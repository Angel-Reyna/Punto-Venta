import bcrypt from "bcrypt";
import crypto from "crypto";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { env } from "../../config/env";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken
} from "./auth.tokens";
import { hashToken, safeCompareHash } from "./token-hash";

type ClientMeta = {
  userAgent?: string;
  ipAddress?: string;
};

type LoginInput = {
  email: string;
  password: string;
};

type AuthResult = {
  user: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  accessToken: string;
  refreshToken: string;
};

function getRefreshExpiresAt(): Date {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + env.REFRESH_TOKEN_TTL_DAYS);
  return expiresAt;
}

function toPublicUser(user: {
  id: string;
  name: string;
  email: string;
  role: string;
}) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role
  };
}

export async function login(
  input: LoginInput,
  meta: ClientMeta
): Promise<AuthResult> {
  const email = input.email.trim().toLowerCase();

  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "Credenciales inválidas");
  }

  const passwordIsValid = await bcrypt.compare(input.password, user.passwordHash);

  if (!passwordIsValid) {
    throw new AppError(401, "Credenciales inválidas");
  }

  const sessionId = crypto.randomUUID();
  const refreshToken = signRefreshToken(user.id, sessionId);
  const accessToken = signAccessToken(user);

  await prisma.refreshSession.create({
    data: {
      id: sessionId,
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      userAgent: meta.userAgent,
      ipAddress: meta.ipAddress,
      expiresAt: getRefreshExpiresAt()
    }
  });

  return {
    user: toPublicUser(user),
    accessToken,
    refreshToken
  };
}

export async function refreshSession(
  refreshToken: string,
  meta: ClientMeta
): Promise<AuthResult> {
  const payload = verifyRefreshToken(refreshToken);
  const incomingHash = hashToken(refreshToken);

  const currentSession = await prisma.refreshSession.findUnique({
    where: { id: payload.sessionId },
    include: { user: true }
  });

  if (!currentSession) {
    throw new AppError(401, "Sesión inválida");
  }

  const tokenMatches = safeCompareHash(currentSession.tokenHash, incomingHash);

  if (!tokenMatches) {
    await prisma.refreshSession.updateMany({
      where: {
        userId: currentSession.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    throw new AppError(401, "Sesión inválida. Se revocaron las sesiones activas.");
  }

  if (currentSession.revokedAt) {
    await prisma.refreshSession.updateMany({
      where: {
        userId: currentSession.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    throw new AppError(401, "Refresh token reutilizado. Sesiones revocadas.");
  }

  if (currentSession.expiresAt.getTime() <= Date.now()) {
    await prisma.refreshSession.update({
      where: { id: currentSession.id },
      data: { revokedAt: new Date() }
    });

    throw new AppError(401, "Sesión expirada");
  }

  if (!currentSession.user.isActive) {
    await prisma.refreshSession.updateMany({
      where: {
        userId: currentSession.userId,
        revokedAt: null
      },
      data: {
        revokedAt: new Date()
      }
    });

    throw new AppError(401, "Usuario inactivo");
  }

  const nextSessionId = crypto.randomUUID();
  const nextRefreshToken = signRefreshToken(currentSession.userId, nextSessionId);
  const nextAccessToken = signAccessToken(currentSession.user);

  await prisma.$transaction([
    prisma.refreshSession.update({
      where: { id: currentSession.id },
      data: {
        revokedAt: new Date(),
        replacedBySessionId: nextSessionId
      }
    }),
    prisma.refreshSession.create({
      data: {
        id: nextSessionId,
        userId: currentSession.userId,
        tokenHash: hashToken(nextRefreshToken),
        userAgent: meta.userAgent,
        ipAddress: meta.ipAddress,
        expiresAt: getRefreshExpiresAt()
      }
    })
  ]);

  return {
    user: toPublicUser(currentSession.user),
    accessToken: nextAccessToken,
    refreshToken: nextRefreshToken
  };
}

export async function logout(refreshToken?: string): Promise<void> {
  if (!refreshToken) return;

  try {
    const payload = verifyRefreshToken(refreshToken);
    const incomingHash = hashToken(refreshToken);

    const session = await prisma.refreshSession.findUnique({
      where: { id: payload.sessionId }
    });

    if (!session) return;
    if (!safeCompareHash(session.tokenHash, incomingHash)) return;
    if (session.revokedAt) return;

    await prisma.refreshSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() }
    });
  } catch {
    return;
  }
}

export async function logoutAll(userId: string): Promise<void> {
  await prisma.refreshSession.updateMany({
    where: {
      userId,
      revokedAt: null
    },
    data: {
      revokedAt: new Date()
    }
  });
}

export async function registerCashier(
  name: string,
  email: string,
  password: string
) {
  const cleanName = name.trim();
  const cleanEmail = email.trim().toLowerCase();

  const existingUser = await prisma.user.findUnique({
    where: {
      email: cleanEmail
    }
  });

  if (existingUser) {
    throw new AppError(409, "El correo ya está registrado");
  }

  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  return prisma.user.create({
    data: {
      name: cleanName,
      email: cleanEmail,
      passwordHash,
      role: "CASHIER",
      isActive: true
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true,
      createdAt: true
    }
  });
}
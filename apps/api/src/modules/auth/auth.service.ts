import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

type TokenPayload = {
  sub: string;
  role: Role;
};

function signAccessToken(user: {
  id: string;
  role: Role;
}) {
  return jwt.sign(
    {
      role: user.role
    },
    env.JWT_ACCESS_SECRET,
    {
      subject: user.id,
      expiresIn: "15m"
    }
  );
}

function signRefreshToken(user: {
  id: string;
  role: Role;
}) {
  return jwt.sign(
    {
      role: user.role
    },
    env.JWT_REFRESH_SECRET,
    {
      subject: user.id,
      expiresIn: "7d"
    }
  );
}

export async function login(
  email: string,
  password: string
) {
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    throw new AppError(401, "Credenciales inválidas");
  }

  if (!user.isActive) {
    throw new AppError(403, "Usuario desactivado");
  }

  const passwordValid = await bcrypt.compare(
    password,
    user.passwordHash
  );

  if (!passwordValid) {
    throw new AppError(401, "Credenciales inválidas");
  }

  return {
    accessToken: signAccessToken({
      id: user.id,
      role: user.role
    }),

    refreshToken: signRefreshToken({
      id: user.id,
      role: user.role
    }),

    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  };
}

export async function refresh(
  refreshToken?: string
) {
  if (!refreshToken) {
    throw new AppError(401, "Refresh token requerido");
  }

  let payload: TokenPayload;

  try {
    payload = jwt.verify(
      refreshToken,
      env.JWT_REFRESH_SECRET
    ) as TokenPayload;
  } catch {
    throw new AppError(401, "Refresh token inválido");
  }

  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub
    }
  });

  if (!user || !user.isActive) {
    throw new AppError(401, "Usuario inválido");
  }

  return {
    accessToken: signAccessToken({
      id: user.id,
      role: user.role
    }),

    refreshToken: signRefreshToken({
      id: user.id,
      role: user.role
    })
  };
}

export async function registerCashier(
  name: string,
  email: string,
  password: string
) {
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    throw new AppError(409, "El correo ya está registrado");
  }

  const passwordHash = await bcrypt.hash(
    password,
    env.BCRYPT_ROUNDS
  );

  return prisma.user.create({
    data: {
      name,
      email,
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
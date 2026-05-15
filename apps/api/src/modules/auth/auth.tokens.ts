import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";
import { env } from "../../config/env";
import { AppError } from "../../utils/AppError";

export type AccessTokenPayload = {
  sub: string;
  email: string;
  role: Role;
  type: "access";
};

export type RefreshTokenPayload = {
  sub: string;
  sessionId: string;
  type: "refresh";
};

type UserForToken = {
  id: string;
  email: string;
  role: Role;
};

export function signAccessToken(user: UserForToken): string {
  const payload: AccessTokenPayload = {
    sub: user.id,
    email: user.email,
    role: user.role,
    type: "access"
  };

  return jwt.sign(payload, env.JWT_ACCESS_SECRET, {
    expiresIn: env.JWT_ACCESS_EXPIRES_IN_SECONDS
  });
}

export function signRefreshToken(userId: string, sessionId: string): string {
  const payload: RefreshTokenPayload = {
    sub: userId,
    sessionId,
    type: "refresh"
  };

  return jwt.sign(payload, env.JWT_REFRESH_SECRET, {
    expiresIn: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60
  });
}

export function verifyAccessToken(token: string): AccessTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_ACCESS_SECRET);

    if (
      typeof payload !== "object" ||
      payload.type !== "access" ||
      typeof payload.sub !== "string" ||
      typeof payload.email !== "string"
    ) {
      throw new AppError(401, "Token inválido");
    }

    return payload as AccessTokenPayload;
  } catch {
    throw new AppError(401, "Token inválido o expirado");
  }
}

export function verifyRefreshToken(token: string): RefreshTokenPayload {
  try {
    const payload = jwt.verify(token, env.JWT_REFRESH_SECRET);

    if (
      typeof payload !== "object" ||
      payload.type !== "refresh" ||
      typeof payload.sub !== "string" ||
      typeof payload.sessionId !== "string"
    ) {
      throw new AppError(401, "Refresh token inválido");
    }

    return payload as RefreshTokenPayload;
  } catch {
    throw new AppError(401, "Refresh token inválido o expirado");
  }
}
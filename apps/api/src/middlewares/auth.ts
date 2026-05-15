import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { Role } from "@prisma/client";

import { env } from "../config/env";
import { AppError } from "../utils/AppError";

type JwtPayloadUser = {
  sub: string;
  email: string;
  role: Role;
};

export function requireAuth(
  req: Request,
  _res: Response,
  next: NextFunction
) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Token requerido");
  }

  const token = header.replace("Bearer ", "");

  try {
    const payload = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    ) as JwtPayloadUser;

    if (!payload.sub || !payload.email || !payload.role) {
      throw new AppError(401, "Token inválido");
    }

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch {
    throw new AppError(401, "Token inválido o expirado");
  }
}

export function requireRole(...roles: Role[]) {
  return (
    req: Request,
    _res: Response,
    next: NextFunction
  ) => {
    if (!req.user) {
      throw new AppError(401, "No autenticado");
    }

    if (!roles.includes(req.user.role)) {
      throw new AppError(403, "No autorizado");
    }

    next();
  };
}

/**
 * Alias de compatibilidad.
 * Permite rutas antiguas que usen requireRoles(...)
 * mientras estandarizamos todo a requireRole(...).
 */
export function requireRoles(...roles: Role[] | [Role[]]) {
  const normalizedRoles = Array.isArray(roles[0])
    ? roles[0]
    : (roles as Role[]);

  return requireRole(...normalizedRoles);
}
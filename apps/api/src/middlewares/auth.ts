import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { z } from "zod";
import { Role } from "@prisma/client";

import { env } from "../config/env";
import { AppError } from "../utils/AppError";

import "../types";

const jwtPayloadSchema = z.object({
  sub: z.string(),
  role: z.nativeEnum(Role),
  email: z.string().email()
});

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
    const decoded = jwt.verify(
      token,
      env.JWT_ACCESS_SECRET
    );

    const payload = jwtPayloadSchema.parse(decoded);

    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role
    };

    next();
  } catch (error) {
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
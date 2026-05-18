import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../modules/auth/auth.tokens";
import {
  logSellerActivity,
  shouldLogSellerActivity
} from "../modules/seller-activity/seller-activity.service";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Token requerido");
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    throw new AppError(401, "Token requerido");
  }

  const payload = verifyAccessToken(token);

  req.user = {
    id: payload.sub,
    email: payload.email,
    role: payload.role
  };

  next();
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "No autenticado");
    }

    if (!roles.includes(req.user.role)) {
      if (shouldLogSellerActivity(req.user)) {
        void logSellerActivity({
          sellerId: req.user.id,
          action: "FAILED_ACCESS_ATTEMPT",
          entityType: "Route",
          entityId: req.originalUrl,
          description: `Intento no autorizado a ${req.method} ${req.originalUrl}`,
          metadata: {
            method: req.method,
            path: req.originalUrl,
            requiredRoles: roles
          },
          ipAddress: req.ip,
          userAgent: req.headers["user-agent"]
        });
      }

      throw new AppError(403, "No autorizado");
    }

    next();
  };
}

export function requireRoles(...roles: Role[] | [Role[]]) {
  const normalizedRoles = Array.isArray(roles[0]) ? roles[0] : (roles as Role[]);

  return requireRole(...normalizedRoles);
}

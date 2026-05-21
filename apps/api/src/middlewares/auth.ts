import { NextFunction, Request, Response } from "express";
import { Role } from "@prisma/client";

import { prisma } from "../config/prisma";
import { AppError } from "../utils/AppError";
import { verifyAccessToken } from "../modules/auth/auth.tokens";
import {
  hasAllPermissions,
  type Permission
} from "../modules/auth/permissions";
import {
  logSellerActivity,
  shouldLogSellerActivity
} from "../modules/seller-activity/seller-activity.service";

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
};

async function authenticateRequest(req: Request): Promise<void> {
  const header = req.headers.authorization;

  if (!header?.startsWith("Bearer ")) {
    throw new AppError(401, "Token requerido");
  }

  const token = header.slice("Bearer ".length).trim();

  if (!token) {
    throw new AppError(401, "Token requerido");
  }

  const payload = verifyAccessToken(token);

  const user = await prisma.user.findUnique({
    where: {
      id: payload.sub
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  if (!user) {
    throw new AppError(401, "Usuario no encontrado");
  }

  if (!user.isActive) {
    throw new AppError(401, "Usuario inactivo");
  }

  req.user = {
    id: user.id,
    email: user.email,
    role: user.role
  };
}

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  void authenticateRequest(req).then(() => next()).catch(next);
}

function logFailedAuthorizationAttempt(
  req: Request,
  metadata: Record<string, unknown>
) {
  if (!req.user || !shouldLogSellerActivity(req.user)) {
    return;
  }

  void logSellerActivity({
    sellerId: req.user.id,
    action: "FAILED_ACCESS_ATTEMPT",
    entityType: "Route",
    entityId: req.originalUrl,
    description: `Intento no autorizado a ${req.method} ${req.originalUrl}`,
    metadata: {
      method: req.method,
      path: req.originalUrl,
      ...metadata
    },
    ipAddress: req.ip,
    userAgent: req.headers["user-agent"]
  });
}

export function requireRole(...roles: Role[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "No autenticado");
    }

    if (!roles.includes(req.user.role)) {
      logFailedAuthorizationAttempt(req, {
        requiredRoles: roles
      });

      throw new AppError(403, "No autorizado");
    }

    next();
  };
}

export function requirePermission(...permissions: Permission[]) {
  if (permissions.length === 0) {
    throw new Error("requirePermission requires at least one permission");
  }

  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      throw new AppError(401, "No autenticado");
    }

    if (!hasAllPermissions(req.user.role, permissions)) {
      logFailedAuthorizationAttempt(req, {
        requiredPermissions: permissions
      });

      throw new AppError(403, "No autorizado");
    }

    next();
  };
}

export function requireRoles(...roles: Role[] | [Role[]]) {
  const normalizedRoles = Array.isArray(roles[0]) ? roles[0] : (roles as Role[]);

  return requireRole(...normalizedRoles);
}

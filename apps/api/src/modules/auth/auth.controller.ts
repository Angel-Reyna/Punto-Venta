import { Request, Response } from "express";
import { z } from "zod";
import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  clearAuthCookies,
  setAuthCookies
} from "./auth.cookies";
import {
  login,
  logout,
  logoutAll,
  refreshSession
} from "./auth.service";

const loginSchema = z.object({
  email: z.string().email().max(255),
  password: z.string().min(8).max(128)
});

function getClientMeta(req: Request) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip
  };
}

export async function loginController(req: Request, res: Response) {
  const input = loginSchema.parse(req.body);

  const result = await login(input, getClientMeta(req));

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  });

  return res.status(200).json({
    user: result.user
  });
}

export async function refreshController(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  if (!refreshToken) {
    throw new AppError(401, "Refresh token requerido");
  }

  const result = await refreshSession(refreshToken, getClientMeta(req));

  setAuthCookies(res, {
    accessToken: result.accessToken,
    refreshToken: result.refreshToken
  });

  return res.status(200).json({
    user: result.user
  });
}

export async function logoutController(req: Request, res: Response) {
  const refreshToken = req.cookies?.[REFRESH_TOKEN_COOKIE];

  await logout(refreshToken);

  clearAuthCookies(res);

  return res.status(204).send();
}

export async function logoutAllController(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  await logoutAll(req.user.id);

  clearAuthCookies(res);

  return res.status(204).send();
}

export async function meController(req: Request, res: Response) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      isActive: true
    }
  });

  if (!user || !user.isActive) {
    clearAuthCookies(res);
    throw new AppError(401, "Usuario inactivo");
  }

  return res.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role
    }
  });
}
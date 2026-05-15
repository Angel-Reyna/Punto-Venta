import { Router, type CookieOptions, type Request } from "express";
import { Role } from "@prisma/client";

import { env } from "../../config/env";
import { prisma } from "../../config/prisma";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";

import { loginSchema, registerCashierSchema } from "./auth.schemas";
import * as service from "./auth.service";

export const authRouter = Router();

const REFRESH_COOKIE_NAME = "refreshToken";

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === "production",
  sameSite: env.NODE_ENV === "production" ? "none" : "lax",
  path: "/api/auth",
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
};

const clearRefreshCookieOptions: CookieOptions = {
  httpOnly: refreshCookieOptions.httpOnly,
  secure: refreshCookieOptions.secure,
  sameSite: refreshCookieOptions.sameSite,
  path: refreshCookieOptions.path
};

function getClientMeta(req: Request) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip
  };
}

function getRefreshTokenFromCookie(req: Request): string {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (typeof refreshToken !== "string" || !refreshToken) {
    throw new AppError(401, "Refresh token requerido");
  }

  return refreshToken;
}

authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await service.login(
      {
        email: req.body.email,
        password: req.body.password
      },
      getClientMeta(req)
    );

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);

    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user
    });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken = getRefreshTokenFromCookie(req);

    const result = await service.refreshSession(refreshToken, getClientMeta(req));

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);

    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user
    });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await service.logout(
      typeof refreshToken === "string" ? refreshToken : undefined
    );

    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);

    return res.status(204).send();
  })
);

authRouter.post(
  "/logout-all",
  requireAuth,
  asyncHandler(async (req, res) => {
    await service.logoutAll(req.user!.id);

    res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);

    return res.status(204).send();
  })
);

authRouter.get(
  "/me",
  requireAuth,
  asyncHandler(async (req, res) => {
    const user = await prisma.user.findUnique({
      where: {
        id: req.user!.id
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
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
  })
);

authRouter.post(
  "/register-cashier",
  requireAuth,
  requireRole(Role.ADMIN),
  validate(registerCashierSchema),
  asyncHandler(async (req, res) => {
    const user = await service.registerCashier(
      req.body.name,
      req.body.email,
      req.body.password
    );

    return res.status(201).json({
      message: "Cuenta de vendedor creada correctamente",
      user
    });
  })
);
import { Router } from "express";
import { Role } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { requireAuth, requireRole } from "../../middlewares/auth";
import { requireCsrfToken } from "../../middlewares/csrf";
import {
  authLoginRateLimiter,
  authRefreshRateLimiter,
  authSensitiveActionRateLimiter
} from "../../middlewares/rateLimit";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { loginSchema, registerCashierSchema } from "./auth.schemas";
import * as service from "./auth.service";
import {
  clearAuthCookies,
  getClientMeta,
  getRefreshTokenFromCookie,
  issueCsrfCookie,
  REFRESH_COOKIE_NAME,
  refreshCookieOptions
} from "./auth.cookies";

export const authRouter = Router();

authRouter.post(
  "/login",
  authLoginRateLimiter,
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
    const csrfToken = issueCsrfCookie(res);

    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
      csrfToken
    });
  })
);

authRouter.get(
  "/csrf-token",
  authRefreshRateLimiter,
  asyncHandler(async (_req, res) => {
    const csrfToken = issueCsrfCookie(res);

    return res.status(200).json({
      csrfToken
    });
  })
);

authRouter.post(
  "/refresh",
  authRefreshRateLimiter,
  requireCsrfToken,
  asyncHandler(async (req, res) => {
    const refreshToken = getRefreshTokenFromCookie(req);

    const result = await service.refreshSession(refreshToken, getClientMeta(req));

    res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, refreshCookieOptions);
    const csrfToken = issueCsrfCookie(res);

    return res.status(200).json({
      accessToken: result.accessToken,
      user: result.user,
      csrfToken
    });
  })
);

authRouter.post(
  "/logout",
  requireCsrfToken,
  asyncHandler(async (req, res) => {
    const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

    await service.logout(
      typeof refreshToken === "string" ? refreshToken : undefined,
      getClientMeta(req)
    );

    clearAuthCookies(res);

    return res.status(204).send();
  })
);

authRouter.post(
  "/logout-all",
  authSensitiveActionRateLimiter,
  requireAuth,
  asyncHandler(async (req, res) => {
    await service.logoutAll(req.user!.id);

    clearAuthCookies(res);

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

    return res.status(200).json({
      user: service.toPublicUser(user)
    });
  })
);

authRouter.post(
  "/register-cashier",
  authSensitiveActionRateLimiter,
  requireAuth,
  requireRole(Role.ADMIN),
  validate(registerCashierSchema),
  asyncHandler(async (req, res) => {
    const user = await service.registerCashier(req.body.name, req.body.email, req.body.password);

    return res.status(201).json({
      message: "Cuenta de vendedor creada correctamente",
      user
    });
  })
);

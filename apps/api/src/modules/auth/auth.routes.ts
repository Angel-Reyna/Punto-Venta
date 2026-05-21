import { Router, type CookieOptions, type Request, type Response } from "express";
import { Role } from "@prisma/client";

import { env } from "../../config/env";
import { resolveRefreshCookieSecurity } from "../../config/cookieSecurity";
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
import { CSRF_COOKIE_NAME, createCsrfToken } from "./csrf";

export const authRouter = Router();

const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";
const CSRF_COOKIE_PATH = "/";

const refreshCookieSecurity = resolveRefreshCookieSecurity({
  nodeEnv: env.NODE_ENV,
  cookieSecure: env.COOKIE_SECURE,
  cookieSameSite: env.COOKIE_SAME_SITE,
  cookieDomain: env.COOKIE_DOMAIN
});

const refreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: refreshCookieSecurity.secure,
  sameSite: refreshCookieSecurity.sameSite,
  path: REFRESH_COOKIE_PATH,
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  ...(refreshCookieSecurity.domain ? { domain: refreshCookieSecurity.domain } : {})
};

const clearRefreshCookieOptions: CookieOptions = {
  httpOnly: true,
  secure: refreshCookieSecurity.secure,
  sameSite: refreshCookieSecurity.sameSite,
  path: REFRESH_COOKIE_PATH,
  ...(refreshCookieSecurity.domain ? { domain: refreshCookieSecurity.domain } : {})
};

const csrfCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: refreshCookieSecurity.secure,
  sameSite: refreshCookieSecurity.sameSite,
  path: CSRF_COOKIE_PATH,
  maxAge: env.REFRESH_TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000,
  ...(refreshCookieSecurity.domain ? { domain: refreshCookieSecurity.domain } : {})
};

const clearCsrfCookieOptions: CookieOptions = {
  httpOnly: false,
  secure: refreshCookieSecurity.secure,
  sameSite: refreshCookieSecurity.sameSite,
  path: CSRF_COOKIE_PATH,
  ...(refreshCookieSecurity.domain ? { domain: refreshCookieSecurity.domain } : {})
};

function getClientMeta(req: Request) {
  return {
    userAgent: req.headers["user-agent"],
    ipAddress: req.ip
  };
}

function issueCsrfCookie(res: Response): string {
  const csrfToken = createCsrfToken(env.TOKEN_HASH_PEPPER);

  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);

  return csrfToken;
}

function clearAuthCookies(res: Response) {
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);
  res.clearCookie(CSRF_COOKIE_NAME, clearCsrfCookieOptions);
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

import type { CookieOptions, Request, Response } from "express";

import { env } from "../../config/env";
import { resolveRefreshCookieSecurity } from "../../config/cookieSecurity";
import { AppError } from "../../utils/AppError";
import type { ClientMeta } from "./auth.shared";
import { CSRF_COOKIE_NAME, createCsrfToken } from "./csrf";

export const REFRESH_COOKIE_NAME = "refreshToken";
const REFRESH_COOKIE_PATH = "/api/auth";
const CSRF_COOKIE_PATH = "/";

const refreshCookieSecurity = resolveRefreshCookieSecurity({
  nodeEnv: env.NODE_ENV,
  cookieSecure: env.COOKIE_SECURE,
  cookieSameSite: env.COOKIE_SAME_SITE,
  cookieDomain: env.COOKIE_DOMAIN
});

export const refreshCookieOptions: CookieOptions = {
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

export function getClientMeta(req: Request): ClientMeta {
  const userAgentHeader = req.headers["user-agent"];

  return {
    userAgent: Array.isArray(userAgentHeader) ? userAgentHeader.join(", ") : userAgentHeader,
    ipAddress: req.ip
  };
}

export function issueCsrfCookie(res: Response): string {
  const csrfToken = createCsrfToken(env.TOKEN_HASH_PEPPER);

  res.cookie(CSRF_COOKIE_NAME, csrfToken, csrfCookieOptions);

  return csrfToken;
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie(REFRESH_COOKIE_NAME, clearRefreshCookieOptions);
  res.clearCookie(CSRF_COOKIE_NAME, clearCsrfCookieOptions);
}

export function getRefreshTokenFromCookie(req: Request): string {
  const refreshToken = req.cookies?.[REFRESH_COOKIE_NAME];

  if (typeof refreshToken !== "string" || !refreshToken) {
    throw new AppError(401, "Refresh token requerido");
  }

  return refreshToken;
}

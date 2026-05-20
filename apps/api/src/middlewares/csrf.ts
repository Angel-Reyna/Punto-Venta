import type { NextFunction, Request, Response } from "express";

import { env } from "../config/env";
import { AppError } from "../utils/AppError";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  csrfTokensMatch,
  isValidCsrfToken
} from "../modules/auth/csrf";

function getCsrfCookie(req: Request): string | undefined {
  const token = req.cookies?.[CSRF_COOKIE_NAME];

  return typeof token === "string" ? token : undefined;
}

function getCsrfHeader(req: Request): string | undefined {
  const token = req.get(CSRF_HEADER_NAME);

  return typeof token === "string" ? token : undefined;
}

export function requireCsrfToken(req: Request, _res: Response, next: NextFunction) {
  const cookieToken = getCsrfCookie(req);
  const headerToken = getCsrfHeader(req);

  if (!cookieToken || !headerToken) {
    throw new AppError(403, "CSRF token requerido");
  }

  if (!isValidCsrfToken(cookieToken, env.TOKEN_HASH_PEPPER)) {
    throw new AppError(403, "CSRF token inválido");
  }

  if (!csrfTokensMatch(cookieToken, headerToken)) {
    throw new AppError(403, "CSRF token inválido");
  }

  return next();
}

import type { Request, Response, NextFunction } from "express";

import { requireCsrfToken } from "../src/middlewares/csrf";
import {
  CSRF_COOKIE_NAME,
  CSRF_HEADER_NAME,
  createCsrfToken,
  isValidCsrfToken
} from "../src/modules/auth/csrf";
import { AppError } from "../src/utils/AppError";

function createRequest(csrfCookie?: string, csrfHeader?: string): Request {
  return {
    cookies: csrfCookie ? { [CSRF_COOKIE_NAME]: csrfCookie } : {},
    get: jest.fn((name: string) => {
      if (name.toLowerCase() === CSRF_HEADER_NAME.toLowerCase()) {
        return csrfHeader;
      }

      return undefined;
    })
  } as unknown as Request;
}

describe("csrf", () => {
  const secret = process.env.TOKEN_HASH_PEPPER!;

  it("creates signed CSRF tokens that can be verified", () => {
    const token = createCsrfToken(secret);

    expect(token).toContain(".");
    expect(isValidCsrfToken(token, secret)).toBe(true);
  });

  it("rejects forged CSRF tokens", () => {
    expect(isValidCsrfToken("forged.token", secret)).toBe(false);
  });

  it("allows requests when cookie and header contain the same valid token", () => {
    const token = createCsrfToken(secret);
    const req = createRequest(token, token);
    const next = jest.fn() as NextFunction;

    requireCsrfToken(req, {} as Response, next);

    expect(next).toHaveBeenCalledTimes(1);
  });

  it("rejects requests without CSRF cookie or header", () => {
    const req = createRequest();
    const next = jest.fn() as NextFunction;

    expect(() => requireCsrfToken(req, {} as Response, next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });

  it("rejects requests when cookie and header differ", () => {
    const cookieToken = createCsrfToken(secret);
    const headerToken = createCsrfToken(secret);
    const req = createRequest(cookieToken, headerToken);
    const next = jest.fn() as NextFunction;

    expect(() => requireCsrfToken(req, {} as Response, next)).toThrow(AppError);
    expect(next).not.toHaveBeenCalled();
  });
});

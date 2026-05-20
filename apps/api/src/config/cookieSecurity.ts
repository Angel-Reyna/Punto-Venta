export type CookieSameSite = "lax" | "strict" | "none";
export type RuntimeEnvironment = "development" | "test" | "production";

export type RefreshCookieSecurityInput = {
  nodeEnv: RuntimeEnvironment;
  cookieSecure?: boolean;
  cookieSameSite?: CookieSameSite;
  cookieDomain?: string;
};

export type RefreshCookieSecurity = {
  secure: boolean;
  sameSite: CookieSameSite;
  domain?: string;
};

export function resolveRefreshCookieSecurity(
  input: RefreshCookieSecurityInput
): RefreshCookieSecurity {
  const secure = input.cookieSecure ?? input.nodeEnv === "production";
  const sameSite =
    input.cookieSameSite ?? (input.nodeEnv === "production" ? "none" : "lax");
  const domain = input.cookieDomain?.trim() || undefined;

  if (sameSite === "none" && !secure) {
    throw new Error(
      "COOKIE_SAME_SITE=none requiere COOKIE_SECURE=true porque los navegadores rechazan cookies cross-site sin Secure"
    );
  }

  return {
    secure,
    sameSite,
    ...(domain ? { domain } : {})
  };
}

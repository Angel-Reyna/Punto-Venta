import "dotenv/config";
import { z } from "zod";

import { resolveRefreshCookieSecurity } from "./cookieSecurity";

const parseOptionalBooleanEnvValue = (value: unknown) => {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }

  if (typeof value === "boolean") {
    return value;
  }

  if (typeof value === "string") {
    const normalized = value.trim().toLowerCase();

    if (["true", "1", "yes", "y", "on"].includes(normalized)) {
      return true;
    }

    if (["false", "0", "no", "n", "off"].includes(normalized)) {
      return false;
    }
  }

  return value;
};

const booleanFromEnv = z.preprocess(parseOptionalBooleanEnvValue, z.boolean());
const optionalBooleanFromEnv = z.preprocess(
  parseOptionalBooleanEnvValue,
  z.boolean().optional()
);

const optionalTrimmedStringFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim();

  return normalized === "" ? undefined : normalized;
}, z.string().min(1).optional());

const optionalSameSiteFromEnv = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const normalized = value.trim().toLowerCase();

  return normalized === "" ? undefined : normalized;
}, z.enum(["lax", "strict", "none"]).optional());

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),

  PORT: z.coerce.number().int().positive().default(4000),
  DATABASE_URL: z.string().min(1),

  CORS_ORIGIN: z.string().url(),

  COOKIE_SECURE: optionalBooleanFromEnv,
  COOKIE_SAME_SITE: optionalSameSiteFromEnv,
  COOKIE_DOMAIN: optionalTrimmedStringFromEnv,

  JWT_ACCESS_SECRET: z.string().min(32),
  JWT_REFRESH_SECRET: z.string().min(32),
  TOKEN_HASH_PEPPER: z.string().min(32),

  JWT_ACCESS_EXPIRES_IN_SECONDS: z.coerce.number().int().positive().default(900),
  REFRESH_TOKEN_TTL_DAYS: z.coerce.number().int().positive().default(7),

  BCRYPT_ROUNDS: z.coerce.number().int().positive().default(12),

  SEED_ADMIN_EMAIL: z.string().trim().toLowerCase().email().default("admin@pos.local"),
  SEED_ADMIN_NAME: z.string().trim().min(2).max(80).default("Administrador"),
  SEED_ADMIN_PASSWORD: z.preprocess(
    (value) => (value === "" ? undefined : value),
    z.string().min(12).max(128).optional()
  ),
  SEED_DEMO_DATA: booleanFromEnv.default(false)
}).superRefine((value, ctx) => {
  try {
    resolveRefreshCookieSecurity({
      nodeEnv: value.NODE_ENV,
      cookieSecure: value.COOKIE_SECURE,
      cookieSameSite: value.COOKIE_SAME_SITE,
      cookieDomain: value.COOKIE_DOMAIN
    });
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["COOKIE_SECURE"],
      message: error instanceof Error ? error.message : "Configuración de cookie inválida"
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables", parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;

export const isProduction = env.NODE_ENV === "production";
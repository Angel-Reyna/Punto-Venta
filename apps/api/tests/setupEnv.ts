process.env.NODE_ENV = process.env.NODE_ENV ?? "test";
process.env.LOG_LEVEL = process.env.LOG_LEVEL ?? "error";
process.env.PORT = process.env.PORT ?? "4000";
process.env.DATABASE_URL =
  process.env.DATABASE_URL ?? "postgresql://test:test@localhost:5432/punta_venta_test";
process.env.CORS_ORIGIN = process.env.CORS_ORIGIN ?? "http://localhost:5173";
process.env.COOKIE_SECURE = process.env.COOKIE_SECURE ?? "false";
process.env.COOKIE_SAME_SITE = process.env.COOKIE_SAME_SITE ?? "lax";
process.env.COOKIE_DOMAIN = process.env.COOKIE_DOMAIN ?? "";
process.env.JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET ?? "test-access-secret-minimum-32-characters";
process.env.JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET ?? "test-refresh-secret-minimum-32-characters";
process.env.TOKEN_HASH_PEPPER =
  process.env.TOKEN_HASH_PEPPER ?? "test-token-pepper-minimum-32-characters";
process.env.JWT_ACCESS_EXPIRES_IN_SECONDS =
  process.env.JWT_ACCESS_EXPIRES_IN_SECONDS ?? "900";
process.env.REFRESH_TOKEN_TTL_DAYS = process.env.REFRESH_TOKEN_TTL_DAYS ?? "7";
process.env.BCRYPT_ROUNDS = process.env.BCRYPT_ROUNDS ?? "4";

jest.mock("bcrypt", () => ({
  compare: jest.fn(),
  hash: jest.fn()
}));

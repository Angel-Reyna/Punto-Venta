import "dotenv/config";

import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum([
    "development",
    "production",
    "test"
  ]),

  PORT: z.coerce.number(),

  DATABASE_URL: z.string().min(1),

  JWT_ACCESS_SECRET: z
    .string()
    .min(
      32,
      "JWT_ACCESS_SECRET inseguro"
    ),

  JWT_REFRESH_SECRET: z
    .string()
    .min(
      32,
      "JWT_REFRESH_SECRET inseguro"
    ),

  BCRYPT_ROUNDS:
    z.coerce.number().min(10),

  CORS_ORIGIN: z.string().url()
});

const parsed =
  envSchema.safeParse(
    process.env
  );

if (!parsed.success) {
  console.error(
    "Variables de entorno inválidas"
  );

  console.error(
    parsed.error.flatten().fieldErrors
  );

  process.exit(1);
}

export const env = parsed.data;
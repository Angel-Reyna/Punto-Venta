import crypto from "crypto";
import { env } from "../../config/env";

export function hashToken(token: string): string {
  return crypto
    .createHmac("sha256", env.TOKEN_HASH_PEPPER)
    .update(token)
    .digest("hex");
}

export function safeCompareHash(a: string, b: string): boolean {
  const first = Buffer.from(a, "hex");
  const second = Buffer.from(b, "hex");

  if (first.length !== second.length) return false;

  return crypto.timingSafeEqual(first, second);
}
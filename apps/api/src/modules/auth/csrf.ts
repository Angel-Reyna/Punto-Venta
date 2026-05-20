import crypto from "crypto";

const CSRF_RANDOM_BYTES = 32;
const CSRF_TOKEN_PARTS = 2;
const CSRF_TOKEN_PATTERN = /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/;

export const CSRF_COOKIE_NAME = "csrfToken";
export const CSRF_HEADER_NAME = "X-CSRF-Token";

function signCsrfNonce(nonce: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(nonce).digest("base64url");
}

function safeEqual(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

export function createCsrfToken(secret: string): string {
  const nonce = crypto.randomBytes(CSRF_RANDOM_BYTES).toString("base64url");
  const signature = signCsrfNonce(nonce, secret);

  return `${nonce}.${signature}`;
}

export function isValidCsrfToken(token: unknown, secret: string): token is string {
  if (typeof token !== "string" || !CSRF_TOKEN_PATTERN.test(token)) {
    return false;
  }

  const parts = token.split(".");

  if (parts.length !== CSRF_TOKEN_PARTS) {
    return false;
  }

  const [nonce, signature] = parts;

  if (!nonce || !signature) {
    return false;
  }

  const expectedSignature = signCsrfNonce(nonce, secret);

  return safeEqual(signature, expectedSignature);
}

export function csrfTokensMatch(left: string, right: string): boolean {
  return safeEqual(left, right);
}

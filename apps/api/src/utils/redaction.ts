import { Prisma } from "@prisma/client";

export const REDACTED_VALUE = "[redactado]";

const SENSITIVE_KEY_PATTERN =
  /(authorization|cookie|credential|csrf|hash|jwt|password|pepper|refresh|secret|session|token)/i;

function redactJsonValue(key: string, value: unknown): unknown {
  if (SENSITIVE_KEY_PATTERN.test(key)) {
    return REDACTED_VALUE;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  return value;
}

function toRedactedJsonCompatibleValue(value: unknown): Prisma.InputJsonValue {
  const serialized = JSON.stringify(value, redactJsonValue);

  if (serialized === undefined) {
    return REDACTED_VALUE;
  }

  return JSON.parse(serialized) as Prisma.InputJsonValue;
}

export function redactSensitiveInputJson(value: undefined): undefined;
export function redactSensitiveInputJson(
  value: Prisma.InputJsonValue | undefined
): Prisma.InputJsonValue | undefined;
export function redactSensitiveInputJson(value: unknown): Prisma.InputJsonValue;
export function redactSensitiveInputJson(
  value: unknown
): Prisma.InputJsonValue | undefined {
  if (value === undefined) {
    return undefined;
  }

  return toRedactedJsonCompatibleValue(value);
}

export function redactSensitiveJsonValue(value: null): null;
export function redactSensitiveJsonValue(
  value: Prisma.JsonValue | null
): Prisma.JsonValue | null;
export function redactSensitiveJsonValue(value: Prisma.JsonValue): Prisma.JsonValue;
export function redactSensitiveJsonValue(
  value: Prisma.JsonValue | null
): Prisma.JsonValue | null {
  if (value === null) {
    return null;
  }

  return toRedactedJsonCompatibleValue(value) as Prisma.JsonValue;
}

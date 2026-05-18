import { env } from "../config/env";

type LogLevel = "debug" | "info" | "warn" | "error";

type LogContext = Record<string, unknown>;

const LEVEL_WEIGHT: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};

const SENSITIVE_KEY_PATTERN =
  /password|pass|token|secret|authorization|cookie|set-cookie|apikey|api_key|credential|hash/i;

function normalizeError(error: unknown) {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: env.NODE_ENV === "production" ? undefined : error.stack
    };
  }

  return {
    message: String(error)
  };
}

function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 4) {
    return "[MaxDepth]";
  }

  if (value instanceof Error) {
    return normalizeError(value);
  }

  if (value === null || value === undefined) {
    return value;
  }

  if (["string", "number", "boolean"].includes(typeof value)) {
    return value;
  }

  if (typeof value === "bigint") {
    return value.toString();
  }

  if (Array.isArray(value)) {
    return value.map((item) => sanitize(item, depth + 1));
  }

  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        SENSITIVE_KEY_PATTERN.test(key) ? "[Redacted]" : sanitize(item, depth + 1)
      ])
    );
  }

  return String(value);
}

function shouldLog(level: LogLevel) {
  const configuredLevel = env.LOG_LEVEL as LogLevel;

  return LEVEL_WEIGHT[level] >= LEVEL_WEIGHT[configuredLevel];
}

function write(level: LogLevel, message: string, context: LogContext = {}) {
  if (!shouldLog(level)) {
    return;
  }

  const sanitizedContext = sanitize(context) as LogContext;

  const payload = {
    timestamp: new Date().toISOString(),
    level,
    message,
    service: "punta-venta-api",
    environment: env.NODE_ENV,
    ...sanitizedContext
  };

  const serialized = JSON.stringify(payload);

  if (level === "error") {
    console.error(serialized);
    return;
  }

  if (level === "warn") {
    console.warn(serialized);
    return;
  }

  console.log(serialized);
}

export const logger = {
  debug: (message: string, context?: LogContext) => write("debug", message, context),
  info: (message: string, context?: LogContext) => write("info", message, context),
  warn: (message: string, context?: LogContext) => write("warn", message, context),
  error: (message: string, context?: LogContext) => write("error", message, context)
};

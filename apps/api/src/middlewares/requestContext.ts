import { randomUUID } from "crypto";
import { NextFunction, Request, Response } from "express";

import { logger } from "../utils/logger";

const REQUEST_ID_HEADER = "x-request-id";
const MAX_REQUEST_ID_LENGTH = 128;
const SAFE_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._:-]+$/;

function getIncomingRequestId(req: Request): string | null {
  const value = req.header(REQUEST_ID_HEADER);

  if (!value) {
    return null;
  }

  const requestId = value.trim();

  if (
    !requestId ||
    requestId.length > MAX_REQUEST_ID_LENGTH ||
    !SAFE_REQUEST_ID_PATTERN.test(requestId)
  ) {
    return null;
  }

  return requestId;
}

function getDurationMs(startedAt: bigint): number {
  const durationNs = process.hrtime.bigint() - startedAt;
  return Number(durationNs) / 1_000_000;
}

export function requestContext(req: Request, res: Response, next: NextFunction) {
  const requestId = getIncomingRequestId(req) ?? randomUUID();

  req.requestId = requestId;
  req.startedAt = process.hrtime.bigint();

  res.setHeader("X-Request-Id", requestId);

  next();
}

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  res.on("finish", () => {
    if (req.path === "/health" && res.statusCode < 400) {
      return;
    }

    const startedAt = req.startedAt;
    const durationMs = startedAt ? getDurationMs(startedAt) : undefined;
    const statusCode = res.statusCode;
    const level = statusCode >= 500 ? "error" : statusCode >= 400 ? "warn" : "info";

    logger[level]("HTTP request completed", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      statusCode,
      durationMs: durationMs === undefined ? undefined : Number(durationMs.toFixed(2)),
      ipAddress: req.ip,
      userAgent: req.header("user-agent"),
      userId: req.user?.id,
      userRole: req.user?.role
    });
  });

  next();
}

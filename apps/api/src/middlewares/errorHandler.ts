import { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Prisma } from "@prisma/client";

import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { logger } from "../utils/logger";

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return String(error);
}

function logHandledError(req: Request, statusCode: number, error: unknown) {
  const level = statusCode >= 500 ? "error" : "warn";

  logger[level]("Request failed", {
    requestId: req.requestId,
    statusCode,
    method: req.method,
    path: req.path,
    ipAddress: req.ip,
    userId: req.user?.id,
    userRole: req.user?.role,
    error
  });
}

function sendErrorResponse(
  req: Request,
  res: Response,
  statusCode: number,
  message: string,
  extra?: Record<string, unknown>
) {
  return res.status(statusCode).json({
    message,
    requestId: req.requestId,
    ...extra
  });
}

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (res.headersSent) {
    logger.error("Error occurred after headers were sent", {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      error
    });

    return next(error);
  }

  if (error instanceof AppError) {
    logHandledError(req, error.statusCode, error);

    return sendErrorResponse(req, res, error.statusCode, error.message);
  }

  if (error instanceof ZodError) {
    logHandledError(req, 400, error);

    return sendErrorResponse(req, res, 400, "Datos inválidos", {
      errors: error.flatten()
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      logHandledError(req, 409, error);

      return sendErrorResponse(req, res, 409, "El registro ya existe");
    }

    logHandledError(req, 400, error);

    return sendErrorResponse(req, res, 400, "Error de base de datos");
  }

  logHandledError(req, 500, error);

  return sendErrorResponse(
    req,
    res,
    500,
    env.NODE_ENV === "production"
      ? "Error interno del servidor"
      : getErrorMessage(error)
  );
}

import {
  NextFunction,
  Request,
  Response
} from "express";

import { ZodError } from "zod";

import { Prisma } from "@prisma/client";

import { AppError } from "../utils/AppError";

export function errorHandler(
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  console.error(error);

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      message: error.message
    });
  }

  if (error instanceof ZodError) {
    return res.status(400).json({
      message: "Datos inválidos",

      errors: error.flatten()
    });
  }

  if (
    error instanceof
    Prisma.PrismaClientKnownRequestError
  ) {
    if (error.code === "P2002") {
      return res.status(409).json({
        message:
          "El registro ya existe"
      });
    }

    return res.status(400).json({
      message:
        "Error de base de datos"
    });
  }

  return res.status(500).json({
    message:
      process.env.NODE_ENV ===
      "production"
        ? "Error interno del servidor"
        : error instanceof Error
        ? error.message
        : "Error desconocido"
  });
}
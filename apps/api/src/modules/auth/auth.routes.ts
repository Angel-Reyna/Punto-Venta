import { Router } from "express";

import { env } from "../../config/env";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";

import {
  loginSchema,
  registerCashierSchema
} from "./auth.schemas";

import * as service from "./auth.service";

export const authRouter = Router();

const refreshCookieOptions = {
  httpOnly: true,

  secure: env.NODE_ENV === "production",

  sameSite:
    env.NODE_ENV === "production"
      ? ("none" as const)
      : ("lax" as const),

  path: "/api/auth",

  maxAge: 7 * 24 * 60 * 60 * 1000
};

authRouter.post(
  "/login",
  validate(loginSchema),
  asyncHandler(async (req, res) => {
    const result = await service.login(
      req.body.email,
      req.body.password
    );

    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions
    );

    res.json({
      accessToken: result.accessToken,
      user: result.user
    });
  })
);

authRouter.post(
  "/refresh",
  asyncHandler(async (req, res) => {
    const refreshToken =
      req.cookies?.refreshToken;

    const result = await service.refresh(
      refreshToken
    );

    res.cookie(
      "refreshToken",
      result.refreshToken,
      refreshCookieOptions
    );

    res.json({
      accessToken: result.accessToken
    });
  })
);

authRouter.post(
  "/logout",
  asyncHandler(async (_req, res) => {
    res.clearCookie(
      "refreshToken",
      refreshCookieOptions
    );

    res.json({
      message: "Sesión cerrada correctamente"
    });
  })
);

authRouter.post(
  "/register-cashier",
  validate(registerCashierSchema),
  asyncHandler(async (req, res) => {
    const user = await service.registerCashier(
      req.body.name,
      req.body.email,
      req.body.password
    );

    res.status(201).json({
      message: "Cuenta de vendedor creada correctamente",
      user
    });
  })
);
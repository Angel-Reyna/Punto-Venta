import { Router, type Request } from "express";
import { z } from "zod";

import { requireAuth, requirePermission } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { setPaginationHeaders } from "../../utils/pagination";
import { PERMISSIONS } from "../auth/permissions";
import {
  auditCashMovementCreated,
  auditCashRegisterClosed,
  auditCashRegisterOpened
} from "./cash-register.audit";

import {
  addManualCashMovement,
  closeCashRegister,
  closeCashRegisterSchema,
  getCurrentCashRegister,
  getCashRegisterSessionById,
  listCashRegisterSessions,
  openCashRegister,
  openCashRegisterSchema,
  manualCashMovementSchema
} from "./cash-register.service";

const sessionIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const cashRegisterRouter = Router();

cashRegisterRouter.use(requireAuth);

function getCurrentUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  return req.user;
}

cashRegisterRouter.get(
  "/current",
  requirePermission(PERMISSIONS.CashRegisterOperate),
  asyncHandler(async (req, res) => {
    const session = await getCurrentCashRegister(getCurrentUser(req));

    res.json({ session });
  })
);

cashRegisterRouter.post(
  "/open",
  requirePermission(PERMISSIONS.CashRegisterOperate),
  validate(openCashRegisterSchema),
  asyncHandler(async (req, res) => {
    const session = await openCashRegister(getCurrentUser(req), req.body);

    await auditCashRegisterOpened({
      userId: req.user?.id,
      ipAddress: req.ip,
      session
    });

    res.status(201).json(session);
  })
);

cashRegisterRouter.post(
  "/movements",
  requirePermission(PERMISSIONS.CashRegisterManage),
  validate(manualCashMovementSchema),
  asyncHandler(async (req, res) => {
    const movement = await addManualCashMovement(getCurrentUser(req), req.body);

    await auditCashMovementCreated({
      userId: req.user?.id,
      ipAddress: req.ip,
      movement
    });

    res.status(201).json(movement);
  })
);

cashRegisterRouter.post(
  "/close",
  requirePermission(PERMISSIONS.CashRegisterOperate),
  validate(closeCashRegisterSchema),
  asyncHandler(async (req, res) => {
    const session = await closeCashRegister(getCurrentUser(req), req.body);

    await auditCashRegisterClosed({
      userId: req.user?.id,
      ipAddress: req.ip,
      session
    });

    res.json(session);
  })
);

cashRegisterRouter.get(
  "/sessions",
  requirePermission(PERMISSIONS.CashRegisterRead),
  asyncHandler(async (req, res) => {
    const result = await listCashRegisterSessions(
      req.query as Record<string, unknown>
    );

    setPaginationHeaders(res, result.meta);

    res.json(result.data);
  })
);

cashRegisterRouter.get(
  "/sessions/:id",
  requirePermission(PERMISSIONS.CashRegisterRead),
  validate(sessionIdParamsSchema),
  asyncHandler(async (req, res) => {
    const session = await getCashRegisterSessionById(String(req.params.id));

    res.json(session);
  })
);

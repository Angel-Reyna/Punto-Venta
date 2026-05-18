import { Router, type Request } from "express";
import { z } from "zod";

import { requireAuth, requireRole } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { setPaginationHeaders } from "../../utils/pagination";
import { auditLog } from "../audit/audit.service";
import { Role } from "@prisma/client";

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
  asyncHandler(async (req, res) => {
    const session = await getCurrentCashRegister(getCurrentUser(req));

    res.json({ session });
  })
);

cashRegisterRouter.post(
  "/open",
  validate(openCashRegisterSchema),
  asyncHandler(async (req, res) => {
    const session = await openCashRegister(getCurrentUser(req), req.body);

    await auditLog({
      userId: req.user?.id,
      action: "CASH_REGISTER_OPENED",
      tableName: "CashRegisterSession",
      recordId: session.id,
      newData: {
        openingAmount: session.openingAmount,
        notes: session.notes
      },
      ipAddress: req.ip
    });

    res.status(201).json(session);
  })
);

cashRegisterRouter.post(
  "/movements",
  requireRole(Role.ADMIN),
  validate(manualCashMovementSchema),
  asyncHandler(async (req, res) => {
    const movement = await addManualCashMovement(getCurrentUser(req), req.body);

    await auditLog({
      userId: req.user?.id,
      action: `CASH_${movement.type}`,
      tableName: "CashMovement",
      recordId: movement.id,
      newData: {
        type: movement.type,
        amount: movement.amount,
        signedAmount: movement.signedAmount,
        reason: movement.reason
      },
      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);

cashRegisterRouter.post(
  "/close",
  validate(closeCashRegisterSchema),
  asyncHandler(async (req, res) => {
    const session = await closeCashRegister(getCurrentUser(req), req.body);

    await auditLog({
      userId: req.user?.id,
      action: "CASH_REGISTER_CLOSED",
      tableName: "CashRegisterSession",
      recordId: session.id,
      newData: {
        expectedClosingAmount: session.expectedClosingAmount,
        closingAmount: session.closingAmount,
        difference: session.difference,
        notes: session.notes
      },
      ipAddress: req.ip
    });

    res.json(session);
  })
);

cashRegisterRouter.get(
  "/sessions",
  requireRole(Role.ADMIN),
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
  requireRole(Role.ADMIN),
  validate(sessionIdParamsSchema),
  asyncHandler(async (req, res) => {
    const session = await getCashRegisterSessionById(String(req.params.id));

    res.json(session);
  })
);

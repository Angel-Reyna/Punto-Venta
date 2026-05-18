import { Router, type Request } from "express";
import { z } from "zod";

import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import { setPaginationHeaders } from "../../utils/pagination";
import { auditLog } from "../audit/audit.service";

import {
  createSale,
  getSaleById,
  listSales,
  saleSchema
} from "./sales.service";

const saleIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const salesRouter = Router();

salesRouter.use(requireAuth);

function getCurrentUser(req: Request) {
  if (!req.user) {
    throw new AppError(401, "No autenticado");
  }

  return req.user;
}

salesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const result = await listSales(
      getCurrentUser(req),
      req.query as Record<string, unknown>
    );

    setPaginationHeaders(res, result.meta);

    res.json(result.data);
  })
);

salesRouter.get(
  "/:id",
  validate(saleIdParamsSchema),
  asyncHandler(async (req, res) => {
    const sale = await getSaleById(getCurrentUser(req), String(req.params.id));

    res.json(sale);
  })
);

salesRouter.post(
  "/",
  validate(saleSchema),
  asyncHandler(async (req, res) => {
    const sale = await createSale(getCurrentUser(req), req.body, {
      ipAddress: req.ip,
      userAgent: req.headers["user-agent"]
    });

    await auditLog({
      userId: req.user?.id,
      action: "CREATE_SALE",
      tableName: "Sale",
      recordId: sale.id,
      newData: sale,
      ipAddress: req.ip
    });

    res.status(201).json(sale);
  })
);

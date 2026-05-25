import { Router } from "express";

import {
  requireAuth,
  requirePermission
} from "../../middlewares/auth";
import { PERMISSIONS } from "../auth/permissions";

import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import {
  buildPaginationMeta,
  getPagination,
  setPaginationHeaders
} from "../../utils/pagination";
import {
  getSellerActivitySummary,
  listSellerActivity
} from "./seller-activity.service";
import { sellerActivityQuerySchema } from "./seller-activity.shared";

export const sellerActivityRouter = Router();

sellerActivityRouter.use(
  requireAuth,
  requirePermission(PERMISSIONS.SellerActivityRead)
);

sellerActivityRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = sellerActivityQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(400, "Filtros inválidos");
    }

    const pagination = getPagination(
      {
        ...req.query,
        ...(parsed.data.limit ? { pageSize: parsed.data.limit } : {})
      } as Record<string, unknown>,
      {
        defaultPageSize: 50,
        maxPageSize: 100
      }
    );

    const result = await listSellerActivity(parsed.data, pagination);

    setPaginationHeaders(
      res,
      buildPaginationMeta(pagination, result.total)
    );

    res.json(result.logs);
  })
);

sellerActivityRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const parsed = sellerActivityQuerySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(400, "Filtros inválidos");
    }

    const summary = await getSellerActivitySummary(parsed.data);

    res.json(summary);
  })
);

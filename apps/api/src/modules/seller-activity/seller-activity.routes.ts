import { Router } from "express";

import {
  requireAuth,
  requirePermission
} from "../../middlewares/auth";
import { PERMISSIONS } from "../auth/permissions";

import { asyncHandler } from "../../utils/asyncHandler";
import {
  buildPaginationMeta,
  setPaginationHeaders
} from "../../utils/pagination";
import {
  getSellerActivitySummary,
  listSellerActivity
} from "./seller-activity.service";
import { parseSellerActivityRequest } from "./seller-activity.queries";

export const sellerActivityRouter = Router();

sellerActivityRouter.use(
  requireAuth,
  requirePermission(PERMISSIONS.SellerActivityRead)
);

sellerActivityRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const { query, pagination } = parseSellerActivityRequest(
      req.query as Record<string, unknown>
    );

    const result = await listSellerActivity(query, pagination);

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
    const { query } = parseSellerActivityRequest(
      req.query as Record<string, unknown>
    );

    const summary = await getSellerActivitySummary(query);

    res.json(summary);
  })
);

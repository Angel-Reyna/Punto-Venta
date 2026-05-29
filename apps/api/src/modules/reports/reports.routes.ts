import { Router } from "express";

import { requireAuth, requirePermission } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { PERMISSIONS } from "../auth/permissions";
import { streamOperationsPdf } from "./reports.pdf";
import {
  getOperationsReport,
  getSalesReport,
  parseReportDateRange
} from "./reports.service";

export const reportsRouter = Router();

reportsRouter.use(requireAuth, requirePermission(PERMISSIONS.ReportsRead));

reportsRouter.get(
  "/sales",
  asyncHandler(async (req, res) => {
    const range = parseReportDateRange(req.query.from, req.query.to);
    const report = await getSalesReport(range);

    res.json(report);
  })
);

reportsRouter.get(
  "/operations",
  asyncHandler(async (req, res) => {
    const range = parseReportDateRange(req.query.from, req.query.to);
    const report = await getOperationsReport(range);

    res.json(report);
  })
);

reportsRouter.get(
  "/operations/pdf",
  asyncHandler(async (req, res) => {
    await streamOperationsPdf(req, res);
  })
);

reportsRouter.get(
  "/sales/pdf",
  asyncHandler(async (req, res) => {
    await streamOperationsPdf(req, res);
  })
);

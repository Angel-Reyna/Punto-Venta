import { Router } from "express";

import { requireAuth, requirePermission } from "../../middlewares/auth";
import { asyncHandler } from "../../utils/asyncHandler";
import { PERMISSIONS } from "../auth/permissions";

import { getDashboardSummary } from "./dashboard.service";

export const dashboardRouter = Router();

dashboardRouter.use(requireAuth);
dashboardRouter.use(requirePermission(PERMISSIONS.DashboardRead));

dashboardRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const summary = await getDashboardSummary(req.user!);

    res.json(summary);
  })
);

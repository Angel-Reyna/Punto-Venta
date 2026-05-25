import { Router } from "express";

import {
  requireAuth,
  requirePermission
} from "../../middlewares/auth";
import { PERMISSIONS } from "../auth/permissions";

import { asyncHandler } from "../../utils/asyncHandler";
import {
  buildPaginationMeta,
  getPagination,
  setPaginationHeaders
} from "../../utils/pagination";
import { listAuditLogs } from "./audit.service";
import { parseAuditLogQuery } from "./audit.shared";

export const auditRouter = Router();

auditRouter.use(
  requireAuth,
  requirePermission(PERMISSIONS.AuditRead)
);

auditRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query as Record<string, unknown>, {
      defaultPageSize: 50,
      maxPageSize: 100
    });
    const query = parseAuditLogQuery(req.query as Record<string, unknown>);

    const result = await listAuditLogs(query, pagination);

    setPaginationHeaders(
      res,
      buildPaginationMeta(pagination, result.total)
    );

    res.json(result.logs);
  })
);

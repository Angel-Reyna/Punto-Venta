import { Router } from "express";
import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

import {
  requireAuth,
  requirePermission
} from "../../middlewares/auth";
import { PERMISSIONS } from "../auth/permissions";

import { asyncHandler } from "../../utils/asyncHandler";
import {
  buildPaginationMeta,
  getDateRange,
  getOptionalString,
  getPagination,
  setPaginationHeaders
} from "../../utils/pagination";

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
    const q = getOptionalString(req.query.q, 120);
    const action = getOptionalString(req.query.action, 80);
    const tableName = getOptionalString(req.query.tableName, 80);
    const userId = getOptionalString(req.query.userId, 80);
    const { dateFrom, dateTo } = getDateRange(
      req.query as Record<string, unknown>
    );

    const where: Prisma.AuditLogWhereInput = {
      ...(action
        ? {
            action: {
              contains: action,
              mode: "insensitive"
            }
          }
        : {}),
      ...(tableName
        ? {
            tableName: {
              contains: tableName,
              mode: "insensitive"
            }
          }
        : {}),
      ...(userId
        ? {
            userId
          }
        : {}),
      ...(dateFrom || dateTo
        ? {
            createdAt: {
              ...(dateFrom ? { gte: dateFrom } : {}),
              ...(dateTo ? { lte: dateTo } : {})
            }
          }
        : {}),
      ...(q
        ? {
            OR: [
              {
                action: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                tableName: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                recordId: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                user: {
                  email: {
                    contains: q,
                    mode: "insensitive"
                  }
                }
              },
              {
                user: {
                  name: {
                    contains: q,
                    mode: "insensitive"
                  }
                }
              }
            ]
          }
        : {})
    };

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          }
        },
        orderBy: {
          createdAt: "desc"
        },
        skip: pagination.skip,
        take: pagination.take
      })
    ]);

    setPaginationHeaders(res, buildPaginationMeta(pagination, total));

    res.json(logs);
  })
);

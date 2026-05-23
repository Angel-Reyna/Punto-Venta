import { Router } from "express";
import { Prisma, SellerAction } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../config/prisma";

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

export const sellerActivityRouter = Router();

sellerActivityRouter.use(
  requireAuth,
  requirePermission(PERMISSIONS.SellerActivityRead)
);

const querySchema = z.object({
  sellerId: z.string().uuid().optional(),

  action: z.nativeEnum(SellerAction).optional(),

  from: z.string().optional(),

  to: z.string().optional(),

  limit: z.coerce.number().int().min(1).max(500).optional()
});

function parseDateFilter(from?: string, to?: string) {
  if (!from && !to) {
    return undefined;
  }

  const createdAt: {
    gte?: Date;
    lte?: Date;
  } = {};

  if (from) {
    const start = new Date(from);

    if (Number.isNaN(start.getTime())) {
      throw new AppError(400, "Fecha inicial inválida");
    }

    start.setHours(0, 0, 0, 0);

    createdAt.gte = start;
  }

  if (to) {
    const end = new Date(to);

    if (Number.isNaN(end.getTime())) {
      throw new AppError(400, "Fecha final inválida");
    }

    end.setHours(23, 59, 59, 999);

    createdAt.lte = end;
  }

  if (createdAt.gte && createdAt.lte && createdAt.gte > createdAt.lte) {
    throw new AppError(
      400,
      "La fecha inicial no puede ser mayor que la fecha final"
    );
  }

  return createdAt;
}

sellerActivityRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(400, "Filtros inválidos");
    }

    const {
      sellerId,
      action,
      from,
      to,
      limit
    } = parsed.data;

    const pagination = getPagination(
      {
        ...req.query,
        ...(limit ? { pageSize: limit } : {})
      } as Record<string, unknown>,
      {
        defaultPageSize: 50,
        maxPageSize: 100
      }
    );

    const createdAt = parseDateFilter(from, to);

    const where: Prisma.SellerActivityLogWhereInput = {
      ...(sellerId
        ? {
            sellerId
          }
        : {}),

      ...(action
        ? {
            action
          }
        : {}),

      ...(createdAt
        ? {
            createdAt
          }
        : {})
    };

    const [total, logs] = await Promise.all([
      prisma.sellerActivityLog.count({ where }),
      prisma.sellerActivityLog.findMany({
        where,
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              isActive: true
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

sellerActivityRouter.get(
  "/summary",
  asyncHandler(async (req, res) => {
    const parsed = querySchema.safeParse(req.query);

    if (!parsed.success) {
      throw new AppError(400, "Filtros inválidos");
    }

    const {
      sellerId,
      from,
      to
    } = parsed.data;

    const createdAt = parseDateFilter(from, to);

    const logs = await prisma.sellerActivityLog.groupBy({
      by: ["action"],

      where: {
        ...(sellerId
          ? {
              sellerId
            }
          : {}),

        ...(createdAt
          ? {
              createdAt
            }
          : {})
      },

      _count: {
        action: true
      }
    });

    res.json(
      logs.map((item) => ({
        action: item.action,
        count: item._count.action
      }))
    );
  })
);
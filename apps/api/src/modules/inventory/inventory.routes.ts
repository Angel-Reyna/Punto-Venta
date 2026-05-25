import { Router } from "express";
import { InventoryType, Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";

import {
  requireAuth,
  requirePermission
} from "../../middlewares/auth";

import { validate } from "../../middlewares/validate";

import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";
import {
  buildPaginationMeta,
  getDateRange,
  getOptionalBoolean,
  getOptionalString,
  getPagination,
  setPaginationHeaders
} from "../../utils/pagination";

import { auditLog } from "../audit/audit.service";
import { PERMISSIONS } from "../auth/permissions";

import {
  mapInventoryMovementAuditData,
  mapProductStock,
  productStockInclude
} from "./inventory.mappers";
import {
  decreaseStock,
  getProductStocks,
  increaseStock
} from "./inventory.service";
import { movementSchema } from "./inventory.shared";

export const inventoryRouter = Router();

inventoryRouter.use(requireAuth);

inventoryRouter.get(
  "/warehouses",
  requirePermission(PERMISSIONS.InventoryRead),
  asyncHandler(async (_req, res) => {
    const warehouses =
      await prisma.warehouse.findMany({
        where: {
          isActive: true
        },

        orderBy: {
          name: "asc"
        }
      });

    res.json(warehouses);
  })
);

inventoryRouter.get(
  "/movements",
  requirePermission(PERMISSIONS.InventoryRead),
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query as Record<string, unknown>, {
      defaultPageSize: 50,
      maxPageSize: 100
    });
    const q = getOptionalString(req.query.q, 120);
    const productId = getOptionalString(req.query.productId, 80);
    const warehouseId = getOptionalString(req.query.warehouseId, 80);
    const type = getOptionalString(req.query.type, 30);
    const { dateFrom, dateTo } = getDateRange(
      req.query as Record<string, unknown>
    );

    if (type && !Object.values(InventoryType).includes(type as InventoryType)) {
      throw new AppError(400, "Tipo de movimiento inválido");
    }

    const where: Prisma.InventoryMovementWhereInput = {
      ...(productId ? { productId } : {}),
      ...(warehouseId ? { warehouseId } : {}),
      ...(type ? { type: type as InventoryType } : {}),
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
                reason: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                productSku: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                productName: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                product: {
                  barcode: {
                    contains: q,
                    mode: "insensitive"
                  }
                }
              },
              {
                warehouse: {
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

    const [total, movements] = await Promise.all([
      prisma.inventoryMovement.count({ where }),
      prisma.inventoryMovement.findMany({
        where,
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              barcode: true,
              name: true
            }
          },

          warehouse: {
            select: {
              id: true,
              name: true
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

    res.json(movements);
  })
);

inventoryRouter.get(
  "/stock",
  requirePermission(PERMISSIONS.InventoryRead),
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query as Record<string, unknown>, {
      defaultPageSize: 50,
      maxPageSize: 100
    });
    const q = getOptionalString(req.query.q, 120);
    const categoryId = getOptionalString(req.query.categoryId, 80);
    const lowStock = getOptionalBoolean(req.query.lowStock);

    const where: Prisma.ProductWhereInput = {
      isActive: true,
      ...(categoryId ? { categoryId } : {}),
      ...(q
        ? {
            OR: [
              {
                sku: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                name: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                barcode: {
                  contains: q,
                  mode: "insensitive"
                }
              },
              {
                category: {
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

    if (lowStock !== true) {
      const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          include: productStockInclude,
          orderBy: {
            name: "asc"
          },
          skip: pagination.skip,
          take: pagination.take
        })
      ]);

      const stocks = await getProductStocks(
        products.map((product) => product.id)
      );

      setPaginationHeaders(res, buildPaginationMeta(pagination, total));

      return res.json(
        products.map((product) => mapProductStock(product, stocks))
      );
    }

    const products = await prisma.product.findMany({
      where,
      include: productStockInclude,
      orderBy: {
        name: "asc"
      }
    });

    const stocks = await getProductStocks(products.map((product) => product.id));
    const lowStockProducts = products
      .map((product) => mapProductStock(product, stocks))
      .filter((product) => product.lowStock);

    const pageItems = lowStockProducts.slice(
      pagination.skip,
      pagination.skip + pagination.take
    );

    setPaginationHeaders(
      res,
      buildPaginationMeta(pagination, lowStockProducts.length)
    );

    return res.json(pageItems);
  })
);

inventoryRouter.post(
  "/in",
  requirePermission(PERMISSIONS.InventoryAdjust),
  validate(movementSchema),
  asyncHandler(async (req, res) => {
    const movement = await prisma.$transaction((tx) =>
      increaseStock(tx, {
        productId: req.body.productId,
        warehouseId: req.body.warehouseId,
        quantity: req.body.quantity,
        reason: req.body.reason,
        createdBy: req.user!.id,
        type: "IN"
      })
    );

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_IN",
      tableName: "InventoryMovement",
      recordId: movement.id,
      newData: mapInventoryMovementAuditData(movement),
      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);

inventoryRouter.post(
  "/out",
  requirePermission(PERMISSIONS.InventoryAdjust),
  validate(movementSchema),
  asyncHandler(async (req, res) => {
    const movement = await prisma.$transaction((tx) =>
      decreaseStock(tx, {
        productId: req.body.productId,
        warehouseId: req.body.warehouseId,
        quantity: req.body.quantity,
        reason: req.body.reason,
        createdBy: req.user!.id,
        type: "OUT"
      })
    );

    await auditLog({
      userId: req.user?.id,
      action: "INVENTORY_OUT",
      tableName: "InventoryMovement",
      recordId: movement.id,
      newData: mapInventoryMovementAuditData(movement),
      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);

import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";

import { prisma } from "../../config/prisma";

import {
  requireAuth,
  requireRole
} from "../../middlewares/auth";

import { validate } from "../../middlewares/validate";

import { asyncHandler } from "../../utils/asyncHandler";

import { auditLog } from "../audit/audit.service";

import {
  decreaseStock,
  getProductStocks,
  increaseStock
} from "./inventory.service";

const movementSchema = z.object({
  body: z.object({
    productId: z.string().uuid(),

    warehouseId: z
      .string()
      .uuid()
      .optional()
      .nullable(),

    quantity: z.coerce
      .number()
      .int()
      .positive()
      .max(1_000_000),

    reason: z
      .string()
      .trim()
      .min(3)
      .max(255)
  })
});

export const inventoryRouter = Router();

inventoryRouter.use(
  requireAuth,
  requireRole(Role.ADMIN)
);

inventoryRouter.get(
  "/warehouses",
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
  asyncHandler(async (_req, res) => {
    const movements =
      await prisma.inventoryMovement.findMany({
        include: {
          product: {
            select: {
              id: true,
              sku: true,
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

        take: 500
      });

    res.json(movements);
  })
);

inventoryRouter.get(
  "/stock",
  asyncHandler(async (_req, res) => {
    const products =
      await prisma.product.findMany({
        where: {
          isActive: true
        },

        include: {
          category: {
            select: {
              id: true,
              name: true
            }
          }
        },

        orderBy: {
          name: "asc"
        }
      });

    const stocks = await getProductStocks(
      products.map((product) => product.id)
    );

    res.json(
      products.map((product) => {
        const quantity = stocks.get(product.id) ?? 0;

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          minStock: product.minStock,
          stock: quantity,
          lowStock: quantity <= product.minStock
        };
      })
    );
  })
);

inventoryRouter.post(
  "/in",
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
      newData: {
        productId: movement.productId,
        productName: movement.product.name,
        warehouseId: movement.warehouseId,
        quantity: movement.quantity,
        reason: movement.reason
      },
      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);

inventoryRouter.post(
  "/out",
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
      newData: {
        productId: movement.productId,
        productName: movement.product.name,
        warehouseId: movement.warehouseId,
        quantity: movement.quantity,
        reason: movement.reason
      },
      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);

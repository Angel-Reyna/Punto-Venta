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
import { AppError } from "../../utils/AppError";

import { auditLog } from "../audit/audit.service";

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
      .positive(),

    reason: z
      .string()
      .min(3)
      .max(255)
  })
});

export const inventoryRouter = Router();

inventoryRouter.use(
  requireAuth,
  requireRole(Role.ADMIN)
);

async function getOrCreateDefaultWarehouse() {
  return prisma.warehouse.upsert({
    where: {
      name: "Almacén principal"
    },
    update: {},
    create: {
      name: "Almacén principal",
      description: "Almacén principal del negocio",
      isActive: true
    }
  });
}

async function resolveWarehouseId(
  warehouseId?: string | null
) {
  if (warehouseId) {
    const warehouse =
      await prisma.warehouse.findUnique({
        where: {
          id: warehouseId
        }
      });

    if (!warehouse) {
      throw new AppError(
        404,
        "Almacén no encontrado"
      );
    }

    if (!warehouse.isActive) {
      throw new AppError(
        400,
        "Almacén inactivo"
      );
    }

    return warehouse.id;
  }

  const warehouse =
    await getOrCreateDefaultWarehouse();

  return warehouse.id;
}

async function getCurrentStock(
  productId: string,
  warehouseId?: string | null
) {
  const movements =
    await prisma.inventoryMovement.findMany({
      where: {
        productId,

        ...(warehouseId
          ? {
              warehouseId
            }
          : {})
      },

      select: {
        type: true,
        quantity: true
      }
    });

  return movements.reduce(
    (stock, movement) => {
      if (
        movement.type === "IN" ||
        movement.type === "RETURN"
      ) {
        return stock + movement.quantity;
      }

      if (
        movement.type === "OUT" ||
        movement.type === "SALE"
      ) {
        return stock - movement.quantity;
      }

      return stock;
    },
    0
  );
}

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

    const stock = await Promise.all(
      products.map(async (product) => {
        const quantity =
          await getCurrentStock(product.id);

        return {
          id: product.id,
          sku: product.sku,
          name: product.name,
          category: product.category,
          minStock: product.minStock,
          stock: quantity,
          lowStock:
            quantity <= product.minStock
        };
      })
    );

    res.json(stock);
  })
);

inventoryRouter.post(
  "/in",
  validate(movementSchema),
  asyncHandler(async (req, res) => {
    const product =
      await prisma.product.findUnique({
        where: {
          id: req.body.productId
        }
      });

    if (!product) {
      throw new AppError(
        404,
        "Producto no encontrado"
      );
    }

    if (!product.isActive) {
      throw new AppError(
        400,
        "Producto inactivo"
      );
    }

    const warehouseId =
      await resolveWarehouseId(
        req.body.warehouseId
      );

    const movement =
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,

          warehouseId,

          type: "IN",

          quantity: req.body.quantity,

          reason: req.body.reason,

          createdBy: req.user!.id
        },

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
        }
      });

    await auditLog({
      userId: req.user?.id,

      action: "INVENTORY_IN",

      tableName: "InventoryMovement",

      recordId: movement.id,

      newData: {
        productId: product.id,
        productName: product.name,
        warehouseId,
        quantity: req.body.quantity,
        reason: req.body.reason
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
    const product =
      await prisma.product.findUnique({
        where: {
          id: req.body.productId
        }
      });

    if (!product) {
      throw new AppError(
        404,
        "Producto no encontrado"
      );
    }

    if (!product.isActive) {
      throw new AppError(
        400,
        "Producto inactivo"
      );
    }

    const warehouseId =
      await resolveWarehouseId(
        req.body.warehouseId
      );

    const currentStock =
      await getCurrentStock(
        product.id,
        warehouseId
      );

    if (
      currentStock < req.body.quantity
    ) {
      throw new AppError(
        400,
        `Stock insuficiente. Stock actual: ${currentStock}`
      );
    }

    const movement =
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,

          warehouseId,

          type: "OUT",

          quantity: req.body.quantity,

          reason: req.body.reason,

          createdBy: req.user!.id
        },

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
        }
      });

    await auditLog({
      userId: req.user?.id,

      action: "INVENTORY_OUT",

      tableName: "InventoryMovement",

      recordId: movement.id,

      newData: {
        productId: product.id,
        productName: product.name,
        warehouseId,
        quantity: req.body.quantity,
        reason: req.body.reason
      },

      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);
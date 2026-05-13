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

    quantity: z.coerce.number().int().positive(),

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

inventoryRouter.get(
  "/movements",
  asyncHandler(async (_req, res) => {
    const movements =
      await prisma.inventoryMovement.findMany({
        include: {
          product: true
        },

        orderBy: {
          createdAt: "desc"
        },

        take: 300
      });

    res.json(movements);
  })
);

inventoryRouter.post(
  "/in",
  validate(movementSchema),
  asyncHandler(async (req, res) => {
    const product =
      await prisma.product.findUniqueOrThrow({
        where: {
          id: req.body.productId
        }
      });

    const movement =
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: {
            id: req.body.productId
          },

          data: {
            stock: {
              increment:
                req.body.quantity
            }
          }
        });

        return tx.inventoryMovement.create({
          data: {
            productId:
              req.body.productId,

            quantity:
              req.body.quantity,

            reason:
              req.body.reason,

            type: "IN",

            createdBy:
              req.user!.id
          },

          include: {
            product: true
          }
        });
      });

    await auditLog({
      userId: req.user?.id,

      action: "INVENTORY_IN",

      tableName:
        "InventoryMovement",

      recordId: movement.id,

      newData: {
        productId:
          product.id,

        productName:
          product.name,

        quantity:
          req.body.quantity,

        reason:
          req.body.reason
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
      await prisma.product.findUniqueOrThrow({
        where: {
          id: req.body.productId
        }
      });

    if (
      product.stock <
      req.body.quantity
    ) {
      throw new AppError(
        400,
        "Stock insuficiente"
      );
    }

    const movement =
      await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: {
            id: req.body.productId
          },

          data: {
            stock: {
              decrement:
                req.body.quantity
            }
          }
        });

        return tx.inventoryMovement.create({
          data: {
            productId:
              req.body.productId,

            quantity:
              req.body.quantity,

            reason:
              req.body.reason,

            type: "OUT",

            createdBy:
              req.user!.id
          },

          include: {
            product: true
          }
        });
      });

    await auditLog({
      userId: req.user?.id,

      action: "INVENTORY_OUT",

      tableName:
        "InventoryMovement",

      recordId: movement.id,

      newData: {
        productId:
          product.id,

        productName:
          product.name,

        quantity:
          req.body.quantity,

        reason:
          req.body.reason
      },

      ipAddress: req.ip
    });

    res.status(201).json(movement);
  })
);
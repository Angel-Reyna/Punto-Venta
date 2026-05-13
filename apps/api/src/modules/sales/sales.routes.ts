import { Router } from "express";
import { z } from "zod";
import { Role } from "@prisma/client";

import { prisma } from "../../config/prisma";

import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";

import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";

import { auditLog } from "../audit/audit.service";

const saleSchema = z.object({
  body: z.object({
    customerName: z.string().max(120).optional(),

    items: z
      .array(
        z.object({
          productId: z.string().uuid(),
          quantity: z.coerce.number().int().positive()
        })
      )
      .min(1)
  })
});

export const salesRouter = Router();

salesRouter.use(requireAuth);

salesRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const where =
      req.user?.role === Role.ADMIN
        ? {}
        : {
            cashierId: req.user!.id
          };

    const sales = await prisma.sale.findMany({
      where,

      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },

        items: {
          include: {
            product: {
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    salePrice: true,
                    promoPercent: true
                }
            }
          }
        }
      },

      orderBy: {
        createdAt: "desc"
      },

      take: 200
    });

    res.json(sales);
  })
);

salesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const sale = await prisma.sale.findUnique({
      where: {
        id: req.params.id as string
      },

      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },

        items: {
          include: {
            product: {
                select: {
                    id: true,
                    sku: true,
                    name: true,
                    salePrice: true,
                    promoPercent: true
                }
            }
          }
        }
      }
    });

    if (!sale) {
      throw new AppError(404, "Venta no encontrada");
    }

    const isOwner =
      sale.cashierId === req.user!.id;

    const isAdmin =
      req.user!.role === Role.ADMIN;

    if (!isAdmin && !isOwner) {
      throw new AppError(403, "No autorizado");
    }

    res.json(sale);
  })
);

salesRouter.post(
  "/",
  validate(saleSchema),
  asyncHandler(async (req, res) => {
    const sale = await prisma.$transaction(async (tx) => {
      let subtotal = 0;
      let discount = 0;

      const preparedItems = [];

      for (const item of req.body.items) {
        const product = await tx.product.findUniqueOrThrow({
          where: {
            id: item.productId
          }
        });

        if (!product.isActive) {
          throw new AppError(
            400,
            `Producto inactivo: ${product.name}`
          );
        }

        if (product.stock < item.quantity) {
          throw new AppError(
            400,
            `Stock insuficiente: ${product.name}`
          );
        }

        const unitPrice = Number(product.salePrice);

        const promoPercent = Number(product.promoPercent);

        const lineSubtotal = unitPrice * item.quantity;

        const lineDiscount =
          lineSubtotal * (promoPercent / 100);

        const lineTotal = lineSubtotal - lineDiscount;

        subtotal += lineSubtotal;
        discount += lineDiscount;

        preparedItems.push({
          product,
          quantity: item.quantity,
          unitPrice,
          discount: lineDiscount,
          total: lineTotal
        });
      }

      const createdSale = await tx.sale.create({
        data: {
          cashierId: req.user!.id,
          customerName: req.body.customerName,
          subtotal,
          discount,
          total: subtotal - discount,

          items: {
            create: preparedItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              total: item.total
            }))
          }
        },

        include: {
          items: true
        }
      });

      for (const item of preparedItems) {
        await tx.product.update({
          where: {
            id: item.product.id
          },

          data: {
            stock: {
              decrement: item.quantity
            }
          }
        });

        await tx.inventoryMovement.create({
          data: {
            productId: item.product.id,
            type: "SALE",
            quantity: item.quantity,
            reason: `Venta ${createdSale.id}`,
            createdBy: req.user!.id
          }
        });
      }

      return createdSale;
    });

    await auditLog({
      userId: req.user?.id,
      action: "CREATE_SALE",
      tableName: "Sale",
      recordId: sale.id,
      newData: sale,
      ipAddress: req.ip
    });

    res.status(201).json(sale);
  })
);
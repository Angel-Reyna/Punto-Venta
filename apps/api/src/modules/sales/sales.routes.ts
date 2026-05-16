import { randomUUID } from "crypto";

import { Router, type Request } from "express";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../config/prisma";

import { requireAuth } from "../../middlewares/auth";
import { validate } from "../../middlewares/validate";

import { asyncHandler } from "../../utils/asyncHandler";
import { AppError } from "../../utils/AppError";

import { auditLog } from "../audit/audit.service";
import {
  decreaseStock,
  getOrCreateDefaultWarehouse
} from "../inventory/inventory.service";

const saleSchema = z.object({
  body: z.object({
    customerId: z.string().uuid().optional().nullable(),

    customerName: z.string().max(120).optional().nullable(),

    paymentMethod: z
      .enum(["CASH", "CARD", "TRANSFER", "MIXED"])
      .default("CASH"),

    items: z
      .array(
        z.object({
          productId: z.string().uuid(),

          quantity: z.coerce
            .number()
            .int()
            .positive()
            .max(1_000_000)
        })
      )
      .min(1)
  })
});

export const salesRouter = Router();

type SaleWithDetails = Prisma.SaleGetPayload<{
  include: {
    cashier: {
      select: {
        id: true;
        name: true;
        email: true;
      };
    };
    customer: {
      select: {
        id: true;
        name: true;
        phone: true;
        email: true;
      };
    };
    items: {
      include: {
        product: {
          select: {
            id: true;
            sku: true;
            name: true;
            salePrice: true;
            promoPercent: true;
          };
        };
      };
    };
    payments: true;
  };
}>;

type SaleWithItemsAndPayments = Prisma.SaleGetPayload<{
  include: {
    items: true;
    payments: true;
  };
}>;

salesRouter.use(requireAuth);

function getRouteId(req: Request) {
  const id = req.params.id;

  if (Array.isArray(id) || !id) {
    throw new AppError(400, "ID inválido");
  }

  return id;
}

function generateFolio() {
  const date = new Date();

  const yyyy = date.getFullYear();

  const mm = String(date.getMonth() + 1).padStart(2, "0");

  const dd = String(date.getDate()).padStart(2, "0");

  const random = randomUUID().slice(0, 8).toUpperCase();

  return `SALE-${yyyy}${mm}${dd}-${random}`;
}

async function resolveCustomer(
  tx: Prisma.TransactionClient,
  customerId?: string | null,
  customerName?: string | null
) {
  if (customerId) {
    const customer = await tx.customer.findUnique({
      where: {
        id: customerId
      }
    });

    if (!customer) {
      throw new AppError(404, "Cliente no encontrado");
    }

    if (!customer.isActive) {
      throw new AppError(400, "Cliente inactivo");
    }

    return customer.id;
  }

  const cleanName = customerName?.trim();

  if (!cleanName) {
    return null;
  }

  const customer = await tx.customer.create({
    data: {
      name: cleanName,
      isActive: true
    }
  });

  return customer.id;
}

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

        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
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
        },

        payments: true
      },

      orderBy: {
        createdAt: "desc"
      },

      take: 200
    });

    res.json(
      sales.map((sale) => ({
        ...sale,

        subtotal: Number(sale.subtotal),
        discount: Number(sale.discount),
        tax: Number(sale.tax),
        total: Number(sale.total),

        items: sale.items.map((item) => ({
          ...item,
          unitPrice: Number(item.unitPrice),
          discount: Number(item.discount),
          total: Number(item.total),

          product: {
            ...item.product,
            salePrice: Number(item.product.salePrice),
            promoPercent: Number(item.product.promoPercent)
          }
        })),

        payments: sale.payments.map((payment) => ({
          ...payment,
          amount: Number(payment.amount)
        }))
      }))
    );
  })
);

salesRouter.get(
  "/:id",
  asyncHandler(async (req, res) => {
    const sale = await prisma.sale.findUnique({
      where: {
        id: getRouteId(req)
      },

      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },

        customer: {
          select: {
            id: true,
            name: true,
            phone: true,
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
        },

        payments: true
      }
    });

    if (!sale) {
      throw new AppError(404, "Venta no encontrada");
    }

    const isOwner = sale.cashierId === req.user!.id;

    const isAdmin = req.user!.role === Role.ADMIN;

    if (!isAdmin && !isOwner) {
      throw new AppError(403, "No autorizado");
    }

    res.json({
      ...sale,

      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      total: Number(sale.total),

      items: sale.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total),

        product: {
          ...item.product,
          salePrice: Number(item.product.salePrice),
          promoPercent: Number(item.product.promoPercent)
        }
      })),

      payments: sale.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    });
  })
);

salesRouter.post(
  "/",
  validate(saleSchema),
  asyncHandler(async (req, res) => {
    const sale: SaleWithItemsAndPayments = await prisma.$transaction(async (tx): Promise<SaleWithItemsAndPayments> => {
      const warehouse = await getOrCreateDefaultWarehouse(tx);

      const customerId = await resolveCustomer(
        tx,
        req.body.customerId,
        req.body.customerName
      );

      let subtotal = 0;

      let discount = 0;

      const preparedItems = [];

      for (const item of req.body.items) {
        const product = await tx.product.findUnique({
          where: {
            id: item.productId
          }
        });

        if (!product) {
          throw new AppError(404, "Producto no encontrado");
        }

        if (!product.isActive) {
          throw new AppError(
            400,
            `Producto inactivo: ${product.name}`
          );
        }

        const unitPrice = Number(product.salePrice);

        const promoPercent = Number(product.promoPercent);

        const lineSubtotal = unitPrice * item.quantity;

        const lineDiscount = lineSubtotal * (promoPercent / 100);

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

      const total = subtotal - discount;

      const createdSale = await tx.sale.create({
        data: {
          folio: generateFolio(),

          cashierId: req.user!.id,

          customerId,

          status: "COMPLETED",

          subtotal,

          discount,

          tax: 0,

          total,

          items: {
            create: preparedItems.map((item) => ({
              productId: item.product.id,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              total: item.total
            }))
          },

          payments: {
            create: {
              method: req.body.paymentMethod,
              amount: total
            }
          }
        },

        include: {
          items: true,
          payments: true
        }
      });

      for (const item of preparedItems) {
        await decreaseStock(tx, {
          productId: item.product.id,
          warehouseId: warehouse.id,
          type: "SALE",
          quantity: item.quantity,
          reason: `Venta ${createdSale.folio}`,
          createdBy: req.user!.id,
          insufficientStockMessage: `Stock insuficiente para ${item.product.name}.`
        });
      }

      if (req.user!.role === Role.CASHIER) {
        await tx.sellerActivityLog.create({
          data: {
            sellerId: req.user!.id,

            action: "SALE_CREATED",

            entityType: "Sale",

            entityId: createdSale.id,

            description: `Venta creada con folio ${createdSale.folio}`,

            metadata: {
              folio: createdSale.folio,
              total,
              items: preparedItems.length
            },

            ipAddress: req.ip,

            userAgent: req.headers["user-agent"]
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

    res.status(201).json({
      ...sale,

      subtotal: Number(sale.subtotal),
      discount: Number(sale.discount),
      tax: Number(sale.tax),
      total: Number(sale.total),

      items: sale.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        discount: Number(item.discount),
        total: Number(item.total)
      })),

      payments: sale.payments.map((payment) => ({
        ...payment,
        amount: Number(payment.amount)
      }))
    });
  })
);
import { Router, type Request } from "express";
import multer from "multer";
import { Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

import {
  requireAuth,
  requireRoles
} from "../../middlewares/auth";

import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";

import { auditLog } from "../audit/audit.service";

import {
  calculateFinalPrice,
  calculateMargin,
  importProducts,
  productTemplateBuffer
} from "./products.service";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024
  }
});

const createSchema = z.object({
  body: z.object({
    categoryId: z.string().uuid().optional().nullable(),

    sku: z.string().min(1).max(80),

    barcode: z.string().max(80).optional().nullable(),

    name: z.string().min(2).max(160),

    description: z.string().max(500).optional().nullable(),

    costPrice: z.coerce.number().min(0),

    salePrice: z.coerce.number().min(0),

    promoPercent: z.coerce.number().min(0).max(100).default(0),

    minStock: z.coerce.number().int().min(0).default(0)
  })
});

const updateSchema = z.object({
  body: createSchema.shape.body.partial()
});

export const productsRouter = Router();

productsRouter.use(requireAuth);

function getRouteId(req: Request) {
  const id = req.params.id;

  if (Array.isArray(id) || !id) {
    throw new AppError(400, "ID inválido");
  }

  return id;
}

async function getProductStock(productId: string) {
  const movements = await prisma.inventoryMovement.findMany({
    where: {
      productId
    },
    select: {
      type: true,
      quantity: true
    }
  });

  return movements.reduce((stock, movement) => {
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
  }, 0);
}

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const q = String(req.query.q ?? "").trim();

    const where = {
      ...(q
        ? {
            OR: [
              {
                sku: {
                  contains: q,
                  mode: "insensitive" as const
                }
              },
              {
                name: {
                  contains: q,
                  mode: "insensitive" as const
                }
              }
            ]
          }
        : {}),

      ...(req.user?.role === Role.ADMIN
        ? {}
        : {
            isActive: true
          })
    };

    const products = await prisma.product.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    });

    const mappedProducts = await Promise.all(
      products.map(async (product) => {
        const stock = await getProductStock(product.id);

        const salePrice = Number(product.salePrice);

        const promoPercent = Number(product.promoPercent);

        const finalPrice = calculateFinalPrice(
          salePrice,
          promoPercent
        );

        if (req.user?.role !== Role.ADMIN) {
          return {
            id: product.id,
            sku: product.sku,
            barcode: product.barcode,
            name: product.name,
            description: product.description,
            category: product.category,
            salePrice,
            promoPercent,
            finalPrice,
            stock
          };
        }

        return {
          ...product,
          costPrice: Number(product.costPrice),
          salePrice,
          promoPercent,
          marginPercent: calculateMargin(
            Number(product.costPrice),
            salePrice
          ),
          finalPrice,
          stock
        };
      })
    );

    res.json(mappedProducts);
  })
);

productsRouter.post(
  "/",
  requireRoles(Role.ADMIN),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.create({
      data: {
        categoryId: req.body.categoryId,
        sku: req.body.sku,
        barcode: req.body.barcode,
        name: req.body.name,
        description: req.body.description,
        costPrice: req.body.costPrice,
        salePrice: req.body.salePrice,
        promoPercent: req.body.promoPercent,
        minStock: req.body.minStock
      }
    });

    await auditLog({
      userId: req.user?.id,
      action: "CREATE_PRODUCT",
      tableName: "Product",
      recordId: product.id,
      newData: product,
      ipAddress: req.ip
    });

    res.status(201).json(product);
  })
);

productsRouter.patch(
  "/:id",
  requireRoles(Role.ADMIN),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const productId = getRouteId(req);

    const oldData = await prisma.product.findUniqueOrThrow({
      where: {
        id: productId
      }
    });

    const product = await prisma.product.update({
      where: {
        id: productId
      },
      data: req.body
    });

    await auditLog({
      userId: req.user?.id,
      action: "UPDATE_PRODUCT",
      tableName: "Product",
      recordId: product.id,
      oldData,
      newData: product,
      ipAddress: req.ip
    });

    res.json(product);
  })
);

productsRouter.patch(
  "/:id/toggle",
  requireRoles(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const productId = getRouteId(req);

    const oldData = await prisma.product.findUniqueOrThrow({
      where: {
        id: productId
      }
    });

    const product = await prisma.product.update({
      where: {
        id: productId
      },
      data: {
        isActive: !oldData.isActive
      }
    });

    await auditLog({
      userId: req.user?.id,
      action: "TOGGLE_PRODUCT_ACTIVE",
      tableName: "Product",
      recordId: product.id,
      oldData,
      newData: product,
      ipAddress: req.ip
    });

    res.json(product);
  })
);

productsRouter.get(
  "/template/excel",
  requireRoles(Role.ADMIN),
  (_req, res) => {
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=formato-productos.xlsx"
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(productTemplateBuffer());
  }
);

productsRouter.post(
  "/import/excel",
  requireRoles(Role.ADMIN),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "Archivo requerido"
      });
    }

  const imported = await importProducts(
    req.file.buffer,
    req.user!.id
  );

    await auditLog({
      userId: req.user?.id,
      action: "IMPORT_PRODUCTS_EXCEL",
      tableName: "Product",
      newData: {
        count: imported.length
      },
      ipAddress: req.ip
    });

    res.json({
      imported: imported.length
    });
  })
);
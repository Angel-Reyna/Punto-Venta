import { Router } from "express";
import multer = require("multer");
import { Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../config/prisma";

import {
  requireAuth,
  requireRole
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
    sku: z.string().min(1).max(80),

    name: z.string().min(2).max(160),

    description: z.string().max(500).optional().nullable(),

    costPrice: z.coerce.number().min(0),

    salePrice: z.coerce.number().min(0),

    promoPercent: z.coerce.number().min(0).max(100).default(0),

    stock: z.coerce.number().int().min(0).default(0),

    minStock: z.coerce.number().int().min(0).default(0)
  })
});

const updateSchema = z.object({
  body: createSchema.shape.body.partial()
});

export const productsRouter = Router();

productsRouter.use(requireAuth);

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

      orderBy: {
        createdAt: "desc"
      }
    });

    const mappedProducts = products.map((product) => {
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
        name: product.name,
        description: product.description,
        salePrice,
        promoPercent,
        finalPrice,
        stock: product.stock
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

        finalPrice
    };
    });

res.json(mappedProducts);
  })
);

productsRouter.post(
  "/",
  requireRole(Role.ADMIN),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const product = await prisma.product.create({
      data: req.body
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
  requireRole(Role.ADMIN),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const oldData = await prisma.product.findUniqueOrThrow({
      where: {
        id: String(req.params.id)
      }
    });

    const product = await prisma.product.update({
      where: {
        id: String(req.params.id)
      },
      data: req.body
    });

    await auditLog({
      userId: req.user?.id,
      action: "UPDATE",
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
  requireRole(Role.ADMIN),
  asyncHandler(async (req, res) => {
    const oldData = await prisma.product.findUniqueOrThrow({
      where: {
        id: String(req.params.id)
      }
    });

    const product = await prisma.product.update({
      where: {
        id: String(req.params.id)
      },

      data: {
        isActive: !oldData.isActive
      }
    });

    await auditLog({
      userId: req.user?.id,
      action: "TOGGLE_ACTIVE",
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
  requireRole(Role.ADMIN),
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
  requireRole(Role.ADMIN),
  upload.single("file"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({
        message: "Archivo requerido"
      });
    }

    const imported = await importProducts(req.file.buffer);

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
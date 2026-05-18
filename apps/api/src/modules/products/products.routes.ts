import { Router, type Request } from "express";
import multer from "multer";
import { Prisma, Role } from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

import {
  requireAuth,
  requireRoles
} from "../../middlewares/auth";

import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import {
  buildPaginationMeta,
  getOptionalBoolean,
  getOptionalString,
  getPagination,
  setPaginationHeaders
} from "../../utils/pagination";

import { auditLog } from "../audit/audit.service";
import { getProductStocks } from "../inventory/inventory.service";

import {
  calculateFinalPrice,
  calculateMargin,
  importProducts,
  productTemplateBuffer
} from "./products.service";

const productWithCategoryInclude = {
  category: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.ProductInclude;

type ProductWithCategory = Prisma.ProductGetPayload<{
  include: typeof productWithCategoryInclude;
}>;

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

function assertExcelFile(file: Express.Multer.File) {
  const fileName = file.originalname.toLowerCase();
  const allowedExtension = fileName.endsWith(".xlsx") || fileName.endsWith(".xls");
  const allowedMimeTypes = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/octet-stream"
  ]);

  if (!allowedExtension || !allowedMimeTypes.has(file.mimetype)) {
    throw new AppError(
      400,
      "El archivo debe ser un Excel válido con extensión .xlsx o .xls"
    );
  }
}

function getRouteId(req: Request) {
  const id = req.params.id;

  if (Array.isArray(id) || !id) {
    throw new AppError(400, "ID inválido");
  }

  return id;
}

productsRouter.get(
  "/",
  asyncHandler(async (req, res) => {
    const pagination = getPagination(req.query as Record<string, unknown>, {
      defaultPageSize: 50,
      maxPageSize: 100
    });
    const q = getOptionalString(req.query.q, 120);
    const categoryId = getOptionalString(req.query.categoryId, 80);
    const active = getOptionalBoolean(req.query.active);
    const lowStock = getOptionalBoolean(req.query.lowStock);

    const where: Prisma.ProductWhereInput = {
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
              }
            ]
          }
        : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(req.user?.role === Role.ADMIN
        ? active === undefined
          ? {}
          : { isActive: active }
        : {
            isActive: true
          })
    };

    const mapProduct = (
      product: ProductWithCategory,
      stock: number
    ) => {
      const salePrice = Number(product.salePrice);
      const promoPercent = Number(product.promoPercent);
      const finalPrice = calculateFinalPrice(salePrice, promoPercent);

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
    };

    if (lowStock !== true) {
      const [total, products] = await Promise.all([
        prisma.product.count({ where }),
        prisma.product.findMany({
          where,
          include: productWithCategoryInclude,
          orderBy: {
            createdAt: "desc"
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
        products.map((product) => mapProduct(product, stocks.get(product.id) ?? 0))
      );
    }

    const products = await prisma.product.findMany({
      where,
      include: productWithCategoryInclude,
      orderBy: {
        createdAt: "desc"
      }
    });

    const stocks = await getProductStocks(products.map((product) => product.id));
    const lowStockProducts = products.filter((product) => {
      const stock = stocks.get(product.id) ?? 0;

      return stock <= product.minStock;
    });

    const pageItems = lowStockProducts
      .slice(pagination.skip, pagination.skip + pagination.take)
      .map((product) => mapProduct(product, stocks.get(product.id) ?? 0));

    setPaginationHeaders(
      res,
      buildPaginationMeta(pagination, lowStockProducts.length)
    );

    return res.json(pageItems);
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
      throw new AppError(400, "Archivo requerido");
    }

    assertExcelFile(req.file);

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
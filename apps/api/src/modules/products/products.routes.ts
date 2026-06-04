import { Router, type Request } from "express";
import multer from "multer";
import { z } from "zod";

import { AppError } from "../../utils/AppError";

import {
  requireAuth,
  requirePermission
} from "../../middlewares/auth";

import { validate } from "../../middlewares/validate";
import { asyncHandler } from "../../utils/asyncHandler";
import { setPaginationHeaders } from "../../utils/pagination";

import { auditLog } from "../audit/audit.service";
import { PERMISSIONS } from "../auth/permissions";

import {
  createProduct,
  deleteAllProductsSafely,
  deleteProductSafely,
  importProducts,
  productTemplateBuffer
} from "./products.service";
import {
  listProductCategories,
  listProducts,
  toggleProductActive,
  updateProduct
} from "./products.queries";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 4 * 1024 * 1024
  }
});

const categoryWriteFieldsSchema = z.object({
  categoryId: z.string().uuid().optional().nullable(),
  categoryName: z.string().trim().min(2).max(60).optional().nullable()
});

const productWriteFieldsSchema = z.object({
  sku: z.string().min(1).max(80),

  barcode: z.string().max(80).optional().nullable(),

  name: z.string().min(2).max(160),

  description: z.string().max(500).optional().nullable(),

  costPrice: z.coerce.number().min(0),

  salePrice: z.coerce.number().min(0),

  promoPercent: z.coerce.number().min(0).max(100).default(0),

  minStock: z.coerce.number().int().min(0).default(0),

  initialStock: z.coerce.number().int().min(0).max(1_000_000).default(0)
});

function validateCategorySelection(
  value: { categoryId?: string | null; categoryName?: string | null },
  ctx: z.RefinementCtx
) {
  if (value.categoryId && value.categoryName) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Elige una categoría existente o escribe una nueva, no ambas.",
      path: ["categoryName"]
    });
  }
}

const createSchema = z.object({
  body: categoryWriteFieldsSchema
    .merge(productWriteFieldsSchema)
    .superRefine(validateCategorySelection)
});

const updateSchema = z.object({
  body: categoryWriteFieldsSchema
    .partial()
    .merge(productWriteFieldsSchema.omit({ initialStock: true }).partial())
    .superRefine(validateCategorySelection)
});

export const productsRouter = Router();

productsRouter.use(requireAuth);

function assertExcelFile(file: Express.Multer.File) {
  const fileName = file.originalname.toLowerCase();
  const allowedExtension = fileName.endsWith(".xlsx");
  const allowedMimeTypes = new Set([
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/octet-stream"
  ]);

  if (!allowedExtension || !allowedMimeTypes.has(file.mimetype)) {
    throw new AppError(
      400,
      "El archivo debe ser un Excel válido con extensión .xlsx"
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
  requirePermission(PERMISSIONS.ProductsRead),
  asyncHandler(async (req, res) => {
    const result = await listProducts(
      req.user!,
      req.query as Record<string, unknown>
    );

    setPaginationHeaders(res, result.meta);

    res.json(result.data);
  })
);

productsRouter.get(
  "/categories",
  requirePermission(PERMISSIONS.ProductsRead),
  asyncHandler(async (_req, res) => {
    const categories = await listProductCategories();

    res.json(categories);
  })
);

productsRouter.post(
  "/",
  requirePermission(PERMISSIONS.ProductsCreate),
  validate(createSchema),
  asyncHandler(async (req, res) => {
    const product = await createProduct(req.body, req.user!.id);

    await auditLog({
      userId: req.user?.id,
      action: "CREATE_PRODUCT",
      tableName: "Product",
      recordId: product.id,
      newData: {
        ...product,
        initialStock: req.body.initialStock
      },
      ipAddress: req.ip
    });

    res.status(201).json(product);
  })
);

productsRouter.patch(
  "/:id",
  requirePermission(PERMISSIONS.ProductsUpdate),
  validate(updateSchema),
  asyncHandler(async (req, res) => {
    const productId = getRouteId(req);
    const { oldData, product } = await updateProduct(productId, req.body);

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
  requirePermission(PERMISSIONS.ProductsToggleActive),
  asyncHandler(async (req, res) => {
    const productId = getRouteId(req);
    const { oldData, product } = await toggleProductActive(productId);

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

productsRouter.delete(
  "/",
  requirePermission(PERMISSIONS.ProductsDelete),
  asyncHandler(async (req, res) => {
    const result = await deleteAllProductsSafely();

    await auditLog({
      userId: req.user?.id,
      action: "DELETE_ALL_PRODUCTS",
      tableName: "Product",
      recordId: "ALL_PRODUCTS",
      newData: result,
      ipAddress: req.ip
    });

    res.json({
      ...result,
      message: `Se eliminaron ${result.deletedProducts} producto${
        result.deletedProducts === 1 ? "" : "s"
      } del catálogo. El historial operativo conserva nombres y SKU como evidencia.`
    });
  })
);

productsRouter.delete(
  "/:id",
  requirePermission(PERMISSIONS.ProductsDelete),
  asyncHandler(async (req, res) => {
    const productId = getRouteId(req);
    const result = await deleteProductSafely(productId);

    await auditLog({
      userId: req.user?.id,
      action: "DELETE_PRODUCT",
      tableName: "Product",
      recordId: result.product.id,
      newData: result,
      ipAddress: req.ip
    });

    res.json({
      ...result,
      message: "Producto eliminado correctamente. El historial operativo conserva nombre y SKU como evidencia."
    });
  })
);

productsRouter.get(
  "/template/excel",
  requirePermission(PERMISSIONS.ProductsImport),
  asyncHandler(async (_req, res) => {
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=formato-productos.xlsx"
    );

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.send(await productTemplateBuffer());
  })
);

productsRouter.post(
  "/import/excel",
  requirePermission(PERMISSIONS.ProductsImport),
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
      newData: imported,
      ipAddress: req.ip
    });

    res.json({
      ...imported,
      message: `Importación finalizada: ${imported.imported} producto${
        imported.imported === 1 ? "" : "s"
      } procesado${imported.imported === 1 ? "" : "s"}.`
    });
  })
);

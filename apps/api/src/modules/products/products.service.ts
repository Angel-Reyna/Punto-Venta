import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

import { resolveProductCategorySelection } from "./products.categories";

import {
  getOrCreateDefaultWarehouse,
  increaseStock
} from "../inventory/inventory.service";

import {
  getOrCreateCategory,
  parseProductImportRow,
  readProductRows
} from "./products.import";

export { productTemplateBuffer } from "./products.import";

export type CreateProductInput = {
  categoryId?: string | null;
  categoryName?: string | null;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;
  costPrice: number;
  salePrice: number;
  promoPercent: number;
  minStock: number;
  initialStock: number;
};

export type DeleteAllProductsResult = {
  mode: "deleted_all";
  deletedProducts: number;
  deletedInventoryBalances: number;
  preservedReferences: {
    saleItems: number;
    saleReturnItems: number;
    inventoryMovements: number;
  };
};

export type DeleteProductResult = {
  mode: "deleted";
  product: {
    id: string;
    sku: string;
    name: string;
    isActive: boolean;
  };
  preservedReferences: {
    saleItems: number;
    saleReturnItems: number;
    inventoryMovements: number;
  };
};

export type ProductImportSummary = {
  imported: number;
  created: number;
  updated: number;
  withInitialStock: number;
};

export async function createProduct(
  input: CreateProductInput,
  userId: string
) {
  return prisma.$transaction(
    async (tx) => {
      const categoryId = await resolveProductCategorySelection(tx, input, {
        defaultToNull: true
      });

      const product = await tx.product.create({
        data: {
          ...(categoryId
            ? {
                category: {
                  connect: {
                    id: categoryId
                  }
                }
              }
            : {}),
          sku: input.sku,
          barcode: input.barcode ?? null,
          name: input.name,
          description: input.description ?? null,
          costPrice: input.costPrice,
          salePrice: input.salePrice,
          promoPercent: input.promoPercent,
          minStock: input.minStock,
          isActive: true
        }
      });

      if (input.initialStock > 0) {
        const warehouse = await getOrCreateDefaultWarehouse(tx);

        await increaseStock(tx, {
          productId: product.id,
          warehouseId: warehouse.id,
          quantity: input.initialStock,
          reason: "Stock inicial desde creación de producto",
          createdBy: userId,
          type: "IN"
        });
      }

      return product;
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000
    }
  );
}

export async function deleteProductSafely(
  productId: string
): Promise<DeleteProductResult> {
  return prisma.$transaction(
    async (tx) => {
      const product = await tx.product.findUnique({
        where: {
          id: productId
        },
        select: {
          id: true,
          sku: true,
          name: true,
          isActive: true
        }
      });

      if (!product) {
        throw new AppError(404, "Producto no encontrado");
      }

      const [saleItems, saleReturnItems, inventoryMovements] = await Promise.all([
        tx.saleItem.count({ where: { productId } }),
        tx.saleReturnItem.count({ where: { productId } }),
        tx.inventoryMovement.count({ where: { productId } })
      ]);

      await tx.inventoryBalance.deleteMany({
        where: {
          productId
        }
      });

      await tx.product.delete({
        where: {
          id: productId
        }
      });

      return {
        mode: "deleted",
        product,
        preservedReferences: {
          saleItems,
          saleReturnItems,
          inventoryMovements
        }
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 15_000
    }
  );
}

export async function deleteAllProductsSafely(): Promise<DeleteAllProductsResult> {
  return prisma.$transaction(
    async (tx) => {
      const [deletedProducts, saleItems, saleReturnItems, inventoryMovements] =
        await Promise.all([
          tx.product.count(),
          tx.saleItem.count({ where: { productId: { not: null } } }),
          tx.saleReturnItem.count({ where: { productId: { not: null } } }),
          tx.inventoryMovement.count({ where: { productId: { not: null } } })
        ]);

      const deletedInventoryBalances = await tx.inventoryBalance.deleteMany({});
      await tx.product.deleteMany({});

      return {
        mode: "deleted_all",
        deletedProducts,
        deletedInventoryBalances: deletedInventoryBalances.count,
        preservedReferences: {
          saleItems,
          saleReturnItems,
          inventoryMovements
        }
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 30_000
    }
  );
}

export function calculateMargin(
  costPrice: number,
  salePrice: number
) {
  if (salePrice <= 0) return 0;

  return Number(
    (((salePrice - costPrice) / salePrice) * 100).toFixed(2)
  );
}

export function calculateFinalPrice(
  salePrice: number,
  promoPercent: number
) {
  return Number(
    (salePrice * (1 - promoPercent / 100)).toFixed(2)
  );
}

export async function importProducts(
  buffer: Buffer,
  userId: string
): Promise<ProductImportSummary> {
  const rows = await readProductRows(buffer);

  return prisma.$transaction(
    async (tx) => {
      const warehouse = await getOrCreateDefaultWarehouse(tx);

      const summary: ProductImportSummary = {
        imported: 0,
        created: 0,
        updated: 0,
        withInitialStock: 0
      };
      const seenSkus = new Set<string>();
      const seenBarcodes = new Set<string>();

      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2;

        const parsedRow = parseProductImportRow(row, rowNumber);
        const {
          categoryName,
          sku,
          barcode,
          name,
          description,
          costPrice,
          salePrice,
          promoPercent,
          minStock,
          initialStock
        } = parsedRow;

        if (seenSkus.has(sku)) {
          throw new AppError(
            400,
            `Fila ${rowNumber}: sku duplicado en el archivo (${sku})`
          );
        }

        seenSkus.add(sku);

        if (barcode) {
          if (seenBarcodes.has(barcode)) {
            throw new AppError(
              400,
              `Fila ${rowNumber}: barcode duplicado en el archivo (${barcode})`
            );
          }

          seenBarcodes.add(barcode);
        }

        const category = await getOrCreateCategory(tx, categoryName);

        if (barcode) {
          const productWithBarcode = await tx.product.findFirst({
            where: {
              barcode,
              sku: {
                not: sku
              }
            },
            select: {
              sku: true
            }
          });

          if (productWithBarcode) {
            throw new AppError(
              409,
              `Fila ${rowNumber}: barcode ya está asignado al SKU ${productWithBarcode.sku}`
            );
          }
        }

        const existingProduct = await tx.product.findFirst({
          where: {
            sku
          },
          select: {
            id: true
          }
        });

        const product = await tx.product.upsert({
          where: {
            sku
          },

          update: {
            categoryId: category.id,
            barcode,
            name,
            description,
            costPrice,
            salePrice,
            promoPercent,
            minStock,
            isActive: true
          },

          create: {
            categoryId: category.id,
            sku,
            barcode,
            name,
            description,
            costPrice,
            salePrice,
            promoPercent,
            minStock,
            isActive: true
          }
        });

        if (existingProduct) {
          summary.updated += 1;
        } else {
          summary.created += 1;
        }

        summary.imported += 1;

        if (initialStock > 0) {
          summary.withInitialStock += 1;

          await increaseStock(tx, {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: initialStock,
            reason: "Stock inicial desde importación Excel",
            createdBy: userId,
            type: "IN"
          });
        }
      }

      return summary;
    },
    {
      maxWait: 5_000,
      timeout: 30_000
    }
  );
}

import { Prisma } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

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

async function assertActiveCategory(
  tx: Prisma.TransactionClient,
  categoryId?: string | null
) {
  if (!categoryId) {
    return;
  }

  const category = await tx.productCategory.findUnique({
    where: {
      id: categoryId
    },
    select: {
      id: true,
      name: true,
      isActive: true
    }
  });

  if (!category) {
    throw new AppError(404, "Categoría no encontrada");
  }

  if (!category.isActive) {
    throw new AppError(400, `Categoría inactiva: ${category.name}`);
  }
}

export async function createProduct(
  input: CreateProductInput,
  userId: string
) {
  return prisma.$transaction(
    async (tx) => {
      await assertActiveCategory(tx, input.categoryId);

      const product = await tx.product.create({
        data: {
          categoryId: input.categoryId ?? null,
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
) {
  const rows = await readProductRows(buffer);

  return prisma.$transaction(
    async (tx) => {
      const warehouse = await getOrCreateDefaultWarehouse(tx);

      const imported = [];
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

        if (initialStock > 0) {
          await increaseStock(tx, {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: initialStock,
            reason: "Stock inicial desde importación Excel",
            createdBy: userId,
            type: "IN"
          });
        }

        imported.push(product);
      }

      return imported;
    },
    {
      maxWait: 5_000,
      timeout: 30_000
    }
  );
}

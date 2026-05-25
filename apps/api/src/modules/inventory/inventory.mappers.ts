import { Prisma } from "@prisma/client";

export const movementInclude = {
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
} satisfies Prisma.InventoryMovementInclude;

export type InventoryMovementWithProductWarehouse =
  Prisma.InventoryMovementGetPayload<{
    include: typeof movementInclude;
  }>;

export const productStockInclude = {
  category: {
    select: {
      id: true,
      name: true
    }
  }
} satisfies Prisma.ProductInclude;

export type ProductWithCategoryForStock = Prisma.ProductGetPayload<{
  include: typeof productStockInclude;
}>;

export function mapProductStock(
  product: ProductWithCategoryForStock,
  stocks: Map<string, number>
) {
  const quantity = stocks.get(product.id) ?? 0;

  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    category: product.category,
    minStock: product.minStock,
    stock: quantity,
    lowStock: quantity <= product.minStock
  };
}

export function mapInventoryMovementAuditData(
  movement: InventoryMovementWithProductWarehouse
) {
  return {
    productId: movement.productId,
    productName: movement.product?.name ?? movement.productName,
    warehouseId: movement.warehouseId,
    quantity: movement.quantity,
    reason: movement.reason
  };
}

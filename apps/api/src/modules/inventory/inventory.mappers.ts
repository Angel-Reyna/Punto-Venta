import { Prisma, WarehouseType } from "@prisma/client";

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
      name: true,
      type: true,
      sellerId: true
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

export type ProductStockBreakdown = {
  total: number;
  locations: Array<{
    warehouseId: string;
    warehouseName: string;
    warehouseType: WarehouseType;
    sellerId: string | null;
    quantity: number;
  }>;
};

export function mapProductStock(
  product: ProductWithCategoryForStock,
  stocks: Map<string, ProductStockBreakdown>
) {
  const stock = stocks.get(product.id) ?? { total: 0, locations: [] };
  const quantity = stock.total;

  return {
    id: product.id,
    sku: product.sku,
    barcode: product.barcode,
    name: product.name,
    category: product.category,
    minStock: product.minStock,
    stock: quantity,
    lowStock: quantity <= product.minStock,
    locations: stock.locations
  };
}

export function mapWarehouseAuditData(warehouse: {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
  type?: WarehouseType;
  sellerId?: string | null;
}) {
  return {
    warehouseId: warehouse.id,
    warehouseName: warehouse.name,
    description: warehouse.description ?? null,
    type: warehouse.type ?? WarehouseType.STORAGE,
    sellerId: warehouse.sellerId ?? null,
    isActive: warehouse.isActive
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
    reasonType: movement.reasonType,
    reason: movement.reason
  };
}

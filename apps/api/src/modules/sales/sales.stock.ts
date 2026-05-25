import { Prisma } from "@prisma/client";

import {
  getOrCreateDefaultWarehouse,
  increaseStock
} from "../inventory/inventory.service";

export type RestockableSaleItem = {
  productId: string | null;
  quantity: number;
};

export async function restoreStockForExistingProducts(
  tx: Prisma.TransactionClient,
  items: RestockableSaleItem[],
  options: {
    reason: string;
    createdBy: string;
  }
) {
  const restockableItems = items.filter(
    (item): item is { productId: string; quantity: number } =>
      Boolean(item.productId)
  );

  if (restockableItems.length === 0) {
    return;
  }

  const warehouse = await getOrCreateDefaultWarehouse(tx);

  for (const item of restockableItems) {
    await increaseStock(tx, {
      productId: item.productId,
      warehouseId: warehouse.id,
      quantity: item.quantity,
      type: "RETURN",
      reason: options.reason,
      createdBy: options.createdBy
    });
  }
}

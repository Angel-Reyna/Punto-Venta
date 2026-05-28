import { api } from "../../api/client";
import type { Movement, Product, StockItem, Warehouse } from "./inventoryShared";

export type InventoryMovementType = "in" | "out";

export type CreateInventoryMovementPayload = {
  productId: string;
  warehouseId?: string;
  quantity: number;
  reason: string;
};

export async function listInventoryProducts() {
  const response = await api.get<Product[]>("/products", {
    params: {
      pageSize: 100,
    },
  });

  return response.data;
}

export async function listWarehouses() {
  const response = await api.get<Warehouse[]>("/inventory/warehouses");

  return response.data;
}

export async function listStock(query: string) {
  const response = await api.get<StockItem[]>("/inventory/stock", {
    params: {
      q: query.trim() || undefined,
      pageSize: 100,
    },
  });

  return response.data;
}

export async function listInventoryMovements(query: string) {
  const response = await api.get<Movement[]>("/inventory/movements", {
    params: {
      q: query.trim() || undefined,
      pageSize: 100,
    },
  });

  return response.data;
}

export async function createInventoryMovement(
  type: InventoryMovementType,
  payload: CreateInventoryMovementPayload,
) {
  await api.post(`/inventory/${type}`, payload);
}

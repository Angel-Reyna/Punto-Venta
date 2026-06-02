import { DEFAULT_LIST_PAGE_SIZE, optionalSearchQuery } from "../../api/contracts";
import { getJson, postJson } from "../../api/http";
import type { InventoryReasonType, Movement, Product, StockItem, Warehouse } from "./inventoryShared";

export type InventoryMovementType = "in" | "out";

export type CreateWarehousePayload = {
  name: string;
  description?: string | null;
};

export type CreateInventoryMovementPayload = {
  productId: string;
  warehouseId?: string;
  quantity: number;
  reasonType: InventoryReasonType;
  reason?: string;
};

export async function listInventoryProducts() {
  return getJson<Product[]>("/products", {
    params: {
      pageSize: DEFAULT_LIST_PAGE_SIZE,
    },
  });
}

export async function listWarehouses() {
  return getJson<Warehouse[]>("/inventory/warehouses");
}

export async function createWarehouse(payload: CreateWarehousePayload) {
  return postJson<Warehouse, CreateWarehousePayload>("/inventory/warehouses", payload);
}

export async function listStock(query: string) {
  return getJson<StockItem[]>("/inventory/stock", {
    params: {
      q: optionalSearchQuery(query),
      pageSize: DEFAULT_LIST_PAGE_SIZE,
    },
  });
}

export async function listInventoryMovements(query: string) {
  return getJson<Movement[]>("/inventory/movements", {
    params: {
      q: optionalSearchQuery(query),
      pageSize: DEFAULT_LIST_PAGE_SIZE,
    },
  });
}

export async function createInventoryMovement(
  type: InventoryMovementType,
  payload: CreateInventoryMovementPayload,
) {
  await postJson(`/inventory/${type}`, payload);
}

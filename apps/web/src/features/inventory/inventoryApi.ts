import { DEFAULT_LIST_PAGE_SIZE, optionalSearchQuery } from "../../api/contracts";
import { getJson, postJson } from "../../api/http";
import type {
  InventoryReasonType,
  InventoryTransferRequest,
  InventoryTransferRequestStatus,
  Movement,
  Product,
  StockItem,
  Warehouse,
} from "./inventoryShared";

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

export type CreateInventoryTransferRequestPayload = {
  fromWarehouseId?: string | null;
  reason: string;
  items: Array<{
    productId: string;
    quantity: number;
  }>;
};

export type ReviewInventoryTransferRequestPayload = {
  reviewNote?: string | null;
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


export async function listInventoryTransferRequests(status?: InventoryTransferRequestStatus) {
  return getJson<InventoryTransferRequest[]>("/inventory/transfer-requests", {
    params: {
      status,
    },
  });
}

export async function createInventoryTransferRequest(
  payload: CreateInventoryTransferRequestPayload,
) {
  return postJson<InventoryTransferRequest, CreateInventoryTransferRequestPayload>(
    "/inventory/transfer-requests",
    payload,
  );
}

export async function approveInventoryTransferRequest(
  requestId: string,
  payload: ReviewInventoryTransferRequestPayload,
) {
  return postJson<InventoryTransferRequest, ReviewInventoryTransferRequestPayload>(
    `/inventory/transfer-requests/${requestId}/approve`,
    payload,
  );
}

export async function rejectInventoryTransferRequest(
  requestId: string,
  payload: ReviewInventoryTransferRequestPayload,
) {
  return postJson<InventoryTransferRequest, ReviewInventoryTransferRequestPayload>(
    `/inventory/transfer-requests/${requestId}/reject`,
    payload,
  );
}

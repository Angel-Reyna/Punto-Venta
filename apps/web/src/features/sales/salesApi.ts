import { DEFAULT_LIST_PAGE_SIZE } from "../../api/contracts";
import { getJson, postJson } from "../../api/http";

import type {
  CartItem,
  PaymentMethod,
  Product,
  Sale,
  SalesAdjustmentRequest,
  SalesAdjustmentRequestType,
  SalesStockItem,
  SalesWarehouseOption,
  SellerStockRow,
  WarehouseType,
} from "./salesShared";

export type CreateSalePayload = {
  customerName?: string;
  warehouseId?: string | null;
  paymentMethod: PaymentMethod;
  paidAmount: number;
  items: CartItem[];
};

export type CancelSalePayload = {
  reason: string;
  refundMethod: PaymentMethod;
};

export type ReturnSaleItemsPayload = {
  reason: string;
  refundMethod: PaymentMethod;
  items: Array<{
    saleItemId: string;
    quantity: number;
  }>;
};

export type CreateSalesAdjustmentRequestPayload = {
  type: SalesAdjustmentRequestType;
  reason: string;
  refundMethod?: PaymentMethod;
  items?: Array<{
    saleItemId: string;
    quantity: number;
  }>;
};

export type ReviewSalesAdjustmentRequestPayload = {
  reviewNote?: string;
};

type SalesWarehouseResponse = {
  id: string;
  name: string;
  type?: WarehouseType;
  sellerId?: string | null;
  isActive: boolean;
};

function buildStockMapFromRows(rows: SalesStockItem[]) {
  const stockByWarehouse = new Map<string, Record<string, number>>();

  for (const row of rows) {
    for (const location of row.locations ?? []) {
      const currentStock = stockByWarehouse.get(location.warehouseId) ?? {};

      currentStock[row.id] = Math.max(Number(location.quantity ?? 0), 0);
      stockByWarehouse.set(location.warehouseId, currentStock);
    }
  }

  return stockByWarehouse;
}

function optionFromStockMap(input: {
  id: string;
  name: string;
  type?: WarehouseType;
  sellerId?: string | null;
  stockByProductId: Record<string, number>;
}): SalesWarehouseOption {
  return {
    id: input.id,
    name: input.name,
    type: input.type ?? "STORAGE",
    sellerId: input.sellerId ?? null,
    stockByProductId: input.stockByProductId,
    totalUnits: Object.values(input.stockByProductId).reduce((sum, quantity) => sum + Number(quantity ?? 0), 0),
  };
}

function buildWarehouseOptions({
  warehouses,
  stockRows,
  sellerStockRows,
}: {
  warehouses: SalesWarehouseResponse[];
  stockRows: SalesStockItem[];
  sellerStockRows: SellerStockRow[];
}): SalesWarehouseOption[] {
  const stockByWarehouse = buildStockMapFromRows(stockRows);
  const options = new Map<string, SalesWarehouseOption>();

  for (const warehouse of warehouses) {
    if (!warehouse.isActive) continue;

    options.set(warehouse.id, optionFromStockMap({
      id: warehouse.id,
      name: warehouse.name,
      type: warehouse.type ?? "STORAGE",
      sellerId: warehouse.sellerId ?? null,
      stockByProductId: stockByWarehouse.get(warehouse.id) ?? {},
    }));
  }

  for (const row of sellerStockRows) {
    if (!row.warehouse.isActive) continue;

    const stockByProductId = Object.fromEntries(
      row.products.map((product) => [product.productId, Math.max(Number(product.quantity ?? 0), 0)]),
    );

    options.set(row.warehouse.id, optionFromStockMap({
      id: row.warehouse.id,
      name: row.warehouse.name,
      type: row.warehouse.type ?? "SELLER",
      sellerId: row.seller?.id ?? null,
      stockByProductId,
    }));
  }

  return [...options.values()].sort((a, b) => {
    if (a.type !== b.type) return a.type === "STORAGE" ? -1 : 1;
    return a.name.localeCompare(b.name, "es");
  });
}


export async function fetchSalesWorkspace() {
  const [products, sales, adjustmentRequests, warehouses, stockRows, sellerStockRows] = await Promise.all([
    getJson<Product[]>("/products", {
      params: {
        page: 1,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
      },
    }),
    getJson<Sale[]>("/sales", {
      params: {
        page: 1,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
      },
    }),
    getJson<SalesAdjustmentRequest[]>("/sales/adjustment-requests", {
      params: {
        page: 1,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
      },
    }),
    getJson<SalesWarehouseResponse[]>("/inventory/warehouses"),
    getJson<SalesStockItem[]>("/inventory/stock", {
      params: {
        pageSize: DEFAULT_LIST_PAGE_SIZE,
      },
    }),
    getJson<SellerStockRow[]>("/inventory/seller-stock").catch(() => [] as SellerStockRow[]),
  ]);

  return {
    products,
    sales,
    adjustmentRequests,
    warehouseOptions: buildWarehouseOptions({
      warehouses,
      stockRows,
      sellerStockRows,
    }),
  };
}

export async function createSale(payload: CreateSalePayload) {
  await postJson("/sales", payload);
}

export async function cancelSale(saleId: string, payload: CancelSalePayload) {
  await postJson(`/sales/${saleId}/cancel`, payload);
}

export async function returnSaleItems(saleId: string, payload: ReturnSaleItemsPayload) {
  await postJson(`/sales/${saleId}/returns`, payload);
}


export async function createSalesAdjustmentRequest(
  saleId: string,
  payload: CreateSalesAdjustmentRequestPayload,
) {
  await postJson(`/sales/${saleId}/adjustment-requests`, payload);
}

export async function approveSalesAdjustmentRequest(
  requestId: string,
  payload: ReviewSalesAdjustmentRequestPayload,
) {
  await postJson(`/sales/adjustment-requests/${requestId}/approve`, payload);
}

export async function rejectSalesAdjustmentRequest(
  requestId: string,
  payload: ReviewSalesAdjustmentRequestPayload,
) {
  await postJson(`/sales/adjustment-requests/${requestId}/reject`, payload);
}

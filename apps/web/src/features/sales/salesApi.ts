import { DEFAULT_LIST_PAGE_SIZE } from "../../api/contracts";
import { getJson, postJson } from "../../api/http";

import type { CartItem, PaymentMethod, Product, Sale } from "./salesShared";

export type CreateSalePayload = {
  customerName?: string;
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

export async function fetchSalesWorkspace() {
  const [products, sales] = await Promise.all([
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
  ]);

  return {
    products,
    sales,
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

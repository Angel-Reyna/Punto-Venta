import { api } from "../../api/client";

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

const DEFAULT_SALES_WORKSPACE_PAGE_SIZE = 100;

export async function fetchSalesWorkspace() {
  const [productsResponse, salesResponse] = await Promise.all([
    api.get<Product[]>(`/products?page=1&pageSize=${DEFAULT_SALES_WORKSPACE_PAGE_SIZE}`),
    api.get<Sale[]>(`/sales?page=1&pageSize=${DEFAULT_SALES_WORKSPACE_PAGE_SIZE}`)
  ]);

  return {
    products: productsResponse.data,
    sales: salesResponse.data
  };
}

export async function createSale(payload: CreateSalePayload) {
  await api.post("/sales", payload);
}

export async function cancelSale(saleId: string, payload: CancelSalePayload) {
  await api.post(`/sales/${saleId}/cancel`, payload);
}

export async function returnSaleItems(
  saleId: string,
  payload: ReturnSaleItemsPayload
) {
  await api.post(`/sales/${saleId}/returns`, payload);
}

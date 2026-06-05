import { useCallback, useState } from "react";

import type { Product, Sale, SalesAdjustmentRequest } from "./salesShared";
import {
  approveSalesAdjustmentRequest,
  cancelSale,
  createSale,
  createSalesAdjustmentRequest,
  fetchSalesWorkspace,
  rejectSalesAdjustmentRequest,
  returnSaleItems,
  type CancelSalePayload,
  type CreateSalePayload,
  type CreateSalesAdjustmentRequestPayload,
  type ReturnSaleItemsPayload,
  type ReviewSalesAdjustmentRequestPayload,
} from "./salesApi";

export function useSalesData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [adjustmentRequests, setAdjustmentRequests] = useState<SalesAdjustmentRequest[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const loadSalesData = useCallback(async () => {
    setIsLoadingCatalog(true);

    try {
      const workspace = await fetchSalesWorkspace();

      setProducts(workspace.products);
      setSales(workspace.sales);
      setAdjustmentRequests(workspace.adjustmentRequests);
    } finally {
      setIsLoadingCatalog(false);
    }
  }, []);

  const submitSale = useCallback(
    async (payload: CreateSalePayload) => {
      await createSale(payload);
      await loadSalesData();
    },
    [loadSalesData]
  );

  const submitSaleCancellation = useCallback(
    async (saleId: string, payload: CancelSalePayload) => {
      await cancelSale(saleId, payload);
      await loadSalesData();
    },
    [loadSalesData]
  );

  const submitSaleReturn = useCallback(
    async (saleId: string, payload: ReturnSaleItemsPayload) => {
      await returnSaleItems(saleId, payload);
      await loadSalesData();
    },
    [loadSalesData]
  );

  const submitSalesAdjustmentRequest = useCallback(
    async (saleId: string, payload: CreateSalesAdjustmentRequestPayload) => {
      await createSalesAdjustmentRequest(saleId, payload);
      await loadSalesData();
    },
    [loadSalesData]
  );

  const approveAdjustmentRequest = useCallback(
    async (requestId: string, payload: ReviewSalesAdjustmentRequestPayload) => {
      await approveSalesAdjustmentRequest(requestId, payload);
      await loadSalesData();
    },
    [loadSalesData]
  );

  const rejectAdjustmentRequest = useCallback(
    async (requestId: string, payload: ReviewSalesAdjustmentRequestPayload) => {
      await rejectSalesAdjustmentRequest(requestId, payload);
      await loadSalesData();
    },
    [loadSalesData]
  );

  return {
    adjustmentRequests,
    products,
    sales,
    isLoadingCatalog,
    approveAdjustmentRequest,
    loadSalesData,
    rejectAdjustmentRequest,
    submitSale,
    submitSaleCancellation,
    submitSaleReturn,
    submitSalesAdjustmentRequest,
  };
}

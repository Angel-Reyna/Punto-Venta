import { useCallback, useState } from "react";

import type { Product, Sale } from "./salesShared";
import {
  cancelSale,
  createSale,
  fetchSalesWorkspace,
  returnSaleItems,
  type CancelSalePayload,
  type CreateSalePayload,
  type ReturnSaleItemsPayload
} from "./salesApi";

export function useSalesData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(false);

  const loadSalesData = useCallback(async () => {
    setIsLoadingCatalog(true);

    try {
      const workspace = await fetchSalesWorkspace();

      setProducts(workspace.products);
      setSales(workspace.sales);
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

  return {
    products,
    sales,
    isLoadingCatalog,
    loadSalesData,
    submitSale,
    submitSaleCancellation,
    submitSaleReturn
  };
}

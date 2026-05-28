import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import type { InventoryMovementForm } from "./inventoryShared";
import {
  createInventoryMovement,
  listInventoryMovements,
  listInventoryProducts,
  listStock,
  listWarehouses,
} from "./inventoryApi";
import type { InventoryMovementType } from "./inventoryApi";
import type { Movement, Product, StockItem, Warehouse } from "./inventoryShared";

const INVENTORY_SEARCH_DEBOUNCE_MS = 250;

export function useInventoryData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockRows, setStockRows] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [stockSearch, setStockSearch] = useState("");
  const [movementSearch, setMovementSearch] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadStaticData = useCallback(async () => {
    try {
      setError("");

      const [loadedProducts, loadedWarehouses] = await Promise.all([
        listInventoryProducts(),
        listWarehouses(),
      ]);

      setProducts(loadedProducts);
      setWarehouses(loadedWarehouses);
    } catch {
      setError("No se pudo cargar productos ni almacenes de inventario.");
    }
  }, []);

  const loadStockRows = useCallback(async (query: string) => {
    try {
      setError("");
      setStockRows(await listStock(query));
    } catch {
      setError("No se pudieron cargar las existencias actuales.");
    }
  }, []);

  const loadMovementRows = useCallback(async (query: string) => {
    try {
      setError("");
      setMovements(await listInventoryMovements(query));
    } catch {
      setError("No se pudieron cargar los movimientos recientes.");
    }
  }, []);

  const reloadInventoryViews = useCallback(async () => {
    await Promise.all([
      loadStaticData(),
      loadStockRows(stockSearch),
      loadMovementRows(movementSearch),
    ]);
  }, [loadMovementRows, loadStaticData, loadStockRows, movementSearch, stockSearch]);

  useEffect(() => {
    void loadStaticData();
  }, [loadStaticData]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStockRows(stockSearch);
    }, INVENTORY_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [loadStockRows, stockSearch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMovementRows(movementSearch);
    }, INVENTORY_SEARCH_DEBOUNCE_MS);

    return () => window.clearTimeout(timeoutId);
  }, [loadMovementRows, movementSearch]);

  const submitInventoryMovement = useCallback(
    async (type: InventoryMovementType, form: InventoryMovementForm) => {
      setMessage("");
      setError("");

      try {
        await createInventoryMovement(type, {
          productId: form.productId,
          warehouseId: form.warehouseId || undefined,
          quantity: form.quantity,
          reason: form.reason.trim(),
        });

        setMessage(
          type === "in"
            ? "Entrada registrada correctamente."
            : "Salida registrada correctamente.",
        );

        await reloadInventoryViews();

        return true;
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "No se pudo registrar el movimiento. Verifica producto, cantidad y motivo.",
          ),
        );

        return false;
      }
    },
    [reloadInventoryViews],
  );

  return {
    error,
    message,
    movementSearch,
    movements,
    products,
    setError,
    setMessage,
    setMovementSearch,
    setStockSearch,
    stockRows,
    stockSearch,
    submitInventoryMovement,
    warehouses,
  };
}

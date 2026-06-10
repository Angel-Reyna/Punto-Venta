import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import type { InventoryMovementForm } from "./inventoryShared";
import {
  approveInventoryTransferRequest,
  createInventoryMovement,
  createInventoryTransferRequest,
  createWarehouse,
  listInventoryMovements,
  listInventoryProducts,
  listInventoryTransferRequests,
  listStock,
  listWarehouses,
  rejectInventoryTransferRequest,
} from "./inventoryApi";
import type {
  CreateInventoryTransferRequestPayload,
  CreateWarehousePayload,
  InventoryMovementType,
  ReviewInventoryTransferRequestPayload,
} from "./inventoryApi";
import type { InventoryTransferRequest, Movement, Product, StockItem, Warehouse } from "./inventoryShared";

const INVENTORY_SEARCH_DEBOUNCE_MS = 250;

export function useInventoryData() {
  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockRows, setStockRows] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [transferRequests, setTransferRequests] = useState<InventoryTransferRequest[]>([]);
  const [isCreatingWarehouse, setIsCreatingWarehouse] = useState(false);
  const [isSubmittingTransferRequest, setIsSubmittingTransferRequest] = useState(false);

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

  const loadTransferRequests = useCallback(async () => {
    try {
      setError("");
      setTransferRequests(await listInventoryTransferRequests());
    } catch {
      setError("No se pudieron cargar las solicitudes de asignación.");
    }
  }, []);

  const reloadInventoryViews = useCallback(async () => {
    await Promise.all([
      loadStaticData(),
      loadStockRows(stockSearch),
      loadMovementRows(movementSearch),
      loadTransferRequests(),
    ]);
  }, [loadMovementRows, loadStaticData, loadStockRows, loadTransferRequests, movementSearch, stockSearch]);

  useEffect(() => {
    void loadStaticData();
    void loadTransferRequests();
  }, [loadStaticData, loadTransferRequests]);

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


  const createInventoryWarehouse = useCallback(
    async (payload: CreateWarehousePayload) => {
      setMessage("");
      setError("");
      setIsCreatingWarehouse(true);

      try {
        const warehouse = await createWarehouse(payload);

        setWarehouses((currentWarehouses) => {
          const nextWarehouses = currentWarehouses.some((item) => item.id === warehouse.id)
            ? currentWarehouses.map((item) => (item.id === warehouse.id ? warehouse : item))
            : [...currentWarehouses, warehouse];

          return nextWarehouses.sort((left, right) => left.name.localeCompare(right.name));
        });
        setMessage(`Almacén: ${warehouse.name} creado correctamente.`);

        return warehouse;
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "No se pudo crear el almacén. Revisa el nombre e intenta de nuevo.",
          ),
        );

        return null;
      } finally {
        setIsCreatingWarehouse(false);
      }
    },
    [],
  );

  const submitInventoryMovement = useCallback(
    async (type: InventoryMovementType, form: InventoryMovementForm) => {
      setMessage("");
      setError("");

      try {
        await createInventoryMovement(type, {
          productId: form.productId,
          warehouseId: form.warehouseId || undefined,
          quantity: form.quantity,
          reasonType: form.reasonType,
          reason: form.reasonType === "EXPIRATION" ? undefined : form.reason.trim(),
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



  const submitTransferRequest = useCallback(
    async (payload: CreateInventoryTransferRequestPayload) => {
      setMessage("");
      setError("");
      setIsSubmittingTransferRequest(true);

      try {
        await createInventoryTransferRequest(payload);
        setMessage("Solicitud de asignación enviada al administrador.");
        await loadTransferRequests();

        return true;
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "No se pudo enviar la solicitud de asignación. Verifica producto, almacén y cantidad.",
          ),
        );

        return false;
      } finally {
        setIsSubmittingTransferRequest(false);
      }
    },
    [loadTransferRequests],
  );

  const approveTransferRequest = useCallback(
    async (requestId: string, payload: ReviewInventoryTransferRequestPayload) => {
      setMessage("");
      setError("");
      setIsSubmittingTransferRequest(true);

      try {
        await approveInventoryTransferRequest(requestId, payload);
        setMessage("Solicitud de asignación aprobada. El stock fue transferido.");
        await reloadInventoryViews();

        return true;
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "No se pudo aprobar la solicitud de asignación. Verifica stock disponible e intenta de nuevo.",
          ),
        );

        return false;
      } finally {
        setIsSubmittingTransferRequest(false);
      }
    },
    [reloadInventoryViews],
  );

  const rejectTransferRequest = useCallback(
    async (requestId: string, payload: ReviewInventoryTransferRequestPayload) => {
      setMessage("");
      setError("");
      setIsSubmittingTransferRequest(true);

      try {
        await rejectInventoryTransferRequest(requestId, payload);
        setMessage("Solicitud de asignación rechazada.");
        await loadTransferRequests();

        return true;
      } catch (err: unknown) {
        setError(
          getApiErrorMessage(
            err,
            "No se pudo rechazar la solicitud de asignación. Agrega una nota e intenta de nuevo.",
          ),
        );

        return false;
      } finally {
        setIsSubmittingTransferRequest(false);
      }
    },
    [loadTransferRequests],
  );

  return {
    error,
    isCreatingWarehouse,
    isSubmittingTransferRequest,
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
    createInventoryWarehouse,
    submitInventoryMovement,
    submitTransferRequest,
    approveTransferRequest,
    rejectTransferRequest,
    transferRequests,
    warehouses,
  };
}

export type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};

export type StockItem = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  category?: {
    id: string;
    name: string;
  } | null;
  minStock: number;
  stock: number;
  lowStock: boolean;
};

export type Warehouse = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type Movement = {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "RETURN";
  quantity: number;
  reason?: string | null;
  createdAt: string;

  productId?: string | null;
  productSku: string;
  productName: string;

  product?: {
    id: string;
    sku: string;
    barcode?: string | null;
    name: string;
  } | null;

  warehouse?: {
    id: string;
    name: string;
  } | null;
};

export type InventoryMovementForm = {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
};

export type StockStatusFilter = "all" | "available" | "low" | "out";
export type InventoryView = "stock" | "adjustments" | "movements";

export const initialInventoryMovementForm: InventoryMovementForm = {
  productId: "",
  warehouseId: "",
  quantity: 1,
  reason: "",
};

export const WAREHOUSE_INFO_TEXT =
  "Ubicación donde se registra el stock. Si lo dejas vacío, el movimiento se aplica al almacén principal.";

export const MOVEMENT_TYPE_INFO_TEXT =
  "IN es entrada, OUT salida manual, SALE venta, RETURN devolución y ADJUSTMENT ajuste de inventario.";

export const STOCK_FILTER_LABELS: Record<StockStatusFilter, string> = {
  all: "Todos",
  available: "Disponibles",
  low: "Bajo stock",
  out: "Sin stock",
};

export type InventoryMetricColor =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";

export function getInventoryFormDisabledReason(form: InventoryMovementForm) {
  if (!form.productId) return "Selecciona un producto.";
  if (form.quantity <= 0) return "La cantidad debe ser mayor a cero.";
  if (!form.reason.trim() || form.reason.trim().length < 3) {
    return "Captura un motivo de al menos 3 caracteres.";
  }

  return "";
}

export function isInventoryFormInvalid(form: InventoryMovementForm) {
  return Boolean(getInventoryFormDisabledReason(form));
}

export function getInventoryStockSummary(rows: StockItem[]) {
  const outOfStock = rows.filter((item) => item.stock <= 0).length;
  const lowStock = rows.filter(
    (item) => item.stock > 0 && item.lowStock,
  ).length;
  const available = rows.filter(
    (item) => item.stock > 0 && !item.lowStock,
  ).length;
  const units = rows.reduce((total, item) => total + item.stock, 0);
  const categories = new Set(
    rows.map((item) => item.category?.name).filter(Boolean),
  ).size;

  return {
    total: rows.length,
    available,
    lowStock,
    outOfStock,
    attention: lowStock + outOfStock,
    categories,
    units,
  };
}

export function filterStockRowsByStatus(
  rows: StockItem[],
  status: StockStatusFilter,
) {
  if (status === "available") {
    return rows.filter((item) => item.stock > 0 && !item.lowStock);
  }

  if (status === "low") {
    return rows.filter((item) => item.stock > 0 && item.lowStock);
  }

  if (status === "out") {
    return rows.filter((item) => item.stock <= 0);
  }

  return rows;
}

export function getStockStatus(item: StockItem) {
  if (item.stock <= 0) {
    return {
      color: "error" as const,
      helper: "Producto sin unidades disponibles.",
      label: "Sin stock",
    };
  }

  if (item.lowStock) {
    return {
      color: "warning" as const,
      helper: "Está en el umbral de reposición.",
      label: "Bajo inventario",
    };
  }

  return {
    color: "success" as const,
    helper: "Inventario suficiente para venta.",
    label: "Disponible",
  };
}

export type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
  costPrice?: number | string;
};

export type StockLocation = {
  warehouseId: string;
  warehouseName: string;
  quantity: number;
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
  locations?: StockLocation[];
};

export type Warehouse = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type InventoryReasonType = "EXPIRATION" | "OTHER";

export type Movement = {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "RETURN";
  quantity: number;
  reason?: string | null;
  reasonType?: InventoryReasonType;
  unitCostAtMovement?: number | string | null;
  costAmount?: number | string | null;
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
  reasonType: InventoryReasonType;
  reason: string;
};

export type StockStatusFilter = "all" | "available" | "low" | "out";
export type InventoryView = "stock" | "entries" | "exits" | "movements";

export const DEFAULT_INVENTORY_ENTRY_REASON = "Reabastecimiento";

export const initialInventoryMovementForm: InventoryMovementForm = {
  productId: "",
  warehouseId: "",
  quantity: 0,
  reasonType: "OTHER",
  reason: "",
};

export const WAREHOUSE_INFO_TEXT =
  "Ubicación donde se registra el stock. Si lo dejas vacío, el movimiento se aplica al almacén principal.";

export const MOVEMENT_TYPE_INFO_TEXT =
  "IN es entrada, OUT salida manual, SALE venta, RETURN devolución y ADJUSTMENT ajuste de inventario.";

export const INVENTORY_REASON_TYPE_LABELS: Record<InventoryReasonType, string> = {
  EXPIRATION: "Caducidad",
  OTHER: "Otros",
};

export function formatInventoryMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(Number(value ?? 0));
}

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


export function getWarehouseStockForProduct({
  stockRows,
  productId,
  warehouseId,
  defaultWarehouseId,
}: {
  stockRows: StockItem[];
  productId: string;
  warehouseId?: string;
  defaultWarehouseId?: string;
}) {
  const stockItem = stockRows.find((item) => item.id === productId);

  if (!stockItem) {
    return 0;
  }

  const totalStock = Math.max(Number(stockItem.stock ?? 0), 0);
  const locations = stockItem.locations ?? [];

  if (locations.length === 0) {
    return totalStock;
  }

  const effectiveWarehouseId = warehouseId || defaultWarehouseId || locations[0]?.warehouseId;

  if (!effectiveWarehouseId) {
    return totalStock;
  }

  const location = locations.find((item) => item.warehouseId === effectiveWarehouseId);

  return Math.max(Number(location?.quantity ?? 0), 0);
}

export function getInventoryFormDisabledReason(form: InventoryMovementForm) {
  if (!form.productId) return "Selecciona un producto.";
  if (form.quantity <= 0) return "La cantidad debe ser mayor a cero.";
  if (form.reasonType === "EXPIRATION") return "";

  if (!form.reason.trim() || form.reason.trim().length < 3) {
    return "Describe el motivo con al menos 3 caracteres.";
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

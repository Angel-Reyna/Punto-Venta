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
  warehouseType?: "STORAGE" | "SELLER";
  sellerId?: string | null;
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
  type?: "STORAGE" | "SELLER";
  sellerId?: string | null;
  isActive: boolean;
};

export type InventoryReasonType = "EXPIRATION" | "OTHER";

export type InventoryTransferRequestStatus = "PENDING" | "APPROVED" | "REJECTED";

export type InventoryTransferRequest = {
  id: string;
  status: InventoryTransferRequestStatus;
  reason: string;
  reviewNote?: string | null;
  createdAt: string;
  updatedAt?: string;
  reviewedAt?: string | null;
  fromWarehouse: Warehouse;
  toWarehouse: Warehouse;
  requestedBy: {
    id: string;
    name: string;
    email: string;
    role: string;
  };
  reviewedBy?: {
    id: string;
    name: string;
    email: string;
    role: string;
  } | null;
  totalUnits: number;
  items: Array<{
    id: string;
    productId?: string | null;
    productSku: string;
    productName: string;
    quantity: number;
  }>;
};

export type InventoryTransferRequestForm = {
  fromWarehouseId: string;
  productId: string;
  quantity: number;
  reason: string;
};

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
    type?: "STORAGE" | "SELLER";
    sellerId?: string | null;
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
export type InventoryView = "stock" | "entries" | "exits" | "movements" | "transfers";

export const DEFAULT_INVENTORY_ENTRY_REASON = "Reabastecimiento";

export const initialInventoryMovementForm: InventoryMovementForm = {
  productId: "",
  warehouseId: "",
  quantity: 0,
  reasonType: "OTHER",
  reason: "",
};

export const initialInventoryTransferRequestForm: InventoryTransferRequestForm = {
  fromWarehouseId: "",
  productId: "",
  quantity: 0,
  reason: "",
};

export const WAREHOUSE_INFO_TEXT =
  "Ubicaci√≥n donde se registra el stock. Si lo dejas vac√≠o, el movimiento se aplica a Almac√©n: Principal.";

export const MOVEMENT_TYPE_INFO_TEXT =
  "IN es entrada, OUT salida manual, SALE venta, RETURN devoluci√≥n y ADJUSTMENT ajuste de inventario.";

export const INVENTORY_REASON_TYPE_LABELS: Record<InventoryReasonType, string> = {
  EXPIRATION: "Caducidad",
  OTHER: "Otros",
};

export const INVENTORY_TRANSFER_STATUS_LABELS: Record<InventoryTransferRequestStatus, string> = {
  PENDING: "Pendiente",
  APPROVED: "Aprobada",
  REJECTED: "Rechazada",
};

export const INVENTORY_TRANSFER_STATUS_COLORS: Record<InventoryTransferRequestStatus, "warning" | "success" | "error"> = {
  PENDING: "warning",
  APPROVED: "success",
  REJECTED: "error",
};

export function getInventoryTransferFormDisabledReason({
  form,
  availableStock,
}: {
  form: InventoryTransferRequestForm;
  availableStock: number;
}) {
  if (!form.fromWarehouseId) return "Selecciona el almacÈn origen.";
  if (!form.productId) return "Selecciona un producto.";
  if (form.quantity <= 0) return "La cantidad debe ser mayor a cero.";
  if (form.quantity > availableStock) {
    return `No puedes solicitar m·s de ${availableStock} unidades disponibles.`;
  }
  if (!form.reason.trim() || form.reason.trim().length < 3) {
    return "Describe el motivo con al menos 3 caracteres.";
  }

  return "";
}

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

function normalizeStockLocations(item: StockItem) {
  const locations = (item.locations ?? []).map((location) => ({
    ...location,
    quantity: Math.max(Number(location.quantity ?? 0), 0),
  }));

  if (locations.length > 0) {
    return locations;
  }

  return [
    {
      warehouseId: "default",
      warehouseName: "Principal",
      quantity: Math.max(Number(item.stock ?? 0), 0),
    },
  ];
}

function getStockLocationFlags(item: StockItem) {
  const minStock = Math.max(Number(item.minStock ?? 0), 0);
  const locations = normalizeStockLocations(item);
  const hasOutOfStockLocation = locations.some((location) => location.quantity <= 0);
  const hasLowStockLocation = locations.some(
    (location) => location.quantity > 0 && minStock > 0 && location.quantity <= minStock,
  );
  const hasAvailableLocation = locations.some((location) => location.quantity > 0);

  return {
    hasAvailableLocation,
    hasLowStockLocation,
    hasOutOfStockLocation,
  };
}

export function getInventoryStockSummary(rows: StockItem[]) {
  const outOfStock = rows.filter(
    (item) => getStockLocationFlags(item).hasOutOfStockLocation,
  ).length;
  const lowStock = rows.filter(
    (item) => getStockLocationFlags(item).hasLowStockLocation,
  ).length;
  const available = rows.filter(
    (item) => getStockLocationFlags(item).hasAvailableLocation,
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
    return rows.filter((item) => getStockLocationFlags(item).hasAvailableLocation);
  }

  if (status === "low") {
    return rows.filter((item) => getStockLocationFlags(item).hasLowStockLocation);
  }

  if (status === "out") {
    return rows.filter((item) => getStockLocationFlags(item).hasOutOfStockLocation);
  }

  return rows;
}

export function getStockStatus(item: StockItem) {
  const flags = getStockLocationFlags(item);

  if (!flags.hasAvailableLocation || flags.hasOutOfStockLocation) {
    return {
      color: "error" as const,
      helper: "Hay una ubicaciÛn sin unidades disponibles.",
      label: "Sin stock",
    };
  }

  if (flags.hasLowStockLocation || item.lowStock) {
    return {
      color: "warning" as const,
      helper: "Est· en el umbral de reposiciÛn.",
      label: "Bajo inventario",
    };
  }

  return {
    color: "success" as const,
    helper: "Inventario suficiente para venta.",
    label: "Disponible",
  };
}

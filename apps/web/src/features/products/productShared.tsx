export type Product = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;

  category?: {
    id: string;
    name: string;
  } | null;

  salePrice: number;
  promoPercent: number;
  finalPrice: number;
  stock: number;

  costPrice?: number;
  marginPercent?: number;
  minStock?: number;
  isActive?: boolean;
};

export type ProductCategory = {
  id: string;
  name: string;
};

export const SKU_INFO_TEXT =
  "SKU es la clave única de inventario del producto; significa Stock Keeping Unit, es decir, una unidad para identificar y controlar existencias.";
export const PRODUCT_CODE_INFO_TEXT =
  "Código físico o comercial del producto. Puede ser código de barras, código del proveedor o un código generado por el sistema.";
export const PROMO_INFO_TEXT =
  "Descuento porcentual aplicado sobre el precio de venta antes de calcular el precio final.";
export const FINAL_PRICE_INFO_TEXT =
  "Precio que pagará el cliente después de aplicar la promoción configurada.";
export const INITIAL_STOCK_INFO_TEXT =
  "Cantidad disponible al crear el producto. Se registra como inventario real en el almacén principal.";
export const MIN_STOCK_INFO_TEXT =
  "Nivel de alerta: cuando el stock llega a este número o queda por debajo, el producto aparece como bajo inventario.";

export const initialForm = {
  categoryId: "",
  sku: "",
  barcode: "",
  name: "",
  description: "",
  costPrice: "",
  salePrice: "",
  promoPercent: "",
  initialStock: "",
  minStock: "",
};

export type ProductFormValues = typeof initialForm;

export function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function toNonNegativeNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return 0;

  return Number(trimmed);
}

export function isInvalidNonNegativeNumber(value: string) {
  const numberValue = toNonNegativeNumber(value);

  return !Number.isFinite(numberValue) || numberValue < 0;
}

export function isInvalidNonNegativeInteger(value: string) {
  const numberValue = toNonNegativeNumber(value);

  return !Number.isInteger(numberValue) || numberValue < 0;
}

export function generateLocalProductCode() {
  const bytes = new Uint32Array(1);

  globalThis.crypto?.getRandomValues(bytes);

  const randomPart = (bytes[0] || Math.floor(Math.random() * 1_000_000))
    .toString(36)
    .toUpperCase()
    .padStart(6, "0")
    .slice(0, 6);
  const timePart = Date.now().toString(36).toUpperCase().slice(-6);

  return `PV-${timePart}-${randomPart}`;
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

export function formatCurrency(value: unknown) {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatPercent(value: unknown) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

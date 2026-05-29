export type IntegratedProductInput = {
  sku: string;
  barcode: string;
  name: string;
  costPrice: string;
  salePrice: string;
  initialStock: string;
  minStock: string;
};

export function buildCustomerName(prefix = "Cliente integrado"): string {
  return `${prefix} ${Date.now().toString(36).toUpperCase()}`;
}

export function buildIntegratedProduct(
  overrides: Partial<IntegratedProductInput> = {},
): IntegratedProductInput {
  const suffix = Date.now().toString(36).toUpperCase();

  return {
    sku: `E2E-DEL-${suffix}`,
    barcode: `998${Date.now().toString().slice(-9)}`,
    name: `Producto eliminado integrado ${suffix}`,
    costPrice: "11",
    salePrice: "21",
    initialStock: "4",
    minStock: "1",
    ...overrides,
  };
}

export function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

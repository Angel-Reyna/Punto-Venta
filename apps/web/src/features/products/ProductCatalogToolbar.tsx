export const PRODUCT_FILTER_OPTIONS = [
  "Todos",
  "Activos",
  "Inactivos",
  "Bajo stock",
  "Sin stock",
  "Con promoción",
] as const;

export const PRODUCT_SORT_OPTIONS = [
  { label: "Nombre A-Z", value: "name-asc" },
  { label: "Menor stock", value: "stock-asc" },
  { label: "Mayor stock", value: "stock-desc" },
  { label: "Precio menor", value: "price-asc" },
  { label: "Precio mayor", value: "price-desc" },
] as const;

export type ProductFilterOption = (typeof PRODUCT_FILTER_OPTIONS)[number];
export type ProductSortOption = (typeof PRODUCT_SORT_OPTIONS)[number]["value"];

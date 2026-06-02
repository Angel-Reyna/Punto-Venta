import { DEFAULT_LIST_PAGE_SIZE, optionalSearchQuery } from "../../api/contracts";
import { deleteJson, getBlob, getJson, patchJson, postFormData, postJson } from "../../api/http";

import type { Product, ProductCategory } from "./productShared";

export type CreateProductInput = {
  barcode?: string | null;
  categoryId?: string | null;
  categoryName?: string | null;
  costPrice: number;
  description?: string | null;
  initialStock: number;
  minStock: number;
  name: string;
  promoPercent: number;
  salePrice: number;
  sku: string;
};

export type UpdateProductInput = Omit<CreateProductInput, "initialStock">;

export type ProductImportResult = {
  imported: number;
};

export type ProductDeleteResult = {
  message?: string;
};

export type ProductDeleteAllResult = {
  deletedProducts: number;
  message?: string;
};

export async function listProducts(query: string) {
  return getJson<Product[]>("/products", {
    params: {
      q: optionalSearchQuery(query),
      pageSize: DEFAULT_LIST_PAGE_SIZE,
    },
  });
}

export async function listProductCategories() {
  return getJson<ProductCategory[]>("/products/categories");
}

export async function createProduct(payload: CreateProductInput) {
  return postJson<Product, CreateProductInput>("/products", payload);
}

export async function updateProduct(productId: string, payload: UpdateProductInput) {
  return patchJson<Product, UpdateProductInput>(`/products/${productId}`, payload);
}

export async function downloadProductTemplate() {
  return getBlob("/products/template/excel");
}

export async function importProductsExcel(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  return postFormData<ProductImportResult>("/products/import/excel", formData);
}

export async function toggleProduct(productId: string) {
  await patchJson(`/products/${productId}/toggle`);
}

export async function deleteProduct(productId: string) {
  return deleteJson<ProductDeleteResult>(`/products/${productId}`);
}

export async function deleteAllProducts() {
  return deleteJson<ProductDeleteAllResult>("/products");
}

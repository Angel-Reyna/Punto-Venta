import { api } from "../../api/client";

import { Product, ProductCategory } from "./productShared";

export type CreateProductInput = {
  barcode?: string;
  categoryId?: string;
  costPrice: number;
  description?: string;
  initialStock: number;
  minStock: number;
  name: string;
  promoPercent: number;
  salePrice: number;
  sku: string;
};

export type ProductImportResult = {
  imported: number;
};

export type ProductDeleteResult = {
  message?: string;
};

export async function listProducts(query: string) {
  const response = await api.get<Product[]>("/products", {
    params: {
      q: query.trim() || undefined,
      pageSize: 100,
    },
  });

  return response.data;
}

export async function listProductCategories() {
  const response = await api.get<ProductCategory[]>("/products/categories");

  return response.data;
}

export async function createProduct(payload: CreateProductInput) {
  const response = await api.post<Product>("/products", payload);

  return response.data;
}

export async function downloadProductTemplate() {
  const response = await api.get<Blob>("/products/template/excel", {
    responseType: "blob",
  });

  return response.data;
}

export async function importProductsExcel(file: File) {
  const formData = new FormData();

  formData.append("file", file);

  const response = await api.post<ProductImportResult>(
    "/products/import/excel",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data;
}

export async function toggleProduct(productId: string) {
  await api.patch(`/products/${productId}/toggle`);
}

export async function deleteProduct(productId: string) {
  const response = await api.delete<ProductDeleteResult>(`/products/${productId}`);

  return response.data;
}

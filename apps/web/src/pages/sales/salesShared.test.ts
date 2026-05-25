import { describe, expect, it } from "vitest";

import { getExactSearchProduct, getFilteredProducts, type Product } from "./salesShared";

const products: Product[] = [
  {
    id: "product-1",
    sku: "COCA-600",
    barcode: "7501055300075",
    name: "Coca-Cola 600 ml",
    salePrice: 18,
    stock: 24,
    promoPercent: 0
  },
  {
    id: "product-2",
    sku: "CAFE-250",
    barcode: null,
    name: "Café 250 g",
    salePrice: 95,
    stock: 0,
    promoPercent: 0
  }
];

describe("sales product search", () => {
  it("keeps partial search results visible without selecting the first product implicitly", () => {
    expect(getFilteredProducts(products, "coca").map((product) => product.sku)).toEqual([
      "COCA-600"
    ]);
    expect(getExactSearchProduct(products, "coca")).toBeUndefined();
  });

  it("resolves only in-stock exact SKU or barcode matches for Enter/add actions", () => {
    expect(getExactSearchProduct(products, " coca-600 ")?.id).toBe("product-1");
    expect(getExactSearchProduct(products, "7501055300075")?.id).toBe("product-1");
    expect(getExactSearchProduct(products, "product-1")).toBeUndefined();
    expect(getExactSearchProduct(products, "CAFE-250")).toBeUndefined();
  });
});

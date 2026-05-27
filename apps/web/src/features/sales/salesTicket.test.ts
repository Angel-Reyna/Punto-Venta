import { describe, expect, it } from "vitest";

import type { CartItem, Product } from "./salesShared";
import {
  SALES_TICKET_MESSAGES,
  addProductToSalesTicket,
  removeSalesTicketItem,
  updateSalesTicketQuantity
} from "./salesTicket";

const products: Product[] = [
  {
    id: "product-1",
    sku: "COCA-600",
    barcode: "7501055300075",
    name: "Coca-Cola 600 ml",
    salePrice: 18,
    stock: 2,
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

describe("sales ticket state", () => {
  it("adds a new in-stock product without mutating the current cart", () => {
    const cart: CartItem[] = [];

    const result = addProductToSalesTicket(cart, products, "product-1");

    expect(result).toEqual({
      cart: [{ productId: "product-1", quantity: 1 }],
      error: "",
      shouldClearSearch: true
    });
    expect(cart).toEqual([]);
  });

  it("increments an existing product until stock is reached", () => {
    const cart: CartItem[] = [{ productId: "product-1", quantity: 1 }];

    const result = addProductToSalesTicket(cart, products, "product-1");

    expect(result.cart).toEqual([{ productId: "product-1", quantity: 2 }]);
    expect(result.error).toBe("");
  });

  it("blocks increments above available stock and preserves the cart", () => {
    const cart: CartItem[] = [{ productId: "product-1", quantity: 2 }];

    const result = addProductToSalesTicket(cart, products, "product-1");

    expect(result.cart).toBe(cart);
    expect(result.error).toBe(SALES_TICKET_MESSAGES.maxStockReached);
    expect(result.shouldClearSearch).toBe(true);
  });

  it("blocks unavailable or out-of-stock products without clearing the search", () => {
    expect(addProductToSalesTicket([], products, "product-2")).toEqual({
      cart: [],
      error: SALES_TICKET_MESSAGES.productUnavailable,
      shouldClearSearch: false
    });

    expect(addProductToSalesTicket([], products, "missing-product")).toEqual({
      cart: [],
      error: SALES_TICKET_MESSAGES.productUnavailable,
      shouldClearSearch: false
    });
  });

  it("clamps quantity changes between one and current stock", () => {
    const cart: CartItem[] = [{ productId: "product-1", quantity: 1 }];

    expect(updateSalesTicketQuantity(cart, products, "product-1", 99)).toEqual([
      { productId: "product-1", quantity: 2 }
    ]);
    expect(updateSalesTicketQuantity(cart, products, "product-1", 0)).toEqual([
      { productId: "product-1", quantity: 1 }
    ]);
  });

  it("preserves the cart when quantity changes target an unknown product", () => {
    const cart: CartItem[] = [{ productId: "product-1", quantity: 1 }];

    expect(updateSalesTicketQuantity(cart, products, "missing-product", 3)).toBe(cart);
  });

  it("removes a product from the ticket", () => {
    const cart: CartItem[] = [
      { productId: "product-1", quantity: 1 },
      { productId: "product-2", quantity: 1 }
    ];

    expect(removeSalesTicketItem(cart, "product-1")).toEqual([
      { productId: "product-2", quantity: 1 }
    ]);
  });
});

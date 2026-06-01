import {
  getProductById,
  type CartItem,
  type Product
} from "./salesShared";

export const SALES_TICKET_MESSAGES = {
  productUnavailable: "Producto sin stock disponible para vender.",
  maxStockReached: "La cantidad no puede superar el stock disponible.",
  exactMatchRequired:
    "Enter solo agrega coincidencias exactas de SKU. Para búsquedas parciales, selecciona el producto de la lista."
} as const;

export type AddProductToSalesTicketResult = {
  cart: CartItem[];
  error: string;
  shouldClearSearch: boolean;
};

export function addProductToSalesTicket(
  cart: CartItem[],
  products: Product[],
  productId: string
): AddProductToSalesTicketResult {
  const product = getProductById(products, productId);

  if (!product || product.stock <= 0) {
    return {
      cart,
      error: SALES_TICKET_MESSAGES.productUnavailable,
      shouldClearSearch: false
    };
  }

  const existingItem = cart.find((item) => item.productId === productId);

  if (!existingItem) {
    return {
      cart: [...cart, { productId, quantity: 1 }],
      error: "",
      shouldClearSearch: true
    };
  }

  if (existingItem.quantity >= product.stock) {
    return {
      cart,
      error: SALES_TICKET_MESSAGES.maxStockReached,
      shouldClearSearch: true
    };
  }

  return {
    cart: cart.map((item) =>
      item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
    ),
    error: "",
    shouldClearSearch: true
  };
}

export function updateSalesTicketQuantity(
  cart: CartItem[],
  products: Product[],
  productId: string,
  quantity: number
) {
  const product = getProductById(products, productId);

  if (!product) {
    return cart;
  }

  const nextQuantity = Math.max(1, Math.min(quantity || 1, product.stock));

  return cart.map((item) =>
    item.productId === productId ? { ...item, quantity: nextQuantity } : item
  );
}

export function removeSalesTicketItem(cart: CartItem[], productId: string) {
  return cart.filter((item) => item.productId !== productId);
}

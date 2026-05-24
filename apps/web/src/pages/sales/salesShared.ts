export type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "MIXED";
export type SaleStatus = "COMPLETED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "REFUNDED";

export type Product = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  salePrice: number;
  stock: number;
  promoPercent: number;
  finalPrice?: number;
};

export type CartItem = {
  productId: string;
  quantity: number;
};

export type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
};

export type SaleReturn = {
  id: string;
  reason: string;
  refundMethod: PaymentMethod;
  refundTotal: number;
  createdAt: string;
  items: Array<{
    id: string;
    saleItemId: string;
    productId: string;
    quantity: number;
    total: number;
  }>;
};

export type Sale = {
  id: string;
  folio: string;
  customerId?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: SaleStatus;
  createdAt: string;

  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;

  cashier?: {
    id: string;
    name: string;
    email: string;
  };

  items?: SaleItem[];
  returns?: SaleReturn[];

  payments?: Array<{
    id: string;
    method: PaymentMethod;
    amount: number;
    createdAt: string;
  }>;
};

export type CartRow = CartItem & {
  product: Product | undefined;
  unitPrice: number;
  total: number;
};

export function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export function statusLabel(status: SaleStatus) {
  switch (status) {
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    case "PARTIALLY_REFUNDED":
      return "Devolución parcial";
    case "REFUNDED":
      return "Devuelta";
    default:
      return status;
  }
}

export function statusColor(status: SaleStatus) {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "PARTIALLY_REFUNDED":
      return "warning" as const;
    case "REFUNDED":
      return "info" as const;
    case "CANCELLED":
    default:
      return "default" as const;
  }
}

export function paymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "TRANSFER":
      return "Transferencia";
    case "MIXED":
      return "Mixto";
    default:
      return method;
  }
}

export function normalizeSearch(value: string) {
  return value.trim().toLowerCase();
}

export function getProductFinalPrice(product: Product) {
  if (typeof product.finalPrice === "number" && Number.isFinite(product.finalPrice)) {
    return product.finalPrice;
  }

  const promoPercent = Number.isFinite(product.promoPercent) ? product.promoPercent : 0;

  return product.salePrice * (1 - promoPercent / 100);
}

export function getProductById(products: Product[], productId: string) {
  return products.find((product) => product.id === productId);
}

export function getReturnedQuantity(sale: Sale, saleItemId: string) {
  return (sale.returns ?? []).reduce((sum, saleReturn) => {
    return (
      sum +
      saleReturn.items.reduce((itemSum, item) => {
        return item.saleItemId === saleItemId ? itemSum + item.quantity : itemSum;
      }, 0)
    );
  }, 0);
}

export function getReturnableQuantity(sale: Sale, saleItem: SaleItem) {
  return Math.max(saleItem.quantity - getReturnedQuantity(sale, saleItem.id), 0);
}

export function calculateCartTotal(cart: CartItem[], products: Product[]) {
  return cart.reduce((sum, item) => {
    const product = getProductById(products, item.productId);

    if (!product) return sum;

    return sum + getProductFinalPrice(product) * item.quantity;
  }, 0);
}

export function isCartInvalid(cart: CartItem[], products: Product[]) {
  if (cart.length === 0) return true;

  return cart.some((item) => {
    const product = getProductById(products, item.productId);

    return (
      !item.productId ||
      !product ||
      item.quantity <= 0 ||
      item.quantity > product.stock
    );
  });
}

export function getFilteredProducts(products: Product[], search: string) {
  const query = normalizeSearch(search);
  const activeProducts = products.filter((product) => product.stock > 0);

  if (!query) {
    return activeProducts.slice(0, 8);
  }

  return activeProducts
    .filter((product) => {
      return [product.sku, product.barcode ?? "", product.name, product.id].some(
        (value) => value.toLowerCase().includes(query)
      );
    })
    .slice(0, 8);
}

export function buildCartRows(cart: CartItem[], products: Product[]): CartRow[] {
  return cart.map((item) => {
    const product = getProductById(products, item.productId);
    const unitPrice = product ? getProductFinalPrice(product) : 0;

    return {
      ...item,
      product,
      unitPrice,
      total: unitPrice * item.quantity
    };
  });
}

export function getFilteredSales(
  sales: Sale[],
  search: string,
  statusFilter: SaleStatus | "ALL",
  paymentFilter: PaymentMethod | "ALL"
) {
  const query = normalizeSearch(search);

  return sales.filter((sale) => {
    const salePaymentMethods = sale.payments?.map((payment) => payment.method) ?? [];
    const matchesStatus = statusFilter === "ALL" || sale.status === statusFilter;
    const matchesPayment = paymentFilter === "ALL" || salePaymentMethods.includes(paymentFilter);

    if (!matchesStatus || !matchesPayment) {
      return false;
    }

    if (!query) {
      return true;
    }

    return [
      sale.folio,
      sale.customer?.name ?? "Sin cliente",
      sale.cashier?.name ?? "",
      sale.cashier?.email ?? "",
      statusLabel(sale.status),
      ...salePaymentMethods.map(paymentMethodLabel)
    ].some((value) => value.toLowerCase().includes(query));
  });
}

export function summarizeSales(sales: Sale[]) {
  const completedSales = sales.filter((sale) => sale.status === "COMPLETED");
  const totalSold = completedSales.reduce(
    (sum, sale) => sum + Number(sale.total ?? 0),
    0
  );
  const cancelledOrReturned = sales.filter(
    (sale) => sale.status === "CANCELLED" || sale.status === "REFUNDED"
  ).length;

  return {
    totalCount: sales.length,
    completedCount: completedSales.length,
    totalSold,
    cancelledOrReturned
  };
}

export function salePaymentSummary(sale: Sale) {
  const payments = sale.payments ?? [];

  if (payments.length === 0) {
    return "Sin pago registrado";
  }

  return payments
    .map(
      (payment) =>
        `${paymentMethodLabel(payment.method)} · ${formatMoney(payment.amount)}`
    )
    .join(" · ");
}

export function saleItemsSummary(sale: Sale) {
  const items = sale.items ?? [];

  if (items.length === 0) {
    return "Sin detalle de productos";
  }

  const visibleItems = items
    .slice(0, 3)
    .map((item) => `${item.quantity}× ${item.product?.name ?? item.productId}`);

  if (items.length > visibleItems.length) {
    visibleItems.push(`+${items.length - visibleItems.length} más`);
  }

  return visibleItems.join(" · ");
}

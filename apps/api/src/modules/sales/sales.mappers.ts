import { Prisma } from "@prisma/client";

export const saleDetailsInclude = {
  cashier: {
    select: {
      id: true,
      name: true,
      email: true
    }
  },
  customer: {
    select: {
      id: true,
      name: true,
      phone: true,
      email: true
    }
  },
  items: {
    include: {
      product: {
        select: {
          id: true,
          sku: true,
          name: true,
          salePrice: true,
          promoPercent: true
        }
      }
    }
  },
  payments: true,
  returns: {
    include: {
      cashier: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: "desc"
    }
  }
} satisfies Prisma.SaleInclude;

export const createdSaleInclude = {
  items: true,
  payments: true
} satisfies Prisma.SaleInclude;

export const saleMutationInclude = {
  items: true,
  payments: true,
  returns: {
    include: {
      items: true
    }
  }
} satisfies Prisma.SaleInclude;

export type SaleWithDetails = Prisma.SaleGetPayload<{
  include: typeof saleDetailsInclude;
}>;

export type SaleWithItemsAndPayments = Prisma.SaleGetPayload<{
  include: typeof createdSaleInclude;
}>;

export type SaleForMutation = Prisma.SaleGetPayload<{
  include: typeof saleMutationInclude;
}>;

function mapSaleItemProduct(item: {
  product: {
    id: string;
    sku: string;
    name: string;
    salePrice?: Prisma.Decimal;
    promoPercent?: Prisma.Decimal;
  } | null;
  productId: string | null;
  productSku: string;
  productName: string;
}) {
  if (item.product) {
    return {
      ...item.product,
      ...(item.product.salePrice === undefined
        ? {}
        : { salePrice: Number(item.product.salePrice) }),
      ...(item.product.promoPercent === undefined
        ? {}
        : { promoPercent: Number(item.product.promoPercent) })
    };
  }

  return {
    id: item.productId,
    sku: item.productSku,
    name: `${item.productName} (eliminado)`,
    deleted: true
  };
}

export function mapSaleDetails(sale: SaleWithDetails) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    tax: Number(sale.tax),
    total: Number(sale.total),
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      unitCost: Number(item.unitCost ?? 0),
      promoPercent: Number(item.promoPercent ?? 0),
      discount: Number(item.discount),
      total: Number(item.total),
      grossProfit: Number(item.grossProfit ?? 0),
      product: mapSaleItemProduct(item)
    })),
    payments: sale.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount)
    })),
    returns: sale.returns.map((saleReturn) => ({
      ...saleReturn,
      refundTotal: Number(saleReturn.refundTotal),
      items: saleReturn.items.map((item) => ({
        ...item,
        unitPrice: Number(item.unitPrice),
        unitCost: Number(item.unitCost ?? 0),
        promoPercent: Number(item.promoPercent ?? 0),
        discount: Number(item.discount),
        total: Number(item.total),
        grossProfit: Number(item.grossProfit ?? 0),
        product: mapSaleItemProduct(item)
      }))
    }))
  };
}

export function mapCreatedSale(sale: SaleWithItemsAndPayments) {
  return {
    ...sale,
    subtotal: Number(sale.subtotal),
    discount: Number(sale.discount),
    tax: Number(sale.tax),
    total: Number(sale.total),
    items: sale.items.map((item) => ({
      ...item,
      unitPrice: Number(item.unitPrice),
      unitCost: Number(item.unitCost ?? 0),
      promoPercent: Number(item.promoPercent ?? 0),
      discount: Number(item.discount),
      total: Number(item.total),
      grossProfit: Number(item.grossProfit ?? 0)
    })),
    payments: sale.payments.map((payment) => ({
      ...payment,
      amount: Number(payment.amount)
    }))
  };
}

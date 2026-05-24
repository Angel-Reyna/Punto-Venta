import { SaleStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REPORT_RANGE_DAYS = 366;

export type ReportDateRange = {
  start: Date;
  end: Date;
  fromLabel: string;
  toLabel: string;
};

export type ReportPerson = {
  id: string;
  name: string;
  email: string;
};

export type SerializedPayment = {
  id: string;
  method: string;
  amount: number;
  createdAt?: Date;
};

export type SalesReport = {
  from: Date;
  to: Date;
  fromLabel: string;
  toLabel: string;
  count: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentSummary: Record<string, number>;
  sales: Array<Record<string, unknown>>;
};

export type OperationsReport = {
  from: Date;
  to: Date;
  fromLabel: string;
  toLabel: string;
  sales: {
    count: number;
    byStatus: Record<string, number>;
    gross: number;
    refunded: number;
    net: number;
    paymentSummary: Record<string, number>;
    bySeller: Array<{
      seller: ReportPerson;
      count: number;
      gross: number;
      refunded: number;
      net: number;
    }>;
    recent: Array<{
      id: string;
      folio: string;
      status: string;
      total: number;
      createdAt: Date;
      cashier: ReportPerson;
      payments: Array<{
        id: string;
        method: string;
        amount: number;
      }>;
    }>;
  };
  returns: {
    count: number;
    total: number;
    byMethod: Record<string, number>;
    latest: Array<{
      id: string;
      saleId: string;
      cashierId: string;
      reason: string;
      refundMethod: string;
      refundTotal: number;
      createdAt: Date;
      updatedAt: Date;
      cashier: ReportPerson;
    }>;
  };
  cashRegister: {
    sessions: Array<{
      id: string;
      status: string;
      openingAmount: number;
      expectedClosingAmount: number | null;
      closingAmount: number | null;
      difference: number | null;
      openedAt: Date;
      closedAt: Date | null;
      cashier: ReportPerson;
    }>;
    movements: {
      count: number;
      summary: Record<string, number>;
    };
  };
  topProducts: Array<{
    product: {
      id: string;
      sku: string | null;
      name: string;
    };
    quantity: number;
    total: number;
  }>;
};

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toMoney(value: unknown) {
  return roundMoney(Number(value ?? 0));
}

function parseDateOnly(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) {
    throw new AppError(
      400,
      `${fieldName} debe tener formato YYYY-MM-DD`
    );
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError(400, `${fieldName} no es una fecha válida`);
  }

  return {
    year,
    month,
    day,
    label: value
  };
}

export function parseReportDateRange(from?: unknown, to?: unknown): ReportDateRange {
  if (!from || !to) {
    throw new AppError(400, "Debes enviar fecha inicial y fecha final");
  }

  const fromDate = parseDateOnly(from, "La fecha inicial");
  const toDate = parseDateOnly(to, "La fecha final");

  const start = new Date(
    Date.UTC(fromDate.year, fromDate.month - 1, fromDate.day, 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(toDate.year, toDate.month - 1, toDate.day, 23, 59, 59, 999)
  );

  if (start > end) {
    throw new AppError(
      400,
      "La fecha inicial no puede ser mayor que la fecha final"
    );
  }

  const rangeDays = Math.ceil(
    (end.getTime() - start.getTime() + 1) / (24 * 60 * 60 * 1000)
  );

  if (rangeDays > MAX_REPORT_RANGE_DAYS) {
    throw new AppError(
      400,
      `El rango máximo permitido para reportes es de ${MAX_REPORT_RANGE_DAYS} días`
    );
  }

  return {
    start,
    end,
    fromLabel: fromDate.label,
    toLabel: toDate.label
  };
}

export async function getSalesReport(range: ReportDateRange): Promise<SalesReport> {
  const sales = await prisma.sale.findMany({
    where: {
      status: SaleStatus.COMPLETED,
      createdAt: {
        gte: range.start,
        lte: range.end
      }
    },
    include: {
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
              name: true
            }
          }
        }
      },
      payments: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const subtotal = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.subtotal), 0)
  );
  const discount = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.discount), 0)
  );
  const tax = roundMoney(sales.reduce((sum, sale) => sum + Number(sale.tax), 0));
  const total = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.total), 0)
  );

  const paymentSummary = sales
    .flatMap((sale) => sale.payments)
    .reduce<Record<string, number>>((summary, payment) => {
      summary[payment.method] = roundMoney(
        (summary[payment.method] ?? 0) + Number(payment.amount)
      );

      return summary;
    }, {});

  return {
    from: range.start,
    to: range.end,
    fromLabel: range.fromLabel,
    toLabel: range.toLabel,
    count: sales.length,
    subtotal,
    discount,
    tax,
    total,
    paymentSummary,
    sales: sales.map((sale) => ({
      ...sale,
      subtotal: toMoney(sale.subtotal),
      discount: toMoney(sale.discount),
      tax: toMoney(sale.tax),
      total: toMoney(sale.total),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: toMoney(item.unitPrice),
        discount: toMoney(item.discount),
        total: toMoney(item.total)
      })),
      payments: sale.payments.map((payment) => ({
        ...payment,
        amount: toMoney(payment.amount)
      }))
    }))
  };
}

export async function getOperationsReport(range: ReportDateRange): Promise<OperationsReport> {
  const [
    sales,
    returns,
    cashSessions,
    cashMovements,
    soldProducts,
    returnedProducts
  ] = await Promise.all([
    prisma.sale.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end
        }
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        },
        payments: true
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.saleReturn.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end
        }
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.cashRegisterSession.findMany({
      where: {
        openedAt: {
          gte: range.start,
          lte: range.end
        }
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        openedAt: "desc"
      }
    }),
    prisma.cashMovement.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end
        }
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    }),
    prisma.saleItem.findMany({
      where: {
        sale: {
          status: {
            not: SaleStatus.CANCELLED
          },
          createdAt: {
            gte: range.start,
            lte: range.end
          }
        }
      },
      select: {
        productId: true,
        productSku: true,
        productName: true,
        quantity: true,
        total: true
      }
    }),
    prisma.saleReturnItem.findMany({
      where: {
        return: {
          createdAt: {
            gte: range.start,
            lte: range.end
          }
        }
      },
      select: {
        productId: true,
        productSku: true,
        productName: true,
        quantity: true,
        total: true
      }
    })
  ]);

  const productTotals = new Map<
    string,
    {
      product: {
        id: string;
        sku: string | null;
        name: string;
      };
      quantity: number;
      total: number;
    }
  >();

  function productAggregateKey(item: {
    productId: string | null;
    productSku: string;
    productName: string;
  }) {
    return item.productId ?? `deleted:${item.productSku}:${item.productName}`;
  }

  function snapshotProduct(item: {
    productId: string | null;
    productSku: string;
    productName: string;
  }) {
    return {
      id: item.productId ?? productAggregateKey(item),
      sku: item.productSku,
      name: item.productId ? item.productName : `${item.productName} (eliminado)`
    };
  }

  for (const item of soldProducts) {
    const key = productAggregateKey(item);
    const current = productTotals.get(key) ?? {
      product: snapshotProduct(item),
      quantity: 0,
      total: 0
    };

    productTotals.set(key, {
      ...current,
      quantity: current.quantity + Number(item.quantity),
      total: roundMoney(current.total + Number(item.total))
    });
  }

  for (const item of returnedProducts) {
    const key = productAggregateKey(item);
    const current = productTotals.get(key) ?? {
      product: snapshotProduct(item),
      quantity: 0,
      total: 0
    };

    productTotals.set(key, {
      ...current,
      quantity: current.quantity - Number(item.quantity),
      total: roundMoney(current.total - Number(item.total))
    });
  }

  const sortedTopProducts = [...productTotals.values()]
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      total: roundMoney(item.total)
    }))
    .filter((item) => item.quantity > 0 || item.total > 0)
    .sort((a, b) => b.quantity - a.quantity || b.total - a.total)
    .slice(0, 10);

  const salesByStatus = sales.reduce<Record<string, number>>((summary, sale) => {
    summary[sale.status] = (summary[sale.status] ?? 0) + 1;

    return summary;
  }, {});

  const grossSales = roundMoney(
    sales
      .filter((sale) => sale.status !== SaleStatus.CANCELLED)
      .reduce((sum, sale) => sum + Number(sale.total), 0)
  );
  const refundedTotal = roundMoney(
    returns.reduce((sum, saleReturn) => sum + Number(saleReturn.refundTotal), 0)
  );
  const netSales = roundMoney(grossSales - refundedTotal);

  const paymentSummary = sales
    .filter((sale) => sale.status !== SaleStatus.CANCELLED)
    .flatMap((sale) => sale.payments)
    .reduce<Record<string, number>>((summary, payment) => {
      summary[payment.method] = roundMoney(
        (summary[payment.method] ?? 0) + Number(payment.amount)
      );

      return summary;
    }, {});

  const sellerTotals = new Map<
    string,
    {
      seller: ReportPerson;
      count: number;
      gross: number;
      refunded: number;
    }
  >();

  for (const sale of sales) {
    if (sale.status === SaleStatus.CANCELLED) continue;

    const current = sellerTotals.get(sale.cashier.id) ?? {
      seller: sale.cashier,
      count: 0,
      gross: 0,
      refunded: 0
    };

    sellerTotals.set(sale.cashier.id, {
      ...current,
      count: current.count + 1,
      gross: roundMoney(current.gross + Number(sale.total))
    });
  }

  for (const saleReturn of returns) {
    const current = sellerTotals.get(saleReturn.cashier.id) ?? {
      seller: saleReturn.cashier,
      count: 0,
      gross: 0,
      refunded: 0
    };

    sellerTotals.set(saleReturn.cashier.id, {
      ...current,
      refunded: roundMoney(current.refunded + Number(saleReturn.refundTotal))
    });
  }

  const salesBySeller = [...sellerTotals.values()]
    .map((entry) => ({
      ...entry,
      gross: roundMoney(entry.gross),
      refunded: roundMoney(entry.refunded),
      net: roundMoney(entry.gross - entry.refunded)
    }))
    .sort((a, b) => b.net - a.net || b.gross - a.gross || a.seller.name.localeCompare(b.seller.name));

  const refundSummary = returns.reduce<Record<string, number>>((summary, saleReturn) => {
    summary[saleReturn.refundMethod] = roundMoney(
      (summary[saleReturn.refundMethod] ?? 0) + Number(saleReturn.refundTotal)
    );

    return summary;
  }, {});

  const cashMovementSummary = cashMovements.reduce<Record<string, number>>(
    (summary, movement) => {
      summary[movement.type] = roundMoney(
        (summary[movement.type] ?? 0) + Number(movement.amount)
      );

      return summary;
    },
    {}
  );

  return {
    from: range.start,
    to: range.end,
    fromLabel: range.fromLabel,
    toLabel: range.toLabel,
    sales: {
      count: sales.length,
      byStatus: salesByStatus,
      gross: grossSales,
      refunded: refundedTotal,
      net: netSales,
      paymentSummary,
      bySeller: salesBySeller,
      recent: sales.slice(0, 25).map((sale) => ({
        id: sale.id,
        folio: sale.folio,
        status: sale.status,
        total: toMoney(sale.total),
        createdAt: sale.createdAt,
        cashier: sale.cashier,
        payments: sale.payments.map((payment) => ({
          id: payment.id,
          method: payment.method,
          amount: toMoney(payment.amount)
        }))
      }))
    },
    returns: {
      count: returns.length,
      total: refundedTotal,
      byMethod: refundSummary,
      latest: returns.slice(0, 20).map((saleReturn) => ({
        ...saleReturn,
        refundTotal: toMoney(saleReturn.refundTotal)
      }))
    },
    cashRegister: {
      sessions: cashSessions.map((session) => ({
        ...session,
        openingAmount: toMoney(session.openingAmount),
        expectedClosingAmount:
          session.expectedClosingAmount === null
            ? null
            : toMoney(session.expectedClosingAmount),
        closingAmount:
          session.closingAmount === null ? null : toMoney(session.closingAmount),
        difference: session.difference === null ? null : toMoney(session.difference)
      })),
      movements: {
        count: cashMovements.length,
        summary: cashMovementSummary
      }
    },
    topProducts: sortedTopProducts.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      total: item.total
    }))
  };
}

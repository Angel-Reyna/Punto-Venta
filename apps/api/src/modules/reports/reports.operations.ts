import { SaleStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { roundMoney, toMoney } from "./reports.shared";
import type { OperationsReport, ReportDateRange, ReportPerson } from "./reports.shared";

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

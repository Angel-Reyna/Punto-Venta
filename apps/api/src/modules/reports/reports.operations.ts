import { SaleStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { buildProfitSummary, roundMoney, toMoney } from "./reports.shared";
import type { OperationsReport, ReportDateRange, ReportPerson } from "./reports.shared";

const INVENTORY_MOVEMENT_TYPES = {
  IN: "IN",
  OUT: "OUT"
} as const;

const INVENTORY_REASON_TYPES = {
  EXPIRATION: "EXPIRATION",
  OTHER: "OTHER"
} as const;

export async function getOperationsReport(range: ReportDateRange): Promise<OperationsReport> {
  const [
    sales,
    returns,
    soldProducts,
    returnedProducts,
    inventoryMovements
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
        payments: true,
        items: true
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
        },
        sale: {
          select: {
            cashierId: true,
            status: true,
            cashier: {
              select: {
                id: true,
                name: true,
                email: true
              }
            }
          }
        },
        items: true
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
        total: true,
        unitCost: true,
        grossProfit: true
      }
    }),
    prisma.saleReturnItem.findMany({
      where: {
        return: {
          createdAt: {
            gte: range.start,
            lte: range.end
          },
          sale: {
            status: {
              not: SaleStatus.CANCELLED
            }
          }
        }
      },
      select: {
        productId: true,
        productSku: true,
        productName: true,
        quantity: true,
        total: true,
        unitCost: true,
        grossProfit: true
      }
    }),
    prisma.inventoryMovement.findMany({
      where: {
        createdAt: {
          gte: range.start,
          lte: range.end
        }
      },
      include: {
        warehouse: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        createdAt: "desc"
      }
    })
  ]);

  const accountableReturns = returns.filter(
    (saleReturn) => saleReturn.sale.status !== SaleStatus.CANCELLED
  );

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
      cost: number;
      grossProfit: number;
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
      total: 0,
      cost: 0,
      grossProfit: 0
    };

    productTotals.set(key, {
      ...current,
      quantity: current.quantity + Number(item.quantity),
      total: roundMoney(current.total + Number(item.total)),
      cost: roundMoney(current.cost + Number(item.unitCost ?? 0) * item.quantity),
      grossProfit: roundMoney(current.grossProfit + Number(item.grossProfit ?? 0))
    });
  }

  for (const item of returnedProducts) {
    const key = productAggregateKey(item);
    const current = productTotals.get(key) ?? {
      product: snapshotProduct(item),
      quantity: 0,
      total: 0,
      cost: 0,
      grossProfit: 0
    };

    productTotals.set(key, {
      ...current,
      quantity: current.quantity - Number(item.quantity),
      total: roundMoney(current.total - Number(item.total)),
      cost: roundMoney(current.cost - Number(item.unitCost ?? 0) * item.quantity),
      grossProfit: roundMoney(current.grossProfit - Number(item.grossProfit ?? 0))
    });
  }

  const sortedTopProducts = [...productTotals.values()]
    .map((item) => ({
      product: item.product,
      quantity: item.quantity,
      total: roundMoney(item.total),
      cost: roundMoney(item.cost),
      grossProfit: roundMoney(item.grossProfit)
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
    accountableReturns.reduce(
      (sum, saleReturn) => sum + Number(saleReturn.refundTotal),
      0
    )
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

  const soldItems = sales
    .filter((sale) => sale.status !== SaleStatus.CANCELLED)
    .flatMap((sale) => sale.items);
  const returnedItems = accountableReturns.flatMap((saleReturn) => saleReturn.items);
  const soldCost = roundMoney(
    soldItems.reduce(
      (sum, item) => sum + Number(item.unitCost ?? 0) * item.quantity,
      0
    )
  );
  const soldProfit = roundMoney(
    soldItems.reduce((sum, item) => sum + Number(item.grossProfit ?? 0), 0)
  );
  const returnedCost = roundMoney(
    returnedItems.reduce(
      (sum, item) => sum + Number(item.unitCost ?? 0) * item.quantity,
      0
    )
  );
  const returnedProfit = roundMoney(
    returnedItems.reduce((sum, item) => sum + Number(item.grossProfit ?? 0), 0)
  );
  const expirationMovements = inventoryMovements.filter(
    (movement) =>
      movement.type === INVENTORY_MOVEMENT_TYPES.OUT &&
      movement.reasonType === INVENTORY_REASON_TYPES.EXPIRATION
  );
  const expirationCost = roundMoney(
    expirationMovements.reduce(
      (sum, movement) =>
        sum + Number(movement.costAmount ?? Number(movement.unitCostAtMovement ?? 0) * movement.quantity),
      0
    )
  );
  const profit = buildProfitSummary({
    grossCost: soldCost,
    returnedCost,
    grossProfit: soldProfit,
    returnedProfit,
    netSales,
    shrinkageCost: expirationCost
  });

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

  for (const saleReturn of accountableReturns) {
    const returnSeller = saleReturn.sale.cashier;
    const current = sellerTotals.get(returnSeller.id) ?? {
      seller: returnSeller,
      count: 0,
      gross: 0,
      refunded: 0
    };

    sellerTotals.set(returnSeller.id, {
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
    .sort(
      (a, b) =>
        b.net - a.net ||
        b.gross - a.gross ||
        a.seller.name.localeCompare(b.seller.name)
    );

  const refundSummary = accountableReturns.reduce<Record<string, number>>((summary, saleReturn) => {
    summary[saleReturn.refundMethod] = roundMoney(
      (summary[saleReturn.refundMethod] ?? 0) + Number(saleReturn.refundTotal)
    );

    return summary;
  }, {});


  const activeSales = sales.filter((sale) => sale.status !== SaleStatus.CANCELLED);
  const unitsSold = soldItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  const unitsReturned = returnedItems.reduce((sum, item) => sum + Number(item.quantity), 0);
  const unitsNet = unitsSold - unitsReturned;
  const unitsPerTransaction = activeSales.length <= 0
    ? 0
    : roundMoney(unitsNet / activeSales.length);

  const salesByDay = new Map<
    string,
    {
      count: number;
      gross: number;
      refunded: number;
      net: number;
      units: number;
    }
  >();

  function ensureDay(date: Date) {
    const day = date.toISOString().slice(0, 10);
    const current = salesByDay.get(day) ?? {
      count: 0,
      gross: 0,
      refunded: 0,
      net: 0,
      units: 0
    };

    salesByDay.set(day, current);

    return current;
  }

  for (const sale of activeSales) {
    const current = ensureDay(sale.createdAt);
    const saleUnits = sale.items.reduce((sum, item) => sum + Number(item.quantity), 0);

    current.count += 1;
    current.gross = roundMoney(current.gross + Number(sale.total));
    current.net = roundMoney(current.net + Number(sale.total));
    current.units += saleUnits;
  }

  for (const saleReturn of accountableReturns) {
    const current = ensureDay(saleReturn.createdAt);
    const returnedUnits = saleReturn.items.reduce((sum, item) => sum + Number(item.quantity), 0);

    current.refunded = roundMoney(current.refunded + Number(saleReturn.refundTotal));
    current.net = roundMoney(current.net - Number(saleReturn.refundTotal));
    current.units -= returnedUnits;
  }

  const dailySales = [...salesByDay.entries()]
    .map(([date, item]) => ({
      date,
      count: item.count,
      gross: roundMoney(item.gross),
      refunded: roundMoney(item.refunded),
      net: roundMoney(item.net),
      units: item.units
    }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const inventoryUnitsIn = inventoryMovements
    .filter((movement) => movement.type === INVENTORY_MOVEMENT_TYPES.IN)
    .reduce((sum, movement) => sum + Number(movement.quantity), 0);
  const inventoryUnitsOut = inventoryMovements
    .filter((movement) => movement.type === INVENTORY_MOVEMENT_TYPES.OUT)
    .reduce((sum, movement) => sum + Number(movement.quantity), 0);
  const inventorySummaryByType = inventoryMovements.reduce<Record<string, number>>(
    (summary, movement) => {
      summary[movement.type] = (summary[movement.type] ?? 0) + Number(movement.quantity);

      return summary;
    },
    {}
  );
  const inventorySummaryByReasonType = inventoryMovements.reduce<Record<string, number>>(
    (summary, movement) => {
      summary[movement.reasonType] = (summary[movement.reasonType] ?? 0) + Number(movement.quantity);

      return summary;
    },
    {}
  );

  const expirationUnits = expirationMovements.reduce(
    (sum, movement) => sum + Number(movement.quantity),
    0
  );
  const shrinkageByProduct = new Map<
    string,
    {
      product: {
        id: string;
        sku: string | null;
        name: string;
      };
      quantity: number;
      cost: number;
    }
  >();
  const shrinkageByWarehouse = new Map<
    string,
    {
      warehouse: {
        id: string | null;
        name: string;
      };
      quantity: number;
      cost: number;
    }
  >();

  for (const movement of expirationMovements) {
    const movementCost = roundMoney(
      Number(movement.costAmount ?? Number(movement.unitCostAtMovement ?? 0) * movement.quantity)
    );
    const productKey = movement.productId ?? `deleted:${movement.productSku}:${movement.productName}`;
    const productCurrent = shrinkageByProduct.get(productKey) ?? {
      product: {
        id: movement.productId ?? productKey,
        sku: movement.productSku,
        name: movement.productId ? movement.productName : `${movement.productName} (eliminado)`
      },
      quantity: 0,
      cost: 0
    };

    shrinkageByProduct.set(productKey, {
      ...productCurrent,
      quantity: productCurrent.quantity + Number(movement.quantity),
      cost: roundMoney(productCurrent.cost + movementCost)
    });

    const warehouseKey = movement.warehouse?.id ?? "unassigned";
    const warehouseCurrent = shrinkageByWarehouse.get(warehouseKey) ?? {
      warehouse: {
        id: movement.warehouse?.id ?? null,
        name: movement.warehouse?.name ?? "Sin almacén"
      },
      quantity: 0,
      cost: 0
    };

    shrinkageByWarehouse.set(warehouseKey, {
      ...warehouseCurrent,
      quantity: warehouseCurrent.quantity + Number(movement.quantity),
      cost: roundMoney(warehouseCurrent.cost + movementCost)
    });
  }

  const latestInventoryMovements = inventoryMovements.slice(0, 20).map((movement) => ({
    id: movement.id,
    type: movement.type,
    reasonType: movement.reasonType,
    reason: movement.reason,
    quantity: movement.quantity,
    unitCostAtMovement:
      movement.unitCostAtMovement === null ? null : toMoney(movement.unitCostAtMovement),
    costAmount: movement.costAmount === null ? null : toMoney(movement.costAmount),
    product: {
      id: movement.productId,
      sku: movement.productSku,
      name: movement.productName
    },
    warehouse: movement.warehouse
      ? {
          id: movement.warehouse.id,
          name: movement.warehouse.name
        }
      : null,
    createdAt: movement.createdAt
  }));

  const latestExpirationMovements = expirationMovements.slice(0, 15).map((movement) => ({
    id: movement.id,
    type: movement.type,
    reasonType: movement.reasonType,
    reason: movement.reason,
    quantity: movement.quantity,
    unitCostAtMovement:
      movement.unitCostAtMovement === null ? null : toMoney(movement.unitCostAtMovement),
    costAmount: movement.costAmount === null ? null : toMoney(movement.costAmount),
    product: {
      id: movement.productId,
      sku: movement.productSku,
      name: movement.productName
    },
    warehouse: movement.warehouse
      ? {
          id: movement.warehouse.id,
          name: movement.warehouse.name
        }
      : null,
    createdAt: movement.createdAt
  }));
  return {
    from: range.start,
    to: range.end,
    fromLabel: range.fromLabel,
    toLabel: range.toLabel,
    sales: {
      count: sales.length,
      activeCount: activeSales.length,
      unitsSold,
      unitsReturned,
      unitsNet,
      unitsPerTransaction,
      byStatus: salesByStatus,
      daily: dailySales,
      gross: grossSales,
      refunded: refundedTotal,
      net: netSales,
      paymentSummary,
      profit,
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
      count: accountableReturns.length,
      total: refundedTotal,
      byMethod: refundSummary,
      latest: accountableReturns.slice(0, 20).map((saleReturn) => ({
        id: saleReturn.id,
        saleId: saleReturn.saleId,
        cashierId: saleReturn.sale.cashier.id,
        reason: saleReturn.reason,
        refundMethod: saleReturn.refundMethod,
        refundTotal: toMoney(saleReturn.refundTotal),
        createdAt: saleReturn.createdAt,
        updatedAt: saleReturn.updatedAt,
        cashier: saleReturn.sale.cashier
      }))
    },
    inventory: {
      movements: {
        count: inventoryMovements.length,
        unitsIn: inventoryUnitsIn,
        unitsOut: inventoryUnitsOut,
        byType: inventorySummaryByType,
        byReasonType: inventorySummaryByReasonType,
        latest: latestInventoryMovements
      },
      shrinkage: {
        totalUnits: expirationUnits,
        totalCost: expirationCost,
        byProduct: [...shrinkageByProduct.values()]
          .sort((a, b) =>
            b.cost - a.cost ||
            b.quantity - a.quantity ||
            a.product.name.localeCompare(b.product.name)
          )
          .slice(0, 10),
        byWarehouse: [...shrinkageByWarehouse.values()]
          .sort((a, b) =>
            b.cost - a.cost ||
            b.quantity - a.quantity ||
            a.warehouse.name.localeCompare(b.warehouse.name)
          )
          .slice(0, 10),
        latest: latestExpirationMovements
      }
    },
    topProducts: sortedTopProducts.map((item) => ({
      product: item.product,
      quantity: item.quantity,
      total: item.total,
      cost: item.cost,
      grossProfit: item.grossProfit
    }))
  };
}

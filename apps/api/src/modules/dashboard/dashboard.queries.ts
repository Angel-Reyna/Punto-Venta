import { InventoryType, SaleStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { RECENT_SALES_LIMIT } from "./dashboard.shared";
import { INVENTORY_REASON_TYPES } from "../inventory/inventory.shared";

export type DashboardScopeWhere = {
  cashierId?: string;
};

const salesPeriodSelect = {
  _count: {
    _all: true
  },
  _sum: {
    total: true
  },
  _avg: {
    total: true
  }
} as const;

function buildCompletedSalesPeriodWhere(input: {
  salesScopeWhere: DashboardScopeWhere;
  from: Date;
  to?: Date;
}) {
  const { from, salesScopeWhere, to } = input;

  return {
    ...salesScopeWhere,
    status: SaleStatus.COMPLETED,
    createdAt: {
      gte: from,
      ...(to ? { lt: to } : {})
    }
  };
}

export async function fetchDashboardSummaryData(input: {
  currentMonthStart: Date;
  isAdmin: boolean;
  last7DaysStart: Date;
  previous7DaysStart: Date;
  previousMonthStart: Date;
  salesScopeWhere: DashboardScopeWhere;
  todayStart: Date;
}) {
  const {
    currentMonthStart,
    isAdmin,
    last7DaysStart,
    previous7DaysStart,
    previousMonthStart,
    salesScopeWhere,
    todayStart
  } = input;

  const [
    activeProducts,
    activeProductRows,
    groupedUsers,
    todaySalesAggregate,
    last7DaysSalesAggregate,
    previous7DaysSalesAggregate,
    currentMonthSalesAggregate,
    previousMonthSalesAggregate,
    todayShrinkageAggregate,
    recentSales
  ] = await Promise.all([
    prisma.product.count({
      where: {
        isActive: true
      }
    }),

    prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        sku: true,
        name: true,
        minStock: true
      },
      orderBy: [
        {
          name: "asc"
        },
        {
          sku: "asc"
        }
      ]
    }),

    isAdmin
      ? prisma.user.groupBy({
          by: ["role"],
          where: {
            isActive: true
          },
          _count: {
            _all: true
          },
          orderBy: {
            role: "asc"
          }
        })
      : Promise.resolve([]),

    prisma.sale.aggregate({
      where: buildCompletedSalesPeriodWhere({
        salesScopeWhere,
        from: todayStart
      }),
      ...salesPeriodSelect
    }),

    prisma.sale.aggregate({
      where: buildCompletedSalesPeriodWhere({
        salesScopeWhere,
        from: last7DaysStart
      }),
      ...salesPeriodSelect
    }),

    prisma.sale.aggregate({
      where: buildCompletedSalesPeriodWhere({
        salesScopeWhere,
        from: previous7DaysStart,
        to: last7DaysStart
      }),
      ...salesPeriodSelect
    }),

    prisma.sale.aggregate({
      where: buildCompletedSalesPeriodWhere({
        salesScopeWhere,
        from: currentMonthStart
      }),
      ...salesPeriodSelect
    }),

    prisma.sale.aggregate({
      where: buildCompletedSalesPeriodWhere({
        salesScopeWhere,
        from: previousMonthStart,
        to: currentMonthStart
      }),
      ...salesPeriodSelect
    }),

    isAdmin
      ? prisma.inventoryMovement.aggregate({
          where: {
            type: InventoryType.OUT,
            reasonType: INVENTORY_REASON_TYPES.EXPIRATION,
            createdAt: {
              gte: todayStart
            }
          },
          _sum: {
            quantity: true,
            costAmount: true
          }
        })
      : Promise.resolve({
          _sum: {
            quantity: 0,
            costAmount: 0
          }
        }),

    prisma.sale.findMany({
      where: salesScopeWhere,
      select: {
        id: true,
        folio: true,
        status: true,
        total: true,
        createdAt: true,
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
      },
      take: RECENT_SALES_LIMIT
    })
  ]);

  return {
    activeProducts,
    activeProductRows,
    groupedUsers,
    todaySalesAggregate,
    last7DaysSalesAggregate,
    previous7DaysSalesAggregate,
    currentMonthSalesAggregate,
    previousMonthSalesAggregate,
    todayShrinkageAggregate,
    recentSales
  };
}

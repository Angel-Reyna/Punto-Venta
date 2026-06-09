import { Prisma, Role } from "@prisma/client";

import { getProductStocks } from "../inventory/inventory.service";
import {
  buildLowStockItems,
  mapRecentSales,
  mapUserCounts
} from "./dashboard.mappers";
import {
  addDays,
  startOfMonth,
  startOfPreviousMonth,
  startOfToday,
  toMoney,
  type CurrentUser,
  type DashboardSalesPeriod,
  type DashboardSalesPeriodComparison,
  type DashboardSummary
} from "./dashboard.shared";
import { fetchDashboardSummaryData } from "./dashboard.queries";

export type { CurrentUser, DashboardSummary } from "./dashboard.shared";

type SalesAggregate = {
  _count: {
    _all: number;
  };
  _sum: {
    total: Prisma.Decimal | number | null;
  };
  _avg: {
    total: Prisma.Decimal | number | null;
  };
};

function mapSalesPeriod(aggregate: SalesAggregate): DashboardSalesPeriod {
  return {
    count: aggregate._count._all,
    total: toMoney(aggregate._sum.total),
    averageTicket: toMoney(aggregate._avg.total)
  };
}

function calculateTotalChangePercent(current: number, previous: number) {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}

function buildSalesPeriodComparison(input: {
  current: SalesAggregate;
  previous: SalesAggregate;
}): DashboardSalesPeriodComparison {
  const current = mapSalesPeriod(input.current);
  const previous = mapSalesPeriod(input.previous);

  return {
    current,
    previous,
    totalChangePercent: calculateTotalChangePercent(current.total, previous.total)
  };
}

export async function getDashboardSummary(
  user: CurrentUser
): Promise<DashboardSummary> {
  const todayStart = startOfToday();
  const isAdmin = user.role === Role.ADMIN;
  const last7DaysStart = addDays(todayStart, -6);
  const previous7DaysStart = addDays(last7DaysStart, -7);
  const currentMonthStart = startOfMonth(todayStart);
  const previousMonthStart = startOfPreviousMonth(todayStart);

  const salesScopeWhere = isAdmin
    ? {}
    : {
        cashierId: user.id
      };

  const {
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
  } = await fetchDashboardSummaryData({
    currentMonthStart,
    isAdmin,
    last7DaysStart,
    previous7DaysStart,
    previousMonthStart,
    todayStart,
    salesScopeWhere
  });
  const stocks = await getProductStocks(
    activeProductRows.map((product) => product.id)
  );
  const lowStock = buildLowStockItems(activeProductRows, stocks);
  const users = mapUserCounts(groupedUsers, isAdmin);
  const todaySalesCount = todaySalesAggregate._count._all;
  const todaySalesTotal = toMoney(todaySalesAggregate._sum.total);

  return {
    role: user.role,
    generatedAt: new Date(),
    userSummary: users,
    productSummary: {
      active: activeProducts,
      shrinkageUnitsToday: todayShrinkageAggregate._sum.quantity ?? 0,
      shrinkageCostToday: toMoney(todayShrinkageAggregate._sum.costAmount),
      ...lowStock
    },
    salesToday: {
      scope: isAdmin ? "global" : "cashier",
      count: todaySalesCount,
      total: todaySalesTotal,
      averageTicket: toMoney(todaySalesAggregate._avg.total)
    },
    salesOutlook: {
      last7Days: buildSalesPeriodComparison({
        current: last7DaysSalesAggregate,
        previous: previous7DaysSalesAggregate
      }),
      currentMonth: buildSalesPeriodComparison({
        current: currentMonthSalesAggregate,
        previous: previousMonthSalesAggregate
      })
    },
    recentSales: mapRecentSales(recentSales),

    products: activeProducts,
    lowStock: lowStock.lowStockTotal,
    users: users.totalActive,
    todaySalesCount,
    todaySalesTotal
  };
}

export const dashboardInternalsForTests = {
  buildLowStockItems,
  mapUserCounts
};

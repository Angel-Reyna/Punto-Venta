import { Role } from "@prisma/client";

import { getProductStocks } from "../inventory/inventory.service";
import {
  buildLowStockItems,
  mapRecentSales,
  mapUserCounts
} from "./dashboard.mappers";
import {
  startOfToday,
  toMoney,
  type CurrentUser,
  type DashboardSummary
} from "./dashboard.shared";
import { fetchDashboardSummaryData } from "./dashboard.queries";

export type { CurrentUser, DashboardSummary } from "./dashboard.shared";

export async function getDashboardSummary(
  user: CurrentUser
): Promise<DashboardSummary> {
  const todayStart = startOfToday();
  const isAdmin = user.role === Role.ADMIN;

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
    todayShrinkageAggregate,
    recentSales
  } = await fetchDashboardSummaryData({
    isAdmin,
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

import { Role } from "@prisma/client";

import { getProductStocks } from "../inventory/inventory.service";
import {
  buildLowStockItems,
  calculateExpectedCash,
  mapCashRegisterSessions,
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

  const cashRegisterScopeWhere = isAdmin
    ? {}
    : {
        cashierId: user.id
      };

  const {
    activeProducts,
    activeProductRows,
    groupedUsers,
    todaySalesAggregate,
    cashRegisterSessions,
    recentSales
  } = await fetchDashboardSummaryData({
    isAdmin,
    todayStart,
    salesScopeWhere,
    cashRegisterScopeWhere
  });
  const stocks = await getProductStocks(
    activeProductRows.map((product) => product.id)
  );
  const lowStock = buildLowStockItems(activeProductRows, stocks);
  const users = mapUserCounts(groupedUsers, isAdmin);
  const cashRegister = mapCashRegisterSessions(cashRegisterSessions);
  const todaySalesCount = todaySalesAggregate._count._all;
  const todaySalesTotal = toMoney(todaySalesAggregate._sum.total);

  return {
    role: user.role,
    generatedAt: new Date(),
    userSummary: users,
    productSummary: {
      active: activeProducts,
      ...lowStock
    },
    salesToday: {
      scope: isAdmin ? "global" : "cashier",
      count: todaySalesCount,
      total: todaySalesTotal,
      averageTicket: toMoney(todaySalesAggregate._avg.total)
    },
    cashRegister: {
      scope: isAdmin ? "global" : "cashier",
      ...cashRegister
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
  calculateExpectedCash,
  mapUserCounts
};

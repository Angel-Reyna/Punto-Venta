import { CashRegisterStatus, Role, SaleStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { getProductStocks } from "../inventory/inventory.service";
import {
  buildLowStockItems,
  calculateExpectedCash,
  mapCashRegisterSessions,
  mapRecentSales,
  mapUserCounts
} from "./dashboard.mappers";
import {
  RECENT_SALES_LIMIT,
  startOfToday,
  toMoney,
  type CurrentUser,
  type DashboardSummary
} from "./dashboard.shared";

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

  const [
    activeProducts,
    activeProductRows,
    groupedUsers,
    todaySalesAggregate,
    cashRegisterSessions,
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
      where: {
        ...salesScopeWhere,
        status: SaleStatus.COMPLETED,
        createdAt: {
          gte: todayStart
        }
      },
      _count: {
        _all: true
      },
      _sum: {
        total: true
      },
      _avg: {
        total: true
      }
    }),

    prisma.cashRegisterSession.findMany({
      where: {
        ...cashRegisterScopeWhere,
        status: CashRegisterStatus.OPEN
      },
      select: {
        id: true,
        cashierId: true,
        openedAt: true,
        cashier: {
          select: {
            name: true
          }
        },
        movements: {
          select: {
            type: true,
            amount: true
          }
        }
      },
      orderBy: {
        openedAt: "desc"
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

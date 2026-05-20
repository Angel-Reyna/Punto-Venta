import {
  CashMovementType,
  CashRegisterStatus,
  Prisma,
  Role,
  SaleStatus
} from "@prisma/client";

import { prisma } from "../../config/prisma";
import { getProductStocks } from "../inventory/inventory.service";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

type StockSeverity = "warning" | "critical";

type DashboardProductStockItem = {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  severity: StockSeverity;
};

type DashboardRecentSale = {
  id: string;
  folio: string;
  status: SaleStatus;
  total: number;
  createdAt: Date;
  cashier: {
    id: string;
    name: string;
    email: string;
  };
};

type DashboardCashRegisterSession = {
  id: string;
  cashierId: string;
  cashierName: string;
  openedAt: Date;
  expectedCash: number;
};

export type DashboardSummary = {
  role: Role;
  generatedAt: Date;
  userSummary: {
    totalActive: number;
    activeAdmins: number;
    activeCashiers: number;
  };
  productSummary: {
    active: number;
    lowStockTotal: number;
    outOfStockTotal: number;
    lowStockItems: DashboardProductStockItem[];
  };
  salesToday: {
    scope: "global" | "cashier";
    count: number;
    total: number;
    averageTicket: number;
  };
  cashRegister: {
    scope: "global" | "cashier";
    hasOpenRegister: boolean;
    openSessions: number;
    currentBalance: number;
    sessions: DashboardCashRegisterSession[];
  };
  recentSales: DashboardRecentSale[];

  /**
   * Backward-compatible fields consumed by the current web dashboard.
   * They should be removed only after all clients use the nested contract.
   */
  products: number;
  lowStock: number;
  users: number;
  todaySalesCount: number;
  todaySalesTotal: number;
};

const LOW_STOCK_ITEMS_LIMIT = 8;
const CASH_REGISTER_SESSIONS_LIMIT = 5;
const RECENT_SALES_LIMIT = 8;

function startOfToday() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return todayStart;
}

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function toMoney(value: Prisma.Decimal | number | null | undefined) {
  return roundMoney(Number(value ?? 0));
}

function signedCashMovementAmount(type: CashMovementType, amount: number) {
  switch (type) {
    case CashMovementType.OPENING:
    case CashMovementType.CASH_IN:
    case CashMovementType.SALE_CASH:
      return amount;
    case CashMovementType.CASH_OUT:
    case CashMovementType.RETURN_CASH:
      return -amount;
    default:
      return 0;
  }
}

function calculateExpectedCash(
  movements: Array<{
    type: CashMovementType;
    amount: Prisma.Decimal | number;
  }>
) {
  return roundMoney(
    movements.reduce(
      (sum, movement) =>
        sum + signedCashMovementAmount(movement.type, Number(movement.amount)),
      0
    )
  );
}

function buildLowStockItems(
  products: Array<{
    id: string;
    sku: string;
    name: string;
    minStock: number;
  }>,
  stocks: Map<string, number>
) {
  const lowStockItems = products
    .map((product) => {
      const currentStock = stocks.get(product.id) ?? 0;

      if (currentStock > product.minStock) {
        return null;
      }

      return {
        id: product.id,
        sku: product.sku,
        name: product.name,
        currentStock,
        minStock: product.minStock,
        severity: currentStock <= 0 ? "critical" : "warning"
      } satisfies DashboardProductStockItem;
    })
    .filter((item): item is DashboardProductStockItem => item !== null)
    .sort((left, right) => {
      const severityDiff =
        (left.severity === "critical" ? 0 : 1) -
        (right.severity === "critical" ? 0 : 1);

      if (severityDiff !== 0) {
        return severityDiff;
      }

      const deficitDiff =
        right.minStock - right.currentStock - (left.minStock - left.currentStock);

      if (deficitDiff !== 0) {
        return deficitDiff;
      }

      return left.name.localeCompare(right.name, "es");
    });

  return {
    lowStockTotal: lowStockItems.length,
    outOfStockTotal: lowStockItems.filter((item) => item.severity === "critical")
      .length,
    lowStockItems: lowStockItems.slice(0, LOW_STOCK_ITEMS_LIMIT)
  };
}

function mapUserCounts(
  groupedUsers: Array<{
    role: Role;
    _count: {
      _all: number;
    };
  }>,
  canSeeUsers: boolean
) {
  if (!canSeeUsers) {
    return {
      totalActive: 0,
      activeAdmins: 0,
      activeCashiers: 0
    };
  }

  const counts = new Map<Role, number>(
    groupedUsers.map((group) => [group.role, group._count._all])
  );
  const activeAdmins = counts.get(Role.ADMIN) ?? 0;
  const activeCashiers = counts.get(Role.CASHIER) ?? 0;

  return {
    totalActive: activeAdmins + activeCashiers,
    activeAdmins,
    activeCashiers
  };
}

function mapCashRegisterSessions(
  sessions: Array<{
    id: string;
    cashierId: string;
    openedAt: Date;
    cashier: {
      name: string;
    };
    movements: Array<{
      type: CashMovementType;
      amount: Prisma.Decimal | number;
    }>;
  }>
) {
  const mappedSessions = sessions
    .map((session) => ({
      id: session.id,
      cashierId: session.cashierId,
      cashierName: session.cashier.name,
      openedAt: session.openedAt,
      expectedCash: calculateExpectedCash(session.movements)
    }))
    .sort((left, right) => right.openedAt.getTime() - left.openedAt.getTime());

  const currentBalance = roundMoney(
    mappedSessions.reduce((sum, session) => sum + session.expectedCash, 0)
  );

  return {
    hasOpenRegister: mappedSessions.length > 0,
    openSessions: mappedSessions.length,
    currentBalance,
    sessions: mappedSessions.slice(0, CASH_REGISTER_SESSIONS_LIMIT)
  };
}

function mapRecentSales(
  sales: Array<{
    id: string;
    folio: string;
    status: SaleStatus;
    total: Prisma.Decimal | number;
    createdAt: Date;
    cashier: {
      id: string;
      name: string;
      email: string;
    };
  }>): DashboardRecentSale[] {
  return sales.map((sale) => ({
    id: sale.id,
    folio: sale.folio,
    status: sale.status,
    total: toMoney(sale.total),
    createdAt: sale.createdAt,
    cashier: sale.cashier
  }));
}

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

import { CashMovementType, Prisma, Role, SaleStatus } from "@prisma/client";

import {
  CASH_REGISTER_SESSIONS_LIMIT,
  LOW_STOCK_ITEMS_LIMIT,
  type DashboardProductStockItem,
  type DashboardRecentSale,
  roundMoney,
  toMoney
} from "./dashboard.shared";

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

export function calculateExpectedCash(
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

export function buildLowStockItems(
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

export function mapUserCounts(
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

export function mapCashRegisterSessions(
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

export function mapRecentSales(
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
  }>
): DashboardRecentSale[] {
  return sales.map((sale) => ({
    id: sale.id,
    folio: sale.folio,
    status: sale.status,
    total: toMoney(sale.total),
    createdAt: sale.createdAt,
    cashier: sale.cashier
  }));
}

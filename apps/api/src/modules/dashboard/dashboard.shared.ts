import { Prisma, Role, SaleStatus } from "@prisma/client";

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

export type StockSeverity = "warning" | "critical";

export type DashboardProductStockItem = {
  id: string;
  sku: string;
  name: string;
  currentStock: number;
  minStock: number;
  severity: StockSeverity;
};

export type DashboardRecentSale = {
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

export type DashboardCashRegisterSession = {
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

export const LOW_STOCK_ITEMS_LIMIT = 8;
export const CASH_REGISTER_SESSIONS_LIMIT = 5;
export const RECENT_SALES_LIMIT = 8;

export function startOfToday() {
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  return todayStart;
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toMoney(value: Prisma.Decimal | number | null | undefined) {
  return roundMoney(Number(value ?? 0));
}

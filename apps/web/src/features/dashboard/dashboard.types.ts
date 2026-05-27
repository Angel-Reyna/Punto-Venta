import { type ReactNode } from "react";

export type StockSeverity = "warning" | "critical";
export type SaleStatus = "COMPLETED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "REFUNDED";

export type DashboardLowStockItem = {
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
  createdAt: string;
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
  openedAt: string;
  expectedCash: number;
};

export type DashboardMetrics = {
  role: "ADMIN" | "CASHIER";
  generatedAt: string;
  userSummary: {
    totalActive: number;
    activeAdmins: number;
    activeCashiers: number;
  };
  productSummary: {
    active: number;
    lowStockTotal: number;
    outOfStockTotal: number;
    lowStockItems: DashboardLowStockItem[];
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
};

export type DashboardQuickAction = {
  label: string;
  description: string;
  to: string;
  visible: boolean;
  primary: boolean;
};

export type MetricTone = "default" | "info" | "success" | "warning" | "critical";

export type MetricCardProps = {
  title: string;
  value: ReactNode;
  description: string;
  icon: ReactNode;
  to?: string;
  tone?: MetricTone;
  footer?: ReactNode;
};

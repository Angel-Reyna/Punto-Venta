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

export type DashboardSalesPeriod = {
  count: number;
  total: number;
  averageTicket: number;
};

export type DashboardSalesDay = {
  date: string;
  label?: string;
  count: number;
  total: number;
};

export type DashboardSalesPeriodComparison = {
  current: DashboardSalesPeriod;
  previous: DashboardSalesPeriod;
  totalChangePercent: number;
  daily?: DashboardSalesDay[];
};

export type DashboardSalesOutlook = {
  last7Days: DashboardSalesPeriodComparison;
  currentMonth: DashboardSalesPeriodComparison;
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
    shrinkageUnitsToday: number;
    shrinkageCostToday: number;
    lowStockItems: DashboardLowStockItem[];
  };
  salesToday: {
    scope: "global" | "cashier";
    count: number;
    total: number;
    averageTicket: number;
  };
  salesOutlook: DashboardSalesOutlook;
  pendingAdjustmentRequestsTotal?: number;
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

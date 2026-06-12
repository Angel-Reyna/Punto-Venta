import { DEFAULT_LIST_PAGE_SIZE } from "../../api/contracts";
import { getJson } from "../../api/http";
import type { Sale } from "../sales/salesShared";
import type { DashboardMetrics, DashboardRecentSale, DashboardSalesDay } from "./dashboard.types";

type DashboardAdjustmentRequest = {
  status: "PENDING" | "APPROVED" | "REJECTED";
};

function toDateKey(date: Date) {
  return [date.getFullYear(), `${date.getMonth() + 1}`.padStart(2, "0"), `${date.getDate()}`.padStart(2, "0")].join("-");
}

function toSafeDate(value: string | null | undefined) {
  if (!value) return new Date();

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? new Date() : date;
}

function buildLastSevenSalesDays(metrics: DashboardMetrics, sales: Sale[]): DashboardSalesDay[] {
  const endDate = toSafeDate(metrics.generatedAt);
  endDate.setHours(12, 0, 0, 0);

  const formatter = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    weekday: "short",
  });

  const days = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - (6 - index));

    return {
      count: 0,
      date: toDateKey(date),
      label: formatter.format(date).replace(".", ""),
      total: 0,
    } satisfies DashboardSalesDay;
  });
  const dayMap = new Map(days.map((day) => [day.date, day]));

  for (const sale of sales) {
    const day = dayMap.get(toDateKey(toSafeDate(sale.createdAt)));

    if (!day || sale.status === "CANCELLED" || sale.status === "REFUNDED") {
      continue;
    }

    day.count += 1;
    day.total += Number(sale.total ?? 0);
  }

  const today = dayMap.get(toDateKey(endDate));
  if (today) {
    today.count = Math.max(today.count, metrics.salesToday.count ?? 0);
    today.total = Math.max(today.total, metrics.salesToday.total ?? 0);
  }

  return days;
}

function saleToDashboardRecentSale(sale: Sale): DashboardRecentSale {
  return {
    id: sale.id,
    folio: sale.folio,
    status: sale.status,
    total: Number(sale.total ?? 0),
    createdAt: sale.createdAt,
    cashier: sale.cashier ?? {
      id: "unknown",
      name: "Vendedor sin asignar",
      email: "",
    },
  };
}

async function fetchPendingAdjustmentRequestsTotal(role: DashboardMetrics["role"]) {
  if (role !== "ADMIN") return 0;

  try {
    const requests = await getJson<DashboardAdjustmentRequest[]>("/sales/adjustment-requests", {
      params: {
        page: 1,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
      },
    });

    return requests.filter((request) => request.status === "PENDING").length;
  } catch {
    return 0;
  }
}

async function fetchDashboardRecentSales() {
  try {
    return await getJson<Sale[]>("/sales", {
      params: {
        page: 1,
        pageSize: DEFAULT_LIST_PAGE_SIZE,
      },
    });
  } catch {
    return [];
  }
}

export async function fetchDashboardMetrics() {
  const metrics = await getJson<DashboardMetrics>("/dashboard");
  const [pendingAdjustmentRequestsTotal, sales] = await Promise.all([
    fetchPendingAdjustmentRequestsTotal(metrics.role),
    fetchDashboardRecentSales(),
  ]);
  const daily = metrics.salesOutlook.last7Days.daily?.length === 7
    ? metrics.salesOutlook.last7Days.daily
    : buildLastSevenSalesDays(metrics, sales);
  const recentSales = sales.length
    ? sales.slice(0, 8).map(saleToDashboardRecentSale)
    : metrics.recentSales;

  return {
    ...metrics,
    pendingAdjustmentRequestsTotal,
    recentSales,
    salesOutlook: {
      ...metrics.salesOutlook,
      last7Days: {
        ...metrics.salesOutlook.last7Days,
        daily,
      },
    },
  };
}

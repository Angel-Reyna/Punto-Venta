import { type SaleStatus, type StockSeverity } from "./dashboard.types";

export function formatMoney(value: number | null | undefined) {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(Number(value ?? 0));
}

export function formatNumber(value: number | null | undefined) {
  return new Intl.NumberFormat("es-MX").format(Number(value ?? 0));
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return "—";
  }

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  }).format(new Date(value));
}

export function saleStatusLabel(status: SaleStatus) {
  switch (status) {
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    case "PARTIALLY_REFUNDED":
      return "Devolución parcial";
    case "REFUNDED":
      return "Devuelta";
    default:
      return status;
  }
}

export function saleStatusColor(status: SaleStatus) {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
    case "REFUNDED":
      return "error";
    case "PARTIALLY_REFUNDED":
      return "warning";
    default:
      return "default";
  }
}

export function stockSeverityLabel(severity: StockSeverity) {
  return severity === "critical" ? "Sin stock" : "Bajo mínimo";
}

export function stockSeverityColor(severity: StockSeverity) {
  return severity === "critical" ? "error" : "warning";
}

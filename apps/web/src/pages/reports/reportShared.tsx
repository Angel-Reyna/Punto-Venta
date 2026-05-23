import type { ReactNode } from "react";

import {
  Box,
  Card,
  CardContent,
  Divider,
  Typography,
  type ChipProps
} from "@mui/material";

import { LabelWithInfo } from "../../components/InfoTooltip";

export type MoneySummary = Record<string, number>;

export type ReportPerson = {
  id: string;
  name: string;
  email: string;
};

export type OperationsReport = {
  from: string;
  to: string;
  fromLabel?: string;
  toLabel?: string;
  sales: {
    count: number;
    byStatus: Record<string, number>;
    gross: number;
    refunded: number;
    net: number;
    paymentSummary: MoneySummary;
    bySeller: Array<{
      seller: ReportPerson;
      count: number;
      gross: number;
      refunded: number;
      net: number;
    }>;
    recent: Array<{
      id: string;
      folio: string;
      status: string;
      total: number;
      createdAt: string;
      cashier: ReportPerson;
      payments: Array<{
        id: string;
        method: string;
        amount: number;
      }>;
    }>;
  };
  returns: {
    count: number;
    total: number;
    byMethod: MoneySummary;
    latest: Array<{
      id: string;
      reason: string;
      refundMethod: string;
      refundTotal: number;
      createdAt: string;
      cashier?: ReportPerson;
    }>;
  };
  cashRegister: {
    sessions: Array<{
      id: string;
      status: "OPEN" | "CLOSED";
      openingAmount: number;
      expectedClosingAmount: number | null;
      closingAmount: number | null;
      difference: number | null;
      openedAt: string;
      closedAt: string | null;
      cashier?: ReportPerson;
    }>;
    movements: {
      count: number;
      summary: MoneySummary;
    };
  };
  topProducts: Array<{
    product: {
      id: string;
      sku: string | null;
      name: string;
    };
    quantity: number;
    total: number;
  }>;
};

export const REPORT_INFO_TEXT = {
  salesCount:
    "Número de ventas registradas en el periodo, incluyendo completadas, canceladas y ventas con devolución.",
  grossSales: "Total de ventas no canceladas antes de restar devoluciones.",
  refunds: "Monto reembolsado por devoluciones registradas dentro del periodo consultado.",
  netSales:
    "Venta bruta menos devoluciones. Es el total operativo más útil para revisar el resultado real del periodo.",
  sellerNet:
    "Venta neta del vendedor: ventas no canceladas menos devoluciones asociadas al periodo.",
  netUnits: "Unidades vendidas menos unidades devueltas dentro del periodo.",
  netSold: "Importe vendido menos devoluciones asociadas al producto dentro del periodo.",
  expectedCash:
    "Efectivo calculado por el sistema: apertura más entradas y ventas en efectivo, menos salidas y devoluciones en efectivo.",
  cashDifference:
    "Diferencia entre el efectivo contado al cerrar caja y el efectivo esperado por el sistema."
} as const;

export function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleString("es-MX");
}

export function statusLabel(status: string) {
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

export function statusColor(status: string): ChipProps["color"] {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "default";
    case "PARTIALLY_REFUNDED":
      return "warning";
    case "REFUNDED":
      return "error";
    default:
      return "default";
  }
}

export function paymentMethodLabel(method: string) {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "TRANSFER":
      return "Transferencia";
    case "MIXED":
      return "Mixto";
    default:
      return method;
  }
}

export function cashMovementLabel(type: string) {
  switch (type) {
    case "OPENING":
      return "Aperturas";
    case "CASH_IN":
      return "Entradas manuales";
    case "CASH_OUT":
      return "Salidas manuales";
    case "SALE_CASH":
      return "Ventas en efectivo";
    case "RETURN_CASH":
      return "Devoluciones en efectivo";
    default:
      return type;
  }
}

export function buildQuery(from: string, to: string) {
  return new URLSearchParams({
    from,
    to
  }).toString();
}

export function includesQuery(values: Array<string | number | null | undefined>, query: string) {
  const normalizedQuery = normalizeText(query);

  if (!normalizedQuery) return true;

  return values.some((value) => normalizeText(String(value ?? "")).includes(normalizedQuery));
}

function normalizeText(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function MetricCard({
  label,
  value,
  helper,
  info
}: {
  label: string;
  value: string | number;
  helper: string;
  info: string;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography color="text.secondary">
          <LabelWithInfo label={label} info={info} ariaLabel={info} />
        </Typography>
        <Typography variant="h5" fontWeight={800} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="body2" color="text.secondary" mt={0.5}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function ReportPanel({
  title,
  subtitle,
  children
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <Card component="section" aria-label={title} sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="h6" fontWeight={800}>
          {title}
        </Typography>
        {subtitle && (
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            {subtitle}
          </Typography>
        )}
        <Divider sx={{ my: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

export function EmptyText({ children }: { children: ReactNode }) {
  return <Typography color="text.secondary">{children}</Typography>;
}

export function DetailLine({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <Box>
      <Typography variant="caption" color="text.secondary" display="block">
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={700}>
        {value}
      </Typography>
    </Box>
  );
}

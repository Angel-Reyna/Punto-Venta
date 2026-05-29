import type { ReactNode } from "react";

import {
  Avatar,
  Box,
  Card,
  CardContent,
  Divider,
  Stack,
  Typography,
  type ChipProps
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { LabelWithInfo } from "../../components/InfoTooltip";
import { valuesIncludeSearchText } from "../../utils/text";

type MetricCardTone = "primary" | "success" | "warning" | "error" | "info";

export type MoneySummary = Record<string, number>;

export type ReportPerson = {
  id: string;
  name: string;
  email: string;
};

export type ProfitSummary = {
  grossCost: number;
  returnedCost: number;
  netCost: number;
  grossProfit: number;
  returnedProfit: number;
  netProfit: number;
  marginPercent: number;
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
    profit: ProfitSummary;
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
    cost: number;
    grossProfit: number;
  }>;
};

export const REPORT_INFO_TEXT = {
  salesCount:
    "Número de ventas registradas en el periodo, incluyendo completadas, canceladas y ventas con devolución.",
  grossSales: "Total de ventas no canceladas antes de restar devoluciones.",
  refunds: "Monto reembolsado por devoluciones registradas dentro del periodo consultado.",
  netSales:
    "Venta bruta menos devoluciones. Es el total operativo más útil para revisar el resultado real del periodo.",
  netCost:
    "Costo histórico neto: costo al momento de venta menos costo asociado a devoluciones del periodo.",
  grossProfit:
    "Utilidad bruta neta calculada con el costo congelado al momento de vender, no con el costo actual del producto.",
  marginPercent:
    "Margen bruto del periodo: utilidad bruta neta dividida entre venta neta.",
  sellerNet:
    "Venta neta del vendedor: ventas no canceladas menos devoluciones asociadas al periodo.",
  netUnits: "Unidades vendidas menos unidades devueltas dentro del periodo.",
  netSold: "Importe vendido menos devoluciones asociadas al producto dentro del periodo.",
  productProfit:
    "Utilidad del producto dentro del periodo: venta neta menos costo histórico neto.",
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
  return valuesIncludeSearchText(values, query);
}

export function MetricCard({
  label,
  value,
  helper,
  info,
  icon,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  helper: string;
  info: string;
  icon?: ReactNode;
  tone?: MetricCardTone;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.18),
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.1)} 0%, ${alpha(
            theme.palette.background.paper,
            0.96
          )} 58%)`
      }}
    >
      <CardContent>
        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={2}>
          <Box sx={{ minWidth: 0 }}>
            <Typography color="text.secondary">
              <LabelWithInfo label={label} info={info} ariaLabel={info} />
            </Typography>
            <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
              {value}
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={0.5}>
              {helper}
            </Typography>
          </Box>

          {icon && (
            <Avatar
              sx={{
                bgcolor: (theme) => alpha(theme.palette[tone].main, 0.12),
                color: (theme) => theme.palette[tone].main,
                width: 44,
                height: 44
              }}
            >
              {icon}
            </Avatar>
          )}
        </Stack>
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
    <Card
      component="section"
      aria-label={title}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)"
      }}
    >
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

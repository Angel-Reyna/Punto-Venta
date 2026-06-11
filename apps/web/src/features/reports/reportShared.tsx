import type { ReactNode } from "react";

import {
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
  shrinkageCost?: number;
  operatingProfit?: number;
  marginPercent: number;
  operatingMarginPercent?: number;
};

export type OperationsReport = {
  from: string;
  to: string;
  fromLabel?: string;
  toLabel?: string;
  sales: {
    count: number;
    byStatus: Record<string, number>;
    daily?: Array<{
      date: string;
      count: number;
      gross: number;
      refunded: number;
      net: number;
      units: number;
    }>;
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
  inventory?: {
    movements: {
      count: number;
      unitsIn: number;
      unitsOut: number;
      byType: Record<string, number>;
      byReasonType: Record<string, number>;
      latest: Array<{
        id: string;
        type: string;
        reasonType: string;
        reason: string | null;
        quantity: number;
        unitCostAtMovement: number | null;
        costAmount: number | null;
        product: {
          id: string | null;
          sku: string;
          name: string;
        };
        warehouse: {
          id: string;
          name: string;
        } | null;
        createdAt: string;
      }>;
    };
    shrinkage: {
      totalUnits: number;
      totalCost: number;
      byProduct: Array<{
        product: {
          id: string;
          sku: string | null;
          name: string;
        };
        quantity: number;
        cost: number;
      }>;
      byWarehouse: Array<{
        warehouse: {
          id: string | null;
          name: string;
        };
        quantity: number;
        cost: number;
      }>;
      latest: Array<{
        id: string;
        type: string;
        reasonType: string;
        reason: string | null;
        quantity: number;
        unitCostAtMovement: number | null;
        costAmount: number | null;
        product: {
          id: string | null;
          sku: string;
          name: string;
        };
        warehouse: {
          id: string;
          name: string;
        } | null;
        createdAt: string;
      }>;
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
    "Utilidad bruta antes de merma: venta neta menos costo histórico neto de los productos vendidos.",
  operatingProfit:
    "Utilidad operativa estimada: utilidad bruta menos la merma por caducidad registrada en el periodo.",
  marginPercent:
    "Margen bruto del periodo: utilidad bruta antes de merma dividida entre venta neta.",
  operatingMarginPercent:
    "Margen operativo estimado: utilidad operativa estimada dividida entre venta neta.",
  sellerNet:
    "Venta neta del vendedor: ventas no canceladas menos devoluciones asociadas al periodo.",
  netUnits: "Unidades vendidas menos unidades devueltas dentro del periodo.",
  netSold: "Importe vendido menos devoluciones asociadas al producto dentro del periodo.",
  productProfit:
    "Utilidad del producto dentro del periodo: venta neta menos costo histórico neto.",
  shrinkage:
    "Costo estimado de las salidas de inventario marcadas como caducidad dentro del periodo consultado. Se resta de la utilidad operativa estimada."
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
  testId,
  tone = "primary"
}: {
  label: string;
  value: string | number;
  helper: string;
  info: string;
  icon?: ReactNode;
  testId?: string;
  tone?: MetricCardTone;
}) {
  return (
    <Card
      data-testid={testId}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.18),
        background: (theme) =>
          `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.1)} 0%, ${alpha(
            theme.palette.background.paper,
            0.96
          )} 58%)`,
        overflow: "hidden",
        position: "relative"
      }}
    >
      {icon && (
        <Box
          aria-hidden="true"
          sx={{
            bottom: -26,
            color: (theme) => alpha(theme.palette[tone].main, 0.15),
            display: "inline-flex",
            position: "absolute",
            right: -18,
            transform: "rotate(-8deg)",
            "& svg": {
              fontSize: { xs: 96, md: 112 }
            }
          }}
        >
          {icon}
        </Box>
      )}

      <CardContent sx={{ p: { xs: 2, md: 2.5 }, position: "relative", zIndex: 1 }}>
        <Box sx={{ minWidth: 0, pr: { xs: 5, md: 6 } }}>
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
        boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)",
        overflow: "hidden"
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6" fontWeight={800}>
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
        </Stack>
        <Divider sx={{ my: 2 }} />
        {children}
      </CardContent>
    </Card>
  );
}

export function EmptyText({ children }: { children: ReactNode }) {
  return (
    <Typography color="text.secondary" sx={{ py: 1 }}>
      {children}
    </Typography>
  );
}

export function DetailLine({
  label,
  value
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <Box
      sx={{
        minWidth: 0,
        borderRadius: 1.5,
        bgcolor: (theme) => alpha(theme.palette.action.hover, 0.45),
        p: 1
      }}
    >
      <Typography variant="caption" color="text.secondary" display="block" fontWeight={700}>
        {label}
      </Typography>
      <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
        {value}
      </Typography>
    </Box>
  );
}

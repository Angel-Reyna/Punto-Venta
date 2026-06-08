import { Grid } from "@mui/material";

import {
  MetricCard,
  REPORT_INFO_TEXT,
  formatMoney,
  type OperationsReport
} from "./reportShared";

export function ReportsSummaryGrid({ data }: { data: OperationsReport }) {
  const shrinkageCost = data.inventory?.shrinkage.totalCost ?? data.sales.profit.shrinkageCost ?? 0;
  const operatingProfit = data.sales.profit.operatingProfit ?? data.sales.profit.netProfit - shrinkageCost;
  const operatingMarginPercent = data.sales.profit.operatingMarginPercent ?? (
    data.sales.net <= 0 ? 0 : (operatingProfit / data.sales.net) * 100
  );

  const summaryCards = [
    {
      id: "sales-count",
      label: "Ventas registradas",
      value: data.sales.count,
      helper: "Incluye completadas, canceladas y con devolución.",
      info: REPORT_INFO_TEXT.salesCount,
      tone: "primary" as const
    },
    {
      id: "gross-sales",
      label: "Venta bruta",
      value: formatMoney(data.sales.gross),
      helper: "Ventas no canceladas antes de devoluciones.",
      info: REPORT_INFO_TEXT.grossSales,
      tone: "success" as const
    },
    {
      id: "refunds",
      label: "Devoluciones",
      value: formatMoney(data.sales.refunded),
      helper: "Reembolsos registrados dentro del periodo.",
      info: REPORT_INFO_TEXT.refunds,
      tone: "warning" as const
    },
    {
      id: "net-sales",
      label: "Venta neta",
      value: formatMoney(data.sales.net),
      helper: "Venta bruta menos devoluciones.",
      info: REPORT_INFO_TEXT.netSales,
      tone: "info" as const
    },
    {
      id: "shrinkage",
      label: "Merma por caducidad",
      value: formatMoney(data.inventory?.shrinkage.totalCost ?? 0),
      helper: `${data.inventory?.shrinkage.totalUnits ?? 0} unidades dadas de baja.`,
      info: REPORT_INFO_TEXT.shrinkage,
      tone: "error" as const
    },
    {
      id: "net-cost",
      label: "Costo neto",
      value: formatMoney(data.sales.profit.netCost),
      helper: "Costo histórico neto del periodo.",
      info: REPORT_INFO_TEXT.netCost,
      tone: "warning" as const
    },
    {
      id: "profit-before-shrinkage",
      label: "Utilidad antes de merma",
      value: formatMoney(data.sales.profit.netProfit),
      helper: "Venta neta menos costo histórico neto.",
      info: REPORT_INFO_TEXT.grossProfit,
      tone: "success" as const
    },
    {
      id: "operating-profit",
      label: "Utilidad operativa",
      value: formatMoney(operatingProfit),
      helper: "Utilidad antes de merma menos caducidad.",
      info: REPORT_INFO_TEXT.operatingProfit,
      tone: operatingProfit < 0 ? "error" as const : "success" as const
    },
    {
      id: "gross-margin",
      label: "Margen bruto",
      value: `${data.sales.profit.marginPercent.toFixed(2)}%`,
      helper: "Utilidad antes de merma sobre venta neta.",
      info: REPORT_INFO_TEXT.marginPercent,
      tone: "primary" as const
    },
    {
      id: "operating-margin",
      label: "Margen operativo",
      value: `${operatingMarginPercent.toFixed(2)}%`,
      helper: "Utilidad operativa sobre venta neta.",
      info: REPORT_INFO_TEXT.operatingMarginPercent,
      tone: operatingMarginPercent < 0 ? "error" as const : "primary" as const
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {summaryCards.map((card) => (
        <Grid key={card.label} item xs={12} sm={6} lg={3}>
          <MetricCard {...card} testId={`reports-metric-${card.id}`} />
        </Grid>
      ))}
    </Grid>
  );
}

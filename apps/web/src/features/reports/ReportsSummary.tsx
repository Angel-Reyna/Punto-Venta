import { Grid } from "@mui/material";

import {
  MetricCard,
  REPORT_INFO_TEXT,
  formatMoney,
  type OperationsReport
} from "./reportShared";

export function ReportsSummaryGrid({ data }: { data: OperationsReport }) {
  const summaryCards = [
    {
      label: "Ventas registradas",
      value: data.sales.count,
      helper: "Incluye completadas, canceladas y con devolución.",
      info: REPORT_INFO_TEXT.salesCount,
      tone: "primary" as const
    },
    {
      label: "Venta bruta",
      value: formatMoney(data.sales.gross),
      helper: "Ventas no canceladas antes de devoluciones.",
      info: REPORT_INFO_TEXT.grossSales,
      tone: "success" as const
    },
    {
      label: "Devoluciones",
      value: formatMoney(data.sales.refunded),
      helper: "Reembolsos registrados dentro del periodo.",
      info: REPORT_INFO_TEXT.refunds,
      tone: "warning" as const
    },
    {
      label: "Venta neta",
      value: formatMoney(data.sales.net),
      helper: "Venta bruta menos devoluciones.",
      info: REPORT_INFO_TEXT.netSales,
      tone: "info" as const
    },
    {
      label: "Costo neto",
      value: formatMoney(data.sales.profit.netCost),
      helper: "Costo histórico neto del periodo.",
      info: REPORT_INFO_TEXT.netCost,
      tone: "warning" as const
    },
    {
      label: "Utilidad bruta",
      value: formatMoney(data.sales.profit.netProfit),
      helper: "Venta neta menos costo histórico neto.",
      info: REPORT_INFO_TEXT.grossProfit,
      tone: "success" as const
    },
    {
      label: "Margen bruto",
      value: `${data.sales.profit.marginPercent.toFixed(2)}%`,
      helper: "Utilidad bruta sobre venta neta.",
      info: REPORT_INFO_TEXT.marginPercent,
      tone: "primary" as const
    }
  ];

  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      {summaryCards.map((card) => (
        <Grid key={card.label} item xs={12} sm={6} lg={3}>
          <MetricCard {...card} />
        </Grid>
      ))}
    </Grid>
  );
}

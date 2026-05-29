import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import AttachMoneyOutlinedIcon from "@mui/icons-material/AttachMoneyOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import PointOfSaleOutlinedIcon from "@mui/icons-material/PointOfSaleOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
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
      icon: <ReceiptLongOutlinedIcon fontSize="small" />,
      tone: "primary" as const
    },
    {
      label: "Venta bruta",
      value: formatMoney(data.sales.gross),
      helper: "Ventas no canceladas antes de devoluciones.",
      info: REPORT_INFO_TEXT.grossSales,
      icon: <PointOfSaleOutlinedIcon fontSize="small" />,
      tone: "success" as const
    },
    {
      label: "Devoluciones",
      value: formatMoney(data.sales.refunded),
      helper: "Reembolsos registrados dentro del periodo.",
      info: REPORT_INFO_TEXT.refunds,
      icon: <AssignmentReturnOutlinedIcon fontSize="small" />,
      tone: "warning" as const
    },
    {
      label: "Venta neta",
      value: formatMoney(data.sales.net),
      helper: "Venta bruta menos devoluciones.",
      info: REPORT_INFO_TEXT.netSales,
      icon: <TrendingUpOutlinedIcon fontSize="small" />,
      tone: "info" as const
    },
    {
      label: "Costo neto",
      value: formatMoney(data.sales.profit.netCost),
      helper: "Costo histórico neto del periodo.",
      info: REPORT_INFO_TEXT.netCost,
      icon: <ReceiptLongOutlinedIcon fontSize="small" />,
      tone: "warning" as const
    },
    {
      label: "Utilidad bruta",
      value: formatMoney(data.sales.profit.netProfit),
      helper: "Venta neta menos costo histórico neto.",
      info: REPORT_INFO_TEXT.grossProfit,
      icon: <AttachMoneyOutlinedIcon fontSize="small" />,
      tone: "success" as const
    },
    {
      label: "Margen bruto",
      value: `${data.sales.profit.marginPercent.toFixed(2)}%`,
      helper: "Utilidad bruta sobre venta neta.",
      info: REPORT_INFO_TEXT.marginPercent,
      icon: <PercentOutlinedIcon fontSize="small" />,
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

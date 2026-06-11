import AssignmentReturnOutlinedIcon from "@mui/icons-material/AssignmentReturnOutlined";
import LocalAtmOutlinedIcon from "@mui/icons-material/LocalAtmOutlined";
import PercentOutlinedIcon from "@mui/icons-material/PercentOutlined";
import TrendingUpOutlinedIcon from "@mui/icons-material/TrendingUpOutlined";
import WarningAmberOutlinedIcon from "@mui/icons-material/WarningAmberOutlined";
import { Box, Card, CardContent, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import {
  MetricCard,
  REPORT_INFO_TEXT,
  formatMoney,
  type OperationsReport
} from "./reportShared";

export function ReportsSummaryGrid({ data }: { data: OperationsReport }) {
  const shrinkageCost = data.inventory?.shrinkage.totalCost ?? data.sales.profit.shrinkageCost ?? 0;
  const shrinkageUnits = data.inventory?.shrinkage.totalUnits ?? 0;
  const operatingProfit = data.sales.profit.operatingProfit ?? data.sales.profit.netProfit - shrinkageCost;
  const operatingMarginPercent = data.sales.profit.operatingMarginPercent ?? (
    data.sales.net <= 0 ? 0 : (operatingProfit / data.sales.net) * 100
  );

  const summaryCards = [
    {
      id: "net-sales",
      label: "Venta neta",
      value: formatMoney(data.sales.net),
      helper: "Venta bruta menos devoluciones.",
      info: REPORT_INFO_TEXT.netSales,
      icon: <LocalAtmOutlinedIcon />,
      tone: "info" as const
    },
    {
      id: "operating-profit",
      label: "Utilidad operativa",
      value: formatMoney(operatingProfit),
      helper: "Venta neta menos costo y merma.",
      info: REPORT_INFO_TEXT.operatingProfit,
      icon: <TrendingUpOutlinedIcon />,
      tone: operatingProfit < 0 ? "error" as const : "success" as const
    },
    {
      id: "shrinkage",
      label: "Merma por caducidad",
      value: formatMoney(shrinkageCost),
      helper: `${shrinkageUnits} unidades dadas de baja.`,
      info: REPORT_INFO_TEXT.shrinkage,
      icon: <WarningAmberOutlinedIcon />,
      tone: "error" as const
    },
    {
      id: "refunds",
      label: "Devoluciones",
      value: formatMoney(data.sales.refunded),
      helper: "Reembolsos registrados en el periodo.",
      info: REPORT_INFO_TEXT.refunds,
      icon: <AssignmentReturnOutlinedIcon />,
      tone: "warning" as const
    },
    {
      id: "operating-margin",
      label: "Margen operativo",
      value: `${operatingMarginPercent.toFixed(2)}%`,
      helper: "Utilidad operativa sobre venta neta.",
      info: REPORT_INFO_TEXT.operatingMarginPercent,
      icon: <PercentOutlinedIcon />,
      tone: operatingMarginPercent < 0 ? "error" as const : "primary" as const
    }
  ];

  const attentionItems = buildAttentionItems(data, operatingProfit, shrinkageUnits, shrinkageCost);

  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)",
        mb: 2
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={1.75}>
          <Box>
            <Typography variant="overline" color="text.secondary" fontWeight={900}>
              Resumen
            </Typography>
            <Typography variant="h6" fontWeight={900}>
              Lectura ejecutiva
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.35 }}>
              Métricas accionables para revisar resultado real, utilidad, pérdidas y devoluciones antes de entrar al detalle.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: {
                xs: "1fr",
                sm: "repeat(2, minmax(0, 1fr))",
                lg: "repeat(5, minmax(0, 1fr))"
              }
            }}
          >
            {summaryCards.map((card) => (
              <MetricCard key={card.id} {...card} testId={`reports-metric-${card.id}`} />
            ))}
          </Box>

          {attentionItems.length > 0 && (
            <Box
              sx={{
                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.08),
                border: "1px solid",
                borderColor: (theme) => alpha(theme.palette.warning.main, 0.24),
                borderRadius: 3,
                p: 1.4
              }}
            >
              <Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "flex-start", md: "center" }} spacing={1.25}>
                <Box
                  aria-hidden="true"
                  sx={{
                    alignItems: "center",
                    bgcolor: (theme) => alpha(theme.palette.warning.main, 0.14),
                    borderRadius: 2,
                    color: "warning.main",
                    display: "inline-flex",
                    height: 38,
                    justifyContent: "center",
                    width: 38,
                    flexShrink: 0
                  }}
                >
                  <WarningAmberOutlinedIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography fontWeight={900}>Atención del periodo</Typography>
                  <Typography color="text.secondary" variant="body2">
                    {attentionItems.join(" ")}
                  </Typography>
                </Box>
              </Stack>
            </Box>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

function buildAttentionItems(
  data: OperationsReport,
  operatingProfit: number,
  shrinkageUnits: number,
  shrinkageCost: number
) {
  const items: string[] = [];

  if (operatingProfit < 0) {
    items.push("La utilidad operativa está en negativo; revisa costo, devoluciones y merma.");
  }

  if (shrinkageUnits > 0 || shrinkageCost > 0) {
    items.push(`La merma suma ${formatMoney(shrinkageCost)} en ${shrinkageUnits} unidad(es).`);
  }

  if (data.sales.refunded > 0) {
    items.push(`Las devoluciones redujeron la venta en ${formatMoney(data.sales.refunded)}.`);
  }

  if (items.length === 0) {
    items.push("No hay señales críticas en el periodo consultado.");
  }

  return items;
}

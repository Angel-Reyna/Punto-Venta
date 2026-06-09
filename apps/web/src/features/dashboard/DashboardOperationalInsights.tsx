import { Box, Chip, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import InsightsIcon from "@mui/icons-material/Insights";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PaidIcon from "@mui/icons-material/Paid";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingFlatIcon from "@mui/icons-material/TrendingFlat";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";

import { SectionCard } from "../../components/layout";
import { formatMoney, formatNumber, formatPercent } from "./dashboard.formatters";
import type { DashboardMetrics, DashboardSalesPeriodComparison } from "./dashboard.types";

function getTrendTone(value: number) {
  if (value > 0) return "success";
  if (value < 0) return "warning";

  return "default";
}

function TrendIcon({ value }: { value: number }) {
  if (value > 0) return <TrendingUpIcon fontSize="small" />;
  if (value < 0) return <TrendingDownIcon fontSize="small" />;

  return <TrendingFlatIcon fontSize="small" />;
}

function TrendChip({ value }: { value: number }) {
  return (
    <Chip
      color={getTrendTone(value)}
      icon={<TrendIcon value={value} />}
      label={`${formatPercent(value, { showSign: true })}%`}
      size="small"
      variant={value === 0 ? "outlined" : "filled"}
    />
  );
}

function PeriodComparisonCard({
  comparison,
  description,
  testId,
  title,
}: {
  comparison: DashboardSalesPeriodComparison | null | undefined;
  description: string;
  testId: string;
  title: string;
}) {
  return (
    <Box
      data-testid={testId}
      sx={(theme) => ({
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.16),
        borderRadius: 3,
        p: 1.75,
        backgroundColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.12 : 0.05),
      })}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
          <Typography color="text.secondary" fontWeight={800} variant="body2">
            {title}
          </Typography>
          <TrendChip value={comparison?.totalChangePercent ?? 0} />
        </Stack>

        <Typography fontWeight={950} sx={{ fontSize: { xs: "1.65rem", sm: "1.9rem" }, lineHeight: 1 }}>
          {formatMoney(comparison?.current.total)}
        </Typography>

        <Typography color="text.secondary" variant="body2">
          {description}
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" label={`${formatNumber(comparison?.current.count)} ventas`} />
          <Chip size="small" label={`Ticket ${formatMoney(comparison?.current.averageTicket)}`} />
          <Chip size="small" label={`Antes ${formatMoney(comparison?.previous.total)}`} />
        </Stack>
      </Stack>
    </Box>
  );
}

function InventoryRiskCard({ metrics }: { metrics: DashboardMetrics | null }) {
  const activeProducts = metrics?.productSummary.active ?? 0;
  const lowStockTotal = metrics?.productSummary.lowStockTotal ?? 0;
  const outOfStockTotal = metrics?.productSummary.outOfStockTotal ?? 0;
  const riskPercent = activeProducts > 0 ? Math.round((lowStockTotal / activeProducts) * 1000) / 10 : 0;

  return (
    <Box
      data-testid="dashboard-inventory-risk-signal"
      sx={(theme) => ({
        border: "1px solid",
        borderColor: lowStockTotal > 0
          ? alpha(theme.palette.warning.main, theme.palette.mode === "dark" ? 0.34 : 0.24)
          : alpha(theme.palette.success.main, theme.palette.mode === "dark" ? 0.3 : 0.2),
        borderRadius: 3,
        p: 1.75,
      })}
    >
      <Stack spacing={1.25}>
        <Stack direction="row" spacing={1} alignItems="center">
          <InventoryIcon fontSize="small" />
          <Typography color="text.secondary" fontWeight={800} variant="body2">
            Riesgo de inventario
          </Typography>
        </Stack>

        <Typography fontWeight={950} sx={{ fontSize: { xs: "1.65rem", sm: "1.9rem" }, lineHeight: 1 }}>
          {formatPercent(riskPercent)}%
        </Typography>

        <Typography color="text.secondary" variant="body2">
          Proporción del catálogo activo que está en mínimo o sin stock.
        </Typography>

        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
          <Chip size="small" color={outOfStockTotal > 0 ? "error" : "default"} label={`Sin stock ${formatNumber(outOfStockTotal)}`} />
          <Chip size="small" color={lowStockTotal > 0 ? "warning" : "default"} label={`En riesgo ${formatNumber(lowStockTotal)}`} />
          <Chip size="small" label={`Catálogo ${formatNumber(activeProducts)}`} />
        </Stack>
      </Stack>
    </Box>
  );
}

export function DashboardOperationalInsights({
  isAdmin,
  metrics,
}: {
  isAdmin: boolean;
  metrics: DashboardMetrics | null;
}) {
  return (
    <Box data-testid="dashboard-operational-insights">
      <SectionCard
        title="Señales operativas"
        subtitle={
          isAdmin
            ? "Ritmo reciente, avance mensual e inventario en riesgo para priorizar decisiones."
            : "Tu ritmo reciente y avance del mes para seguir la jornada con contexto."
        }
        action={
          <Chip
            icon={<InsightsIcon />}
            label={metrics?.salesToday.scope === "cashier" ? "Vista de vendedor" : "Vista global"}
            size="small"
            variant="outlined"
          />
        }
      >
      <Grid container spacing={1.5}>
        <Grid item xs={12} md={isAdmin ? 4 : 6}>
          <PeriodComparisonCard
            comparison={metrics?.salesOutlook?.last7Days}
            description="Comparado contra los 7 días anteriores."
            testId="dashboard-sales-last-7-days-signal"
            title="Últimos 7 días"
          />
        </Grid>

        <Grid item xs={12} md={isAdmin ? 4 : 6}>
          <PeriodComparisonCard
            comparison={metrics?.salesOutlook?.currentMonth}
            description="Comparado contra el mes anterior completo."
            testId="dashboard-sales-current-month-signal"
            title="Mes actual"
          />
        </Grid>

        {isAdmin && (
          <Grid item xs={12} md={4}>
            <InventoryRiskCard metrics={metrics} />
          </Grid>
        )}
      </Grid>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mt: 1.5 }}
      >
        <Chip
          icon={<PaidIcon />}
          label={`Hoy ${formatMoney(metrics?.salesToday.total)}`}
          size="small"
          variant="outlined"
        />
        <Typography color="text.secondary" variant="caption">
          Usa estas señales para comparar tendencia reciente contra el historial inmediato, no solo el corte del día.
        </Typography>
      </Stack>
      </SectionCard>
    </Box>
  );
}

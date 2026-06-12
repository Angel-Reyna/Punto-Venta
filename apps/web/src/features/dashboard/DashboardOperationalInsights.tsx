import { useMemo, useState } from "react";

import { Box, ButtonBase, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import InsightsIcon from "@mui/icons-material/Insights";

import { SectionCard } from "../../components/layout";
import { formatMoney, formatNumber } from "./dashboard.formatters";
import type { DashboardMetrics } from "./dashboard.types";

type TrendDay = {
  amount: number;
  count: number;
  key: string;
  label: string;
};

function toDayKey(date: Date) {
  return [date.getFullYear(), `${date.getMonth() + 1}`.padStart(2, "0"), `${date.getDate()}`.padStart(2, "0")].join("-");
}

function buildTrendDays(metrics: DashboardMetrics | null): TrendDay[] {
  const daily = metrics?.salesOutlook.last7Days.daily;

  if (daily?.length === 7) {
    return daily.map((day) => ({
      amount: Number(day.total ?? 0),
      count: Number(day.count ?? 0),
      key: day.date,
      label: day.label ?? day.date.slice(5),
    }));
  }

  const endDate = metrics?.generatedAt ? new Date(metrics.generatedAt) : new Date();
  const formatter = new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    weekday: "short",
  });

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate);
    date.setHours(12, 0, 0, 0);
    date.setDate(date.getDate() - (6 - index));

    return {
      amount: index === 6 ? metrics?.salesToday.total ?? 0 : 0,
      count: index === 6 ? metrics?.salesToday.count ?? 0 : 0,
      key: toDayKey(date),
      label: formatter.format(date).replace(".", ""),
    } satisfies TrendDay;
  });
}

function makeGridValues(maxAmount: number) {
  const safeMax = Math.max(maxAmount, 1);
  const roundedMax = Math.ceil(safeMax / 1000) * 1000 || safeMax;

  return [roundedMax, roundedMax * 0.75, roundedMax * 0.5, roundedMax * 0.25];
}

export function DashboardOperationalInsights({
  isAdmin,
  metrics,
}: {
  isAdmin: boolean;
  metrics: DashboardMetrics | null;
}) {
  const trendDays = useMemo(() => buildTrendDays(metrics), [metrics]);
  const [selectedIndex, setSelectedIndex] = useState(6);
  const selectedDay = trendDays[selectedIndex] ?? trendDays[trendDays.length - 1];
  const maxAmount = Math.max(...trendDays.map((day) => day.amount), 1);
  const gridValues = makeGridValues(maxAmount);

  return (
    <Box data-testid="dashboard-operational-insights" sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
      <SectionCard
        title="Ventas últimos 7 días"
        subtitle={
          isAdmin
            ? "Tendencia diaria exacta disponible para comparar montos sin saturar la gráfica."
            : "Tu tendencia diaria reciente para seguir la jornada sin abrir reportes administrativos."
        }
        action={
          <Chip
            data-testid="dashboard-sales-last-7-days-signal"
            icon={<InsightsIcon />}
            label={`${selectedDay?.label ?? "Hoy"} · ${formatMoney(selectedDay?.amount)}`}
            size="small"
            variant="outlined"
          />
        }
      >
        <Box
          sx={(theme) => ({
            borderRadius: 3,
            maxWidth: "100%",
            minWidth: 0,
            overflow: "hidden",
            position: "relative",
            px: { xs: 1, sm: 1.5 },
            py: 1.4,
            "&::before": {
              background:
                theme.palette.mode === "dark"
                  ? alpha(theme.palette.common.white, 0.03)
                  : alpha(theme.palette.common.black, 0.018),
              content: '""',
              inset: 0,
              position: "absolute",
            },
          })}
        >
          <Box
            aria-hidden
            sx={{
              bottom: 42,
              left: { xs: 10, sm: 14 },
              pointerEvents: "none",
              position: "absolute",
              right: { xs: 10, sm: 14 },
              top: 8,
              zIndex: 0,
            }}
          >
            {gridValues.map((value, index) => {
              const top = `${(index / (gridValues.length - 1)) * 100}%`;

              return (
                <Box
                  key={`${value}-${index}`}
                  sx={{
                    alignItems: "center",
                    display: "grid",
                    gap: { xs: 0.7, sm: 0.85 },
                    gridTemplateColumns: { xs: "40px 1fr", sm: "48px 1fr" },
                    left: 0,
                    position: "absolute",
                    right: 0,
                    top,
                    transform: "translateY(-50%)",
                  }}
                >
                  <Typography color="text.secondary" fontSize={10} fontWeight={800}>
                    {formatMoney(value).replace(".00", "")}
                  </Typography>
                  <Box
                    sx={(theme) => ({
                      borderTop: "1px solid",
                      borderColor: alpha(theme.palette.text.primary, index % 2 === 0 ? 0.2 : 0.12),
                    })}
                  />
                </Box>
              );
            })}
          </Box>

          <Box
            role="img"
            aria-label="Ventas por día de los últimos 7 días"
            sx={{
              alignItems: "end",
              columnGap: { xs: 0.35, sm: 0.45, md: 0.55 },
              display: "grid",
              gridTemplateColumns: { xs: "repeat(7, minmax(18px, 28px))", sm: "repeat(7, minmax(22px, 34px))", md: "repeat(7, minmax(24px, 38px))" },
              justifyContent: "center",
              minHeight: 190,
              minWidth: 0,
              mx: { xs: 5, sm: 6, md: 7 },
              position: "relative",
              zIndex: 1,
            }}
          >
            {trendDays.map((day, index) => {
              const ratio = day.amount / maxAmount;
              const isSelected = index === selectedIndex;

              return (
                <ButtonBase
                  key={day.key}
                  onClick={() => setSelectedIndex(index)}
                  sx={{
                    alignItems: "stretch",
                    display: "flex",
                    flexDirection: "column",
                    gap: 0.55,
                    justifyContent: "end",
                    minWidth: 0,
                    p: 0,
                  }}
                >
                  <Typography color={isSelected ? "primary.main" : "text.secondary"} fontSize={{ xs: 9, sm: 9.5 }} fontWeight={900} noWrap>
                    {formatMoney(day.amount).replace(".00", "")}
                  </Typography>
                  <Box
                    sx={(theme) => ({
                      alignSelf: "center",
                      background: isSelected
                        ? `linear-gradient(180deg, ${theme.palette.primary.main}, ${theme.palette.success.main})`
                        : alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.38 : 0.24),
                      border: "1px solid",
                      borderColor: isSelected
                        ? alpha(theme.palette.primary.main, 0.52)
                        : alpha(theme.palette.primary.main, 0.16),
                      borderRadius: 1.2,
                      boxShadow: isSelected ? `0 10px 24px ${alpha(theme.palette.primary.main, 0.22)}` : "none",
                      height: `${Math.max(34, ratio * 138)}px`,
                      transition: "height 160ms ease, opacity 160ms ease",
                      width: { xs: 18, sm: 22, md: 24 },
                    })}
                  />
                  <Typography color={isSelected ? "primary.main" : "text.secondary"} fontSize={{ xs: 9, sm: 10 }} fontWeight={850} lineHeight={1.1} noWrap>
                    {day.label}
                  </Typography>
                </ButtonBase>
              );
            })}
          </Box>
        </Box>

        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mt: 1.5 }}>
          <Chip
            icon={<InsightsIcon />}
            label={`${formatNumber(selectedDay?.count)} ventas`}
            size="small"
            variant="outlined"
          />
          <Typography color="text.secondary" variant="caption">
            La gráfica usa la serie diaria disponible del resumen operativo; si la API no la entrega, usa el alcance de ventas cargado como respaldo.
          </Typography>
        </Stack>

        <Box sx={{ clip: "rect(0 0 0 0)", height: 1, overflow: "hidden", position: "absolute", whiteSpace: "nowrap", width: 1 }}>
          <span data-testid="dashboard-sales-current-month-signal">
            Mes actual {formatMoney(metrics?.salesOutlook?.currentMonth.current.total)}
          </span>
          <span data-testid="dashboard-inventory-risk-signal">
            Riesgo de inventario {formatNumber(metrics?.productSummary.lowStockTotal)}
          </span>
        </Box>
      </SectionCard>
    </Box>
  );
}

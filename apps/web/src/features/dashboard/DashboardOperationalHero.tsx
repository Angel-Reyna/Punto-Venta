import { type ReactNode } from "react";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import DashboardCustomizeIcon from "@mui/icons-material/DashboardCustomize";
import RefreshIcon from "@mui/icons-material/Refresh";
import InsightsIcon from "@mui/icons-material/Insights";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import StorefrontIcon from "@mui/icons-material/Storefront";

import { formatNumber } from "./dashboard.formatters";
import type { DashboardMetrics } from "./dashboard.types";

function getHeroTone({
  hasCriticalStock,
  hasLowStock,
}: {
  hasCriticalStock: boolean;
  hasLowStock: boolean;
}) {
  if (hasCriticalStock) return "error" as const;
  if (hasLowStock) return "warning" as const;
  return "success" as const;
}

function SummaryPill({
  icon,
  label,
  value,
  tone = "primary",
}: {
  icon: ReactNode;
  label: string;
  value: string;
  tone?: "primary" | "success" | "warning" | "info" | "error";
}) {
  return (
    <Box
      sx={(theme) => ({
        alignItems: "center",
        backgroundColor: alpha(theme.palette[tone].main, theme.palette.mode === "dark" ? 0.13 : 0.06),
        border: "1px solid",
        borderColor: alpha(theme.palette[tone].main, theme.palette.mode === "dark" ? 0.32 : 0.18),
        borderRadius: 3,
        display: "flex",
        gap: 1,
        minWidth: 0,
        px: 1.25,
        py: 1.1,
      })}
    >
      <Box
        sx={(theme) => ({
          alignItems: "center",
          color: theme.palette[tone].main,
          display: "flex",
          flex: "0 0 auto",
        })}
      >
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography color="text.secondary" fontSize={12} fontWeight={850} noWrap>
          {label}
        </Typography>
        <Typography fontWeight={950} noWrap>
          {value}
        </Typography>
      </Box>
    </Box>
  );
}

export function DashboardOperationalHero({
  generatedAtLabel,
  hasCriticalStock,
  hasLowStock,
  isLoading,
  metrics,
  onRefresh,
}: {
  generatedAtLabel: string;
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  isLoading: boolean;
  metrics: DashboardMetrics | null;
  onRefresh: () => void;
}) {
  const heroTone = "primary" as const;
  const operationalTone = getHeroTone({ hasCriticalStock, hasLowStock });
  const operationalStateLabel = hasCriticalStock
    ? "Atención crítica"
    : hasLowStock
      ? "Reposición sugerida"
      : "Operación estable";
  const alertCount = (metrics?.productSummary.outOfStockTotal ?? 0) + (metrics?.productSummary.lowStockTotal ?? 0);

  return (
    <Box
      data-testid="dashboard-operational-hero"
      sx={(theme) => ({
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette[heroTone].dark, 0.42)}, ${alpha(
                theme.palette.background.paper,
                0.94,
              )})`
            : `linear-gradient(135deg, ${alpha(theme.palette[heroTone].light, 0.2)}, ${alpha(
                theme.palette.background.paper,
                0.98,
              )})`,
        border: "1px solid",
        borderColor: alpha(theme.palette[heroTone].main, theme.palette.mode === "dark" ? 0.34 : 0.18),
        borderRadius: 6,
        maxWidth: "100%",
        mb: 2.5,
        overflow: "hidden",
        overflowX: "hidden",
        p: { xs: 1.75, sm: 2, md: 2.6 },
        position: "relative",
      })}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          bottom: -32,
          color: alpha(theme.palette[heroTone].main, theme.palette.mode === "dark" ? 0.1 : 0.08),
          position: "absolute",
          right: { xs: -6, md: -18 },
          transform: "rotate(-8deg)",
        })}
      >
        <DashboardCustomizeIcon sx={{ fontSize: { xs: 120, md: 168 } }} />
      </Box>

      <Stack spacing={2.1} sx={{ maxWidth: "100%", minWidth: 0, position: "relative" }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2} useFlexGap>
          <Stack direction="row" spacing={1.4} sx={{ minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                alignItems: "center",
                bgcolor: alpha(theme.palette[heroTone].main, theme.palette.mode === "dark" ? 0.18 : 0.12),
                borderRadius: 3,
                color: theme.palette[heroTone].main,
                display: { xs: "none", sm: "flex" },
                height: 46,
                justifyContent: "center",
                width: 46,
              })}
            >
              <InsightsIcon />
            </Box>
            <Box sx={{ maxWidth: "100%", minWidth: 0 }}>
              <Typography color="primary.main" fontSize={12} fontWeight={900} letterSpacing={0.8} textTransform="uppercase">
                Inicio
              </Typography>
              <Typography component="h2" fontWeight={950} sx={{ fontSize: { xs: 28, md: 38 }, lineHeight: 1.02 }}>
                Centro operativo
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 760, mt: 0.75 }} variant="body2">
                Inicio concentra ventas del día, inventario que requiere atención, equipo activo y acciones directas sin depender de caja.
              </Typography>
            </Box>
          </Stack>

          <Stack alignItems={{ xs: "flex-start", md: "flex-end" }} spacing={1}>
            <Stack direction="row" flexWrap="wrap" gap={1} justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Chip color={operationalTone} label={operationalStateLabel} size="small" />
              <Chip label={metrics?.salesToday.scope === "cashier" ? "Vista de vendedor" : "Vista global"} size="small" variant="outlined" />
            </Stack>
            <Typography color="text.secondary" variant="caption">
              Última actualización: {generatedAtLabel}
            </Typography>
            <Button
              disabled={isLoading}
              onClick={onRefresh}
              size="small"
              startIcon={<RefreshIcon />}
              variant="contained"
              sx={{ alignSelf: { xs: "stretch", sm: "flex-end" } }}
            >
              Actualizar
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(3, minmax(0, 1fr))" },
            maxWidth: "100%",
            minWidth: 0,
            overflowX: "hidden",
          }}
        >
          <SummaryPill
            icon={<AdminPanelSettingsIcon fontSize="small" />}
            label="Administradores activos"
            tone="info"
            value={`${formatNumber(metrics?.userSummary.activeAdmins)} activos`}
          />
          <SummaryPill
            icon={<StorefrontIcon fontSize="small" />}
            label="Vendedores activos"
            tone="success"
            value={`${formatNumber(metrics?.userSummary.activeCashiers)} activos`}
          />
          <SummaryPill
            icon={<ReportProblemIcon fontSize="small" />}
            label="Estado general"
            tone={alertCount > 0 ? "warning" : "success"}
            value={alertCount > 0 ? `${formatNumber(alertCount)} alertas` : "Sin alertas"}
          />
        </Box>
      </Stack>
    </Box>
  );
}

import { type ElementType, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Link as RouterLink } from "react-router-dom";

import AssessmentIcon from "@mui/icons-material/Assessment";
import AssignmentTurnedInIcon from "@mui/icons-material/AssignmentTurnedIn";
import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import DeleteSweepIcon from "@mui/icons-material/DeleteSweep";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import PaidIcon from "@mui/icons-material/Paid";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import TimelineIcon from "@mui/icons-material/Timeline";
import TrendingDownIcon from "@mui/icons-material/TrendingDown";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import WarningIcon from "@mui/icons-material/WarningAmber";

import { DashboardEmptyPanel } from "./DashboardEmptyPanel";
import { DashboardPanelCard } from "./DashboardPanelCard";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  saleStatusColor,
  saleStatusLabel,
  stockSeverityColor,
  stockSeverityLabel,
} from "./dashboard.formatters";
import { type DashboardMetrics } from "./dashboard.types";

export function DashboardSkeleton() {
  return (
    <Grid container spacing={2.5}>
      {[1, 2, 3, 4, 5, 6].map((item) => (
        <Grid item xs={12} sm={6} lg={4} xl={2} key={item}>
          <Skeleton height={150} variant="rounded" sx={{ borderRadius: 4 }} />
        </Grid>
      ))}
    </Grid>
  );
}


type DashboardTone = "primary" | "success" | "warning" | "info" | "error";

type QuickAction = {
  description: string;
  icon: ElementType;
  label: string;
  tone: Exclude<DashboardTone, "error">;
  to: string;
  visible?: boolean;
};

function toneMain(theme: import("@mui/material/styles").Theme, tone: DashboardTone) {
  return theme.palette[tone].main;
}

type OperationalTone = "default" | "error" | "success" | "warning" | "info";

function operationalToneMain(theme: import("@mui/material/styles").Theme, tone: OperationalTone) {
  if (tone === "error") return theme.palette.error.main;
  if (tone === "success") return theme.palette.success.main;
  if (tone === "warning") return theme.palette.warning.main;
  if (tone === "info") return theme.palette.info.main;

  return theme.palette.text.secondary;
}

function DashboardActionCard({ action }: { action: QuickAction }) {
  const Icon = action.icon;

  return (
    <Box
      component={RouterLink}
      to={action.to}
      sx={(theme) => ({
        alignItems: "center",
        backgroundColor: alpha(toneMain(theme, action.tone), theme.palette.mode === "dark" ? 0.12 : 0.06),
        border: "1px solid",
        borderColor: alpha(toneMain(theme, action.tone), theme.palette.mode === "dark" ? 0.34 : 0.18),
        borderRadius: 3,
        color: "text.primary",
        display: "flex",
        gap: 1.2,
        minHeight: 76,
        p: 1.25,
        textDecoration: "none",
        transition: "transform 160ms ease, border-color 160ms ease, background-color 160ms ease",
        "&:hover": {
          backgroundColor: alpha(toneMain(theme, action.tone), theme.palette.mode === "dark" ? 0.18 : 0.09),
          borderColor: alpha(toneMain(theme, action.tone), 0.42),
          transform: "translateY(-1px)",
        },
      })}
    >
      <Box
        sx={(theme) => ({
          alignItems: "center",
          backgroundColor: alpha(toneMain(theme, action.tone), theme.palette.mode === "dark" ? 0.18 : 0.12),
          borderRadius: 2.5,
          color: toneMain(theme, action.tone),
          display: "flex",
          height: 42,
          justifyContent: "center",
          width: 42,
        })}
      >
        <Icon />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={900}>{action.label}</Typography>
        <Typography color="text.secondary" variant="body2" sx={{ lineHeight: 1.3 }}>
          {action.description}
        </Typography>
      </Box>
      <ArrowForwardIcon sx={{ color: "text.secondary", flexShrink: 0, ml: "auto" }} />
    </Box>
  );
}



type ExecutiveMetric = {
  action: string;
  description: string;
  icon: ElementType;
  label: string;
  tone: DashboardTone;
  to: string;
  value: string;
};

function DashboardExecutiveMetricCard({ metric }: { metric: ExecutiveMetric }) {
  const Icon = metric.icon;

  return (
    <Box
      component={RouterLink}
      to={metric.to}
      sx={(theme) => ({
        backgroundColor: alpha(toneMain(theme, metric.tone), theme.palette.mode === "dark" ? 0.1 : 0.04),
        border: "1px solid",
        borderColor: alpha(toneMain(theme, metric.tone), theme.palette.mode === "dark" ? 0.28 : 0.16),
        borderRadius: 5,
        color: "text.primary",
        display: "block",
        minHeight: 170,
        minWidth: 0,
        overflow: "hidden",
        p: 2,
        position: "relative",
        textDecoration: "none",
        transition: "transform 160ms ease, box-shadow 160ms ease, border-color 160ms ease",
        "&:hover": {
          borderColor: alpha(toneMain(theme, metric.tone), 0.44),
          boxShadow: theme.shadows[6],
          transform: "translateY(-2px)",
        },
      })}
    >
      <Box
        aria-hidden
        sx={(theme) => ({
          color: alpha(toneMain(theme, metric.tone), theme.palette.mode === "dark" ? 0.16 : 0.1),
          position: "absolute",
          right: 14,
          top: 10,
          transform: "rotate(-8deg)",
          "& svg": { fontSize: 92 },
        })}
      >
        <Icon />
      </Box>

      <Stack spacing={1.35} sx={{ minHeight: 130, minWidth: 0, position: "relative" }}>
        <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
          <Box
            sx={(theme) => ({
              alignItems: "center",
              bgcolor: alpha(toneMain(theme, metric.tone), theme.palette.mode === "dark" ? 0.18 : 0.1),
              borderRadius: 2.5,
              color: toneMain(theme, metric.tone),
              display: "flex",
              height: 38,
              justifyContent: "center",
              width: 38,
            })}
          >
            <Icon fontSize="small" />
          </Box>
          <Chip
            color={metric.tone === "error" ? "error" : metric.tone === "warning" ? "warning" : "default"}
            label={metric.action}
            size="small"
          />
        </Stack>

        <Box sx={{ minWidth: 0 }}>
          <Typography color="text.secondary" fontSize={12.5} fontWeight={850}>
            {metric.label}
          </Typography>
          <Typography fontWeight={950} sx={{ fontSize: { xs: 28, md: 32 }, lineHeight: 1, overflowWrap: "anywhere" }}>
            {metric.value}
          </Typography>
        </Box>

        <Typography color="text.secondary" variant="body2">
          {metric.description}
        </Typography>
      </Stack>
    </Box>
  );
}

function getStockAttentionDestination(metrics: DashboardMetrics | null) {
  const outOfStockTotal = metrics?.productSummary.outOfStockTotal ?? 0;

  return outOfStockTotal > 0
    ? "/inventory?view=stock&status=out"
    : "/inventory?view=stock&status=low";
}

export function DashboardExecutiveSummary({
  hasCriticalStock,
  hasLowStock,
  isAdmin,
  metrics,
  salesDestination,
}: {
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  isAdmin: boolean;
  metrics: DashboardMetrics | null;
  salesDestination: string;
}) {
  const stockTone: DashboardTone = hasCriticalStock ? "error" : hasLowStock ? "warning" : "warning";
  const pendingAdjustments = metrics?.pendingAdjustmentRequestsTotal ?? 0;
  const stockAttentionDestination = getStockAttentionDestination(metrics);
  const cards: ExecutiveMetric[] = [
    {
      action: isAdmin ? "Ver reportes" : "Ver ventas",
      description: isAdmin
        ? "Venta registrada hoy por todos los vendedores."
        : "Venta registrada hoy por ti.",
      icon: PaidIcon,
      label: "Ventas de hoy",
      tone: "success",
      to: isAdmin ? "/reports?preset=today&detail=historial" : salesDestination,
      value: formatMoney(metrics?.salesToday.total),
    },
    ...(isAdmin
      ? [
          {
            action: "Revisar ajuste",
            description: "Devolución o cancelación esperando autorización del admin.",
            icon: ReceiptLongIcon,
            label: "Ajuste pendiente",
            tone: pendingAdjustments > 0 ? "info" : "primary",
            to: "/sales?view=adjustments&status=PENDING",
            value: formatNumber(pendingAdjustments),
          },
        ] satisfies ExecutiveMetric[]
      : []),
    {
      action: hasCriticalStock || hasLowStock ? "Revisar inventario" : "Estable",
      description: "Productos en mínimo o agotados.",
      icon: WarningIcon,
      label: "Atención stock",
      tone: stockTone,
      to: stockAttentionDestination,
      value: formatNumber((metrics?.productSummary.lowStockTotal ?? 0) + (metrics?.productSummary.outOfStockTotal ?? 0)),
    },
    ...(isAdmin
      ? [
          {
            action: "Ver merma",
            description: "Pérdida registrada por caducidad o daños hoy.",
            icon: DeleteSweepIcon,
            label: "Merma hoy",
            tone: (metrics?.productSummary.shrinkageCostToday ?? 0) > 0 ? "error" : "success",
            to: "/inventory?view=movements&search=merma",
            value: formatMoney(metrics?.productSummary.shrinkageCostToday),
          },
        ] satisfies ExecutiveMetric[]
      : []),
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gap: 1.4,
        gridTemplateColumns: {
          xs: "minmax(0, 1fr)",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: `repeat(${Math.min(cards.length, 4)}, minmax(0, 1fr))`,
        },
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "hidden",
      }}
    >
      {cards.map((metric) => (
        <DashboardExecutiveMetricCard key={metric.label} metric={metric} />
      ))}
    </Box>
  );
}

export function DashboardQuickActions({ isAdmin, metrics }: { isAdmin: boolean; metrics: DashboardMetrics | null }) {
  const stockAttentionDestination = getStockAttentionDestination(metrics);
  const actions: QuickAction[] = [
    {
      description: "Registrar una venta con stock asignado.",
      icon: PointOfSaleIcon,
      label: "Ventas",
      tone: "success",
      to: "/sales",
    },
    {
      description: "Ver productos sin stock o debajo del mínimo.",
      icon: InventoryIcon,
      label: "Revisar inventario",
      tone: "warning",
      to: stockAttentionDestination,
    },
    {
      description: "Consultar ventas, utilidad, merma y devoluciones.",
      icon: TimelineIcon,
      label: "Abrir reportes",
      tone: "primary",
      to: "/reports?preset=today&detail=vendedores",
      visible: isAdmin,
    },
    {
      description: "Gestionar vendedores y administradores activos.",
      icon: PeopleAltIcon,
      label: "Ver usuarios",
      tone: "info",
      to: "/users",
      visible: isAdmin,
    },
  ];

  return (
    <DashboardPanelCard
      title="Qué hacer ahora"
      subtitle="Acciones directas desde Inicio. Cada tarjeta lleva al módulo donde se resuelve el pendiente."
    >
      <Box
        sx={{
          display: "grid",
          gap: 1.2,
          gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
        }}
      >
        {actions
          .filter((action) => action.visible !== false)
          .map((action) => <DashboardActionCard action={action} key={action.label} />)}
      </Box>
    </DashboardPanelCard>
  );
}

export function PendingOperationsPanel({
  hasCriticalStock,
  hasLowStock,
  metrics,
}: {
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  metrics: DashboardMetrics | null;
}) {
  const pendingAdjustments = metrics?.pendingAdjustmentRequestsTotal ?? 0;
  const items = [
    {
      action: "Reponer",
      detail: "Productos en o debajo del mínimo configurado.",
      icon: WarningIcon,
      label: "Stock bajo",
      to: "/inventory?view=stock&status=low",
      tone: hasLowStock ? "warning" : "default",
      value: `${formatNumber(metrics?.productSummary.lowStockTotal)} productos`,
    },
    {
      action: "Resolver",
      detail: "Productos agotados que pueden bloquear ventas.",
      icon: ReportProblemIcon,
      label: "Sin stock",
      to: "/inventory?view=stock&status=out",
      tone: hasCriticalStock ? "error" : "default",
      value: `${formatNumber(metrics?.productSummary.outOfStockTotal)} productos`,
    },
    {
      action: "Revisar",
      detail: "Solicitudes de devolución o cancelación pendientes de autorización.",
      icon: AssignmentTurnedInIcon,
      label: "Ajuste pendiente",
      to: "/sales?view=adjustments&status=PENDING",
      tone: pendingAdjustments > 0 ? "info" : "default",
      value: `${formatNumber(pendingAdjustments)} ${pendingAdjustments === 1 ? "solicitud" : "solicitudes"}`,
    },
  ] as const;

  return (
    <DashboardPanelCard
      title="Pendientes operativos"
      subtitle="Alertas priorizadas. Rojo significa bloqueo operativo; amarillo indica riesgo antes de quedarse sin producto."
    >
      <Stack spacing={1}>
        {items.map((item) => {
          const Icon = item.icon;

          return (
            <Box
              key={item.label}
              component={RouterLink}
              to={item.to}
              sx={(theme) => {
                const color = item.tone === "error"
                  ? theme.palette.error.main
                  : item.tone === "warning"
                    ? theme.palette.warning.main
                    : item.tone === "info"
                      ? theme.palette.info.main
                      : theme.palette.text.secondary;

                return {
                  backgroundColor: item.tone === "default" ? "transparent" : alpha(color, theme.palette.mode === "dark" ? 0.12 : 0.07),
                  border: "1px solid",
                  borderColor: item.tone === "default" ? theme.palette.divider : alpha(color, 0.46),
                  borderLeft: "4px solid",
                  borderLeftColor: item.tone === "default" ? theme.palette.divider : color,
                  borderRadius: 3,
                  color: "text.primary",
                  display: "block",
                  p: 1.25,
                  textDecoration: "none",
                  transition: "border-color 160ms ease, transform 160ms ease, background-color 160ms ease",
                  "&:hover": {
                    backgroundColor: alpha(color, theme.palette.mode === "dark" ? 0.16 : 0.1),
                    borderColor: alpha(color, 0.62),
                    transform: "translateY(-1px)",
                  },
                };
              }}
            >
              <Stack
                alignItems={{ xs: "flex-start", sm: "center" }}
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={1}
              >
                <Stack direction="row" spacing={1.1} sx={{ minWidth: 0 }}>
                  <Box
                    sx={(theme) => {
                      const color = operationalToneMain(theme, item.tone);

                      return {
                        alignItems: "center",
                        bgcolor: item.tone === "default" ? alpha(theme.palette.text.secondary, 0.1) : alpha(color, 0.18),
                        border: "1px solid",
                        borderColor: item.tone === "default" ? theme.palette.divider : alpha(color, 0.32),
                        borderRadius: 2.5,
                        color,
                        display: "flex",
                        flexShrink: 0,
                        height: 40,
                        justifyContent: "center",
                        width: 40,
                      };
                    }}
                  >
                    <Icon fontSize="small" />
                  </Box>
                  <Box sx={{ minWidth: 0 }}>
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Typography fontWeight={900}>{item.label}</Typography>
                      <Chip label={item.value} size="small" />
                    </Stack>
                    <Typography color="text.secondary" variant="body2">
                      {item.detail}
                    </Typography>
                  </Box>
                </Stack>
                <Box
                  component="span"
                  sx={(theme) => ({
                    border: "1px solid",
                    borderColor: alpha(theme.palette.primary.main, 0.36),
                    borderRadius: 2,
                    color: theme.palette.primary.main,
                    fontSize: 12,
                    fontWeight: 900,
                    px: 1.2,
                    py: 0.55,
                    whiteSpace: "nowrap",
                  })}
                >
                  {item.action}
                </Box>
              </Stack>
            </Box>
          );
        })}
      </Stack>
    </DashboardPanelCard>
  );
}

export function TeamOverviewPanel({ metrics }: { metrics: DashboardMetrics | null }) {
  const sellers = useMemo(() => {
    const rows = new Map<string, { count: number; name: string; total: number }>();

    metrics?.recentSales.forEach((sale) => {
      const key = sale.cashier.id;
      const current = rows.get(key) ?? { count: 0, name: sale.cashier.name, total: 0 };
      current.count += 1;
      current.total += sale.total;
      rows.set(key, current);
    });

    return [...rows.values()].sort((a, b) => b.total - a.total).slice(0, 4);
  }, [metrics?.recentSales]);
  const maxTotal = Math.max(...sellers.map((seller) => seller.total), 1);
  const trendPercent = metrics?.salesOutlook.last7Days.totalChangePercent ?? 0;
  const trendIsDown = trendPercent < 0;
  const trendLabel = `${trendPercent > 0 ? "+" : ""}${trendPercent.toFixed(1)}%`;
  const TrendIcon = trendIsDown ? TrendingDownIcon : TrendingUpIcon;

  return (
    <DashboardPanelCard
      title="Vendedores activos"
      subtitle="Lectura rápida del equipo para detectar quién está vendiendo y quién necesita seguimiento."
    >
      {sellers.length ? (
        <Stack spacing={1}>
          {sellers.map((seller) => (
            <Box key={seller.name}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
                <Stack spacing={0.3} sx={{ minWidth: 0 }}>
                  <Typography fontWeight={900} noWrap>{seller.name}</Typography>
                  <Typography color="text.secondary" variant="caption">
                    {formatNumber(seller.count)} ventas · {formatMoney(seller.total)}
                  </Typography>
                </Stack>
                <Chip
                  color={trendIsDown ? "warning" : "success"}
                  icon={<TrendIcon />}
                  label={trendLabel}
                  size="small"
                  sx={{ "& .MuiChip-icon": { fontSize: 16 } }}
                  title={trendIsDown ? "Ventas bajaron frente al periodo anterior" : "Ventas subieron frente al periodo anterior"}
                />
              </Stack>
              <LinearProgress
                value={Math.min(100, Math.round((seller.total / maxTotal) * 100))}
                variant="determinate"
                sx={{ borderRadius: 999, height: 7, mt: 0.8 }}
              />
            </Box>
          ))}
        </Stack>
      ) : (
        <Box sx={{ display: "grid", gap: 1.2, gridTemplateColumns: { xs: "minmax(0, 1fr)", sm: "repeat(2, minmax(0, 1fr))" }, maxWidth: "100%", minWidth: 0, overflowX: "hidden" }}>
          {[
            {
              helper: "Permisos de gestión y configuración.",
              icon: AssessmentIcon,
              label: "Administradores activos",
              value: formatNumber(metrics?.userSummary.activeAdmins),
            },
            {
              helper: "Usuarios operativos que registran ventas.",
              icon: PointOfSaleIcon,
              label: "Vendedores activos",
              value: formatNumber(metrics?.userSummary.activeCashiers),
            },
          ].map((item) => {
            const Icon = item.icon;

            return (
              <Box
                key={item.label}
                sx={(theme) => ({
                  border: "1px solid",
                  borderColor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.24 : 0.14),
                  borderRadius: 3,
                  p: 1.35,
                })}
              >
                <Stack spacing={1} alignItems="center" textAlign="center">
                  <Icon color="primary" />
                  <Box>
                    <Typography color="text.secondary" fontSize={12} fontWeight={850}>
                      {item.label}
                    </Typography>
                    <Typography fontSize={26} fontWeight={950} lineHeight={1.05}>
                      {item.value}
                    </Typography>
                    <Typography color="text.secondary" variant="caption">
                      {item.helper}
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            );
          })}
        </Box>
      )}
    </DashboardPanelCard>
  );
}



type DashboardTrackingView = "attention" | "team" | "sales";

export function DashboardTrackingPanel({
  hasCriticalStock,
  hasLowStock,
  isAdmin,
  metrics,
  salesDestination,
}: {
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  metrics: DashboardMetrics | null;
  onRefresh: () => void;
  salesDestination: string;
}) {
  const [view, setView] = useState<DashboardTrackingView>("attention");
  const availableViews = useMemo(
    () => [
      { label: "Atención", value: "attention" as const },
      ...(isAdmin ? [{ label: "Equipo", value: "team" as const }] : []),
      { label: "Ventas", value: "sales" as const },
    ],
    [isAdmin],
  );
  const safeView = view === "team" && !isAdmin ? "attention" : view;

  const viewToggle = (
    <ToggleButtonGroup
      exclusive
      onChange={(_, nextView) => {
        if (nextView) setView(nextView as DashboardTrackingView);
      }}
      size="small"
      value={safeView}
      sx={(theme) => ({
        alignSelf: { xs: "stretch", sm: "center" },
        display: "inline-flex",
        flexShrink: 0,
        flexWrap: "nowrap",
        gap: { xs: 0.45, sm: 0.6 },
        justifyContent: { xs: "space-between", sm: "flex-end" },
        maxWidth: "100%",
        minWidth: 0,
        "& .MuiToggleButtonGroup-grouped": {
          border: "1px solid",
          borderColor: `${alpha(theme.palette.primary.main, 0.18)} !important`,
          borderRadius: "999px !important",
          color: "text.secondary",
          flex: { xs: "1 1 0", sm: "0 0 auto" },
          fontSize: { xs: 11, sm: 12 },
          fontWeight: 900,
          m: "0 !important",
          minHeight: { xs: 34, sm: 36 },
          minWidth: { xs: 0, sm: 72, md: 78 },
          px: { xs: 0.85, sm: 1.15 },
          textTransform: "none",
          transition: "background-color 160ms ease, border-color 160ms ease, color 160ms ease",
          "&.Mui-selected": {
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.22 : 0.12),
            borderColor: `${alpha(theme.palette.primary.main, 0.46)} !important`,
            color: "text.primary",
            boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.06 : 0.2)}`,
          },
          "&.Mui-selected:hover": {
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.28 : 0.16),
          },
        },
      })}
    >
      {availableViews.map((item) => (
        <ToggleButton key={item.value} value={item.value}>
          {item.label}
        </ToggleButton>
      ))}
    </ToggleButtonGroup>
  );

  return (
    <DashboardPanelCard
      title="Panel de seguimiento"
      subtitle="Pendientes, equipo o ventas sin saturar Inicio."
      action={viewToggle}
    >
      {safeView === "attention" && (
        <PendingOperationsPanel
          hasCriticalStock={hasCriticalStock}
          hasLowStock={hasLowStock}
          metrics={metrics}
        />
      )}

      {safeView === "team" && <TeamOverviewPanel metrics={metrics} />}

      {safeView === "sales" && (
        <RecentSalesPanel
          isAdmin={isAdmin}
          limit={3}
          metrics={metrics}
          salesDestination={salesDestination}
        />
      )}
    </DashboardPanelCard>
  );
}

export function InventoryAttentionPanel({
  metrics,
}: {
  metrics: DashboardMetrics | null;
}) {
  return (
    <DashboardPanelCard
      title="Inventario requiere atención"
      subtitle="Stock cero en rojo; stock en o debajo del mínimo en amarillo."
      actionTo="/inventory"
    >
      {metrics?.productSummary.lowStockItems.length ? (
        <List disablePadding>
          {metrics.productSummary.lowStockItems.map((item, index) => (
            <Box key={item.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem
                disableGutters
                secondaryAction={
                  <Chip
                    size="small"
                    color={stockSeverityColor(item.severity)}
                    label={stockSeverityLabel(item.severity)}
                  />
                }
                sx={{ py: 1.25, pr: { xs: 0, sm: 12 }, flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "flex-start", sm: "center" } }}
              >
                <ListItemText
                  primary={
                    <Typography fontWeight={800} noWrap>
                      {item.name}
                    </Typography>
                  }
                  secondary={
                    <Typography color="text.secondary" variant="body2">
                      {item.sku} · Stock {formatNumber(item.currentStock)} /
                      mínimo {formatNumber(item.minStock)}
                    </Typography>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      ) : (
        <DashboardEmptyPanel>
          No hay productos en bajo inventario.
        </DashboardEmptyPanel>
      )}
    </DashboardPanelCard>
  );
}

export function RecentSalesPanel({
  metrics,
  isAdmin,
  limit,
  salesDestination,
}: {
  metrics: DashboardMetrics | null;
  isAdmin: boolean;
  limit?: number;
  salesDestination: string;
}) {
  const visibleSales = typeof limit === "number" ? metrics?.recentSales.slice(0, limit) : metrics?.recentSales;
  return (
    <DashboardPanelCard
      title="Ventas recientes"
      subtitle={
        isAdmin
          ? "Últimas ventas registradas por el equipo."
          : "Tus últimas ventas registradas."
      }
      actionTo={salesDestination}
    >
      {visibleSales?.length ? (
        <List disablePadding>
          {visibleSales.map((sale, index) => (
            <Box key={sale.id}>
              {index > 0 && <Divider component="li" />}
              <ListItem disableGutters sx={{ py: 1.25 }}>
                <ListItemText
                  primary={
                    <Box
                      sx={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 1,
                        alignItems: "center",
                        minWidth: 0,
                      }}
                    >
                      <Typography fontWeight={800} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>{sale.folio}</Typography>
                      <Typography fontWeight={900}>
                        {formatMoney(sale.total)}
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Stack
                      direction="row"
                      spacing={1}
                      alignItems="center"
                      flexWrap="wrap"
                      useFlexGap
                      sx={{ mt: 0.75 }}
                    >
                      <Chip
                        size="small"
                        color={saleStatusColor(sale.status)}
                        label={saleStatusLabel(sale.status)}
                      />
                      <Typography color="text.secondary" variant="caption">
                        {formatDateTime(sale.createdAt)}
                      </Typography>
                      {isAdmin && (
                        <Typography color="text.secondary" variant="caption">
                          {sale.cashier.name}
                        </Typography>
                      )}
                    </Stack>
                  }
                />
              </ListItem>
            </Box>
          ))}
        </List>
      ) : (
        <DashboardEmptyPanel>
          No hay ventas recientes en tu alcance.
        </DashboardEmptyPanel>
      )}
    </DashboardPanelCard>
  );
}

export function OperationalReadingPanel({
  hasCriticalStock,
  hasLowStock,
  outOfStockTotal,
  isLoading,
  onRefresh,
}: {
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  outOfStockTotal: number | null | undefined;
  isLoading: boolean;
  onRefresh: () => void;
}) {
  return (
    <DashboardPanelCard
      title="Lectura operativa"
      subtitle="Resumen rápido para decidir el siguiente paso."
    >
      <Stack spacing={1.5}>
        {hasCriticalStock && (
          <Alert severity="error">
            Hay {formatNumber(outOfStockTotal)} producto(s) sin stock. Revisa
            inventario antes de venderlos.
          </Alert>
        )}

        {!hasCriticalStock && hasLowStock && (
          <Alert severity="warning">
            Hay productos en o debajo del mínimo. Programa reposición para
            evitar ventas fallidas.
          </Alert>
        )}

        {!hasLowStock && !hasCriticalStock && (
          <Alert severity="success">
            Operación estable: ventas registrables sin alertas críticas de
            inventario.
          </Alert>
        )}

        <Button
          variant="outlined"
          startIcon={<AssessmentIcon />}
          onClick={onRefresh}
          disabled={isLoading}
          sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
        >
          Recalcular resumen
        </Button>
      </Stack>
    </DashboardPanelCard>
  );
}

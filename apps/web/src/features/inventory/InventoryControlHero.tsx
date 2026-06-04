
import type { ElementType } from "react";

import { Box, Card, CardContent, Stack, Tab, Tabs, Typography } from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import HistoryIcon from "@mui/icons-material/History";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SyncIcon from "@mui/icons-material/Sync";

import type { InventoryView, Movement, StockItem } from "./inventoryShared";
import { getInventoryStockSummary } from "./inventoryShared";

type DashboardTone = "primary" | "success" | "error" | "info" | "secondary";

type MovementMetric = {
  color: DashboardTone;
  helper: string;
  icon: ElementType;
  label: string;
  unitsLabel: string;
  value: { count: number; units: number };
};

const viewTabs: Array<{ icon: ElementType; label: string; value: InventoryView; requiresAdjustment?: boolean }> = [
  { icon: Inventory2Icon, label: "Existencias", value: "stock" },
  { icon: AddCircleIcon, label: "Entradas", value: "entries", requiresAdjustment: true },
  { icon: RemoveCircleIcon, label: "Salidas", value: "exits", requiresAdjustment: true },
  { icon: HistoryIcon, label: "Historial", value: "movements" },
];

const heroPanelSx = (theme: Theme) => ({
  minWidth: 0,
  border: 1,
  borderColor: alpha(theme.palette.primary.main, 0.18),
  borderRadius: { xs: 3, md: 4 },
  background:
    theme.palette.mode === "dark"
      ? `linear-gradient(145deg, ${alpha(theme.palette.primary.main, 0.08)}, transparent 48%), ${alpha(theme.palette.background.paper, 0.18)}`
      : `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.16)}, transparent 48%), ${alpha(theme.palette.background.paper, 0.9)}`,
  boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.045 : 0.58)}`,
});

export function InventoryControlHero({
  activeView,
  canAdjustInventory,
  movements,
  onViewChange,
  stockRows,
}: {
  activeView: InventoryView;
  canAdjustInventory: boolean;
  movements: Movement[];
  onViewChange: (value: InventoryView) => void;
  stockRows: StockItem[];
}) {
  const stockSummary = getInventoryStockSummary(stockRows);
  const movementSummary = getMovementSummary(movements);

  return (
    <Card
      data-testid="inventory-visual-dashboard"
      sx={(theme) => ({
        mb: 2,
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.2),
        borderRadius: { xs: 3, md: 4.5 },
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 12% 0%, ${alpha(theme.palette.primary.main, 0.16)}, transparent 34%), radial-gradient(circle at 92% 4%, ${alpha(theme.palette.success.main, 0.1)}, transparent 26%), ${alpha(theme.palette.background.paper, 0.94)}`
            : `radial-gradient(circle at 12% 0%, ${alpha(theme.palette.primary.light, 0.18)}, transparent 34%), radial-gradient(circle at 92% 4%, ${alpha(theme.palette.success.light, 0.14)}, transparent 26%), ${alpha(theme.palette.background.paper, 0.98)}`,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 22px 70px ${alpha(theme.palette.common.black, 0.3)}`
            : `0 22px 70px ${alpha(theme.palette.primary.main, 0.1)}`,
      })}
    >
      <CardContent sx={{ p: { xs: 1.5, sm: 2, md: 2.25 }, "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.25 } } }}>
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, lg: 2 },
            gridTemplateColumns: { xs: "1fr", lg: "minmax(420px, 0.44fr) minmax(560px, 0.56fr)" },
            alignItems: "stretch",
          }}
        >
          <InventoryControlPanel
            activeView={activeView}
            canAdjustInventory={canAdjustInventory}
            onViewChange={onViewChange}
            summary={stockSummary}
          />
          <InventoryMovementPanel summary={movementSummary} />
        </Box>
      </CardContent>
    </Card>
  );
}

function InventoryControlPanel({
  activeView,
  canAdjustInventory,
  onViewChange,
  summary,
}: {
  activeView: InventoryView;
  canAdjustInventory: boolean;
  onViewChange: (value: InventoryView) => void;
  summary: ReturnType<typeof getInventoryStockSummary>;
}) {
  const hasOutOfStock = summary.outOfStock > 0;
  const hasAttention = summary.attention > 0;
  const tone: "error" | "warning" | "success" = hasOutOfStock ? "error" : hasAttention ? "warning" : "success";
  const availableTabs = viewTabs.filter((tab) => canAdjustInventory || !tab.requiresAdjustment);
  const statusTitle = hasAttention ? "Algunos productos requieren atención" : "Inventario estable";
  const statusCopy = hasOutOfStock
    ? "Hay ubicaciones sin unidades. Revisa por almacén antes de reponer."
    : hasAttention
      ? "Hay ubicaciones cerca del mínimo. Prioriza reposición por almacén."
      : "No hay alertas críticas visibles.";

  return (
    <Box
      sx={(theme) => ({
        ...heroPanelSx(theme),
        p: { xs: 1.45, sm: 1.75, md: 2 },
        display: "grid",
        gridTemplateRows: "auto auto auto",
        gap: { xs: 1.2, sm: 1.35 },
      })}
    >
      <Box sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              flex: "0 0 auto",
              borderRadius: 2.3,
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.22),
            })}
          >
            <HistoryIcon fontSize="small" />
          </Box>
          <Typography
            component="h2"
            variant="h4"
            fontWeight={950}
            sx={{ letterSpacing: -0.5, lineHeight: 1.05, fontSize: { xs: 23, sm: 27, md: 29 }, overflowWrap: "anywhere" }}
          >
            Control de inventario
          </Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ mt: 0.75, fontSize: { xs: 13, sm: 13.8 }, lineHeight: 1.42 }}>
          {canAdjustInventory
            ? "Consulta existencias y registra ajustes manuales con trazabilidad."
            : "Consulta existencias e historial operativo. Los ajustes requieren permiso administrativo."}
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(138px, 0.35fr)" },
          gap: { xs: 1, sm: 1.1 },
          alignItems: "stretch",
        }}
      >
        <StockAttentionCard tone={tone} title={statusTitle} description={statusCopy} />
        <TotalUnitsCard units={summary.units} />
      </Box>

      <InventoryViewTabs activeView={activeView} availableTabs={availableTabs} onViewChange={onViewChange} />
    </Box>
  );
}

function InventoryViewTabs({
  activeView,
  availableTabs,
  onViewChange,
}: {
  activeView: InventoryView;
  availableTabs: typeof viewTabs;
  onViewChange: (value: InventoryView) => void;
}) {
  return (
    <Tabs
      value={activeView}
      onChange={(_, value: InventoryView) => onViewChange(value)}
      variant="scrollable"
      scrollButtons="auto"
      aria-label="Secciones de inventario"
      sx={(theme) => ({
        minHeight: 34,
        borderTop: 1,
        borderColor: alpha(theme.palette.primary.main, 0.1),
        pt: 0.9,
        "& .MuiTabs-indicator": { height: 3, borderRadius: 999 },
        "& .MuiTab-root": {
          minHeight: 32,
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.14),
          borderRadius: 999,
          color: "text.secondary",
          fontSize: 12.5,
          fontWeight: 850,
          gap: 0.55,
          mr: 0.65,
          minWidth: "auto",
          px: 1.2,
          textTransform: "none",
          "&.Mui-selected": {
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.12),
            borderColor: alpha(theme.palette.primary.main, 0.34),
          },
        },
      })}
    >
      {availableTabs.map((tab) => {
        const Icon = tab.icon;
        return <Tab key={tab.value} value={tab.value} icon={<Icon sx={{ fontSize: 16 }} />} iconPosition="start" label={tab.label} />;
      })}
    </Tabs>
  );
}

function StockAttentionCard({ description, title, tone }: { description: string; title: string; tone: "error" | "warning" | "success" }) {
  return (
    <Box
      sx={(theme) => ({
        minWidth: 0,
        minHeight: { xs: 88, sm: 96 },
        border: 1,
        borderColor: alpha(theme.palette[tone].main, 0.3),
        borderRadius: 2.75,
        p: { xs: 1.1, sm: 1.25 },
        display: "grid",
        gridTemplateColumns: "38px minmax(0, 1fr)",
        gap: 1,
        alignItems: "center",
        bgcolor: alpha(theme.palette[tone].main, theme.palette.mode === "dark" ? 0.07 : 0.04),
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.14)}, transparent 58%), ${alpha(theme.palette.background.paper, 0.13)}`
            : `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.1)}, transparent 58%), ${alpha(theme.palette.background.paper, 0.78)}`,
      })}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: 999,
          color: theme.palette[tone].contrastText,
          bgcolor: theme.palette[tone].main,
          boxShadow: `0 12px 26px ${alpha(theme.palette[tone].main, 0.22)}`,
        })}
      >
        <ReportProblemIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={950} sx={{ letterSpacing: 0.45, textTransform: "uppercase" }}>
          Estado de existencias
        </Typography>
        <Typography fontWeight={950} sx={{ mt: 0.1, lineHeight: 1.1, overflowWrap: "anywhere", fontSize: { xs: 15.2, sm: 16.2 } }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.3, fontSize: { xs: 12.2, sm: 12.8 }, lineHeight: 1.3 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

function TotalUnitsCard({ units }: { units: number }) {
  return (
    <Box
      sx={(theme) => ({
        minWidth: 0,
        minHeight: { xs: 82, sm: 96 },
        border: 1,
        borderColor: alpha(theme.palette.info.main, 0.24),
        borderRadius: 2.75,
        p: { xs: 1.05, sm: 1.2 },
        display: "grid",
        gridTemplateColumns: { xs: "36px minmax(0, 1fr)", sm: "1fr" },
        gap: { xs: 0.9, sm: 0.45 },
        alignItems: "center",
        bgcolor: alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.075 : 0.04),
        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.12)}, transparent 62%)`,
      })}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          borderRadius: 2.3,
          color: "info.main",
          bgcolor: alpha(theme.palette.info.main, 0.13),
        })}
      >
        <LocalShippingIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h5" fontWeight={950} sx={{ lineHeight: 0.95, letterSpacing: -0.3 }}>
          {units}
        </Typography>
        <Typography fontWeight={950} sx={{ mt: 0.15, lineHeight: 1.08, fontSize: 12.5 }}>
          Unidades totales
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25, lineHeight: 1.2 }}>
          Stock visible
        </Typography>
      </Box>
    </Box>
  );
}

function InventoryMovementPanel({ summary }: { summary: ReturnType<typeof getMovementSummary> }) {
  const metrics = getMovementMetrics(summary);

  return (
    <Box
      sx={(theme) => ({
        ...heroPanelSx(theme),
        p: { xs: 1.45, sm: 1.75, md: 2 },
        display: "grid",
        gridTemplateRows: "auto auto",
        gap: { xs: 1.2, sm: 1.35 },
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.main, 0.2)}, transparent 36%), ${alpha(theme.palette.background.paper, 0.16)}`
            : `radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.main, 0.13)}, transparent 36%), ${alpha(theme.palette.background.paper, 0.82)}`,
      })}
    >
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" }, gap: 1.1, alignItems: "center" }}>
        <Stack direction="row" spacing={1.05} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={(theme) => ({
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              width: 38,
              height: 38,
              borderRadius: 999,
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.24),
            })}
          >
            <SyncIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h3"
              variant="h4"
              fontWeight={950}
              sx={{ lineHeight: 1, letterSpacing: -0.6, fontSize: { xs: 26, sm: 31, md: 34 }, overflowWrap: "anywhere" }}
            >
              Movimientos
            </Typography>
            <Typography color="text.secondary" fontWeight={800} sx={{ mt: 0.35, fontSize: { xs: 12.5, sm: 13 } }}>
              Resumen de actividad del inventario
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={(theme) => ({
            minWidth: { xs: "100%", sm: 130 },
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.22),
            borderRadius: 2.8,
            px: 1.4,
            py: 1,
            textAlign: { xs: "left", sm: "center" },
            bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.18 : 0.58),
          })}
        >
          <Typography variant="h3" fontWeight={950} sx={{ lineHeight: 0.9, letterSpacing: -0.7 }}>
            {summary.total}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={850} sx={{ mt: 0.35 }}>
            Total movimientos
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: { xs: 1, sm: 1.1 },
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))", xl: "repeat(4, minmax(0, 1fr))" },
          alignItems: "stretch",
        }}
      >
        {metrics.map((metric) => (
          <MovementMetricCard key={metric.label} metric={metric} />
        ))}
      </Box>
    </Box>
  );
}

function MovementMetricCard({ metric }: { metric: MovementMetric }) {
  const Icon = metric.icon;

  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        minWidth: 0,
        minHeight: { xs: 100, xl: 126 },
        border: 1,
        borderColor: alpha(theme.palette[metric.color].main, 0.32),
        borderRadius: 3,
        p: { xs: 1.15, sm: 1.25 },
        display: "grid",
        gridTemplateRows: "auto 1fr auto",
        gap: { xs: 0.75, xl: 1 },
        overflow: "hidden",
        bgcolor: alpha(theme.palette[metric.color].main, theme.palette.mode === "dark" ? 0.06 : 0.035),
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.13)}, transparent 58%), ${alpha(theme.palette.background.default, 0.18)}`
            : `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.09)}, transparent 58%), ${alpha(theme.palette.background.paper, 0.82)}`,
        "&::after": {
          content: '""',
          position: "absolute",
          left: 12,
          right: 12,
          bottom: 0,
          height: 3,
          borderRadius: 999,
          bgcolor: theme.palette[metric.color].main,
        },
      })}
    >
      <Stack
        direction={{ xs: "row", xl: "column" }}
        spacing={{ xs: 0.9, xl: 0.6 }}
        alignItems={{ xs: "center", xl: "flex-start" }}
        sx={{ minWidth: 0 }}
      >
        <Box
          sx={(theme) => ({
            display: "grid",
            placeItems: "center",
            width: { xs: 36, xl: 48 },
            height: { xs: 36, xl: 48 },
            flex: "0 0 auto",
            borderRadius: 999,
            color: theme.palette[metric.color].main,
            bgcolor: alpha(theme.palette[metric.color].main, 0.13),
            border: 1,
            borderColor: alpha(theme.palette[metric.color].main, 0.22),
          })}
        >
          <Icon sx={{ fontSize: { xs: 19, xl: 29 } }} />
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 0.95, letterSpacing: -0.45, fontSize: { xs: 23, xl: 30 } }}>
            {metric.value.count}
          </Typography>
          <Typography fontWeight={900} sx={{ mt: 0.25, lineHeight: 1.1, fontSize: { xs: 12.8, xl: 14.5 } }}>
            {metric.label}
          </Typography>
        </Box>
      </Stack>

      <Typography
        color="text.secondary"
        sx={{ alignSelf: "center", display: { xs: "none", sm: "block" }, fontSize: { sm: 11.6, xl: 12.4 }, lineHeight: 1.28 }}
      >
        {metric.helper}
      </Typography>

      <Box sx={(theme) => ({ borderTop: 1, borderColor: alpha(theme.palette[metric.color].main, 0.22), pt: 0.75 })}>
        <Typography fontWeight={900} sx={{ fontSize: { xs: 12.5, xl: 13.5 }, lineHeight: 1.15, overflowWrap: "anywhere" }}>
          {metric.value.units} {metric.unitsLabel}
        </Typography>
      </Box>
    </Box>
  );
}

function getMovementSummary(movements: Movement[]) {
  return movements.reduce(
    (summary, movement) => {
      const quantity = Math.max(Number(movement.quantity ?? 0), 0);

      if (movement.type === "IN") {
        summary.entries.count += 1;
        summary.entries.units += quantity;
      } else if (movement.type === "OUT" || movement.type === "ADJUSTMENT") {
        summary.exits.count += 1;
        summary.exits.units += quantity;
      } else if (movement.type === "SALE") {
        summary.sales.count += 1;
        summary.sales.units += quantity;
      } else if (movement.type === "RETURN") {
        summary.returns.count += 1;
        summary.returns.units += quantity;
      }

      summary.total += 1;
      return summary;
    },
    {
      entries: { count: 0, units: 0 },
      exits: { count: 0, units: 0 },
      returns: { count: 0, units: 0 },
      sales: { count: 0, units: 0 },
      total: 0,
    },
  );
}

function getMovementMetrics(summary: ReturnType<typeof getMovementSummary>): MovementMetric[] {
  return [
    {
      color: "success",
      helper: "Unidades recibidas por reposición",
      icon: KeyboardArrowDownIcon,
      label: "Entradas",
      unitsLabel: "unidades recibidas",
      value: summary.entries,
    },
    {
      color: "error",
      helper: "Unidades retiradas por ajuste o merma",
      icon: KeyboardArrowUpIcon,
      label: "Salidas",
      unitsLabel: "unidades retiradas",
      value: summary.exits,
    },
    {
      color: "primary",
      helper: "Unidades descontadas por ventas",
      icon: ShoppingCartIcon,
      label: "Ventas",
      unitsLabel: "unidades vendidas",
      value: summary.sales,
    },
    {
      color: "secondary",
      helper: "Unidades devueltas al inventario",
      icon: KeyboardReturnIcon,
      label: "Devoluciones",
      unitsLabel: "unidades devueltas",
      value: summary.returns,
    },
  ];
}

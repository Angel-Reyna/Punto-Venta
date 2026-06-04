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

type HeroTone = "success" | "warning" | "error";
type MovementTone = "primary" | "success" | "error" | "secondary";

type MovementMetric = {
  color: MovementTone;
  icon: ElementType;
  label: string;
  shortLabel: string;
  unitsLabel: string;
  value: { count: number; units: number };
};

const viewTabs: Array<{ icon: ElementType; label: string; value: InventoryView; requiresAdjustment?: boolean }> = [
  { icon: Inventory2Icon, label: "Existencias", value: "stock" },
  { icon: AddCircleIcon, label: "Entradas", value: "entries", requiresAdjustment: true },
  { icon: RemoveCircleIcon, label: "Salidas", value: "exits", requiresAdjustment: true },
  { icon: HistoryIcon, label: "Historial", value: "movements" },
];

const heroShellSx = (theme: Theme) => ({
  mb: 2,
  overflow: "hidden",
  border: 1,
  borderColor: alpha(theme.palette.primary.main, 0.28),
  borderRadius: { xs: 3, md: 4 },
  background:
    theme.palette.mode === "dark"
      ? `radial-gradient(circle at 4% 0%, ${alpha(theme.palette.primary.main, 0.28)}, transparent 34%), linear-gradient(118deg, ${alpha(
          theme.palette.primary.dark,
          0.28,
        )}, ${alpha(theme.palette.background.paper, 0.96)} 48%, ${alpha(theme.palette.success.dark, 0.14)})`
      : `radial-gradient(circle at 4% 0%, ${alpha(theme.palette.primary.light, 0.26)}, transparent 34%), linear-gradient(118deg, ${alpha(
          theme.palette.primary.light,
          0.2,
        )}, ${alpha(theme.palette.background.paper, 0.98)} 48%, ${alpha(theme.palette.success.light, 0.16)})`,
  boxShadow:
    theme.palette.mode === "dark"
      ? `0 18px 50px ${alpha(theme.palette.common.black, 0.28)}`
      : `0 18px 50px ${alpha(theme.palette.primary.main, 0.1)}`,
});

const heroContentSx = {
  p: { xs: 1.15, sm: 1.35, md: 1.5 },
  "&:last-child": { pb: { xs: 1.15, sm: 1.35, md: 1.5 } },
};

const heroGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", lg: "minmax(282px, 0.3fr) minmax(0, 0.7fr)" },
  gap: { xs: 1.15, md: 1.25 },
  alignItems: "stretch",
};

const commandPanelSx = (theme: Theme) => ({
  position: "relative",
  minWidth: 0,
  minHeight: { xs: "auto", lg: 152 },
  p: { xs: 1.35, md: 1.55 },
  overflow: "hidden",
  border: 1,
  borderColor: alpha(theme.palette.primary.main, 0.18),
  borderRadius: 3,
  bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.2 : 0.56),
  "&::before": {
    content: '""',
    position: "absolute",
    insetBlock: 14,
    left: 0,
    width: 4,
    borderRadius: 999,
    bgcolor: theme.palette.primary.main,
    boxShadow: `0 0 18px ${alpha(theme.palette.primary.main, 0.42)}`,
  },
});

const compactStatsGridSx = {
  display: "grid",
  gridTemplateColumns: { xs: "1fr", sm: "1.15fr 0.85fr", lg: "1fr" },
  gap: 0.8,
  mt: 1.05,
};

const operationsPanelSx = (theme: Theme) => ({
  minWidth: 0,
  minHeight: { xs: "auto", lg: 152 },
  p: { xs: 1.2, md: 1.35 },
  border: 1,
  borderColor: alpha(theme.palette.primary.main, 0.22),
  borderRadius: 3,
  bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.16 : 0.48),
  background:
    theme.palette.mode === "dark"
      ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, transparent 52%), ${alpha(theme.palette.background.default, 0.18)}`
      : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.16)}, transparent 52%), ${alpha(theme.palette.background.paper, 0.72)}`,
});

const movementGridSx = {
  display: "grid",
  gridTemplateColumns: {
    xs: "1fr",
    sm: "repeat(2, minmax(0, 1fr))",
    xl: "repeat(4, minmax(0, 1fr))",
  },
  gap: { xs: 0.8, md: 0.9 },
};

const tabsRailSx = (theme: Theme) => ({
  mt: 1.15,
  pt: 1.05,
  borderTop: 1,
  borderColor: alpha(theme.palette.primary.main, 0.16),
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
  const availableTabs = viewTabs.filter((tab) => canAdjustInventory || !tab.requiresAdjustment);

  return (
    <Card data-testid="inventory-visual-dashboard" sx={heroShellSx}>
      <CardContent sx={heroContentSx}>
        <Box sx={heroGridSx}>
          <InventoryCommandPanel canAdjustInventory={canAdjustInventory} stockSummary={stockSummary} />
          <OperationsRibbon activeView={activeView} availableTabs={availableTabs} movementSummary={movementSummary} onViewChange={onViewChange} />
        </Box>
      </CardContent>
    </Card>
  );
}

function InventoryCommandPanel({ canAdjustInventory, stockSummary }: { canAdjustInventory: boolean; stockSummary: ReturnType<typeof getInventoryStockSummary> }) {
  return (
    <Box sx={commandPanelSx}>
      <Stack spacing={0.15} sx={{ pl: 0.45, minWidth: 0 }}>
        <Stack direction="row" spacing={0.9} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              display: "grid",
              placeItems: "center",
              width: 34,
              height: 34,
              flex: "0 0 auto",
              borderRadius: 2.1,
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.14),
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.26),
            })}
          >
            <Inventory2Icon sx={{ fontSize: 19 }} />
          </Box>
          <Typography
            component="h2"
            fontWeight={950}
            sx={{ minWidth: 0, overflowWrap: "anywhere", lineHeight: 1.02, letterSpacing: -0.42, fontSize: { xs: 22, sm: 24, md: 25 } }}
          >
            Control de inventario
          </Typography>
        </Stack>
        <Typography color="text.secondary" sx={{ maxWidth: 420, fontSize: { xs: 12.3, md: 12.8 }, lineHeight: 1.34 }}>
          {canAdjustInventory ? "Stock, alertas y ajustes trazables." : "Stock y movimientos visibles. Los ajustes requieren permiso administrativo."}
        </Typography>
      </Stack>

      <Box sx={compactStatsGridSx}>
        <StockStateTile summary={stockSummary} />
        <TotalUnitsTile units={stockSummary.units} />
      </Box>
    </Box>
  );
}

function OperationsRibbon({
  activeView,
  availableTabs,
  movementSummary,
  onViewChange,
}: {
  activeView: InventoryView;
  availableTabs: typeof viewTabs;
  movementSummary: ReturnType<typeof getMovementSummary>;
  onViewChange: (value: InventoryView) => void;
}) {
  const metrics = getMovementMetrics(movementSummary);

  return (
    <Box component="section" aria-label="Resumen operativo de inventario" sx={operationsPanelSx}>
      <Stack spacing={1.1}>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }} justifyContent="space-between">
          <Stack direction="row" spacing={0.9} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                display: "grid",
                placeItems: "center",
                width: 36,
                height: 36,
                flex: "0 0 auto",
                borderRadius: 999,
                color: "primary.main",
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.26),
              })}
            >
              <SyncIcon sx={{ fontSize: 19 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography component="h3" fontWeight={950} sx={{ lineHeight: 1, letterSpacing: -0.35, fontSize: { xs: 22, sm: 24, md: 26 } }}>
                Movimientos
              </Typography>
              <Typography color="text.secondary" sx={{ mt: 0.2, fontSize: { xs: 11.8, md: 12.4 }, lineHeight: 1.22 }}>
                Entradas, salidas, ventas y devoluciones.
              </Typography>
            </Box>
          </Stack>

          <TotalMovementsBadge total={movementSummary.total} />
        </Stack>

        <Box sx={movementGridSx}>
          {metrics.map((metric) => (
            <MovementMetricCard key={metric.label} metric={metric} />
          ))}
        </Box>

        <Box sx={tabsRailSx}>
          <InventoryViewTabs activeView={activeView} availableTabs={availableTabs} onViewChange={onViewChange} />
        </Box>
      </Stack>
    </Box>
  );
}

function StockStateTile({ summary }: { summary: ReturnType<typeof getInventoryStockSummary> }) {
  const hasOutOfStock = summary.outOfStock > 0;
  const hasAttention = summary.attention > 0;
  const tone: HeroTone = hasOutOfStock ? "error" : hasAttention ? "warning" : "success";
  const title = hasAttention ? "Requieren atención" : "Inventario estable";
  const description = hasOutOfStock ? "Ubicaciones sin unidades." : hasAttention ? "Cerca del mínimo." : "Sin alertas críticas.";

  return (
    <CompactTile tone={tone} icon={ReportProblemIcon} label="Estado de existencias" title={title} description={description} />
  );
}

function TotalUnitsTile({ units }: { units: number }) {
  return <CompactTile tone="success" icon={LocalShippingIcon} label="Unidades totales" title={formatInventoryCount(units)} description="Stock visible" />;
}

function CompactTile({
  description,
  icon: Icon,
  label,
  title,
  tone,
}: {
  description: string;
  icon: ElementType;
  label: string;
  title: string;
  tone: HeroTone;
}) {
  return (
    <Box
      sx={(theme) => ({
        minWidth: 0,
        minHeight: 56,
        p: 0.9,
        border: 1,
        borderColor: alpha(theme.palette[tone].main, 0.3),
        borderRadius: 2.25,
        display: "grid",
        gridTemplateColumns: "32px minmax(0, 1fr)",
        gap: 0.8,
        alignItems: "center",
        bgcolor: alpha(theme.palette[tone].main, theme.palette.mode === "dark" ? 0.07 : 0.045),
      })}
    >
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 32,
          height: 32,
          borderRadius: 1.8,
          color: theme.palette[tone].contrastText,
          bgcolor: theme.palette[tone].main,
        })}
      >
        <Icon sx={{ fontSize: 17 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={900} sx={{ display: "block", lineHeight: 1, letterSpacing: 0.32 }}>
          {label}
        </Typography>
        <Typography fontWeight={950} sx={{ mt: 0.25, lineHeight: 1.06, overflowWrap: "anywhere", fontSize: 14.6 }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.15, fontSize: 11.2, lineHeight: 1.15 }}>
          {description}
        </Typography>
      </Box>
    </Box>
  );
}

function TotalMovementsBadge({ total }: { total: number }) {
  return (
    <Box
      sx={(theme) => ({
        minWidth: { xs: "100%", sm: 118 },
        px: 1.2,
        py: 0.75,
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.26),
        borderRadius: 2.25,
        textAlign: { xs: "left", sm: "center" },
        bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.08 : 0.05),
      })}
    >
      <Typography fontWeight={950} sx={{ lineHeight: 0.95, letterSpacing: -0.35, fontSize: 24 }}>
        {formatInventoryCount(total)}
      </Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={850} sx={{ display: "block", mt: 0.2, lineHeight: 1 }}>
        Total movimientos
      </Typography>
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
        minHeight: { xs: 64, md: 70 },
        p: { xs: 0.85, md: 0.95 },
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette[metric.color].main, 0.34),
        borderRadius: 2.4,
        display: "grid",
        gridTemplateColumns: "34px minmax(0, 1fr) auto",
        gap: 0.85,
        alignItems: "center",
        bgcolor: alpha(theme.palette[metric.color].main, theme.palette.mode === "dark" ? 0.065 : 0.04),
        "&::after": {
          content: '""',
          position: "absolute",
          insetInline: 12,
          bottom: 0,
          height: 3,
          borderRadius: 999,
          bgcolor: theme.palette[metric.color].main,
        },
      })}
    >
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 34,
          height: 34,
          borderRadius: 2,
          color: theme.palette[metric.color].main,
          bgcolor: alpha(theme.palette[metric.color].main, 0.14),
          border: 1,
          borderColor: alpha(theme.palette[metric.color].main, 0.24),
        })}
      >
        <Icon sx={{ fontSize: 20 }} />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={950} sx={{ overflowWrap: "anywhere", lineHeight: 1.05, fontSize: 13.8 }}>
          {metric.label}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.15, overflowWrap: "anywhere", lineHeight: 1.1, fontSize: 11.3 }}>
          {metric.shortLabel}
        </Typography>
        <Typography color="text.secondary" fontWeight={850} sx={{ mt: 0.25, overflowWrap: "anywhere", lineHeight: 1.05, fontSize: 10.8 }}>
          {formatInventoryCount(metric.value.units)} {metric.unitsLabel}
        </Typography>
      </Box>
      <Typography fontWeight={950} sx={{ lineHeight: 1, letterSpacing: -0.28, fontSize: { xs: 23, md: 26 }, textAlign: "right" }}>
        {formatInventoryCount(metric.value.count)}
      </Typography>
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
        "& .MuiTabs-indicator": { height: 3, borderRadius: 999 },
        "& .MuiTab-root": {
          minHeight: 32,
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.16),
          borderRadius: 999,
          color: "text.secondary",
          fontSize: 12.2,
          fontWeight: 850,
          gap: 0.55,
          mr: 0.7,
          minWidth: "auto",
          px: 1.15,
          textTransform: "none",
          "&.Mui-selected": {
            color: "primary.main",
            bgcolor: alpha(theme.palette.primary.main, 0.14),
            borderColor: alpha(theme.palette.primary.main, 0.36),
          },
        },
      })}
    >
      {availableTabs.map((tab) => {
        const Icon = tab.icon;
        return <Tab key={tab.value} value={tab.value} icon={<Icon sx={{ fontSize: 15 }} />} iconPosition="start" label={tab.label} />;
      })}
    </Tabs>
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
      icon: KeyboardArrowDownIcon,
      label: "Entradas",
      shortLabel: "Stock recibido",
      unitsLabel: "recibidas",
      value: summary.entries,
    },
    {
      color: "error",
      icon: KeyboardArrowUpIcon,
      label: "Salidas",
      shortLabel: "Retiros y merma",
      unitsLabel: "retiradas",
      value: summary.exits,
    },
    {
      color: "primary",
      icon: ShoppingCartIcon,
      label: "Ventas",
      shortLabel: "Stock vendido",
      unitsLabel: "vendidas",
      value: summary.sales,
    },
    {
      color: "secondary",
      icon: KeyboardReturnIcon,
      label: "Devoluciones",
      shortLabel: "Stock devuelto",
      unitsLabel: "devueltas",
      value: summary.returns,
    },
  ];
}

function formatInventoryCount(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

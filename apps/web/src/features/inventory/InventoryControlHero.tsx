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

type PanelTone = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type MovementMetric = {
  color: PanelTone;
  helper: string;
  icon: ElementType;
  label: string;
  unitsLabel: string;
  value: {
    count: number;
    units: number;
  };
};

const viewTabs: Array<{
  icon: ElementType;
  label: string;
  value: InventoryView;
  requiresAdjustment?: boolean;
}> = [
  { icon: Inventory2Icon, label: "Existencias", value: "stock" },
  { icon: AddCircleIcon, label: "Entradas", value: "entries", requiresAdjustment: true },
  { icon: RemoveCircleIcon, label: "Salidas", value: "exits", requiresAdjustment: true },
  { icon: HistoryIcon, label: "Historial", value: "movements" },
];

const panelSx = (theme: Theme) => ({
  minWidth: 0,
  border: 1,
  borderColor: alpha(theme.palette.primary.main, 0.14),
  borderRadius: { xs: 3, md: 4 },
  bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.2 : 0.86),
  boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.04 : 0.56)}`,
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
        borderColor: alpha(theme.palette.primary.main, 0.18),
        borderRadius: { xs: 3, md: 4.5 },
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 16% 0%, ${alpha(theme.palette.primary.main, 0.14)}, transparent 34%), radial-gradient(circle at 88% 8%, ${alpha(
                theme.palette.success.main,
                0.1,
              )}, transparent 28%), ${alpha(theme.palette.background.paper, 0.94)}`
            : `radial-gradient(circle at 16% 0%, ${alpha(theme.palette.primary.light, 0.18)}, transparent 34%), radial-gradient(circle at 88% 8%, ${alpha(
                theme.palette.success.light,
                0.16,
              )}, transparent 28%), ${alpha(theme.palette.background.paper, 0.98)}`,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 22px 70px ${alpha(theme.palette.common.black, 0.3)}`
            : `0 22px 70px ${alpha(theme.palette.primary.main, 0.1)}`,
      })}
    >
      <CardContent
        sx={{
          p: { xs: 1.5, sm: 2, md: 2.25 },
          "&:last-child": { pb: { xs: 1.5, sm: 2, md: 2.25 } },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.5, lg: 2 },
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(500px, 0.48fr) minmax(620px, 0.52fr)",
            },
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
    ? "Hay ubicaciones sin unidades. Revisa almacenes antes de reponer."
    : hasAttention
      ? "Hay ubicaciones cerca del mínimo. Prioriza reposición por almacén."
      : "No hay alertas críticas visibles en las existencias actuales.";

  return (
    <Box
      sx={(theme) => ({
        ...panelSx(theme),
        p: { xs: 1.5, sm: 1.75, md: 2 },
        display: "grid",
        gridTemplateRows: "auto auto auto",
        gap: { xs: 1.25, sm: 1.5 },
      })}
    >
      <Stack spacing={0.85} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            aria-hidden="true"
            sx={(theme) => ({
              display: "grid",
              placeItems: "center",
              width: { xs: 38, sm: 42 },
              height: { xs: 38, sm: 42 },
              flex: "0 0 auto",
              borderRadius: 2.5,
              color: "primary.main",
              bgcolor: alpha(theme.palette.primary.main, 0.12),
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.2),
            })}
          >
            <HistoryIcon fontSize="small" />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              component="h2"
              variant="h4"
              fontWeight={950}
              sx={{
                letterSpacing: -0.5,
                lineHeight: 1.05,
                fontSize: { xs: 23, sm: 27, md: 30 },
                overflowWrap: "anywhere",
              }}
            >
              Control de inventario
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 0.45, fontSize: { xs: 13.2, sm: 14 }, lineHeight: 1.38 }}>
              {canAdjustInventory
                ? "Consulta existencias y registra ajustes de entrada o salida cuando el almacén lo requiera."
                : "Consulta existencias, alertas e historial operativo. Los ajustes requieren permiso administrativo."}
            </Typography>
          </Box>
        </Stack>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) minmax(150px, 0.34fr)" },
          gap: { xs: 1, sm: 1.15 },
          alignItems: "stretch",
        }}
      >
        <StockAttentionCard tone={tone} title={statusTitle} description={statusCopy} />
        <TotalUnitsCard units={summary.units} />
      </Box>

      <InventoryViewTabs
        activeView={activeView}
        availableTabs={availableTabs}
        onViewChange={onViewChange}
      />
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
        minHeight: 40,
        borderTop: 1,
        borderColor: alpha(theme.palette.primary.main, 0.1),
        pt: 1,
        "& .MuiTabs-indicator": {
          height: 3,
          borderRadius: 999,
        },
        "& .MuiTab-root": {
          minHeight: 36,
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.14),
          borderRadius: 999,
          color: "text.secondary",
          fontSize: 13,
          fontWeight: 850,
          gap: 0.65,
          mr: 0.8,
          minWidth: "auto",
          px: 1.35,
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
        return (
          <Tab
            key={tab.value}
            value={tab.value}
            icon={<Icon sx={{ fontSize: 18 }} />}
            iconPosition="start"
            label={tab.label}
          />
        );
      })}
    </Tabs>
  );
}

function StockAttentionCard({
  description,
  title,
  tone,
}: {
  description: string;
  title: string;
  tone: "error" | "warning" | "success";
}) {
  return (
    <Box
      sx={(theme) => ({
        minWidth: 0,
        minHeight: { xs: 104, sm: 112 },
        border: 1,
        borderColor: alpha(theme.palette[tone].main, 0.28),
        borderRadius: 3,
        p: { xs: 1.25, sm: 1.45 },
        display: "grid",
        gridTemplateColumns: "42px minmax(0, 1fr)",
        gap: 1.1,
        alignItems: "center",
        bgcolor: alpha(theme.palette[tone].main, theme.palette.mode === "dark" ? 0.07 : 0.04),
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.14)}, transparent 58%), ${alpha(
                theme.palette.background.paper,
                0.13,
              )}`
            : `linear-gradient(135deg, ${alpha(theme.palette[tone].main, 0.1)}, transparent 58%), ${alpha(
                theme.palette.background.paper,
                0.78,
              )}`,
      })}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 42,
          height: 42,
          borderRadius: 2.5,
          color: theme.palette[tone].contrastText,
          bgcolor: theme.palette[tone].main,
          boxShadow: `0 14px 28px ${alpha(theme.palette[tone].main, 0.22)}`,
        })}
      >
        <ReportProblemIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={950} sx={{ letterSpacing: 0.45, textTransform: "uppercase" }}>
          Estado de existencias
        </Typography>
        <Typography fontWeight={950} sx={{ mt: 0.15, lineHeight: 1.12, overflowWrap: "anywhere", fontSize: { xs: 16, sm: 17 } }}>
          {title}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.35, fontSize: { xs: 12.6, sm: 13.2 }, lineHeight: 1.35 }}>
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
        minHeight: { xs: 96, sm: 112 },
        border: 1,
        borderColor: alpha(theme.palette.info.main, 0.22),
        borderRadius: 3,
        p: { xs: 1.2, sm: 1.35 },
        display: "grid",
        gridTemplateColumns: { xs: "40px minmax(0, 1fr)", sm: "1fr" },
        gap: { xs: 1, sm: 0.6 },
        alignItems: "center",
        bgcolor: alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.075 : 0.04),
        background: `linear-gradient(135deg, ${alpha(theme.palette.info.main, 0.12)}, transparent 62%)`,
      })}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: 2.5,
          color: "info.main",
          bgcolor: alpha(theme.palette.info.main, 0.13),
        })}
      >
        <LocalShippingIcon fontSize="small" />
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 0.95, letterSpacing: -0.35 }}>
          {units}
        </Typography>
        <Typography fontWeight={950} sx={{ mt: 0.2, lineHeight: 1.08 }}>
          Unidades totales
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.3, lineHeight: 1.25 }}>
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
        ...panelSx(theme),
        p: { xs: 1.5, sm: 1.75, md: 2 },
        display: "grid",
        gridTemplateRows: "auto auto",
        gap: { xs: 1.25, sm: 1.5 },
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.main, 0.18)}, transparent 36%), ${alpha(
                theme.palette.background.paper,
                0.16,
              )}`
            : `radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.main, 0.13)}, transparent 36%), ${alpha(
                theme.palette.background.paper,
                0.82,
              )}`,
      })}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "minmax(0, 1fr) auto" },
          gap: 1.2,
          alignItems: "center",
        }}
      >
        <Stack direction="row" spacing={1.1} alignItems="center" sx={{ minWidth: 0 }}>
          <Box
            sx={(theme) => ({
              display: "grid",
              placeItems: "center",
              flex: "0 0 auto",
              width: { xs: 40, sm: 44 },
              height: { xs: 40, sm: 44 },
              borderRadius: 2.7,
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
              sx={{
                lineHeight: 1.02,
                letterSpacing: -0.6,
                fontSize: { xs: 26, sm: 31, md: 34 },
                overflowWrap: "anywhere",
              }}
            >
              Movimientos
            </Typography>
            <Typography color="text.secondary" fontWeight={800} sx={{ mt: 0.35, fontSize: { xs: 12.8, sm: 13.4 } }}>
              Entradas, salidas, ventas y devoluciones registradas.
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={(theme) => ({
            minWidth: { xs: "100%", sm: 136 },
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.2),
            borderRadius: 2.8,
            px: 1.45,
            py: 1.1,
            textAlign: { xs: "left", sm: "center" },
            bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.18 : 0.58),
          })}
        >
          <Typography variant="h3" fontWeight={950} sx={{ lineHeight: 0.9, letterSpacing: -0.7 }}>
            {summary.total}
          </Typography>
          <Typography variant="body2" color="text.secondary" fontWeight={850} sx={{ mt: 0.45 }}>
            Total movimientos
          </Typography>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gap: { xs: 1, sm: 1.15 },
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, minmax(0, 1fr))" },
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
        minHeight: { xs: 104, md: 112 },
        border: 1,
        borderColor: alpha(theme.palette[metric.color].main, 0.3),
        borderRadius: 3,
        p: { xs: 1.2, sm: 1.35 },
        display: "grid",
        gridTemplateColumns: "40px minmax(0, 1fr) auto",
        gap: 1,
        alignItems: "center",
        overflow: "hidden",
        bgcolor: alpha(theme.palette[metric.color].main, theme.palette.mode === "dark" ? 0.06 : 0.035),
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.13)}, transparent 58%), ${alpha(
                theme.palette.background.default,
                0.18,
              )}`
            : `linear-gradient(135deg, ${alpha(theme.palette[metric.color].main, 0.09)}, transparent 58%), ${alpha(
                theme.palette.background.paper,
                0.82,
              )}`,
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
      <Box
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          width: 38,
          height: 38,
          borderRadius: 2.5,
          color: theme.palette[metric.color].main,
          bgcolor: alpha(theme.palette[metric.color].main, 0.13),
          border: 1,
          borderColor: alpha(theme.palette[metric.color].main, 0.22),
        })}
      >
        <Icon fontSize="small" />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography fontWeight={950} sx={{ lineHeight: 1.08, fontSize: { xs: 15.5, sm: 16.5 }, overflowWrap: "anywhere" }}>
          {metric.label}
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.25, fontSize: { xs: 12.2, sm: 12.8 }, lineHeight: 1.25 }}>
          {metric.helper}
        </Typography>
        <Typography fontWeight={900} sx={{ mt: 0.65, fontSize: { xs: 13.5, sm: 14.5 }, lineHeight: 1.15 }}>
          {metric.value.units} {metric.unitsLabel}
        </Typography>
      </Box>

      <Typography variant="h4" fontWeight={950} sx={{ lineHeight: 1, letterSpacing: -0.45, textAlign: "right" }}>
        {metric.value.count}
      </Typography>
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
      helper: "Reposición o ingreso",
      icon: KeyboardArrowDownIcon,
      label: "Entradas",
      unitsLabel: "recibidas",
      value: summary.entries,
    },
    {
      color: "error",
      helper: "Retiros, ajustes o merma",
      icon: KeyboardArrowUpIcon,
      label: "Salidas",
      unitsLabel: "retiradas",
      value: summary.exits,
    },
    {
      color: "primary",
      helper: "Descuento por venta",
      icon: ShoppingCartIcon,
      label: "Ventas",
      unitsLabel: "vendidas",
      value: summary.sales,
    },
    {
      color: "secondary",
      helper: "Reintegro al inventario",
      icon: KeyboardReturnIcon,
      label: "Devoluciones",
      unitsLabel: "devueltas",
      value: summary.returns,
    },
  ];
}

import type { ElementType } from "react";

import { Box, Card, CardContent, Stack, Tab, Tabs, Typography } from "@mui/material";
import { alpha, type Theme, useTheme } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import HistoryIcon from "@mui/icons-material/History";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import OutboxIcon from "@mui/icons-material/Outbox";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import SyncIcon from "@mui/icons-material/Sync";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import type { InventoryView, Movement, StockItem } from "./inventoryShared";
import { getInventoryStockSummary } from "./inventoryShared";

type Tone = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type MovementMetric = {
  color: Tone;
  count: number;
  icon: ElementType;
  impact: "Aumenta existencias" | "Reduce existencias";
  label: string;
  units: number;
};

type StatusSignal = {
  action: string;
  count: number;
  description: string;
  icon: ElementType;
  label: string;
  tone: Extract<Tone, "success" | "warning" | "error">;
};

const viewTabs: Array<{
  icon: ElementType;
  label: string;
  requiresAdjustment?: boolean;
  requiresTransferRequests?: boolean;
  value: InventoryView;
}> = [
  { icon: Inventory2Icon, label: "Existencias", value: "stock" },
  { icon: AddCircleIcon, label: "Entradas", value: "entries", requiresAdjustment: true },
  { icon: RemoveCircleIcon, label: "Salidas", value: "exits", requiresAdjustment: true },
  { icon: HistoryIcon, label: "Historial", value: "movements" },
  { icon: LocalShippingIcon, label: "Asignaciones", value: "transfers", requiresTransferRequests: true },
];

const heroShellSx = (theme: Theme) => ({
  mb: 2,
  overflow: "hidden",
  border: 1,
  borderColor: alpha(theme.palette.primary.main, 0.22),
  borderRadius: { xs: 3, md: 4 },
  background:
    theme.palette.mode === "dark"
      ? `radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.main, 0.26)}, transparent 34%), linear-gradient(135deg, ${alpha(
          theme.palette.background.paper,
          0.92,
        )}, ${alpha(theme.palette.background.default, 0.88)})`
      : `radial-gradient(circle at 0% 0%, ${alpha(theme.palette.primary.light, 0.22)}, transparent 34%), linear-gradient(135deg, ${alpha(
          theme.palette.common.white,
          0.98,
        )}, ${alpha(theme.palette.background.default, 0.72)})`,
  boxShadow:
    theme.palette.mode === "dark"
      ? `0 18px 50px ${alpha(theme.palette.common.black, 0.24)}`
      : `0 18px 50px ${alpha(theme.palette.primary.main, 0.08)}`,
});

export function InventoryControlHero({
  activeView,
  canAdjustInventory,
  canManageTransferRequests,
  movements,
  onViewChange,
  stockRows,
}: {
  activeView: InventoryView;
  canAdjustInventory: boolean;
  canManageTransferRequests: boolean;
  movements: Movement[];
  onViewChange: (value: InventoryView) => void;
  stockRows: StockItem[];
}) {
  const stockSummary = getInventoryStockSummary(stockRows);
  const movementSummary = getMovementSummary(movements);
  const statusSignals = getStatusSignals(stockSummary);
  const movementMetrics = getMovementMetrics(movementSummary);
  const availableTabs = viewTabs.filter((tab) => {
    if (tab.requiresAdjustment && !canAdjustInventory) return false;
    if (tab.requiresTransferRequests && !canManageTransferRequests) return false;

    return true;
  });

  return (
    <Card data-testid="inventory-visual-dashboard" sx={heroShellSx}>
      <CardContent sx={{ p: { xs: 1.5, sm: 2 }, "&:last-child": { pb: { xs: 1.5, sm: 2 } } }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography component="h2" fontWeight={950} letterSpacing="-0.03em" variant="h5">
              Estado y movimientos
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Señales para decidir qué vender, reponer o revisar sin repetir los datos de la tabla.
            </Typography>
          </Box>

          <Box
            sx={{
              display: "grid",
              gap: 1.15,
              gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 0.92fr) minmax(0, 1.08fr)" },
            }}
          >
            <InventoryHealthGauge statusSignals={statusSignals} totalProducts={stockSummary.total} />
            <InventoryMovementsPanel metrics={movementMetrics} />
          </Box>

          <Box
            sx={(theme) => ({
              pt: 1.05,
              borderTop: 1,
              borderColor: alpha(theme.palette.primary.main, 0.16),
            })}
          >
            <InventoryViewTabs activeView={activeView} availableTabs={availableTabs} onViewChange={onViewChange} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function IconTile({ icon: Icon, size = 42, tone }: { icon: ElementType; size?: number; tone: Tone }) {
  const theme = useTheme();
  const color = toneMain(theme, tone);

  return (
    <Box
      aria-hidden="true"
      sx={{
        background: `radial-gradient(circle at 30% 20%, ${alpha(color, 0.28)}, ${alpha(color, 0.08)} 68%)`,
        border: "1px solid",
        borderColor: alpha(color, 0.28),
        borderRadius: size > 44 ? 3.25 : 2.4,
        boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, 0.04)}`,
        color,
        display: "grid",
        flex: `0 0 ${size}px`,
        height: size,
        placeItems: "center",
        width: size,
      }}
    >
      <Icon sx={{ fontSize: Math.round(size * 0.56) }} />
    </Box>
  );
}

function MetricPill({ label, tone, value }: { label: string; tone: Tone; value: string }) {
  const theme = useTheme();
  const color = toneMain(theme, tone);

  return (
    <Box
      sx={{
        alignItems: "center",
        backgroundColor: alpha(color, 0.085),
        border: "1px solid",
        borderColor: alpha(color, 0.18),
        borderRadius: 2.2,
        display: "grid",
        gap: 0.55,
        gridTemplateColumns: "auto auto",
        minHeight: 30,
        px: 0.85,
        py: 0.55,
      }}
    >
      <Typography color="text.secondary" fontSize={10} fontWeight={900} lineHeight={1} textTransform="uppercase">
        {label}
      </Typography>
      <Typography color={color} fontSize={15} fontWeight={950} lineHeight={1}>
        {value}
      </Typography>
    </Box>
  );
}

function InventoryHealthGauge({
  statusSignals,
  totalProducts,
}: {
  statusSignals: StatusSignal[];
  totalProducts: number;
}) {
  const theme = useTheme();
  const healthy = theme.palette.success.main;
  const warning = theme.palette.warning.main;
  const error = theme.palette.error.main;
  const signalTotal = Math.max(statusSignals.reduce((sum, signal) => sum + signal.count, 0), 1);
  const availableDegrees = Math.round((statusSignals[0].count / signalTotal) * 360);
  const lowDegrees = Math.round((statusSignals[1].count / signalTotal) * 360);
  const lowEnd = Math.min(availableDegrees + lowDegrees, 360);

  return (
    <Box
      sx={{
        alignItems: "stretch",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(140deg, rgba(15, 23, 42, 0.78), rgba(15, 23, 42, 0.42))"
            : "linear-gradient(140deg, rgba(255, 255, 255, 0.96), rgba(248, 250, 252, 0.82))",
        border: "1px solid",
        borderColor: alpha(theme.palette.success.main, 0.2),
        borderRadius: 3.2,
        display: "grid",
        gap: { xs: 1.2, sm: 1.45 },
        gridTemplateColumns: { xs: "1fr", sm: "178px minmax(0, 1fr)" },
        p: { xs: 1.15, sm: 1.3 },
      }}
    >
      <Stack alignItems="center" justifyContent="center" spacing={0.75}>
        <Box
          sx={{
            alignItems: "center",
            background: `conic-gradient(${healthy} 0deg ${availableDegrees}deg, ${warning} ${availableDegrees}deg ${lowEnd}deg, ${error} ${lowEnd}deg 360deg)`,
            borderRadius: "50%",
            boxShadow: `0 18px 44px ${alpha(theme.palette.success.main, 0.18)}`,
            display: "grid",
            height: { xs: 140, sm: 156 },
            justifyItems: "center",
            position: "relative",
            width: { xs: 140, sm: 156 },
            "&::after": {
              backgroundColor: theme.palette.background.paper,
              borderRadius: "50%",
              boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.divider, 0.5)}`,
              content: '""',
              height: "68%",
              position: "absolute",
              width: "68%",
            },
          }}
        >
          <Stack alignItems="center" spacing={0.05} sx={{ position: "relative", zIndex: 1 }}>
            <Typography color="success.main" fontSize={36} fontWeight={950} lineHeight={0.95}>
              {formatInventoryCount(totalProducts)}
            </Typography>
            <Typography color="text.secondary" fontSize={11} fontWeight={900} letterSpacing="0.08em" textTransform="uppercase">
              productos
            </Typography>
          </Stack>
        </Box>
        <Typography color="text.secondary" fontSize={11.5} fontWeight={800} textAlign="center">
          Salud general del inventario visible
        </Typography>
      </Stack>

      <Stack justifyContent="center" spacing={0.72}>
        {statusSignals.map((signal) => (
          <SignalRow key={signal.label} signal={signal} />
        ))}
      </Stack>
    </Box>
  );
}

function SignalRow({ signal }: { signal: StatusSignal }) {
  const theme = useTheme();
  const color = toneMain(theme, signal.tone);
  const Icon = signal.icon;

  return (
    <Box
      sx={{
        alignItems: "center",
        backgroundColor: alpha(color, 0.075),
        border: "1px solid",
        borderColor: alpha(color, 0.16),
        borderRadius: 2.2,
        display: "grid",
        gap: 0.75,
        gridTemplateColumns: "32px minmax(0, 1fr) auto",
        minHeight: 44,
        px: 0.85,
        py: 0.55,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          backgroundColor: alpha(color, 0.13),
          borderRadius: "50%",
          color,
          display: "grid",
          height: 32,
          placeItems: "center",
          width: 32,
        }}
      >
        <Icon sx={{ fontSize: 18 }} />
      </Box>
      <Box minWidth={0}>
        <Typography fontSize={13} fontWeight={950} lineHeight={1.05} noWrap>
          {signal.label}
        </Typography>
        <Typography color="text.secondary" fontSize={10.5} fontWeight={750} lineHeight={1.1} noWrap>
          {signal.description}
        </Typography>
      </Box>
      <Stack alignItems="flex-end" spacing={0.05}>
        <Typography color={color} fontSize={18} fontWeight={950} lineHeight={1}>
          {formatInventoryCount(signal.count)}
        </Typography>
        <Typography color="text.secondary" fontSize={9.5} fontWeight={900} lineHeight={1}>
          {signal.action}
        </Typography>
      </Stack>
    </Box>
  );
}

function InventoryMovementsPanel({ metrics }: { metrics: MovementMetric[] }) {
  const theme = useTheme();
  const totalMovements = metrics.reduce((sum, item) => sum + item.count, 0);
  const totalUnits = metrics.reduce((sum, item) => sum + item.units, 0);
  return (
    <Box
      sx={{
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 44%), rgba(15, 23, 42, 0.48)"
            : "radial-gradient(circle at top left, rgba(37, 99, 235, 0.1), transparent 44%), rgba(255, 255, 255, 0.8)",
        border: "1px solid",
        borderColor: alpha(theme.palette.primary.main, 0.16),
        borderRadius: 3.5,
        p: { xs: 1, md: 1.15 },
      }}
    >
      <Stack spacing={0.95}>
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
        >
          <Stack direction="row" spacing={0.9} alignItems="center">
            <Box sx={{ mt: 0.35 }}>
              <IconTile icon={SyncIcon} size={40} tone="primary" />
            </Box>
            <Box>
              <Typography fontWeight={950} letterSpacing="-0.025em" variant="subtitle1">
                Movimientos
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Entradas, salidas, ventas y devoluciones que cambiaron el stock.
              </Typography>
            </Box>
          </Stack>
          <Stack
            direction="row"
            flexWrap="nowrap"
            gap={0.65}
            sx={{ alignSelf: "flex-start", ml: "auto" }}
          >
            <MetricPill label="Movimientos" tone="primary" value={formatInventoryCount(totalMovements)} />
            <MetricPill label="Unidades" tone="info" value={formatInventoryCount(totalUnits)} />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 0.75,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {metrics.map((item) => {
            const color = toneMain(theme, item.color);
            const Icon = item.icon;

            return (
              <Box
                key={item.label}
                sx={{
                  alignItems: "center",
                  background: `linear-gradient(150deg, ${alpha(color, 0.13)}, ${alpha(theme.palette.background.paper, 0.42)})`,
                  border: "1px solid",
                  borderColor: alpha(color, 0.22),
                  borderLeft: "3px solid",
                  borderLeftColor: color,
                  borderRadius: 2.5,
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr) minmax(76px, 38%)",
                  minHeight: 86,
                  overflow: "hidden",
                  p: 1,
                  position: "relative",
                }}
              >
                <Icon
                  sx={{
                    color: alpha(color, 0.1),
                    fontSize: 72,
                    position: "absolute",
                    right: -9,
                    top: "50%",
                    transform: "translateY(-50%)",
                  }}
                />

                <Stack alignItems="center" direction="row" spacing={0.95} sx={{ minWidth: 0, position: "relative", zIndex: 1 }}>
                  <IconTile icon={item.icon} size={42} tone={item.color} />
                  <Box minWidth={0}>
                    <Typography fontSize={14.5} fontWeight={950} lineHeight={1.1} noWrap>
                      {item.label}
                    </Typography>
                    <Typography color="text.secondary" fontSize={11.2} fontWeight={800} lineHeight={1.2} noWrap>
                      {item.impact}
                    </Typography>
                  </Box>
                </Stack>

                <Stack alignItems="center" justifyContent="center" spacing={0.25} sx={{ minHeight: 58, position: "relative", zIndex: 1 }}>
                  <Typography color={color} fontSize={26} fontWeight={950} lineHeight={1} textAlign="center">
                    {formatInventoryCount(item.count)}
                  </Typography>
                  <Typography color="text.secondary" fontSize={11.5} fontWeight={850} lineHeight={1.1} textAlign="center" noWrap>
                    movimientos · {formatInventoryCount(item.units)}
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Box>
      </Stack>
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

function getStatusSignals(summary: ReturnType<typeof getInventoryStockSummary>): StatusSignal[] {
  return [
    {
      action: "Operable",
      count: summary.available,
      description: "Productos con unidades para vender.",
      icon: CheckCircleIcon,
      label: "Disponible",
      tone: "success",
    },
    {
      action: "Revisar",
      count: summary.lowStock,
      description: "Productos en o debajo del mínimo.",
      icon: WarningAmberIcon,
      label: "Stock bajo",
      tone: "warning",
    },
    {
      action: "Urgente",
      count: summary.outOfStock,
      description: "Productos sin unidades visibles.",
      icon: ErrorOutlineIcon,
      label: "Sin stock",
      tone: "error",
    },
  ];
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
      count: summary.entries.count,
      icon: MoveToInboxIcon,
      impact: "Aumenta existencias",
      label: "Entradas",
      units: summary.entries.units,
    },
    {
      color: "error",
      count: summary.exits.count,
      icon: OutboxIcon,
      impact: "Reduce existencias",
      label: "Salidas",
      units: summary.exits.units,
    },
    {
      color: "primary",
      count: summary.sales.count,
      icon: PointOfSaleIcon,
      impact: "Reduce existencias",
      label: "Ventas",
      units: summary.sales.units,
    },
    {
      color: "secondary",
      count: summary.returns.count,
      icon: KeyboardReturnIcon,
      impact: "Aumenta existencias",
      label: "Devoluciones",
      units: summary.returns.units,
    },
  ];
}

function toneMain(theme: Theme, tone: Tone) {
  return theme.palette[tone].main;
}

function formatInventoryCount(value: number) {
  return new Intl.NumberFormat("es-MX").format(Math.max(Number(value) || 0, 0));
}

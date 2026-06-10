import type { ElementType, ReactNode } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, type SxProps, type Theme, useTheme } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import HistoryIcon from "@mui/icons-material/History";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import MoveToInboxIcon from "@mui/icons-material/MoveToInbox";
import OutboxIcon from "@mui/icons-material/Outbox";
import PersonIcon from "@mui/icons-material/Person";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import SyncIcon from "@mui/icons-material/Sync";
import WarehouseIcon from "@mui/icons-material/Warehouse";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { pvVisualTokens } from "../../design-lab/pvVisualTokens";
import { CategoryPill } from "../products/categoryVisuals";

type Tone = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type InventoryRow = {
  action: "Mover" | "Reponer";
  category: string;
  minimumStock: number;
  name: string;
  sku: string;
  status: "Disponible" | "Stock bajo" | "Sin stock";
  stock: number;
  tone: Extract<Tone, "success" | "warning" | "error">;
  warehouses: Array<{
    label: string;
    stock: number;
    type: "main" | "seller";
  }>;
};

type MovementStat = {
  count: number;
  icon: ElementType;
  impact: "Aumenta existencias" | "Reduce existencias";
  label: string;
  tone: Tone;
  units: number;
};

const inventoryRows: InventoryRow[] = [
  {
    action: "Mover",
    category: "Bebidas frías",
    minimumStock: 24,
    name: "Coca-Cola 600 ml",
    sku: "BEB-COCA-600",
    status: "Disponible",
    stock: 72,
    tone: "success",
    warehouses: [
      { label: "Principal", stock: 42, type: "main" },
      { label: "Ana", stock: 18, type: "seller" },
      { label: "Luis", stock: 12, type: "seller" },
    ],
  },
  {
    action: "Reponer",
    category: "Snacks",
    minimumStock: 12,
    name: "Sabritas Original 45 g",
    sku: "BOT-SAB-045",
    status: "Stock bajo",
    stock: 8,
    tone: "warning",
    warehouses: [
      { label: "Principal", stock: 5, type: "main" },
      { label: "Ana", stock: 3, type: "seller" },
      { label: "Luis", stock: 0, type: "seller" },
    ],
  },
  {
    action: "Mover",
    category: "Abarrotes",
    minimumStock: 36,
    name: "Agua natural 1 L",
    sku: "DEMO-AGUA-1L",
    status: "Disponible",
    stock: 1957,
    tone: "success",
    warehouses: [
      { label: "DEMO Almacén Principal", stock: 859, type: "main" },
      { label: "DEMO Almacén Norte", stock: 29, type: "main" },
      { label: "Bodega Centro", stock: 80, type: "main" },
      { label: "Ana", stock: 332, type: "seller" },
      { label: "Luis", stock: 0, type: "seller" },
      { label: "Carlos", stock: 74, type: "seller" },
      { label: "Ruta Norte", stock: 228, type: "seller" },
      { label: "Ruta Centro", stock: 248, type: "seller" },
      { label: "Ruta Sur", stock: 107, type: "seller" },
    ],
  },
];

const movementStats: MovementStat[] = [
  { count: 38, icon: MoveToInboxIcon, impact: "Aumenta existencias", label: "Entradas", tone: "success", units: 516 },
  { count: 14, icon: OutboxIcon, impact: "Reduce existencias", label: "Salidas", tone: "error", units: 196 },
  { count: 41, icon: PointOfSaleIcon, impact: "Reduce existencias", label: "Ventas", tone: "primary", units: 392 },
  { count: 3, icon: KeyboardReturnIcon, impact: "Aumenta existencias", label: "Devoluciones", tone: "secondary", units: 28 },
];

const statusSignals = [
  {
    action: "Operable",
    count: 18,
    description: "Productos con unidades suficientes para vender.",
    icon: CheckCircleIcon,
    label: "Disponible",
    tone: "success" as const,
  },
  {
    action: "Revisar",
    count: 5,
    description: "Productos en o debajo del mínimo definido.",
    icon: WarningAmberIcon,
    label: "Stock bajo",
    tone: "warning" as const,
  },
  {
    action: "Urgente",
    count: 2,
    description: "Productos sin unidades, visibles para auditoría.",
    icon: ErrorOutlineIcon,
    label: "Sin stock",
    tone: "error" as const,
  },
];

const inventoryNavItems = [
  { icon: Inventory2Icon, label: "Existencias", tone: "primary" as const },
  { icon: AddCircleIcon, label: "Entradas", tone: "success" as const },
  { icon: RemoveCircleIcon, label: "Salidas", tone: "error" as const },
  { icon: HistoryIcon, label: "Historial", tone: "secondary" as const },
  { icon: LocalShippingIcon, label: "Retiros", tone: "info" as const },
];

function formatNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(value);
}

function toneMain(theme: Theme, tone: Tone) {
  return theme.palette[tone].main;
}

function Surface({ children, sx }: { children: ReactNode; sx?: SxProps<Theme> }) {
  return (
    <Card
      sx={[
        {
          borderRadius: `${pvVisualTokens.layout.cardRadius}px`,
          overflow: "hidden",
        },
        ...(sx ? (Array.isArray(sx) ? sx : [sx]) : []),
      ]}
    >
      <CardContent sx={{ p: { xs: 1.6, md: 2.2 } }}>{children}</CardContent>
    </Card>
  );
}

function SectionHeader({ description, eyebrow, title }: { description: string; eyebrow: string; title: string }) {
  return (
    <Stack spacing={0.75}>
      <Typography color="primary.main" fontWeight={850} letterSpacing="0.08em" textTransform="uppercase" variant="caption">
        {eyebrow}
      </Typography>
      <Typography component="h2" fontWeight={900} letterSpacing="-0.035em" variant="h4">
        {title}
      </Typography>
      <Typography color="text.secondary" sx={{ maxWidth: 920 }} variant="body1">
        {description}
      </Typography>
    </Stack>
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

function HealthGauge() {
  const theme = useTheme();
  const healthy = theme.palette.success.main;
  const warning = theme.palette.warning.main;
  const error = theme.palette.error.main;
  const totalSignals = statusSignals.reduce((sum, signal) => sum + signal.count, 0);

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
            background: `conic-gradient(${healthy} 0deg 259deg, ${warning} 259deg 331deg, ${error} 331deg 360deg)`,
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
          <Stack alignItems="center" spacing={0.15} sx={{ position: "relative", zIndex: 1 }}>
            <Typography fontSize={{ xs: 34, sm: 38 }} fontWeight={950} lineHeight={1}>
              72%
            </Typography>
            <Typography color="text.secondary" fontSize={10.5} fontWeight={850} letterSpacing="0.08em" textTransform="uppercase">
              saludable
            </Typography>
          </Stack>
        </Box>
        <Typography color="text.secondary" fontSize={11.5} fontWeight={800} textAlign="center">
          Salud general del inventario
        </Typography>
      </Stack>

      <Stack justifyContent="center" spacing={0.85}>
        <Box>
          <Typography fontWeight={950} letterSpacing="-0.025em" variant="subtitle1">
            Estado operativo
          </Typography>
          <Typography color="text.secondary" fontSize={12.25}>
            Lectura rápida por nivel de atención: vender, revisar o reponer.
          </Typography>
        </Box>

        <Stack spacing={0.68}>
          {statusSignals.map((signal) => {
            const color = toneMain(theme, signal.tone);
            const Icon = signal.icon;
            const percentage = Math.round((signal.count / totalSignals) * 100);

            return (
              <Box
                key={signal.label}
                sx={{
                  alignItems: "center",
                  backgroundColor: alpha(color, 0.07),
                  border: "1px solid",
                  borderColor: alpha(color, 0.17),
                  borderRadius: 2.4,
                  display: "grid",
                  gap: 0.9,
                  gridTemplateColumns: "34px minmax(0, 1fr) auto",
                  minHeight: 52,
                  px: 1,
                  py: 0.7,
                }}
              >
                <Box sx={{ color, display: "grid", placeItems: "center" }}>
                  <Icon fontSize="small" />
                </Box>
                <Box minWidth={0}>
                  <Typography fontSize={13.5} fontWeight={950} lineHeight={1.15} noWrap>
                    {signal.label}
                  </Typography>
                  <Typography color="text.secondary" fontSize={11.25} lineHeight={1.25} noWrap>
                    {signal.action} · {signal.description}
                  </Typography>
                </Box>
                <Stack alignItems="flex-end" spacing={0.1}>
                  <Typography color={color} fontSize={20} fontWeight={950} lineHeight={1}>
                    {signal.count}
                  </Typography>
                  <Typography color="text.secondary" fontSize={10.5} fontWeight={850}>
                    {percentage}%
                  </Typography>
                </Stack>
              </Box>
            );
          })}
        </Stack>
      </Stack>
    </Box>
  );
}

function MovementsPanel() {
  const theme = useTheme();
  const totalMovements = movementStats.reduce((sum, item) => sum + item.count, 0);
  const totalUnits = movementStats.reduce((sum, item) => sum + item.units, 0);
  const inflow = movementStats
    .filter((item) => item.impact === "Aumenta existencias")
    .reduce((sum, item) => sum + item.units, 0);
  const outflow = movementStats
    .filter((item) => item.impact === "Reduce existencias")
    .reduce((sum, item) => sum + item.units, 0);
  const net = inflow - outflow;

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
        <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" spacing={1}>
          <Stack direction="row" spacing={0.9}>
            <IconTile icon={SyncIcon} size={40} tone="primary" />
            <Box>
              <Typography fontWeight={950} letterSpacing="-0.025em" variant="subtitle1">
                Movimientos del periodo
              </Typography>
              <Typography color="text.secondary" variant="caption">
                Entradas, salidas, ventas y devoluciones que cambiaron el stock.
              </Typography>
            </Box>
          </Stack>
          <Stack direction="row" flexWrap="wrap" gap={0.65}>
            <MetricPill label="Movimientos" tone="primary" value={formatNumber(totalMovements)} />
            <MetricPill label="Unidades" tone="info" value={formatNumber(totalUnits)} />
            <MetricPill label="Neto" tone={net < 0 ? "error" : "success"} value={String(net)} />
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 0.75,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", xl: "repeat(4, minmax(0, 1fr))" },
          }}
        >
          {movementStats.map((item) => {
            const color = toneMain(theme, item.tone);
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

                <Stack
                  alignItems="center"
                  direction="row"
                  spacing={0.95}
                  sx={{ minWidth: 0, position: "relative", zIndex: 1 }}
                >
                  <IconTile icon={item.icon} size={42} tone={item.tone} />
                  <Box minWidth={0}>
                    <Typography fontSize={14.5} fontWeight={950} lineHeight={1.1} noWrap>
                      {item.label}
                    </Typography>
                    <Typography color="text.secondary" fontSize={11.2} fontWeight={800} lineHeight={1.2} noWrap>
                      {item.impact}
                    </Typography>
                  </Box>
                </Stack>

                <Stack
                  alignItems="center"
                  justifyContent="center"
                  spacing={0.25}
                  sx={{ minHeight: 58, position: "relative", zIndex: 1 }}
                >
                  <Typography color={color} fontSize={26} fontWeight={950} lineHeight={1} textAlign="center">
                    {item.count}
                  </Typography>
                  <Typography color="text.secondary" fontSize={11.5} fontWeight={850} lineHeight={1.1} textAlign="center" noWrap>
                    movimientos · {formatNumber(item.units)}
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

function InventoryOperationalPanel() {
  return (
    <Surface>
      <Stack spacing={1.25}>
        <Box>
          <Typography color="primary.main" fontWeight={850} letterSpacing="0.08em" textTransform="uppercase" variant="caption">
            Lectura rápida
          </Typography>
          <Typography fontWeight={950} letterSpacing="-0.03em" variant="h5">
            Estado y movimientos
          </Typography>
          <Typography color="text.secondary" variant="body2">
            Señales para decidir qué vender, reponer o revisar sin repetir los datos de la tabla.
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gap: 1.15, gridTemplateColumns: { xs: "1fr", lg: "minmax(0, 0.92fr) minmax(0, 1.08fr)" } }}>
          <HealthGauge />
          <MovementsPanel />
        </Box>
      </Stack>
    </Surface>
  );
}

function InventoryNav() {
  return (
    <Stack direction="row" flexWrap="wrap" gap={1}>
      {inventoryNavItems.map((item, index) => (
        <Button
          color={item.tone}
          key={item.label}
          startIcon={<item.icon />}
          sx={{ minHeight: pvVisualTokens.density.compactControlHeight, px: 1.7 }}
          variant={index === 0 ? "contained" : "outlined"}
        >
          {item.label}
        </Button>
      ))}
    </Stack>
  );
}

function getDistributionTone(warehouse: InventoryRow["warehouses"][number]): Tone {
  if (warehouse.stock === 0) {
    return "error";
  }

  return warehouse.type === "main" ? "info" : "secondary";
}

function getDistributionLabel(warehouse: InventoryRow["warehouses"][number]) {
  return warehouse.type === "main" ? `Almacén: ${warehouse.label}` : `Vendedor: ${warehouse.label}`;
}

function DistributionLocationLine({ warehouse }: { warehouse: InventoryRow["warehouses"][number] }) {
  const theme = useTheme();
  const tone = getDistributionTone(warehouse);
  const color = toneMain(theme, tone);
  const Icon = warehouse.type === "main" ? WarehouseIcon : PersonIcon;

  return (
    <Box
      sx={{
        alignItems: "center",
        background: alpha(color, theme.palette.mode === "dark" ? 0.11 : 0.08),
        border: "1px solid",
        borderColor: alpha(color, 0.26),
        borderRadius: 2.25,
        display: "grid",
        gap: 0.9,
        gridTemplateColumns: "30px minmax(0, 1fr) auto",
        minHeight: 34,
        px: 0.8,
        py: 0.55,
      }}
    >
      <Box
        sx={{
          alignItems: "center",
          background: alpha(color, 0.18),
          border: "1px solid",
          borderColor: alpha(color, 0.28),
          borderRadius: "50%",
          color,
          display: "grid",
          height: 28,
          justifyContent: "center",
          width: 28,
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </Box>
      <Typography color="text.primary" fontSize={12.25} fontWeight={850} lineHeight={1.15} noWrap>
        {getDistributionLabel(warehouse)}
      </Typography>
      <Typography color={warehouse.stock === 0 ? "error.main" : "text.primary"} fontSize={13} fontWeight={950} whiteSpace="nowrap">
        {warehouse.stock} disponibles
      </Typography>
    </Box>
  );
}

function DistributionSummary({ item }: { item: InventoryRow }) {
  const sortedWarehouses = [...item.warehouses].sort((a, b) => {
    if (a.stock === 0 && b.stock !== 0) {
      return -1;
    }
    if (a.stock !== 0 && b.stock === 0) {
      return 1;
    }
    if (a.type !== b.type) {
      return a.type === "main" ? -1 : 1;
    }

    return b.stock - a.stock;
  });
  const visibleWarehouses = sortedWarehouses.slice(0, 4);
  const hiddenCount = Math.max(sortedWarehouses.length - visibleWarehouses.length, 0);
  const warehouseCount = item.warehouses.filter((warehouse) => warehouse.type === "main").length;
  const sellerCount = item.warehouses.filter((warehouse) => warehouse.type === "seller").length;
  const emptyCount = item.warehouses.filter((warehouse) => warehouse.stock === 0).length;

  return (
    <Stack minWidth={0} spacing={0.85}>
      <Stack alignItems="center" direction="row" justifyContent="space-between" spacing={1}>
        <Typography color="text.secondary" fontSize={10.5} fontWeight={900} letterSpacing="0.07em" textTransform="uppercase">
          Distribución real
        </Typography>
        <Chip label={`${item.warehouses.length} ubicaciones`} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 900, height: 24 }} />
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.55}>
        <Chip label={`${warehouseCount} ${warehouseCount === 1 ? "almacén" : "almacenes"}`} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 850, height: 23 }} />
        <Chip label={`${sellerCount} ${sellerCount === 1 ? "vendedor" : "vendedores"}`} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 850, height: 23 }} />
        {emptyCount > 0 ? <Chip color="error" label={`${emptyCount} sin stock`} size="small" variant="outlined" sx={{ fontSize: 11, fontWeight: 850, height: 23 }} /> : null}
      </Stack>

      <Stack spacing={0.55}>
        {visibleWarehouses.map((warehouse) => (
          <DistributionLocationLine key={`${item.sku}-${warehouse.label}`} warehouse={warehouse} />
        ))}
        {hiddenCount > 0 ? (
          <Box
            sx={(theme) => ({
              alignItems: "center",
              border: "1px dashed",
              borderColor: alpha(theme.palette.primary.main, 0.36),
              borderRadius: 2,
              display: "flex",
              justifyContent: "center",
              minHeight: 30,
              px: 1,
            })}
          >
            <Typography color="primary.main" fontSize={12} fontWeight={900}>
              +{hiddenCount} ubicaciones más en detalle
            </Typography>
          </Box>
        ) : null}
      </Stack>
    </Stack>
  );
}

function StockMeterCard({ item }: { item: InventoryRow }) {
  const theme = useTheme();
  const color = toneMain(theme, item.tone);
  const diff = item.stock - item.minimumStock;
  const diffLabel = diff >= 0 ? `+${diff} sobre el mínimo` : `Faltan ${Math.abs(diff)}`;

  return (
    <Box
      sx={{
        alignItems: "center",
        background: `linear-gradient(135deg, ${alpha(color, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.72)} 45%, ${alpha(color, 0.08)} 100%)`,
        border: "1px solid",
        borderColor: alpha(color, 0.38),
        borderRadius: 3,
        boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.035 : 0.22)}`,
        display: "grid",
        minHeight: 112,
        overflow: "hidden",
        placeItems: "center",
        position: "relative",
        px: 1.25,
        py: 1,
        textAlign: "center",
        "&::before": {
          background: color,
          borderRadius: 999,
          bottom: 14,
          content: '""',
          left: 10,
          position: "absolute",
          top: 14,
          width: 5,
        },
        "&::after": {
          background: `linear-gradient(90deg, ${alpha(color, 0.9)} 0%, ${alpha(color, 0.34)} 60%, ${alpha(color, 0.14)} 100%)`,
          borderRadius: 999,
          bottom: 8,
          content: '""',
          height: 4,
          left: 18,
          position: "absolute",
          right: 18,
        },
      }}
    >
      <Stack alignItems="center" justifyContent="center" spacing={0.8} sx={{ width: "100%" }}>
        <Typography color="text.secondary" fontSize={10.5} fontWeight={900} letterSpacing="0.08em" textTransform="uppercase">
          Stock actual y mínimo
        </Typography>
        <Box
          sx={{
            alignItems: "center",
            display: "grid",
            gap: 1.2,
            gridTemplateColumns: "auto minmax(0, 1fr)",
            justifyContent: "center",
            maxWidth: 250,
            width: "100%",
          }}
        >
          <Typography color={color} fontSize={38} fontWeight={950} lineHeight={1} sx={{ minWidth: 72, textAlign: "center" }}>
            {item.stock}
          </Typography>
          <Box
            component="ul"
            sx={{
              color: "text.primary",
              fontSize: 12.5,
              fontWeight: 850,
              lineHeight: 1.4,
              listStylePosition: "inside",
              m: 0,
              p: 0,
              textAlign: "left",
            }}
          >
            <li>Actual: {item.stock}</li>
            <li>Mínimo: {item.minimumStock}</li>
            <li>{diffLabel}</li>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

function InventoryRowCard({ item }: { item: InventoryRow }) {
  const theme = useTheme();
  const color = toneMain(theme, item.tone);

  const actionButtonSx = {
    borderRadius: 2.25,
    fontSize: 12.5,
    fontWeight: 950,
    minHeight: 34,
    minWidth: 94,
    px: 1.35,
    py: 0.45,
  } as const;

  return (
    <Box
      sx={{
        background: alpha(theme.palette.background.paper, 0.72),
        border: "1px solid",
        borderColor: alpha(color, 0.24),
        borderLeft: "5px solid",
        borderLeftColor: color,
        borderRadius: 3.5,
        display: "grid",
        gap: 1.25,
        gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.2fr) 300px minmax(360px, 1fr) 102px" },
        p: 1.35,
      }}
    >
      <Stack alignItems="center" direction="row" minWidth={0} spacing={1.25}>
        <IconTile icon={Inventory2Icon} size={58} tone={item.tone} />
        <Stack minWidth={0} spacing={0.55}>
          <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.75}>
            <Typography fontWeight={950}>{item.name}</Typography>
            <Chip color={item.tone} label={item.status} size="small" />
          </Stack>
          <Typography color="text.secondary" variant="body2">
            Código del producto: {item.sku}
          </Typography>
          <CategoryPill label={item.category} />
        </Stack>
      </Stack>

      <StockMeterCard item={item} />

      <DistributionSummary item={item} />

      <Stack alignItems={{ xs: "stretch", md: "flex-end" }} justifyContent="center" spacing={0.55}>
        <Button size="small" sx={actionButtonSx} variant="outlined">
          Detalle
        </Button>
        <Button color={item.tone === "success" ? "primary" : item.tone} size="small" sx={actionButtonSx} variant="contained">
          {item.action}
        </Button>
      </Stack>
    </Box>
  );
}



function InventoryTablePrototype() {
  return (
    <Surface>
      <Stack spacing={1.75}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={1.25}>
          <Box>
            <Typography fontWeight={950} letterSpacing="-0.025em" variant="h5">
              Existencias actuales
            </Typography>
            <Typography color="text.secondary" variant="body2">
              Resumen compacto por producto; la distribución completa queda para detalle cuando hay muchas ubicaciones.
            </Typography>
          </Box>
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <TextField
              placeholder="Buscar por producto, código o almacén"
              size="small"
              slotProps={{ input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> } }}
              sx={{ minWidth: { xs: "100%", sm: 290 } }}
            />
            <Button startIcon={<SortIcon />} variant="outlined">
              Ordenar
            </Button>
            <Button startIcon={<FilterListIcon />} variant="outlined">
              Filtros
            </Button>
          </Stack>
        </Stack>

        <Stack spacing={1.05}>
          {inventoryRows.map((item) => (
            <InventoryRowCard item={item} key={item.sku} />
          ))}
        </Stack>
      </Stack>
    </Surface>
  );
}



function MobilePreview() {
  return (
    <Surface sx={{ display: { xs: "none", lg: "block" } }}>
      <Stack spacing={1.5}>
        <Box>
          <Typography color="primary.main" fontWeight={850} letterSpacing="0.08em" textTransform="uppercase" variant="caption">
            Vista móvil
          </Typography>
          <Typography fontWeight={950} variant="h6">
            390 × 844
          </Typography>
        </Box>
        <Box
          sx={(theme) => ({
            backgroundColor: alpha(theme.palette.background.default, 0.7),
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 5,
            maxWidth: 390,
            mx: "auto",
            overflow: "hidden",
            p: 1.25,
          })}
        >
          <Stack spacing={1.1}>
            <Typography fontWeight={950}>Control de inventario</Typography>
            <HealthGauge />
            <Box sx={{ display: "grid", gap: 0.8, gridTemplateColumns: "1fr 1fr" }}>
              {movementStats.map((movement) => (
                <Box key={movement.label} sx={{ border: "1px solid", borderColor: `${movement.tone}.main`, borderRadius: 2.5, p: 0.85 }}>
                  <Typography color="text.secondary" fontSize={10} fontWeight={800}>
                    {movement.label}
                  </Typography>
                  <Typography color={`${movement.tone}.main`} fontSize={18} fontWeight={950}>
                    {movement.count} movimientos
                  </Typography>
                </Box>
              ))}
            </Box>
            <Chip label="Existencias · Entradas · Salidas · Retiros" size="small" variant="outlined" />
            {inventoryRows.slice(0, 1).map((item) => (
              <Box key={item.sku} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, p: 1 }}>
                <Stack direction="row" justifyContent="space-between" spacing={1}>
                  <Typography fontWeight={900}>{item.name}</Typography>
                  <Chip color={item.tone} label={item.status} size="small" />
                </Stack>
                <Typography color="text.secondary" variant="body2">
                  Stock {item.stock} · mínimo {item.minimumStock}
                </Typography>
                <Typography color="text.secondary" fontSize={12}>
                  Principal, vendedor y sin stock visibles
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Stack>
    </Surface>
  );
}

function DesignTokenSummary() {
  const { density, layout } = pvVisualTokens;

  const tokens = [
    ["Padding móvil", `${layout.mobileContentPadding}px`],
    ["Padding desktop", `${layout.desktopContentPadding}px`],
    ["Radio tarjetas", `${layout.cardRadius}px`],
    ["Fila tabla", `${layout.tableRowHeight}px`],
    ["Gap sección", `${layout.sectionGap}px`],
    ["Gap denso", `${layout.denseSectionGap}px`],
    ["Control compacto", `${density.compactControlHeight}px`],
    ["Touch target", `${density.touchTarget}px`],
  ];

  return (
    <Surface>
      <Stack spacing={1.6}>
        <SectionHeader
          description="Estos números evitan que el diseño se implemente a ojo. La maqueta aprobada debe migrarse con los mismos radios, gaps, tamaños y breakpoints."
          eyebrow="Tokens"
          title="Medidas que sí se pueden implementar"
        />
        <Box sx={{ display: "grid", gap: 1, gridTemplateColumns: { xs: "1fr 1fr", md: "repeat(4, minmax(0, 1fr))" } }}>
          {tokens.map(([label, value]) => (
            <Box key={label} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 3, px: 1.3, py: 1.05 }}>
              <Typography color="text.secondary" fontSize={12} fontWeight={750}>
                {label}
              </Typography>
              <Typography fontSize={15} fontWeight={900}>
                {value}
              </Typography>
            </Box>
          ))}
        </Box>
      </Stack>
    </Surface>
  );
}

function InventoryEditablePrototype() {
  return (
    <Stack spacing={2}>
      <Surface
        sx={(theme) => ({
          background:
            theme.palette.mode === "dark"
              ? "linear-gradient(135deg, rgba(37, 99, 235, 0.18), rgba(15, 23, 42, 0.64))"
              : "linear-gradient(135deg, rgba(37, 99, 235, 0.10), rgba(255, 255, 255, 0.9))",
        })}
      >
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" spacing={2}>
          <Stack direction="row" spacing={1.3}>
            <IconTile icon={Inventory2Icon} size={54} tone="primary" />
            <Box>
              <Typography color="text.secondary" fontWeight={850} letterSpacing="0.08em" textTransform="uppercase" variant="caption">
                Desktop 1366 × 900 · Inventario completo
              </Typography>
              <Typography component="h1" fontWeight={950} letterSpacing="-0.04em" variant="h4">
                Control de inventario
              </Typography>
              <Typography color="text.secondary" sx={{ maxWidth: 820 }} variant="body2">
                Existencias, movimientos, entradas, salidas, historial y retiros de stock. Basado en el tablero editable que subiste.
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </Surface>

      <InventoryOperationalPanel />
      <InventoryNav />
      <InventoryTablePrototype />
      <MobilePreview />
      <DesignTokenSummary />
    </Stack>
  );
}

export function UiLabPage() {
  const theme = useTheme();

  return (
    <Box
      sx={{
        background:
          theme.palette.mode === "dark"
            ? "radial-gradient(circle at top left, rgba(96, 165, 250, 0.18), transparent 34%), #070f1d"
            : "radial-gradient(circle at top left, rgba(37, 99, 235, 0.10), transparent 34%), #f6f8fb",
        minHeight: "100vh",
        px: {
          xs: `${pvVisualTokens.layout.mobileContentPadding}px`,
          sm: `${pvVisualTokens.layout.tabletContentPadding}px`,
          lg: `${pvVisualTokens.layout.desktopContentPadding}px`,
        },
        py: { xs: 3, md: 4 },
      }}
    >
      <Stack spacing={2.4} sx={{ maxWidth: pvVisualTokens.layout.pageMaxWidth, mx: "auto" }}>
        <Surface>
          <Stack spacing={1.25}>
            <Stack direction="row" flexWrap="wrap" gap={1}>
              <Chip color="primary" label="UI Lab" />
              <Chip label="Inventario desde Excalidraw" variant="outlined" />
              <Chip label="No toca backend" variant="outlined" />
            </Stack>
            <SectionHeader
              description="Prototipo ejecutable para revisar una página completa antes de migrarla a Inventario real. Usa datos mock, MUI y tokens medibles."
              eyebrow="Punta Venta"
              title="Referencia visual editable convertida a UI Lab"
            />
          </Stack>
        </Surface>

        <InventoryEditablePrototype />
      </Stack>
    </Box>
  );
}

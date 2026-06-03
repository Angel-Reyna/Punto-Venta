import type { ElementType } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import HistoryIcon from "@mui/icons-material/History";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowUpIcon from "@mui/icons-material/KeyboardArrowUp";
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import SyncIcon from "@mui/icons-material/Sync";

import type { InventoryView, Movement, StockItem } from "./inventoryShared";
import { getInventoryStockSummary } from "./inventoryShared";

type MovementMetricColor = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type MovementBucket = {
  accent: MovementMetricColor;
  description: string;
  icon: ElementType;
  label: string;
  unitsLabel: string;
  value: {
    count: number;
    units: number;
  };
};

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
  const summary = getInventoryStockSummary(stockRows);
  const hasAlerts = summary.attention > 0;
  const movementSummary = getMovementSummary(movements);

  return (
    <Card
      data-testid="inventory-visual-dashboard"
      sx={(theme) => ({
        mb: 2,
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.18),
        borderRadius: 4.5,
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 52% 0%, ${alpha(theme.palette.success.main, 0.1)}, transparent 28%), linear-gradient(135deg, ${alpha(
                theme.palette.primary.dark,
                0.16,
              )}, ${alpha(theme.palette.background.paper, 0.96)} 44%, ${alpha(
                theme.palette.primary.main,
                0.08,
              )})`
            : `radial-gradient(circle at 52% 0%, ${alpha(theme.palette.success.main, 0.1)}, transparent 28%), linear-gradient(135deg, ${alpha(
                theme.palette.primary.light,
                0.16,
              )}, ${alpha(theme.palette.background.paper, 0.98)} 44%, ${alpha(
                theme.palette.primary.main,
                0.08,
              )})`,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 28px 90px ${alpha(theme.palette.common.black, 0.32)}`
            : `0 28px 90px ${alpha(theme.palette.primary.main, 0.12)}`,
      })}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.4, md: 2.8 },
          "&:last-child": { pb: { xs: 2, sm: 2.4, md: 2.8 } },
        }}
      >
        <Box
          sx={{
            display: "grid",
            gap: { xs: 2.2, lg: 3.1 },
            gridTemplateColumns: {
              xs: "1fr",
              lg: "minmax(300px, 0.78fr) minmax(640px, 1.22fr)",
            },
            alignItems: "stretch",
          }}
        >
          <InventoryHeroIntro
            activeView={activeView}
            canAdjustInventory={canAdjustInventory}
            hasAlerts={hasAlerts}
            onViewChange={onViewChange}
            stockAlertCount={summary.attention}
          />

          <InventoryMovementOverview summary={movementSummary} />
        </Box>
      </CardContent>
    </Card>
  );
}

function InventoryHeroIntro({
  activeView,
  canAdjustInventory,
  hasAlerts,
  onViewChange,
  stockAlertCount,
}: {
  activeView: InventoryView;
  canAdjustInventory: boolean;
  hasAlerts: boolean;
  onViewChange: (value: InventoryView) => void;
  stockAlertCount: number;
}) {
  return (
    <Stack
      spacing={2.4}
      justifyContent="space-between"
      sx={{
        minWidth: 0,
        minHeight: { xs: "auto", lg: 280 },
        py: { xs: 0, lg: 0.4 },
      }}
    >
      <Stack spacing={1.4} sx={{ minWidth: 0 }}>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            color={canAdjustInventory ? "primary" : "success"}
            label={canAdjustInventory ? "Permiso: lectura y ajuste" : "Permiso: solo consulta"}
            sx={{
              borderRadius: 999,
              fontWeight: 900,
              px: 0.35,
            }}
          />
          <Chip
            color={hasAlerts ? "warning" : "success"}
            icon={hasAlerts ? <ReportProblemIcon /> : undefined}
            variant="outlined"
            label={
              hasAlerts
                ? `${stockAlertCount} alerta${stockAlertCount === 1 ? "" : "s"} de stock`
                : "Stock operativo estable"
            }
            sx={{
              borderRadius: 999,
              fontWeight: 900,
              px: 0.35,
            }}
          />
        </Stack>

        <Box sx={{ minWidth: 0 }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Typography
              component="h2"
              variant="h4"
              fontWeight={950}
              sx={{
                letterSpacing: -0.75,
                lineHeight: 1.06,
                overflowWrap: "anywhere",
              }}
            >
              Control de inventario
            </Typography>
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                alignItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.13),
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.2),
                borderRadius: 1.65,
                color: "primary.main",
                display: { xs: "none", sm: "inline-flex" },
                height: 34,
                justifyContent: "center",
                width: 34,
              })}
            >
              <HistoryIcon sx={{ fontSize: 18 }} />
            </Box>
          </Stack>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ mt: 1.05, maxWidth: 590, lineHeight: 1.58 }}
          >
            {canAdjustInventory
              ? "Consulta existencias, registra entradas por reposición y separa salidas cuando haya merma, corrección o retiro de producto."
              : "Consulta existencias, alertas de stock e historial operativo. Las entradas y salidas manuales las realiza el administrador."}
          </Typography>
        </Box>
      </Stack>

      <InventoryTabs
        activeView={activeView}
        canAdjustInventory={canAdjustInventory}
        onViewChange={onViewChange}
      />
    </Stack>
  );
}

function InventoryTabs({
  activeView,
  canAdjustInventory,
  onViewChange,
}: {
  activeView: InventoryView;
  canAdjustInventory: boolean;
  onViewChange: (value: InventoryView) => void;
}) {
  return (
    <Tabs
      value={activeView}
      onChange={(_event, value: InventoryView) => onViewChange(value)}
      variant="scrollable"
      allowScrollButtonsMobile
      aria-label="Secciones de inventario"
      sx={(theme) => ({
        minHeight: 48,
        "& .MuiTabs-scroller": {
          mx: { xs: -0.5, sm: 0 },
        },
        "& .MuiTabs-flexContainer": {
          gap: 1.05,
        },
        "& .MuiTab-root": {
          border: 1,
          borderColor: alpha(theme.palette.primary.main, 0.14),
          borderRadius: 999,
          minHeight: 44,
          px: { xs: 1.6, sm: 2.15 },
          textTransform: "none",
          whiteSpace: "nowrap",
          bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.2 : 0.38),
        },
        "& .MuiTab-iconWrapper": {
          mr: 0.8,
        },
        "& .Mui-selected": {
          borderColor: alpha(theme.palette.primary.main, 0.46),
          bgcolor: alpha(theme.palette.primary.main, 0.14),
          boxShadow: `inset 0 -2px 0 ${theme.palette.primary.main}`,
        },
      })}
    >
      <Tab
        value="stock"
        icon={<Inventory2Icon fontSize="small" />}
        iconPosition="start"
        label="Existencias"
      />
      {canAdjustInventory && (
        <Tab
          value="entries"
          icon={<AddCircleIcon fontSize="small" />}
          iconPosition="start"
          label="Entradas"
        />
      )}
      {canAdjustInventory && (
        <Tab
          value="exits"
          icon={<RemoveCircleIcon fontSize="small" />}
          iconPosition="start"
          label="Salidas"
        />
      )}
      <Tab
        value="movements"
        icon={<HistoryIcon fontSize="small" />}
        iconPosition="start"
        label="Historial"
      />
    </Tabs>
  );
}

function getMovementSummary(movements: Movement[]) {
  const initialTotals = {
    ADJUSTMENT: { count: 0, units: 0 },
    IN: { count: 0, units: 0 },
    OUT: { count: 0, units: 0 },
    RETURN: { count: 0, units: 0 },
    SALE: { count: 0, units: 0 },
  } satisfies Record<Movement["type"], { count: number; units: number }>;

  const totals = movements.reduce((acc, movement) => {
    acc[movement.type].count += 1;
    acc[movement.type].units += Math.max(Number(movement.quantity ?? 0), 0);
    return acc;
  }, initialTotals);

  const exits = {
    count: totals.OUT.count + totals.ADJUSTMENT.count,
    units: totals.OUT.units + totals.ADJUSTMENT.units,
  };

  const cards: MovementBucket[] = [
    {
      accent: "success",
      description: "Unidades recibidas por reposición",
      icon: KeyboardArrowDownIcon,
      label: "Entradas",
      unitsLabel: "unidades recibidas",
      value: totals.IN,
    },
    {
      accent: "error",
      description: "Unidades retiradas por ajuste o merma",
      icon: KeyboardArrowUpIcon,
      label: "Salidas",
      unitsLabel: "unidades retiradas",
      value: exits,
    },
    {
      accent: "primary",
      description: "Unidades descontadas por ventas",
      icon: ShoppingCartIcon,
      label: "Ventas",
      unitsLabel: "unidades vendidas",
      value: totals.SALE,
    },
    {
      accent: "secondary",
      description: "Unidades devueltas al inventario",
      icon: KeyboardReturnIcon,
      label: "Devoluciones",
      unitsLabel: "unidades devueltas",
      value: totals.RETURN,
    },
  ];

  return {
    cards,
    total: movements.length,
  };
}

function InventoryMovementOverview({
  summary,
}: {
  summary: ReturnType<typeof getMovementSummary>;
}) {
  return (
    <Box
      aria-label="Resumen de movimientos de inventario"
      component="section"
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        minWidth: 0,
        height: "100%",
        minHeight: { xs: "auto", lg: 280 },
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.42),
        borderRadius: 4.75,
        bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.48 : 0.84),
        background:
          theme.palette.mode === "dark"
            ? `radial-gradient(circle at 18% 0%, ${alpha(theme.palette.primary.main, 0.18)}, transparent 32%), linear-gradient(135deg, ${alpha(
                theme.palette.primary.dark,
                0.22,
              )}, ${alpha(theme.palette.background.paper, 0.72)} 50%, ${alpha(
                theme.palette.primary.main,
                0.08,
              )})`
            : `radial-gradient(circle at 18% 0%, ${alpha(theme.palette.primary.main, 0.14)}, transparent 32%), linear-gradient(135deg, ${alpha(
                theme.palette.primary.light,
                0.2,
              )}, ${alpha(theme.palette.background.paper, 0.9)} 50%, ${alpha(
                theme.palette.primary.main,
                0.08,
              )})`,
        boxShadow:
          theme.palette.mode === "dark"
            ? `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.06)}, 0 26px 68px ${alpha(theme.palette.common.black, 0.34)}`
            : `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.56)}, 0 26px 68px ${alpha(theme.palette.primary.main, 0.12)}`,
        p: { xs: 1.45, sm: 1.9, md: 2.25 },
      })}
    >
      <Stack spacing={2.05} sx={{ height: "100%" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "stretch", sm: "flex-start" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.45} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                alignItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.16),
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.26),
                borderRadius: 999,
                color: "primary.main",
                display: "inline-flex",
                flex: "0 0 auto",
                height: 56,
                justifyContent: "center",
                width: 56,
                boxShadow: `0 0 34px ${alpha(theme.palette.primary.main, 0.16)}`,
              })}
            >
              <SyncIcon sx={{ fontSize: 34 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="h4"
                fontWeight={950}
                lineHeight={1.03}
                sx={{ letterSpacing: -0.65 }}
              >
                Movimientos
              </Typography>
              <Typography variant="body1" color="text.secondary" fontWeight={750} sx={{ mt: 0.35 }}>
                Resumen de actividad del inventario
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={(theme) => ({
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.24),
              borderRadius: 3.2,
              bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.36 : 0.48),
              minWidth: { xs: "100%", sm: 190 },
              px: 2.25,
              py: 1.45,
              textAlign: "left",
              boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, 0.04)}`,
            })}
          >
            <Typography variant="h3" fontWeight={950} lineHeight={0.95} sx={{ letterSpacing: -0.5 }}>
              {summary.total}
            </Typography>
            <Typography variant="body2" color="text.secondary" fontWeight={850}>
              Total movimientos
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.25, md: 1.45 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            alignItems: "stretch",
            flex: 1,
          }}
        >
          {summary.cards.map((item) => (
            <InventoryMovementTypeCard key={item.label} item={item} />
          ))}
        </Box>
      </Stack>
    </Box>
  );
}

function InventoryMovementTypeCard({ item }: { item: MovementBucket }) {
  const Icon = item.icon;

  return (
    <Box
      sx={(theme) => ({
        position: "relative",
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette[item.accent].main, 0.34),
        borderRadius: 3.2,
        bgcolor: alpha(theme.palette[item.accent].main, theme.palette.mode === "dark" ? 0.1 : 0.055),
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(150deg, ${alpha(theme.palette[item.accent].main, 0.17)}, ${alpha(
                theme.palette.background.paper,
                0.54,
              )} 60%)`
            : `linear-gradient(150deg, ${alpha(theme.palette[item.accent].main, 0.13)}, ${alpha(
                theme.palette.background.paper,
                0.9,
              )} 60%)`,
        minHeight: { xs: 150, sm: 164, xl: 178 },
        p: { xs: 1.55, sm: 1.75 },
        boxShadow: `inset 0 1px 0 ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.045 : 0.58)}`,
        "&::after": {
          content: '""',
          position: "absolute",
          insetInline: 0,
          bottom: 0,
          height: 3,
          bgcolor: theme.palette[item.accent].main,
          boxShadow: `0 0 22px ${alpha(theme.palette[item.accent].main, 0.45)}`,
        },
      })}
    >
      <Stack spacing={1.25} sx={{ height: "100%" }}>
        <Box
          sx={(theme) => ({
            alignItems: "center",
            bgcolor: alpha(theme.palette[item.accent].main, 0.18),
            border: 1,
            borderColor: alpha(theme.palette[item.accent].main, 0.3),
            borderRadius: 999,
            color: `${item.accent}.main`,
            display: "inline-flex",
            height: 56,
            justifyContent: "center",
            width: 56,
            boxShadow: `0 0 30px ${alpha(theme.palette[item.accent].main, 0.16)}`,
          })}
        >
          <Icon sx={{ fontSize: 34 }} />
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography variant="h4" fontWeight={950} lineHeight={0.95}>
            {item.value.count}
          </Typography>
          <Typography variant="body1" fontWeight={900} sx={{ mt: 0.35 }}>
            {item.label}
          </Typography>
        </Box>

        <Typography variant="caption" color="text.secondary" fontWeight={750} sx={{ lineHeight: 1.35 }}>
          {item.description}
        </Typography>

        <Box
          sx={(theme) => ({
            mt: "auto",
            borderTop: 1,
            borderColor: alpha(theme.palette[item.accent].main, 0.2),
            pt: 1,
          })}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 10,
                height: 10,
                borderRadius: 999,
                bgcolor: theme.palette[item.accent].main,
                boxShadow: `0 0 16px ${alpha(theme.palette[item.accent].main, 0.62)}`,
              })}
            />
            <Typography variant="body2" color="text.primary" fontWeight={900}>
              {item.value.units} unidades
            </Typography>
          </Stack>
          <Typography variant="caption" color="text.secondary" fontWeight={750}>
            {item.unitsLabel}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

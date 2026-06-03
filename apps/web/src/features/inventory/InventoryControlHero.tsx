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
import KeyboardReturnIcon from "@mui/icons-material/KeyboardReturn";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import SyncIcon from "@mui/icons-material/Sync";

import type { InventoryView, Movement, StockItem } from "./inventoryShared";
import { getInventoryStockSummary } from "./inventoryShared";

type MovementMetricColor = "primary" | "success" | "warning" | "error" | "info" | "secondary";

type MovementBucket = {
  caption: string;
  color: MovementMetricColor;
  icon: typeof AddCircleIcon;
  label: string;
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
        borderColor: alpha(theme.palette.primary.main, 0.24),
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(
                theme.palette.background.paper,
                0.98,
              )} 46%, ${alpha(theme.palette.primary.dark, 0.1)})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(
                theme.palette.background.paper,
                0.98,
              )} 46%, ${alpha(theme.palette.primary.light, 0.1)})`,
      })}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          "&:last-child": { pb: { xs: 2, sm: 2.5, md: 3 } },
        }}
      >
        <Stack spacing={2.25}>
          <Box
            sx={{
              display: "grid",
              gap: { xs: 2.5, lg: 3 },
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(360px, 0.82fr) minmax(640px, 1.18fr)",
              },
              alignItems: "stretch",
            }}
          >
            <Stack spacing={2.25} justifyContent="space-between" sx={{ minWidth: 0 }}>
              <Stack spacing={1.25} sx={{ minWidth: 0 }}>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip
                    color={canAdjustInventory ? "primary" : "success"}
                    label={
                      canAdjustInventory
                        ? "Permiso: lectura y ajuste"
                        : "Permiso: solo consulta"
                    }
                  />
                  <Chip
                    color={hasAlerts ? "warning" : "success"}
                    icon={hasAlerts ? <ReportProblemIcon /> : undefined}
                    variant="outlined"
                    label={
                      hasAlerts
                        ? `${summary.attention} alerta${summary.attention === 1 ? "" : "s"} de stock`
                        : "Stock operativo estable"
                    }
                  />
                </Stack>

                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
                    <Typography
                      component="h2"
                      variant="h4"
                      fontWeight={950}
                      sx={{ letterSpacing: -0.6, lineHeight: 1.08 }}
                    >
                      Control de inventario
                    </Typography>
                    <Box
                      aria-hidden="true"
                      sx={(theme) => ({
                        alignItems: "center",
                        bgcolor: alpha(theme.palette.primary.main, 0.12),
                        borderRadius: 1.5,
                        color: "primary.main",
                        display: { xs: "none", sm: "inline-flex" },
                        height: 32,
                        justifyContent: "center",
                        width: 32,
                      })}
                    >
                      <HistoryIcon sx={{ fontSize: 18 }} />
                    </Box>
                  </Stack>
                  <Typography
                    variant="body1"
                    color="text.secondary"
                    sx={{ mt: 1, maxWidth: 620, lineHeight: 1.55 }}
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

            <InventoryMovementOverview summary={movementSummary} />
          </Box>
        </Stack>
      </CardContent>
    </Card>
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
        minHeight: 44,
        "& .MuiTabs-scroller": {
          mx: { xs: -0.5, sm: 0 },
        },
        "& .MuiTabs-flexContainer": {
          gap: 1,
        },
        "& .MuiTab-root": {
          border: 1,
          borderColor: "divider",
          borderRadius: 999,
          minHeight: 40,
          px: { xs: 1.5, sm: 2 },
          textTransform: "none",
          whiteSpace: "nowrap",
        },
        "& .MuiTab-iconWrapper": {
          mr: 0.75,
        },
        "& .Mui-selected": {
          bgcolor: alpha(theme.palette.primary.main, 0.1),
        },
      })}
    >
      <Tab value="stock" label="Existencias" />
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
      <Tab value="movements" label="Historial" />
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

  const cards: MovementBucket[] = [
    {
      caption: "Inventario recibido",
      color: "success",
      icon: AddCircleIcon,
      label: "Entradas",
      value: totals.IN,
    },
    {
      caption: "Retiros y mermas",
      color: "warning",
      icon: RemoveCircleIcon,
      label: "Salidas",
      value: totals.OUT,
    },
    {
      caption: "Descuentos por venta",
      color: "primary",
      icon: PointOfSaleIcon,
      label: "Ventas",
      value: totals.SALE,
    },
    {
      caption: "Producto devuelto",
      color: "secondary",
      icon: KeyboardReturnIcon,
      label: "Devoluciones",
      value: totals.RETURN,
    },
  ];

  return {
    adjustments: totals.ADJUSTMENT,
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
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.36),
        borderRadius: 4,
        bgcolor:
          theme.palette.mode === "dark"
            ? alpha(theme.palette.primary.dark, 0.12)
            : alpha(theme.palette.primary.light, 0.1),
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.09)}, ${alpha(
                theme.palette.background.paper,
                0.78,
              )})`
            : `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.08)}, ${alpha(
                theme.palette.background.paper,
                0.9,
              )})`,
        boxShadow:
          theme.palette.mode === "dark"
            ? `0 24px 72px ${alpha(theme.palette.common.black, 0.34)}`
            : `0 24px 72px ${alpha(theme.palette.primary.main, 0.13)}`,
        p: { xs: 1.5, sm: 2, md: 2.25 },
        minWidth: 0,
        height: "100%",
      })}
    >
      <Stack spacing={1.75} sx={{ height: "100%" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "flex-start" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                alignItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.14),
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.24),
                borderRadius: 999,
                color: "primary.main",
                display: "inline-flex",
                flex: "0 0 auto",
                height: 48,
                justifyContent: "center",
                width: 48,
              })}
            >
              <SyncIcon sx={{ fontSize: 31 }} />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h4" fontWeight={950} lineHeight={1.05} sx={{ letterSpacing: -0.5 }}>
                Movimientos
              </Typography>
              <Typography variant="body1" color="text.secondary" fontWeight={700}>
                Resumen de actividad del inventario
              </Typography>
            </Box>
          </Stack>

          <Box
            sx={(theme) => ({
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.22),
              borderRadius: 3,
              bgcolor: alpha(theme.palette.background.default, 0.28),
              minWidth: { xs: 155, sm: 190 },
              px: 2.25,
              py: 1.35,
              textAlign: { xs: "left", sm: "left" },
            })}
          >
            <Typography variant="h4" fontWeight={950} lineHeight={1}>
              {summary.total}
            </Typography>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              Total movimientos
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
          }}
        >
          {summary.cards.map((item) => (
            <InventoryMovementTypeCard key={item.label} item={item} />
          ))}
        </Box>

        {summary.adjustments.count > 0 && (
          <Typography variant="caption" color="text.secondary" fontWeight={800}>
            Ajustes registrados: {summary.adjustments.count} · {summary.adjustments.units} unidades ajustadas.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

function InventoryMovementTypeCard({ item }: { item: MovementBucket }) {
  const Icon = item.icon;

  return (
    <Box
      sx={(theme) => ({
        border: 1,
        borderColor: alpha(theme.palette[item.color].main, 0.3),
        borderRadius: 3,
        bgcolor: alpha(theme.palette[item.color].main, 0.1),
        background: `linear-gradient(135deg, ${alpha(theme.palette[item.color].main, 0.13)}, ${alpha(
          theme.palette.background.paper,
          theme.palette.mode === "dark" ? 0.54 : 0.82,
        )})`,
        minHeight: 124,
        p: { xs: 1.3, sm: 1.45 },
      })}
    >
      <Stack spacing={1} sx={{ height: "100%" }}>
        <Stack direction="row" spacing={1.1} alignItems="center">
          <Box
            sx={(theme) => ({
              alignItems: "center",
              bgcolor: alpha(theme.palette[item.color].main, 0.18),
              border: 1,
              borderColor: alpha(theme.palette[item.color].main, 0.32),
              borderRadius: 999,
              color: `${item.color}.main`,
              display: "inline-flex",
              height: 46,
              justifyContent: "center",
              width: 46,
            })}
          >
            <Icon sx={{ fontSize: 27 }} />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={950} lineHeight={1}>
              {item.value.count}
            </Typography>
            <Typography variant="body2" color="text.primary" fontWeight={800}>
              {item.label}
            </Typography>
          </Box>
        </Stack>

        <Box
          sx={(theme) => ({
            borderTop: 1,
            borderColor: alpha(theme.palette[item.color].main, 0.18),
            pt: 1,
          })}
        >
          <Stack direction="row" spacing={0.75} alignItems="center">
            <Box
              aria-hidden="true"
              sx={(theme) => ({
                width: 9,
                height: 9,
                borderRadius: 999,
                bgcolor: theme.palette[item.color].main,
                boxShadow: `0 0 14px ${alpha(theme.palette[item.color].main, 0.55)}`,
              })}
            />
            <Typography variant="body2" color="text.secondary" fontWeight={850}>
              {item.value.units} unidades
            </Typography>
          </Stack>
        </Box>
      </Stack>
    </Box>
  );
}

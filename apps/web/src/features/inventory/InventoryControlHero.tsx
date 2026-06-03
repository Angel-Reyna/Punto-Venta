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
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";

import type { InventoryView, StockItem } from "./inventoryShared";
import { getInventoryStockSummary } from "./inventoryShared";

export function InventoryControlHero({
  activeView,
  canAdjustInventory,
  movementsCount,
  onViewChange,
  stockRows,
}: {
  activeView: InventoryView;
  canAdjustInventory: boolean;
  movementsCount: number;
  onViewChange: (value: InventoryView) => void;
  stockRows: StockItem[];
}) {
  const summary = getInventoryStockSummary(stockRows);
  const hasAlerts = summary.attention > 0;

  return (
    <Card
      data-testid="inventory-visual-dashboard"
      sx={(theme) => ({
        mb: 2,
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.18),
        background:
          theme.palette.mode === "dark"
            ? `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.16,
              )}, ${alpha(theme.palette.background.paper, 0.96)} 54%, ${alpha(
                theme.palette.warning.main,
                hasAlerts ? 0.12 : 0.04,
              )})`
            : `linear-gradient(135deg, ${alpha(
                theme.palette.primary.main,
                0.12,
              )}, ${alpha(theme.palette.background.paper, 0.98)} 52%, ${alpha(
                theme.palette.warning.main,
                hasAlerts ? 0.12 : 0.04,
              )})`,
      })}
    >
      <CardContent
        sx={{
          p: { xs: 2, sm: 2.5, md: 3 },
          "&:last-child": { pb: { xs: 2, sm: 2.5, md: 3 } },
        }}
      >
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", lg: "row" }}
            spacing={{ xs: 2, lg: 3 }}
            alignItems={{ xs: "stretch", lg: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={1.25} sx={{ maxWidth: 760 }}>
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

              <Box>
                <Typography variant="h5" fontWeight={900}>
                  Control de inventario
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {canAdjustInventory
                    ? "Consulta existencias, registra entradas por reposición y separa salidas cuando haya merma, corrección o retiro de producto."
                    : "Consulta existencias, alertas de stock e historial operativo. Las entradas y salidas manuales las realiza el administrador."}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "1fr 1fr",
                  sm: "repeat(4, minmax(0, 1fr))",
                  lg: "repeat(2, minmax(128px, 1fr))",
                },
                minWidth: { lg: 320 },
              }}
            >
              <InventoryHeroStat label="Productos" value={summary.total} />
              <InventoryHeroStat label="Unidades" value={summary.units} />
              <InventoryHeroStat label="Alertas" value={summary.attention} />
              <InventoryHeroStat label="Movimientos" value={movementsCount} />
            </Box>
          </Stack>

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
        </Stack>
      </CardContent>
    </Card>
  );
}

function InventoryHeroStat({ label, value }: { label: string; value: number }) {
  return (
    <Box
      sx={(theme) => ({
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.16),
        borderRadius: 3,
        bgcolor: alpha(theme.palette.background.paper, 0.64),
        px: 1.5,
        py: 1.25,
      })}
    >
      <Stack direction="row" spacing={1} alignItems="center">
        {label === "Movimientos" ? (
          <HistoryIcon fontSize="small" color="primary" />
        ) : (
          <Inventory2Icon fontSize="small" color="primary" />
        )}
        <Box>
          <Typography variant="h6" fontWeight={900} lineHeight={1.1}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary" fontWeight={800}>
            {label}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

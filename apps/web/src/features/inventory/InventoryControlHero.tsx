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

import HistoryIcon from "@mui/icons-material/History";
import Inventory2Icon from "@mui/icons-material/Inventory2";

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

  return (
    <Card
      data-testid="inventory-visual-dashboard"
      sx={(theme) => ({
        mb: 2,
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.18),
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.14,
        )}, ${alpha(theme.palette.background.paper, 0.96)} 48%, ${alpha(
          theme.palette.warning.main,
          summary.attention > 0 ? 0.1 : 0.03,
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
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={1} sx={{ maxWidth: 720 }}>
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
                  color={summary.attention > 0 ? "warning" : "success"}
                  variant="outlined"
                  label={
                    summary.attention > 0
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
                  Revisa existencias, detecta reposición y consulta movimientos
                  con una lectura más visual antes de registrar ajustes
                  manuales.
                </Typography>
              </Box>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
            >
              <Chip
                icon={<Inventory2Icon />}
                label={`${summary.total} productos`}
              />
              <Chip
                icon={<HistoryIcon />}
                label={`${movementsCount} movimientos`}
              />
            </Stack>
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
                px: { xs: 1.75, sm: 2.25 },
                textTransform: "none",
                whiteSpace: "nowrap",
              },
              "& .Mui-selected": {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            })}
          >
            <Tab value="stock" label="Existencias" />
            <Tab value="adjustments" label="Entradas y salidas" />
            <Tab value="movements" label="Historial" />
          </Tabs>
        </Stack>
      </CardContent>
    </Card>
  );
}

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography,
} from "@mui/material";

import AssessmentIcon from "@mui/icons-material/Assessment";

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
                sx={{ py: 1.25, pr: 12 }}
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
  salesDestination,
}: {
  metrics: DashboardMetrics | null;
  isAdmin: boolean;
  salesDestination: string;
}) {
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
      {metrics?.recentSales.length ? (
        <List disablePadding>
          {metrics.recentSales.map((sale, index) => (
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
                      }}
                    >
                      <Typography fontWeight={800}>{sale.folio}</Typography>
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

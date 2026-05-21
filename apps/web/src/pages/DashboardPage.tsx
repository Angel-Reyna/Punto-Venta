import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  Skeleton,
  Stack,
  Typography
} from "@mui/material";

import AssessmentIcon from "@mui/icons-material/Assessment";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PaidIcon from "@mui/icons-material/Paid";
import PeopleIcon from "@mui/icons-material/People";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RefreshIcon from "@mui/icons-material/Refresh";
import WarningIcon from "@mui/icons-material/WarningAmber";

import { api } from "../api/client";
import { PERMISSIONS } from "../auth/permissions";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../utils/apiError";
import { DashboardEmptyPanel } from "./dashboard/DashboardEmptyPanel";
import { DashboardMetricCard } from "./dashboard/DashboardMetricCard";
import { DashboardPanelCard } from "./dashboard/DashboardPanelCard";
import {
  formatDateTime,
  formatMoney,
  formatNumber,
  saleStatusColor,
  saleStatusLabel,
  stockSeverityColor,
  stockSeverityLabel
} from "./dashboard/dashboard.formatters";
import { type DashboardMetrics } from "./dashboard/dashboard.types";

function DashboardSkeleton() {
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

export function DashboardPage() {
  const { can, isAdmin } = useAuth();

  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function load() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get<DashboardMetrics>("/dashboard");

      setMetrics(response.data);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cargar el resumen. Intenta actualizar la página."
        )
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  const hasMetrics = Boolean(metrics);
  const hasCriticalStock = (metrics?.productSummary.outOfStockTotal ?? 0) > 0;
  const hasLowStock = (metrics?.productSummary.lowStockTotal ?? 0) > 0;
  const salesDestination = can(PERMISSIONS.ReportsRead) ? "/reports" : "/sales";

  return (
    <>
      <PageHeader
        title="Inicio"
        subtitle={
          isAdmin
            ? "Resumen operativo del negocio: ventas por vendedor, inventario crítico y usuarios activos."
            : "Panel para registrar ventas y consultar tu actividad reciente."
        }
        action={
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={load}
            disabled={isLoading}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Actualizar
          </Button>
        }
      />

      {isLoading && <LinearProgress sx={{ mb: 2, borderRadius: 999 }} />}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!hasMetrics && isLoading ? (
        <DashboardSkeleton />
      ) : (
        <Stack spacing={2.5}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6} lg={4} xl={2}>
              <DashboardMetricCard
                title="Ventas de hoy"
                value={formatNumber(metrics?.salesToday.count)}
                icon={<PointOfSaleIcon />}
                description={
                  isAdmin ? "Ventas globales completadas" : "Tus ventas completadas"
                }
                to={salesDestination}
                tone="info"
                footer={
                  <Typography color="text.secondary" variant="caption">
                    Ticket promedio {formatMoney(metrics?.salesToday.averageTicket)}
                  </Typography>
                }
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={4} xl={2}>
              <DashboardMetricCard
                title="Total vendido"
                value={formatMoney(metrics?.salesToday.total)}
                icon={<PaidIcon />}
                description={
                  isAdmin ? "Importe global del día" : "Importe vendido por ti hoy"
                }
                to={salesDestination}
                tone="success"
                footer={
                  <Typography color="text.secondary" variant="caption">
                    Alcance: {metrics?.salesToday.scope === "cashier" ? "vendedor" : "global"}
                  </Typography>
                }
              />
            </Grid>


            {isAdmin && (
              <Grid item xs={12} sm={6} lg={4} xl={2}>
                <DashboardMetricCard
                  title="Usuarios activos"
                  value={formatNumber(metrics?.userSummary.totalActive)}
                  icon={<PeopleIcon />}
                  description="Administradores y vendedores activos"
                  to="/users"
                  footer={
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        label={`Admins ${formatNumber(metrics?.userSummary.activeAdmins)}`}
                      />
                      <Chip
                        size="small"
                        label={`Vendedores ${formatNumber(metrics?.userSummary.activeCashiers)}`}
                      />
                    </Stack>
                  }
                />
              </Grid>
            )}

            {isAdmin && (
              <Grid item xs={12} sm={6} lg={4} xl={2}>
                <DashboardMetricCard
                  title="Productos activos"
                  value={formatNumber(metrics?.productSummary.active)}
                  icon={<InventoryIcon />}
                  description="Catálogo disponible para venta"
                  to="/products"
                />
              </Grid>
            )}

            {isAdmin && (
              <Grid item xs={12} sm={6} lg={4} xl={2}>
                <DashboardMetricCard
                  title="Inventario bajo"
                  value={formatNumber(metrics?.productSummary.lowStockTotal)}
                  icon={<WarningIcon />}
                  description="Productos en mínimo o sin stock"
                  to="/inventory"
                  tone={hasCriticalStock ? "critical" : hasLowStock ? "warning" : "success"}
                  footer={
                    <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                      <Chip
                        size="small"
                        color={hasCriticalStock ? "error" : "default"}
                        label={`Sin stock ${formatNumber(metrics?.productSummary.outOfStockTotal)}`}
                      />
                      <Chip
                        size="small"
                        color={hasLowStock ? "warning" : "default"}
                        label="Revisar"
                      />
                    </Stack>
                  }
                />
              </Grid>
            )}
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12} lg={5}>
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
                                {item.sku} · Stock {formatNumber(item.currentStock)} / mínimo {formatNumber(item.minStock)}
                              </Typography>
                            }
                          />
                        </ListItem>
                      </Box>
                    ))}
                  </List>
                ) : (
                  <DashboardEmptyPanel>No hay productos en bajo inventario.</DashboardEmptyPanel>
                )}
              </DashboardPanelCard>
            </Grid>

            <Grid item xs={12} lg={7}>
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
                                  alignItems: "center"
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
                  <DashboardEmptyPanel>No hay ventas recientes en tu alcance.</DashboardEmptyPanel>
                )}
              </DashboardPanelCard>
            </Grid>

          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <DashboardPanelCard
                title="Lectura operativa"
                subtitle="Resumen rápido para decidir el siguiente paso."
              >
                <Stack spacing={1.5}>
                  {hasCriticalStock && (
                    <Alert severity="error">
                      Hay {formatNumber(metrics?.productSummary.outOfStockTotal)} producto(s) sin stock. Revisa inventario antes de venderlos.
                    </Alert>
                  )}

                  {!hasCriticalStock && hasLowStock && (
                    <Alert severity="warning">
                      Hay productos en o debajo del mínimo. Programa reposición para evitar ventas fallidas.
                    </Alert>
                  )}

                  {!hasLowStock && !hasCriticalStock && (
                    <Alert severity="success">
                      Operación estable: ventas registrables sin dependencia de caja y sin alertas críticas de inventario.
                    </Alert>
                  )}

                  <Button
                    variant="outlined"
                    startIcon={<AssessmentIcon />}
                    onClick={load}
                    disabled={isLoading}
                    sx={{ alignSelf: { xs: "stretch", sm: "flex-start" } }}
                  >
                    Recalcular resumen
                  </Button>
                </Stack>
              </DashboardPanelCard>
            </Grid>
          </Grid>
        </Stack>
      )}
    </>
  );
}

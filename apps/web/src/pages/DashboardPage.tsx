import { useEffect, useState } from "react";

import {
  Alert,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";

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
import { DashboardMetricCard } from "./dashboard/DashboardMetricCard";
import {
  DashboardSkeleton,
  InventoryAttentionPanel,
  OperationalReadingPanel,
  RecentSalesPanel,
} from "./dashboard/dashboard.sections";
import { formatMoney, formatNumber } from "./dashboard/dashboard.formatters";
import { type DashboardMetrics } from "./dashboard/dashboard.types";

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
          "No se pudo cargar el resumen. Intenta actualizar la página.",
        ),
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
                  isAdmin
                    ? "Ventas globales completadas"
                    : "Tus ventas completadas"
                }
                to={salesDestination}
                tone="info"
                footer={
                  <Typography color="text.secondary" variant="caption">
                    Ticket promedio{" "}
                    {formatMoney(metrics?.salesToday.averageTicket)}
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
                  isAdmin
                    ? "Importe global del día"
                    : "Importe vendido por ti hoy"
                }
                to={salesDestination}
                tone="success"
                footer={
                  <Typography color="text.secondary" variant="caption">
                    Alcance:{" "}
                    {metrics?.salesToday.scope === "cashier"
                      ? "vendedor"
                      : "global"}
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
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
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
                  tone={
                    hasCriticalStock
                      ? "critical"
                      : hasLowStock
                        ? "warning"
                        : "success"
                  }
                  footer={
                    <Stack
                      direction="row"
                      spacing={1}
                      flexWrap="wrap"
                      useFlexGap
                    >
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
              <InventoryAttentionPanel metrics={metrics} />
            </Grid>

            <Grid item xs={12} lg={7}>
              <RecentSalesPanel
                metrics={metrics}
                isAdmin={isAdmin}
                salesDestination={salesDestination}
              />
            </Grid>
          </Grid>

          <Grid container spacing={2.5}>
            <Grid item xs={12}>
              <OperationalReadingPanel
                hasCriticalStock={hasCriticalStock}
                hasLowStock={hasLowStock}
                outOfStockTotal={metrics?.productSummary.outOfStockTotal}
                isLoading={isLoading}
                onRefresh={load}
              />
            </Grid>
          </Grid>
        </Stack>
      )}
    </>
  );
}

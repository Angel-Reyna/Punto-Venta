import { Alert, Button, Grid, LinearProgress, Stack } from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

import { PERMISSIONS } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { DashboardMetricsGrid } from "./DashboardMetricsGrid";
import { DashboardOperationalHero } from "./DashboardOperationalHero";
import {
  DashboardSkeleton,
  InventoryAttentionPanel,
  OperationalReadingPanel,
  RecentSalesPanel,
} from "./dashboard.sections";
import { useDashboardData } from "./useDashboardData";

function getGeneratedAtLabel(value: string | null | undefined) {
  if (!value) return "Sin actualizar";

  return new Intl.DateTimeFormat("es-MX", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function DashboardPage() {
  const { can, isAdmin } = useAuth();
  const { error, isLoading, load, metrics } = useDashboardData();

  const hasMetrics = Boolean(metrics);
  const hasCriticalStock = (metrics?.productSummary.outOfStockTotal ?? 0) > 0;
  const hasLowStock = (metrics?.productSummary.lowStockTotal ?? 0) > 0;
  const salesDestination = can(PERMISSIONS.ReportsRead) ? "/reports" : "/sales";
  const generatedAtLabel = getGeneratedAtLabel(metrics?.generatedAt);

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

      <DashboardOperationalHero
        generatedAtLabel={generatedAtLabel}
        hasCriticalStock={hasCriticalStock}
        hasLowStock={hasLowStock}
        metrics={metrics}
      />

      {!hasMetrics && isLoading ? (
        <DashboardSkeleton />
      ) : (
        <Stack spacing={2.5}>
          <DashboardMetricsGrid
            hasCriticalStock={hasCriticalStock}
            hasLowStock={hasLowStock}
            isAdmin={isAdmin}
            metrics={metrics}
            salesDestination={salesDestination}
          />

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

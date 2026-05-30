import { Alert, Button, LinearProgress, useMediaQuery, type Theme } from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

import { PERMISSIONS } from "../../auth/permissions";
import { useAuth } from "../../auth/AuthContext";
import { PageHeader } from "../../components/PageHeader";
import { DashboardOperationalHero } from "./DashboardOperationalHero";
import {
  DashboardDesktopScreen,
  DashboardMobileScreen,
  DashboardTabletScreen,
} from "./DashboardDeviceScreens";
import { DashboardSkeleton } from "./dashboard.sections";
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
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

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
            ? "Vista clara del día: ventas, inventario que requiere atención y actividad reciente."
            : "Tu punto de partida para vender, revisar inventario y consultar tus operaciones."
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
        <>
          {isMobile ? (
            <DashboardMobileScreen
              hasCriticalStock={hasCriticalStock}
              hasLowStock={hasLowStock}
              isAdmin={isAdmin}
              isLoading={isLoading}
              metrics={metrics}
              onRefresh={load}
              salesDestination={salesDestination}
            />
          ) : isDesktop ? (
            <DashboardDesktopScreen
              hasCriticalStock={hasCriticalStock}
              hasLowStock={hasLowStock}
              isAdmin={isAdmin}
              isLoading={isLoading}
              metrics={metrics}
              onRefresh={load}
              salesDestination={salesDestination}
            />
          ) : (
            <DashboardTabletScreen
              hasCriticalStock={hasCriticalStock}
              hasLowStock={hasLowStock}
              isAdmin={isAdmin}
              isLoading={isLoading}
              metrics={metrics}
              onRefresh={load}
              salesDestination={salesDestination}
            />
          )}
        </>
      )}
    </>
  );
}

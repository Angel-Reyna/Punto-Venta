import { Alert, Box, LinearProgress, useMediaQuery, type Theme } from "@mui/material";

import { useAuth } from "../../auth/AuthContext";
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
  const { isAdmin } = useAuth();
  const { error, isLoading, load, metrics } = useDashboardData();
  const isMobile = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
  const isDesktop = useMediaQuery((theme: Theme) => theme.breakpoints.up("lg"));

  const hasMetrics = Boolean(metrics);
  const hasCriticalStock = (metrics?.productSummary.outOfStockTotal ?? 0) > 0;
  const hasLowStock = (metrics?.productSummary.lowStockTotal ?? 0) > 0;
  const salesDestination = "/sales?view=history";
  const generatedAtLabel = getGeneratedAtLabel(metrics?.generatedAt);

  return (
    <Box
      sx={{
        boxSizing: "border-box",
        contain: "layout paint",
        maxWidth: "100%",
        minWidth: 0,
        overflowX: "hidden",
        width: "100%",
        "& *": { boxSizing: "border-box" },
        "& img, & svg, & canvas, & video": { maxWidth: "100%" },
      }}
    >
      <Box component="h1" sx={{
        border: 0,
        clip: "rect(0 0 0 0)",
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        whiteSpace: "nowrap",
        width: 1,
      }}>
        Inicio
      </Box>

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
        isLoading={isLoading}
        metrics={metrics}
        onRefresh={load}
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
    </Box>
  );
}

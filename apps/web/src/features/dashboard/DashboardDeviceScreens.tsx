import { Box, Stack } from "@mui/material";

import { DashboardOperationalInsights } from "./DashboardOperationalInsights";
import {
  DashboardExecutiveSummary,
  DashboardQuickActions,
  DashboardTrackingPanel,
} from "./dashboard.sections";
import type { DashboardMetrics } from "./dashboard.types";

type DashboardScreenProps = {
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  metrics: DashboardMetrics | null;
  onRefresh: () => void;
  salesDestination: string;
};

function DashboardMainWorkspace(props: DashboardScreenProps) {
  return (
    <Stack spacing={2.4} sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0, overflowX: "hidden", width: "100%" }}>
      <DashboardExecutiveSummary
        hasCriticalStock={props.hasCriticalStock}
        hasLowStock={props.hasLowStock}
        isAdmin={props.isAdmin}
        metrics={props.metrics}
        salesDestination={props.salesDestination}
      />

      <DashboardQuickActions isAdmin={props.isAdmin} metrics={props.metrics} />

      <Box
        sx={{
          alignItems: "start",
          display: "grid",
          gap: 2.4,
          gridTemplateColumns: { xs: "minmax(0, 1fr)", lg: "minmax(0, 1.1fr) minmax(0, 0.9fr)" },
          maxWidth: "100%",
          minWidth: 0,
          overflowX: "hidden",
        }}
      >
        <DashboardTrackingPanel
          hasCriticalStock={props.hasCriticalStock}
          hasLowStock={props.hasLowStock}
          isAdmin={props.isAdmin}
          isLoading={props.isLoading}
          metrics={props.metrics}
          onRefresh={props.onRefresh}
          salesDestination={props.salesDestination}
        />

        <DashboardOperationalInsights isAdmin={props.isAdmin} metrics={props.metrics} />
      </Box>
    </Stack>
  );
}

export function DashboardMobileScreen(props: DashboardScreenProps) {
  return (
    <Box data-testid="dashboard-mobile-screen" sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0, overflowX: "hidden", width: "100%" }}>
      <DashboardMainWorkspace {...props} />
    </Box>
  );
}

export function DashboardTabletScreen(props: DashboardScreenProps) {
  return (
    <Box data-testid="dashboard-tablet-screen" sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0, overflowX: "hidden", width: "100%" }}>
      <DashboardMainWorkspace {...props} />
    </Box>
  );
}

export function DashboardDesktopScreen(props: DashboardScreenProps) {
  return (
    <Box data-testid="dashboard-desktop-screen" sx={{ boxSizing: "border-box", maxWidth: "100%", minWidth: 0, overflowX: "hidden", width: "100%" }}>
      <DashboardMainWorkspace {...props} />
    </Box>
  );
}

import { useState } from "react";

import { Alert, Box, Stack, useMediaQuery, useTheme } from "@mui/material";

import { PageHeader } from "../../components/PageHeader";
import { AuditFiltersPanel } from "./AuditFiltersPanel";
import { AuditHero } from "./AuditHero";
import { AuditInsightsPanel } from "./AuditInsightsPanel";
import { AuditResultsSection } from "./AuditResultsSection";
import { useAuditData } from "./useAuditData";
import type { AuditView } from "./auditShared";

type AuditPageData = ReturnType<typeof useAuditData>;

function AuditError({ error }: { error?: string | null }) {
  if (!error) return null;

  return (
    <Alert severity="error" sx={{ mb: 2 }}>
      {error}
    </Alert>
  );
}

function AuditContent({ audit, layout }: { audit: AuditPageData; layout: "mobile" | "tablet" | "desktop" }) {
  const [activeView, setActiveView] = useState<AuditView>("activity");

  return (
    <Stack spacing={layout === "mobile" ? 1.25 : 1.6}>
      <AuditHero
        activeView={activeView}
        criticalEvents={audit.criticalEvents}
        latestEvent={audit.latestEvent}
        mode={layout}
        onViewChange={setActiveView}
      />

      <AuditFiltersPanel
        actionOptions={audit.actionOptions}
        activeFilterLabels={audit.activeFilterLabels}
        clearFilters={audit.clearFilters}
        consult={audit.consult}
        filters={audit.filters}
        isLoading={audit.isLoading}
        layout={layout}
        tableOptions={audit.tableOptions}
        userOptions={audit.userOptions}
        updateFilter={audit.updateFilter}
      />

      {activeView === "activity" && (
        <AuditInsightsPanel mode={layout} uniqueUsers={audit.uniqueUsers} visibleRows={audit.visibleRows} />
      )}

      {activeView === "events" && (
        <AuditResultsSection
          criticalEvents={audit.criticalEvents}
          layoutVariant={layout}
          visibleRows={audit.visibleRows}
        />
      )}
    </Stack>
  );
}

function AuditMobileScreen({ audit }: { audit: AuditPageData }) {
  return (
    <Box sx={{ mx: { xs: -1.5, sm: 0 }, pb: 8 }}>
      <PageHeader title="Auditoría" subtitle="Cambios, responsables y puntos a revisar." />
      <AuditError error={audit.error} />
      <AuditContent audit={audit} layout="mobile" />
    </Box>
  );
}

function AuditTabletScreen({ audit }: { audit: AuditPageData }) {
  return (
    <Box>
      <PageHeader title="Auditoría" subtitle="Actividad reciente con filtros y señales claras." />
      <AuditError error={audit.error} />
      <AuditContent audit={audit} layout="tablet" />
    </Box>
  );
}

function AuditDesktopScreen({ audit }: { audit: AuditPageData }) {
  return (
    <Box>
      <PageHeader title="Auditoría" subtitle="Cambios recientes, responsables y alertas principales." />
      <AuditError error={audit.error} />
      <AuditContent audit={audit} layout="desktop" />
    </Box>
  );
}

export function AuditPage() {
  const audit = useAuditData();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  if (isMobile) return <AuditMobileScreen audit={audit} />;
  if (isTablet) return <AuditTabletScreen audit={audit} />;
  return <AuditDesktopScreen audit={audit} />;
}

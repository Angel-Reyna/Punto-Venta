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

function AuditMobileScreen({ audit }: { audit: AuditPageData }) {
  const [activeView, setActiveView] = useState<AuditView>("activity");

  return (
    <Box sx={{ mx: { xs: -1.5, sm: 0 }, pb: 8 }}>
      <PageHeader
        title="Auditoría"
        subtitle="Cambios, responsables y puntos a revisar."
      />

      <AuditError error={audit.error} />

      <Stack spacing={1.25}>
        <AuditHero
          activeView={activeView}
          criticalEvents={audit.criticalEvents}
          latestEvent={audit.latestEvent}
          mode="mobile"
          onViewChange={setActiveView}
          visibleCount={audit.visibleRows.length}
        />

        {activeView === "activity" && (
          <AuditInsightsPanel mode="mobile" uniqueUsers={audit.uniqueUsers} visibleRows={audit.visibleRows} />
        )}

        <AuditFiltersPanel
          actionOptions={audit.actionOptions}
          activeFilterLabels={audit.activeFilterLabels}
          clearFilters={audit.clearFilters}
          consult={audit.consult}
          filters={audit.filters}
          isLoading={audit.isLoading}
          layout="mobile"
          tableOptions={audit.tableOptions}
          userOptions={audit.userOptions}
          updateFilter={audit.updateFilter}
        />

        {activeView === "events" && (
          <AuditResultsSection
            criticalEvents={audit.criticalEvents}
            layoutVariant="mobile"
            visibleRows={audit.visibleRows}
          />
        )}
      </Stack>
    </Box>
  );
}

function AuditTabletScreen({ audit }: { audit: AuditPageData }) {
  const [activeView, setActiveView] = useState<AuditView>("activity");

  return (
    <Box>
      <PageHeader
        title="Auditoría"
        subtitle="Actividad reciente con filtros y señales claras."
      />

      <AuditError error={audit.error} />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: "minmax(300px, 340px) minmax(0, 1fr)",
          alignItems: "start",
        }}
      >
        <Stack spacing={1.5} sx={{ position: "sticky", top: 84 }}>
          <AuditHero
            activeView={activeView}
            criticalEvents={audit.criticalEvents}
            latestEvent={audit.latestEvent}
            mode="tablet"
            onViewChange={setActiveView}
            visibleCount={audit.visibleRows.length}
          />
          <AuditFiltersPanel
            actionOptions={audit.actionOptions}
            activeFilterLabels={audit.activeFilterLabels}
            clearFilters={audit.clearFilters}
            consult={audit.consult}
            filters={audit.filters}
            isLoading={audit.isLoading}
            layout="tablet"
            tableOptions={audit.tableOptions}
            userOptions={audit.userOptions}
            updateFilter={audit.updateFilter}
          />
        </Stack>

        <Stack spacing={1.5}>
          {activeView === "activity" && (
            <AuditInsightsPanel mode="tablet" uniqueUsers={audit.uniqueUsers} visibleRows={audit.visibleRows} />
          )}
          {activeView === "events" && (
            <AuditResultsSection
              criticalEvents={audit.criticalEvents}
              layoutVariant="tablet"
              visibleRows={audit.visibleRows}
            />
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function AuditDesktopScreen({ audit }: { audit: AuditPageData }) {
  const [activeView, setActiveView] = useState<AuditView>("activity");

  return (
    <Box>
      <PageHeader
        title="Auditoría"
        subtitle="Cambios recientes, responsables y alertas principales."
      />

      <AuditError error={audit.error} />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { md: "320px minmax(0, 1fr)", xl: "340px minmax(0, 1fr)" },
          alignItems: "start",
        }}
      >
        <Stack spacing={1.5} sx={{ position: "sticky", top: 84 }}>
          <AuditFiltersPanel
            actionOptions={audit.actionOptions}
            activeFilterLabels={audit.activeFilterLabels}
            clearFilters={audit.clearFilters}
            consult={audit.consult}
            filters={audit.filters}
            isLoading={audit.isLoading}
            layout="desktop"
            tableOptions={audit.tableOptions}
            userOptions={audit.userOptions}
            updateFilter={audit.updateFilter}
          />
        </Stack>

        <Stack spacing={2}>
          <AuditHero
            activeView={activeView}
            criticalEvents={audit.criticalEvents}
            latestEvent={audit.latestEvent}
            mode="desktop"
            onViewChange={setActiveView}
            visibleCount={audit.visibleRows.length}
          />
          {activeView === "activity" && (
            <AuditInsightsPanel mode="desktop" uniqueUsers={audit.uniqueUsers} visibleRows={audit.visibleRows} />
          )}
          {activeView === "events" && (
            <AuditResultsSection
              criticalEvents={audit.criticalEvents}
              layoutVariant="desktop"
              visibleRows={audit.visibleRows}
            />
          )}
        </Stack>
      </Box>
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

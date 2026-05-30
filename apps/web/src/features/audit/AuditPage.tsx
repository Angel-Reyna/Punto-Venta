import { Alert, Grid } from "@mui/material";

import { PageHeader } from "../../components/PageHeader";
import { AuditFiltersPanel } from "./AuditFiltersPanel";
import { AuditHero } from "./AuditHero";
import { AuditResultsSection } from "./AuditResultsSection";
import { AuditSummaryCards } from "./AuditSummaryCards";
import { useAuditData } from "./useAuditData";

export function AuditPage() {
  const {
    actionOptions,
    activeFilterLabels,
    clearFilters,
    consult,
    criticalEvents,
    error,
    filters,
    isLoading,
    latestEvent,
    tableOptions,
    uniqueUsers,
    updateFilter,
    visibleRows,
  } = useAuditData();

  return (
    <>
      <PageHeader
        title="Auditoría"
        subtitle="Consulta el historial de cambios con explicaciones simples: qué pasó, quién lo hizo y cuándo ocurrió."
      />

      <AuditHero criticalEvents={criticalEvents} latestEvent={latestEvent} visibleCount={visibleRows.length} />

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <AuditSummaryCards
        criticalEvents={criticalEvents}
        latestEvent={latestEvent}
        uniqueUsers={uniqueUsers}
        visibleCount={visibleRows.length}
      />

      <Grid container spacing={{ xs: 1.5, md: 2 }} alignItems="flex-start">
        <Grid item xs={12} md={5} lg={4}>
          <AuditFiltersPanel
            actionOptions={actionOptions}
            activeFilterLabels={activeFilterLabels}
            clearFilters={clearFilters}
            consult={consult}
            filters={filters}
            isLoading={isLoading}
            tableOptions={tableOptions}
            updateFilter={updateFilter}
          />
        </Grid>

        <Grid item xs={12} md={7} lg={8}>
          <AuditResultsSection criticalEvents={criticalEvents} visibleRows={visibleRows} />
        </Grid>
      </Grid>
    </>
  );
}

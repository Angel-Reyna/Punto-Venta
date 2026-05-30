import { Alert, Box, Card, CardContent, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";

import { PageHeader } from "../../components/PageHeader";
import { AuditFiltersPanel } from "./AuditFiltersPanel";
import { AuditHero } from "./AuditHero";
import { AuditResultsSection } from "./AuditResultsSection";
import { AuditSummaryCards } from "./AuditSummaryCards";
import { useAuditData } from "./useAuditData";

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
  return (
    <Box sx={{ mx: { xs: -1.5, sm: 0 }, pb: 8 }}>
      <PageHeader
        title="Auditoría"
        subtitle="Bitácora rápida: qué pasó, quién lo hizo y si debes revisarlo."
      />

      <AuditError error={audit.error} />

      <Stack spacing={1.25}>
        <AuditHero
          criticalEvents={audit.criticalEvents}
          latestEvent={audit.latestEvent}
          mode="mobile"
          visibleCount={audit.visibleRows.length}
        />

        <AuditFiltersPanel
          actionOptions={audit.actionOptions}
          activeFilterLabels={audit.activeFilterLabels}
          clearFilters={audit.clearFilters}
          consult={audit.consult}
          filters={audit.filters}
          isLoading={audit.isLoading}
          layout="mobile"
          tableOptions={audit.tableOptions}
          updateFilter={audit.updateFilter}
        />

        <AuditResultsSection
          criticalEvents={audit.criticalEvents}
          layoutVariant="mobile"
          visibleRows={audit.visibleRows}
        />
      </Stack>
    </Box>
  );
}

function AuditTabletScreen({ audit }: { audit: AuditPageData }) {
  return (
    <Box>
      <PageHeader
        title="Auditoría"
        subtitle="Vista de tablet: tablero de revisión con filtros fijos y eventos en tarjetas."
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
            criticalEvents={audit.criticalEvents}
            latestEvent={audit.latestEvent}
            mode="tablet"
            visibleCount={audit.visibleRows.length}
          />
          <AuditSummaryCards
            criticalEvents={audit.criticalEvents}
            latestEvent={audit.latestEvent}
            mode="tablet"
            uniqueUsers={audit.uniqueUsers}
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
            updateFilter={audit.updateFilter}
          />
        </Stack>

        <AuditResultsSection
          criticalEvents={audit.criticalEvents}
          layoutVariant="tablet"
          visibleRows={audit.visibleRows}
        />
      </Box>
    </Box>
  );
}

function AuditDesktopScreen({ audit }: { audit: AuditPageData }) {
  return (
    <Box>
      <PageHeader
        title="Auditoría"
        subtitle="Centro de investigación operativa: revisa cambios importantes con filtros, línea de tiempo y resumen ejecutivo."
      />

      <AuditError error={audit.error} />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: { md: "300px minmax(0, 1fr) 280px", xl: "320px minmax(0, 1fr) 310px" },
          alignItems: "start",
        }}
      >
        <AuditFiltersPanel
          actionOptions={audit.actionOptions}
          activeFilterLabels={audit.activeFilterLabels}
          clearFilters={audit.clearFilters}
          consult={audit.consult}
          filters={audit.filters}
          isLoading={audit.isLoading}
          layout="desktop"
          tableOptions={audit.tableOptions}
          updateFilter={audit.updateFilter}
        />

        <Stack spacing={2}>
          <AuditHero
            criticalEvents={audit.criticalEvents}
            latestEvent={audit.latestEvent}
            mode="desktop"
            visibleCount={audit.visibleRows.length}
          />
          <AuditResultsSection
            criticalEvents={audit.criticalEvents}
            layoutVariant="desktop"
            visibleRows={audit.visibleRows}
          />
        </Stack>

        <Stack spacing={2} sx={{ position: "sticky", top: 84 }}>
          <AuditSummaryCards
            criticalEvents={audit.criticalEvents}
            latestEvent={audit.latestEvent}
            mode="desktop"
            uniqueUsers={audit.uniqueUsers}
            visibleCount={audit.visibleRows.length}
          />

          <Card variant="outlined">
            <CardContent>
              <Stack spacing={1}>
                <Typography variant="subtitle1" fontWeight={950}>
                  Cómo leer esta pantalla
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  1. Filtra por acción o fecha. 2. Revisa primero las acciones críticas. 3. Abre detalles solo cuando
                  necesites comparar antes/después.
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Los datos sensibles se mantienen ocultos como [redactado].
                </Typography>
              </Stack>
            </CardContent>
          </Card>
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

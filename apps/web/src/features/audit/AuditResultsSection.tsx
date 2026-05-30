import { Box, Card, CardContent, Chip, Stack, Typography, useMediaQuery, useTheme } from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { EmptyStatePanel } from "../../components/data-display";
import { AuditLogCard, type AuditLayoutVariant, type AuditLog } from "./auditShared";

function useAuditLayoutVariant(): AuditLayoutVariant {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const isTablet = useMediaQuery(theme.breakpoints.between("sm", "lg"));

  if (isMobile) return "mobile";
  if (isTablet) return "tablet";
  return "desktop";
}

export function AuditResultsSection({
  criticalEvents,
  visibleRows,
}: {
  criticalEvents: number;
  visibleRows: AuditLog[];
}) {
  const layoutVariant = useAuditLayoutVariant();
  const isTabletLayout = layoutVariant === "tablet";

  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25} justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={900} data-testid="audit-results-heading">
                {visibleRows.length} registro(s) para revisar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Cada tarjeta explica en lenguaje simple qué pasó, quién lo hizo, cuándo ocurrió y qué dato cambió.
              </Typography>
            </Box>
            <Chip
              color={criticalEvents > 0 ? "error" : "success"}
              label={criticalEvents > 0 ? "Hay acciones delicadas" : "Sin acciones delicadas visibles"}
              icon={criticalEvents > 0 ? <WarningAmberIcon /> : <SecurityIcon />}
              sx={{ alignSelf: { xs: "flex-start", sm: "center" } }}
            />
          </Stack>
        </CardContent>
      </Card>

      {visibleRows.length === 0 ? (
        <EmptyStatePanel>
          No hay registros con los filtros actuales. Limpia filtros o realiza una acción administrativa para ver actividad.
        </EmptyStatePanel>
      ) : (
        <Box
          sx={{
            display: "grid",
            gap: 1.5,
            gridTemplateColumns: isTabletLayout ? "repeat(2, minmax(0, 1fr))" : "1fr",
          }}
        >
          {visibleRows.map((log) => (
            <AuditLogCard key={log.id} log={log} variant={layoutVariant} />
          ))}
        </Box>
      )}
    </Stack>
  );
}

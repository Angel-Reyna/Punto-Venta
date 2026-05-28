import { Box, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { EmptyStatePanel } from "../../components/data-display";
import { AuditLogCard, type AuditLog } from "./auditShared";

export function AuditResultsSection({
  criticalEvents,
  visibleRows,
}: {
  criticalEvents: number;
  visibleRows: AuditLog[];
}) {
  return (
    <Stack spacing={2}>
      <Card variant="outlined">
        <CardContent>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
            <Box>
              <Typography variant="h6" fontWeight={900} data-testid="audit-results-heading">
                {visibleRows.length} evento(s) visibles
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Revisión secuencial con severidad, actor, entidad afectada y evidencia redactada.
              </Typography>
            </Box>
            <Chip
              color={criticalEvents > 0 ? "error" : "success"}
              label={criticalEvents > 0 ? "Requiere revisión prioritaria" : "Sin críticos visibles"}
              icon={criticalEvents > 0 ? <WarningAmberIcon /> : <SecurityIcon />}
            />
          </Stack>
        </CardContent>
      </Card>

      {visibleRows.length === 0 ? (
        <EmptyStatePanel>
          No hay eventos de auditoría. Ajusta los filtros o registra una acción administrativa para generar actividad auditable.
        </EmptyStatePanel>
      ) : (
        <Stack spacing={1.5}>
          {visibleRows.map((log) => (
            <AuditLogCard key={log.id} log={log} />
          ))}
        </Stack>
      )}
    </Stack>
  );
}

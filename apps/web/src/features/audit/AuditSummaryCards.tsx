import type { ReactNode } from "react";

import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HistoryIcon from "@mui/icons-material/History";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

type AuditMetricTone = "primary" | "success" | "warning" | "error" | "info";

function AuditMetricCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  helper: string;
  icon?: ReactNode;
  tone?: AuditMetricTone;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        border: 1,
        borderColor: `${tone}.light`,
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.06)",
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.25} alignItems="flex-start">
          <Box
            sx={{
              display: "grid",
              placeItems: "center",
              width: 38,
              height: 38,
              borderRadius: 2,
              color: `${tone}.main`,
              bgcolor: "background.default",
              border: 1,
              borderColor: `${tone}.light`,
            }}
          >
            {icon}
          </Box>

          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>

            <Typography variant="h5" fontWeight={950} sx={{ mt: 0.5, overflowWrap: "anywhere" }}>
              {value}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function AuditSummaryCards({
  criticalEvents,
  latestEvent,
  uniqueUsers,
  visibleCount,
}: {
  criticalEvents: number;
  latestEvent: string;
  uniqueUsers: number;
  visibleCount: number;
}) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} lg={3}>
        <AuditMetricCard
          label="Eventos visibles"
          value={visibleCount}
          helper="Resultados después de filtros operativos"
          icon={<HistoryIcon fontSize="small" />}
          tone="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <AuditMetricCard
          label="Usuarios involucrados"
          value={uniqueUsers}
          helper="Incluye acciones de sistema"
          icon={<PeopleAltIcon fontSize="small" />}
          tone="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <AuditMetricCard
          label="Eventos críticos"
          value={criticalEvents}
          helper="Acciones destructivas o de acceso"
          icon={<WarningAmberIcon fontSize="small" />}
          tone="error"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <AuditMetricCard
          label="Último evento"
          value={latestEvent}
          helper="Actividad más reciente"
          icon={<AdminPanelSettingsIcon fontSize="small" />}
          tone="warning"
        />
      </Grid>
    </Grid>
  );
}

import type { ReactNode } from "react";

import { Box, Card, CardContent, Stack, Typography } from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HistoryIcon from "@mui/icons-material/History";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import type { AuditLayoutVariant } from "./auditShared";

type AuditMetricTone = "primary" | "success" | "warning" | "error" | "info";

type AuditMetric = {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  tone: AuditMetricTone;
};

function AuditMetricRow({ helper, icon, label, tone, value }: AuditMetric) {
  return (
    <Box
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 2,
        p: 1.25,
        bgcolor: "background.paper",
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="flex-start">
        <Box
          sx={{
            display: "grid",
            placeItems: "center",
            width: 36,
            height: 36,
            borderRadius: 2,
            color: `${tone}.main`,
            bgcolor: "background.default",
            border: 1,
            borderColor: `${tone}.light`,
            flexShrink: 0,
          }}
        >
          {icon}
        </Box>
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="caption" color="text.secondary">
            {label}
          </Typography>
          <Typography variant="h6" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
            {value}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        </Box>
      </Stack>
    </Box>
  );
}

export function AuditSummaryCards({
  criticalEvents,
  latestEvent,
  mode = "desktop",
  uniqueUsers,
  visibleCount,
}: {
  criticalEvents: number;
  latestEvent: string;
  mode?: AuditLayoutVariant;
  uniqueUsers: number;
  visibleCount: number;
}) {
  const metrics: AuditMetric[] = [
    {
      label: "Eventos visibles",
      value: visibleCount,
      helper: "Después de aplicar filtros",
      icon: <HistoryIcon fontSize="small" />,
      tone: "primary",
    },
    {
      label: "Personas",
      value: uniqueUsers,
      helper: "Usuarios o sistema",
      icon: <PeopleAltIcon fontSize="small" />,
      tone: "success",
    },
    {
      label: "Críticas",
      value: criticalEvents,
      helper: "Revisar primero",
      icon: <WarningAmberIcon fontSize="small" />,
      tone: "error",
    },
    {
      label: "Último cambio",
      value: latestEvent,
      helper: "Más reciente en la lista",
      icon: <AdminPanelSettingsIcon fontSize="small" />,
      tone: "warning",
    },
  ];

  if (mode === "tablet") {
    return (
      <Box
        sx={{
          display: "grid",
          gap: 1,
          gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
        }}
      >
        {metrics.slice(0, 3).map((metric) => (
          <AuditMetricRow key={metric.label} {...metric} />
        ))}
      </Box>
    );
  }

  return (
    <Card variant="outlined" sx={{ borderRadius: 3 }}>
      <CardContent sx={{ p: 2 }}>
        <Stack spacing={1.25}>
          <Box>
            <Typography variant="subtitle1" fontWeight={950}>
              Resumen ejecutivo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Lee primero estos datos antes de abrir detalles.
            </Typography>
          </Box>
          {metrics.map((metric) => (
            <AuditMetricRow key={metric.label} {...metric} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

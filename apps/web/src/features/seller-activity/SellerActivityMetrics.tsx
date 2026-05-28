import type { ReactNode } from "react";

import { Box, Card, CardContent, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import BlockIcon from "@mui/icons-material/Block";
import GroupsIcon from "@mui/icons-material/Groups";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import TimelineIcon from "@mui/icons-material/Timeline";

import type { summarizeActivity } from "./sellerActivityShared";

type MetricTone = "primary" | "success" | "warning" | "error" | "info";
type ActivitySummary = ReturnType<typeof summarizeActivity>;

function VisualMetricCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  tone?: MetricTone;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette[tone].main, 0.04),
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: `${tone}.main`,
              bgcolor: (theme) => alpha(theme.palette[tone].main, 0.12),
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Box minWidth={0}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={900} sx={{ mt: 0.25 }}>
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

export function SellerActivityMetrics({ rowsCount, summary }: { rowsCount: number; summary: ActivitySummary }) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }}>
      <Grid item xs={12} sm={6} lg={3}>
        <VisualMetricCard
          label="Movimientos cargados"
          value={rowsCount}
          helper="Según filtros consultados"
          icon={<TimelineIcon />}
          tone="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <VisualMetricCard
          label="Vendedores con actividad"
          value={summary.activeSellersInResults}
          helper="Usuarios únicos en resultados"
          icon={<GroupsIcon />}
          tone="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <VisualMetricCard
          label="Ventas registradas"
          value={summary.saleCreatedCount}
          helper="Eventos de venta del periodo"
          icon={<PointOfSaleIcon />}
          tone="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <VisualMetricCard
          label="Accesos bloqueados"
          value={summary.failedAccessCount}
          helper="Intentos sin permiso"
          icon={<BlockIcon />}
          tone="error"
        />
      </Grid>
    </Grid>
  );
}

import { Grid } from "@mui/material";

import BlockIcon from "@mui/icons-material/Block";
import GroupsIcon from "@mui/icons-material/Groups";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import TimelineIcon from "@mui/icons-material/Timeline";

import { VisualMetricCard } from "../../components/VisualMetricCard";

import type { summarizeActivity } from "./sellerActivityShared";

type ActivitySummary = ReturnType<typeof summarizeActivity>;

export function SellerActivityMetrics({ rowsCount, summary }: { rowsCount: number; summary: ActivitySummary }) {
  return (
    <Grid container spacing={2} sx={{ mb: 2 }} data-testid="seller-activity-metrics">
      <Grid item xs={12} sm={6} lg={3}>
        <VisualMetricCard
          label="Movimientos cargados"
          value={rowsCount}
          helper="Eventos cargados"
          icon={<TimelineIcon />}
          tone="primary"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <VisualMetricCard
          label="Vendedores con actividad"
          value={summary.activeSellersInResults}
          helper="Personas distintas"
          icon={<GroupsIcon />}
          tone="info"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <VisualMetricCard
          label="Ventas registradas"
          value={summary.saleCreatedCount}
          helper="Operación comercial"
          icon={<PointOfSaleIcon />}
          tone="success"
        />
      </Grid>
      <Grid item xs={12} sm={6} lg={3}>
        <VisualMetricCard
          label="Accesos bloqueados"
          value={summary.failedAccessCount}
          helper="Requieren revisión"
          icon={<BlockIcon />}
          tone="error"
        />
      </Grid>
    </Grid>
  );
}

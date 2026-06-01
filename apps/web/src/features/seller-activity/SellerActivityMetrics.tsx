import BlockIcon from "@mui/icons-material/Block";
import GroupsIcon from "@mui/icons-material/Groups";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import TimelineIcon from "@mui/icons-material/Timeline";

import { VisualMetricCard } from "../../components/VisualMetricCard";
import { VisualMetricGrid } from "../../components/VisualMetricGrid";

import type { summarizeActivity } from "./sellerActivityShared";

type ActivitySummary = ReturnType<typeof summarizeActivity>;

export function SellerActivityMetrics({ rowsCount, summary }: { rowsCount: number; summary: ActivitySummary }) {
  return (
    <VisualMetricGrid marginBottom={2} testId="seller-activity-metrics">
      <VisualMetricCard
        label="Movimientos cargados"
        value={rowsCount}
        helper="Eventos cargados"
        icon={<TimelineIcon />}
        tone="primary"
      />
      <VisualMetricCard
        label="Vendedores con actividad"
        value={summary.activeSellersInResults}
        helper="Personas distintas"
        icon={<GroupsIcon />}
        tone="info"
      />
      <VisualMetricCard
        label="Ventas registradas"
        value={summary.saleCreatedCount}
        helper="Operación comercial"
        icon={<PointOfSaleIcon />}
        tone="success"
      />
      <VisualMetricCard
        label="Accesos bloqueados"
        value={summary.failedAccessCount}
        helper="Requieren revisión"
        icon={<BlockIcon />}
        tone="error"
      />
    </VisualMetricGrid>
  );
}

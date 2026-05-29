import InsightsIcon from "@mui/icons-material/Insights";

import { EntityStatusChip } from "../../components/data-display";
import { PageHero } from "../../components/layout";
import { formatMoney, formatNumber } from "./dashboard.formatters";
import type { DashboardMetrics } from "./dashboard.types";

export function DashboardOperationalHero({
  generatedAtLabel,
  hasCriticalStock,
  hasLowStock,
  metrics,
}: {
  generatedAtLabel: string;
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  metrics: DashboardMetrics | null;
}) {
  const operationalStateLabel = hasCriticalStock
    ? "Atención crítica"
    : hasLowStock
      ? "Reposición sugerida"
      : "Operación estable";
  const operationalStateColor = hasCriticalStock ? "error" : hasLowStock ? "warning" : "success";

  return (
    <PageHero
      testId="dashboard-operational-hero"
      title="Resumen operativo en tiempo real"
      subtitle="Prioriza ventas, reposición e incidencias desde una sola lectura. La venta en efectivo sigue independiente de Caja; Caja solo ayuda a controlar entregas y cortes."
      tone={
        operationalStateColor === "error"
          ? "error"
          : operationalStateColor === "warning"
            ? "warning"
            : "success"
      }
      eyebrow={
        <>
          <EntityStatusChip
            icon={<InsightsIcon />}
            tone={operationalStateColor}
            label={operationalStateLabel}
            variant="filled"
          />
          <EntityStatusChip
            label={metrics?.salesToday.scope === "cashier" ? "Vista de vendedor" : "Vista global"}
          />
        </>
      }
      stats={[
        {
          label: "Vendido hoy",
          value: formatMoney(metrics?.salesToday.total),
        },
        {
          label: "Productos activos",
          value: formatNumber(metrics?.productSummary.active),
        },
        {
          label: "Última actualización",
          value: generatedAtLabel,
        },
      ]}
    />
  );
}

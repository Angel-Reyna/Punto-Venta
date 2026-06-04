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
      title="Pulso operativo"
      subtitle="Ventas del día, alertas de inventario y lectura rápida para decidir el siguiente paso."
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
          label: "Ventas hoy",
          value: formatNumber(metrics?.salesToday.count),
        },
        {
          label: "Inventario en alerta",
          value: formatNumber(metrics?.productSummary.lowStockTotal),
        },
        {
          label: "Última actualización",
          value: generatedAtLabel,
        },
      ]}
    />
  );
}

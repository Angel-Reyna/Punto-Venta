import { Chip, Grid, Stack, Typography } from "@mui/material";

import InventoryIcon from "@mui/icons-material/Inventory2";
import PaidIcon from "@mui/icons-material/Paid";
import PeopleIcon from "@mui/icons-material/People";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import WarningIcon from "@mui/icons-material/WarningAmber";

import { MetricGrid } from "../../components/layout";
import { DashboardMetricCard } from "./DashboardMetricCard";
import { formatMoney, formatNumber } from "./dashboard.formatters";
import type { DashboardMetrics } from "./dashboard.types";

export function DashboardMetricsGrid({
  hasCriticalStock,
  hasLowStock,
  isAdmin,
  metrics,
  salesDestination,
}: {
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  isAdmin: boolean;
  metrics: DashboardMetrics | null;
  salesDestination: string;
}) {
  return (
    <MetricGrid>
      <Grid item xs={12} sm={6} lg={4} xl={2}>
        <DashboardMetricCard
          title="Ventas de hoy"
          value={formatNumber(metrics?.salesToday.count)}
          icon={<PointOfSaleIcon />}
          description={isAdmin ? "Ventas globales completadas" : "Tus ventas completadas"}
          to={salesDestination}
          tone="info"
          footer={
            <Typography color="text.secondary" variant="caption">
              Ticket promedio {formatMoney(metrics?.salesToday.averageTicket)}
            </Typography>
          }
        />
      </Grid>

      <Grid item xs={12} sm={6} lg={4} xl={2}>
        <DashboardMetricCard
          title="Total vendido"
          value={formatMoney(metrics?.salesToday.total)}
          icon={<PaidIcon />}
          description={isAdmin ? "Importe global del día" : "Importe vendido por ti hoy"}
          to={salesDestination}
          tone="success"
          footer={
            <Typography color="text.secondary" variant="caption">
              Alcance: {metrics?.salesToday.scope === "cashier" ? "vendedor" : "global"}
            </Typography>
          }
        />
      </Grid>

      {isAdmin && (
        <Grid item xs={12} sm={6} lg={4} xl={2}>
          <DashboardMetricCard
            title="Usuarios activos"
            value={formatNumber(metrics?.userSummary.totalActive)}
            icon={<PeopleIcon />}
            description="Administradores y vendedores activos"
            to="/users"
            footer={
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip size="small" label={`Admins ${formatNumber(metrics?.userSummary.activeAdmins)}`} />
                <Chip size="small" label={`Vendedores ${formatNumber(metrics?.userSummary.activeCashiers)}`} />
              </Stack>
            }
          />
        </Grid>
      )}

      {isAdmin && (
        <Grid item xs={12} sm={6} lg={4} xl={2}>
          <DashboardMetricCard
            title="Productos activos"
            value={formatNumber(metrics?.productSummary.active)}
            icon={<InventoryIcon />}
            description="Catálogo disponible para venta"
            to="/products"
          />
        </Grid>
      )}

      {isAdmin && (
        <Grid item xs={12} sm={6} lg={4} xl={2}>
          <DashboardMetricCard
            title="Inventario bajo"
            value={formatNumber(metrics?.productSummary.lowStockTotal)}
            icon={<WarningIcon />}
            description="Productos en mínimo o sin stock"
            to="/inventory"
            tone={hasCriticalStock ? "critical" : hasLowStock ? "warning" : "success"}
            footer={
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  color={hasCriticalStock ? "error" : "default"}
                  label={`Sin stock ${formatNumber(metrics?.productSummary.outOfStockTotal)}`}
                />
                <Chip size="small" color={hasLowStock ? "warning" : "default"} label="Revisar" />
              </Stack>
            }
          />
        </Grid>
      )}
    </MetricGrid>
  );
}

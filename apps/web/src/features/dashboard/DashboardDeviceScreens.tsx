import { Link as RouterLink } from "react-router-dom";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import ArrowForwardIcon from "@mui/icons-material/ArrowForward";
import AssessmentIcon from "@mui/icons-material/Assessment";
import InventoryIcon from "@mui/icons-material/Inventory2";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import WarningIcon from "@mui/icons-material/WarningAmber";

import { DashboardMetricsGrid } from "./DashboardMetricsGrid";
import { DashboardOperationalInsights } from "./DashboardOperationalInsights";
import {
  InventoryAttentionPanel,
  OperationalReadingPanel,
  RecentSalesPanel,
} from "./dashboard.sections";
import { formatMoney, formatNumber } from "./dashboard.formatters";
import type { DashboardMetrics } from "./dashboard.types";

type DashboardScreenProps = {
  hasCriticalStock: boolean;
  hasLowStock: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  metrics: DashboardMetrics | null;
  onRefresh: () => void;
  salesDestination: string;
};

type DashboardTodayCardProps = Pick<
  DashboardScreenProps,
  "hasCriticalStock" | "hasLowStock" | "isAdmin" | "metrics" | "salesDestination"
> & {
  compact?: boolean;
};

function getInventoryStateLabel({
  hasCriticalStock,
  hasLowStock,
}: Pick<DashboardTodayCardProps, "hasCriticalStock" | "hasLowStock">) {
  if (hasCriticalStock) return "Revisar inventario ahora";
  if (hasLowStock) return "Reposición sugerida";
  return "Inventario estable";
}

function getInventoryTone({
  hasCriticalStock,
  hasLowStock,
}: Pick<DashboardTodayCardProps, "hasCriticalStock" | "hasLowStock">) {
  if (hasCriticalStock) return "error";
  if (hasLowStock) return "warning";
  return "success";
}

function DashboardTodayCard({
  compact = false,
  hasCriticalStock,
  hasLowStock,
  isAdmin,
  metrics,
  salesDestination,
}: DashboardTodayCardProps) {
  const inventoryTone = getInventoryTone({ hasCriticalStock, hasLowStock });
  const inventoryStateLabel = getInventoryStateLabel({ hasCriticalStock, hasLowStock });

  return (
    <Card
      data-testid="dashboard-today-card"
      sx={(theme) => {
        const isDark = theme.palette.mode === "dark";

        return {
          borderRadius: 5,
          overflow: "hidden",
          border: "1px solid",
          borderColor: alpha(theme.palette.primary.main, isDark ? 0.26 : 0.18),
          background: isDark
            ? `linear-gradient(145deg, ${alpha(theme.palette.primary.dark, 0.34)} 0%, ${alpha(
                theme.palette.background.paper,
                0.96,
              )} 58%)`
            : `linear-gradient(145deg, ${alpha(theme.palette.primary.light, 0.2)} 0%, ${theme.palette.background.paper} 62%)`,
        };
      }}
    >
      <CardContent>
        <Stack spacing={compact ? 2 : 2.5}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Chip
              icon={<PointOfSaleIcon />}
              label={isAdmin ? "Negocio hoy" : "Tu jornada"}
              color="primary"
              variant="outlined"
            />
            <Chip
              color={inventoryTone}
              icon={<WarningIcon />}
              label={inventoryStateLabel}
              variant={inventoryTone === "success" ? "outlined" : "filled"}
            />
          </Stack>

          <Box>
            <Typography color="text.secondary" fontWeight={800} variant="body2">
              Ventas registradas hoy
            </Typography>
            <Typography
              fontWeight={950}
              sx={{
                fontSize: compact ? { xs: "2.25rem", sm: "2.75rem" } : { md: "3rem" },
                letterSpacing: "-0.06em",
                lineHeight: 1,
                mt: 0.75,
              }}
            >
              {formatMoney(metrics?.salesToday.total)}
            </Typography>
          </Box>

          <Grid container spacing={1.5}>
            <Grid item xs={6}>
              <Stack spacing={0.25}>
                <Typography color="text.secondary" variant="caption">
                  Operaciones
                </Typography>
                <Typography fontWeight={900}>{formatNumber(metrics?.salesToday.count)}</Typography>
              </Stack>
            </Grid>
            <Grid item xs={6}>
              <Stack spacing={0.25}>
                <Typography color="text.secondary" variant="caption">
                  Ticket promedio
                </Typography>
                <Typography fontWeight={900}>{formatMoney(metrics?.salesToday.averageTicket)}</Typography>
              </Stack>
            </Grid>
          </Grid>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
            <Button
              component={RouterLink}
              endIcon={<ArrowForwardIcon />}
              to={salesDestination}
              fullWidth
            >
              {isAdmin ? "Revisar ventas" : "Registrar venta"}
            </Button>
            <Button
              component={RouterLink}
              startIcon={<InventoryIcon />}
              to="/inventory"
              variant="outlined"
              fullWidth
            >
              Ver inventario
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function DashboardPriorityPanel({
  hasCriticalStock,
  hasLowStock,
  metrics,
}: Pick<DashboardScreenProps, "hasCriticalStock" | "hasLowStock" | "metrics">) {
  const title = hasCriticalStock
    ? "Primero revisa productos sin stock"
    : hasLowStock
      ? "Hay productos por reponer"
      : "La operación está estable";
  const description = hasCriticalStock
    ? "Evita ventas fallidas: hay productos agotados en el catálogo."
    : hasLowStock
      ? "Todavía puedes vender, pero conviene programar reposición."
      : "No hay alertas críticas de inventario. Mantén el foco en ventas y seguimiento.";

  return (
    <Card
      sx={(theme) => ({
        borderRadius: 4,
        border: "1px solid",
        borderColor: alpha(
          hasCriticalStock
            ? theme.palette.error.main
            : hasLowStock
              ? theme.palette.warning.main
              : theme.palette.success.main,
          theme.palette.mode === "dark" ? 0.26 : 0.2,
        ),
      })}
    >
      <CardContent>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1} alignItems="center">
            <Box
              sx={(theme) => ({
                width: 42,
                height: 42,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                color: hasCriticalStock
                  ? theme.palette.error.main
                  : hasLowStock
                    ? theme.palette.warning.main
                    : theme.palette.success.main,
                backgroundColor: alpha(
                  hasCriticalStock
                    ? theme.palette.error.main
                    : hasLowStock
                      ? theme.palette.warning.main
                      : theme.palette.success.main,
                  0.12,
                ),
              })}
            >
              {hasCriticalStock || hasLowStock ? <WarningIcon /> : <AssessmentIcon />}
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography fontWeight={900}>{title}</Typography>
              <Typography color="text.secondary" variant="body2">
                {description}
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            <Chip
              size="small"
              color={hasCriticalStock ? "error" : "default"}
              label={`Sin stock ${formatNumber(metrics?.productSummary.outOfStockTotal)}`}
            />
            <Chip
              size="small"
              color={hasLowStock ? "warning" : "default"}
              label={`Bajo mínimo ${formatNumber(metrics?.productSummary.lowStockTotal)}`}
            />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function DashboardMobileScreen(props: DashboardScreenProps) {
  return (
    <Stack data-testid="dashboard-mobile-screen" spacing={2}>
      <DashboardTodayCard {...props} compact />
      <DashboardPriorityPanel {...props} />
      <DashboardOperationalInsights isAdmin={props.isAdmin} metrics={props.metrics} />
      <RecentSalesPanel
        metrics={props.metrics}
        isAdmin={props.isAdmin}
        salesDestination={props.salesDestination}
      />
      <InventoryAttentionPanel metrics={props.metrics} />
      <OperationalReadingPanel
        hasCriticalStock={props.hasCriticalStock}
        hasLowStock={props.hasLowStock}
        outOfStockTotal={props.metrics?.productSummary.outOfStockTotal}
        isLoading={props.isLoading}
        onRefresh={props.onRefresh}
      />
    </Stack>
  );
}

export function DashboardTabletScreen(props: DashboardScreenProps) {
  return (
    <Grid data-testid="dashboard-tablet-screen" container spacing={2.5} alignItems="flex-start">
      <Grid item xs={12} md={5}>
        <Stack spacing={2.5} sx={{ position: { md: "sticky" }, top: { md: 88 } }}>
          <DashboardTodayCard {...props} compact />
          <DashboardPriorityPanel {...props} />
          <OperationalReadingPanel
            hasCriticalStock={props.hasCriticalStock}
            hasLowStock={props.hasLowStock}
            outOfStockTotal={props.metrics?.productSummary.outOfStockTotal}
            isLoading={props.isLoading}
            onRefresh={props.onRefresh}
          />
        </Stack>
      </Grid>

      <Grid item xs={12} md={7}>
        <Stack spacing={2.5}>
          <DashboardMetricsGrid
            hasCriticalStock={props.hasCriticalStock}
            hasLowStock={props.hasLowStock}
            isAdmin={props.isAdmin}
            metrics={props.metrics}
            salesDestination={props.salesDestination}
          />
          <DashboardOperationalInsights isAdmin={props.isAdmin} metrics={props.metrics} />
          <InventoryAttentionPanel metrics={props.metrics} />
          <RecentSalesPanel
            metrics={props.metrics}
            isAdmin={props.isAdmin}
            salesDestination={props.salesDestination}
          />
        </Stack>
      </Grid>
    </Grid>
  );
}

export function DashboardDesktopScreen(props: DashboardScreenProps) {
  return (
    <Box
      data-testid="dashboard-desktop-screen"
      sx={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 1fr) minmax(360px, 430px)",
        gap: 2.5,
        alignItems: "start",
      }}
    >
      <Stack spacing={2.5} sx={{ minWidth: 0 }}>
        <DashboardMetricsGrid
          hasCriticalStock={props.hasCriticalStock}
          hasLowStock={props.hasLowStock}
          isAdmin={props.isAdmin}
          metrics={props.metrics}
          salesDestination={props.salesDestination}
        />

        <DashboardOperationalInsights isAdmin={props.isAdmin} metrics={props.metrics} />

        <Grid container spacing={2.5}>
          <Grid item xs={12} xl={5}>
            <InventoryAttentionPanel metrics={props.metrics} />
          </Grid>
          <Grid item xs={12} xl={7}>
            <RecentSalesPanel
              metrics={props.metrics}
              isAdmin={props.isAdmin}
              salesDestination={props.salesDestination}
            />
          </Grid>
        </Grid>
      </Stack>

      <Stack spacing={2.5} sx={{ minWidth: 0, position: "sticky", top: 96 }}>
        <DashboardTodayCard {...props} />
        <OperationalReadingPanel
          hasCriticalStock={props.hasCriticalStock}
          hasLowStock={props.hasLowStock}
          outOfStockTotal={props.metrics?.productSummary.outOfStockTotal}
          isLoading={props.isLoading}
          onRefresh={props.onRefresh}
        />
      </Stack>
    </Box>
  );
}

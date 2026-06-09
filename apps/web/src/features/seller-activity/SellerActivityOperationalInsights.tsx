import type { ReactNode } from "react";

import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import BlockIcon from "@mui/icons-material/Block";
import GroupsIcon from "@mui/icons-material/Groups";
import InsightsIcon from "@mui/icons-material/Insights";
import PersonOffIcon from "@mui/icons-material/PersonOff";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";

import type { Seller, SellerActivityBySeller, SummaryItem } from "./sellerActivityShared";

function getSummaryCount(summary: SummaryItem[], action: SummaryItem["action"]) {
  return summary.find((item) => item.action === action)?.count ?? 0;
}

function pluralize(count: number, singular: string, plural: string) {
  return `${count} ${count === 1 ? singular : plural}`;
}

function InsightTile({
  helper,
  icon,
  label,
  tone = "primary",
  value,
}: {
  helper: string;
  icon: ReactNode;
  label: string;
  tone?: "primary" | "success" | "warning" | "error" | "info";
  value: string;
}) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        bgcolor: (theme) => alpha(theme.palette[tone].main, 0.06),
        borderColor: (theme) => alpha(theme.palette[tone].main, 0.18),
      }}
    >
      <CardContent sx={{ p: 2 }}>
        <Stack direction="row" spacing={1.25} alignItems="flex-start" justifyContent="space-between">
          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {label}
            </Typography>
            <Typography variant="h6" fontWeight={900} sx={{ mt: 0.25, overflowWrap: "anywhere" }}>
              {value}
            </Typography>
          </Box>
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: "50%",
              display: "grid",
              placeItems: "center",
              color: `${tone}.main`,
              bgcolor: (theme) => alpha(theme.palette[tone].main, 0.13),
            }}
          >
            {icon}
          </Box>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

export function SellerActivityOperationalInsights({
  sellers,
  summaries,
  summary,
}: {
  sellers: Seller[];
  summaries: SellerActivityBySeller[];
  summary: SummaryItem[];
}) {
  const totalEvents = summary.reduce((sum, item) => sum + item.count, 0);
  const saleEvents = getSummaryCount(summary, "SALE_CREATED");
  const failedAccessEvents = getSummaryCount(summary, "FAILED_ACCESS_ATTEMPT");
  const sellersWithoutActivity = sellers.filter(
    (seller) => !summaries.some((item) => item.sellerId === seller.id),
  );
  const topSeller = summaries[0] ?? null;
  const topSellerBySales = [...summaries].sort((left, right) => {
    if (right.saleCreatedCount !== left.saleCreatedCount) {
      return right.saleCreatedCount - left.saleCreatedCount;
    }

    return right.total - left.total;
  })[0] ?? null;
  const blockedPerHundred = totalEvents > 0 ? Math.round((failedAccessEvents / totalEvents) * 100) : 0;

  return (
    <Card variant="outlined" data-testid="seller-activity-operational-insights" sx={{ mb: 2 }}>
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            justifyContent="space-between"
            alignItems={{ xs: "flex-start", sm: "center" }}
          >
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <InsightsIcon color="primary" />
                <Typography variant="h6" fontWeight={900}>
                  Señales operativas
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Resumen del periodo consultado calculado por el servidor, no solo por los eventos visibles en pantalla.
              </Typography>
            </Box>
            <Chip size="small" variant="outlined" color="primary" label={pluralize(totalEvents, "evento", "eventos")} />
          </Stack>

          <Grid container spacing={1.5}>
            <Grid item xs={12} sm={6} lg={3}>
              <InsightTile
                label="Vendedor más activo"
                value={topSeller?.sellerName ?? "Sin actividad"}
                helper={topSeller ? pluralize(topSeller.total, "movimiento", "movimientos") : "No hay eventos en el periodo"}
                icon={<GroupsIcon />}
                tone="primary"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <InsightTile
                label="Mayor ritmo de ventas"
                value={topSellerBySales?.sellerName ?? "Sin ventas"}
                helper={pluralize(saleEvents, "venta registrada", "ventas registradas")}
                icon={<PointOfSaleIcon />}
                tone="success"
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <InsightTile
                label="Bloqueos por cada 100 eventos"
                value={`${blockedPerHundred}`}
                helper={pluralize(failedAccessEvents, "acceso bloqueado", "accesos bloqueados")}
                icon={<BlockIcon />}
                tone={failedAccessEvents > 0 ? "error" : "info"}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={3}>
              <InsightTile
                label="Vendedores sin movimiento"
                value={`${sellersWithoutActivity.length}`}
                helper={
                  sellersWithoutActivity.length > 0
                    ? sellersWithoutActivity.map((seller) => seller.name).slice(0, 2).join(", ")
                    : "Todos tuvieron actividad en el periodo"
                }
                icon={<PersonOffIcon />}
                tone={sellersWithoutActivity.length > 0 ? "warning" : "info"}
              />
            </Grid>
          </Grid>
        </Stack>
      </CardContent>
    </Card>
  );
}

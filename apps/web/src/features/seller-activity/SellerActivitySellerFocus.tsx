import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import BlockIcon from "@mui/icons-material/Block";
import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import UpdateIcon from "@mui/icons-material/Update";

import { formatDate, type SellerActivityBySeller } from "./sellerActivityShared";

function SellerFocusCard({ seller }: { seller: SellerActivityBySeller }) {
  const hasBlockedAccess = seller.failedAccessCount > 0;

  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.98),
        borderColor: (theme) =>
          hasBlockedAccess ? alpha(theme.palette.error.main, 0.38) : alpha(theme.palette.divider, 0.9),
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
        <Stack spacing={1.5}>
          <Stack direction="row" spacing={1.25} alignItems="flex-start" justifyContent="space-between">
            <Box minWidth={0}>
              <Typography fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                {seller.sellerName}
              </Typography>
              <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                {seller.sellerEmail}
              </Typography>
            </Box>
            <Chip
              size="small"
              label={seller.isActive ? "Activo" : "Inactivo"}
              color={seller.isActive ? "success" : "default"}
              variant="outlined"
            />
          </Stack>

          <Grid container spacing={1.25}>
            <Grid item xs={4}>
              <Stack spacing={0.25}>
                <Typography variant="h5" fontWeight={900}>
                  {seller.total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  eventos
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={4}>
              <Stack spacing={0.25}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <PointOfSaleIcon color="success" fontSize="small" />
                  <Typography variant="h6" fontWeight={900}>
                    {seller.saleCreatedCount}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  ventas
                </Typography>
              </Stack>
            </Grid>
            <Grid item xs={4}>
              <Stack spacing={0.25}>
                <Stack direction="row" spacing={0.5} alignItems="center">
                  <BlockIcon color={hasBlockedAccess ? "error" : "disabled"} fontSize="small" />
                  <Typography variant="h6" fontWeight={900}>
                    {seller.failedAccessCount}
                  </Typography>
                </Stack>
                <Typography variant="caption" color="text.secondary">
                  bloqueos
                </Typography>
              </Stack>
            </Grid>
          </Grid>

          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            sx={{
              p: 1,
              borderRadius: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
            }}
          >
            <UpdateIcon color="action" fontSize="small" />
            <Box minWidth={0}>
              <Typography variant="caption" color="text.secondary">
                Última actividad visible
              </Typography>
              <Typography variant="body2" fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                {seller.lastActivityAt ? formatDate(seller.lastActivityAt) : "Sin fecha"}
              </Typography>
            </Box>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function SellerActivitySellerFocus({ summaries }: { summaries: SellerActivityBySeller[] }) {
  const visibleSellersLabel = summaries.length === 1 ? "1 vendedor visible" : `${summaries.length} vendedores visibles`;

  return (
    <Card
      data-testid="seller-activity-seller-focus"
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.96),
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
            <Box>
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonSearchIcon color="action" />
                <Typography variant="h6" fontWeight={900}>
                  Actividad por vendedor
                </Typography>
              </Stack>
              <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                Lectura rápida de quién operó, cuántas ventas registró y si tuvo bloqueos con los filtros actuales.
              </Typography>
            </Box>
            <Chip size="small" color="primary" variant="outlined" label={visibleSellersLabel} />
          </Stack>

          {summaries.length === 0 ? (
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                bgcolor: (theme) => alpha(theme.palette.action.hover, 0.6),
              }}
            >
              <Typography fontWeight={800}>Sin vendedores visibles con la búsqueda actual.</Typography>
              <Typography variant="body2" color="text.secondary">
                Ajusta búsqueda, acción, vendedor o rango de fechas para volver a ver actividad.
              </Typography>
            </Box>
          ) : (
            <Grid container spacing={1.5}>
              {summaries.map((seller) => (
                <Grid item xs={12} md={6} key={seller.sellerId}>
                  <SellerFocusCard seller={seller} />
                </Grid>
              ))}
            </Grid>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

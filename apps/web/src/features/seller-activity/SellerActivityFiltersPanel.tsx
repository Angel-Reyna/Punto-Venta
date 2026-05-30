import { Box, Button, Card, CardContent, Chip, Divider, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import FilterAltIcon from "@mui/icons-material/FilterAlt";

import {
  actionLabels,
  getRelativeDateInputValue,
  sellerActions,
  type Seller,
  type SellerAction,
} from "./sellerActivityShared";

export function SellerActivityFiltersPanel({
  action,
  activeFilterLabels,
  from,
  invalidFilters,
  isAutoRefreshPaused,
  isLoading,
  limit,
  onConsult,
  onRefreshNow,
  onResetFilters,
  onToggleAutoRefresh,
  search,
  sellerId,
  sellers,
  setAction,
  setFrom,
  setLimit,
  setSearch,
  setSellerId,
  setTo,
  to,
  today,
}: {
  action: string;
  activeFilterLabels: string[];
  from: string;
  invalidFilters: boolean;
  isAutoRefreshPaused: boolean;
  isLoading: boolean;
  limit: number;
  onConsult: () => void;
  onRefreshNow: () => void;
  onResetFilters: () => void;
  onToggleAutoRefresh: () => void;
  search: string;
  sellerId: string;
  sellers: Seller[];
  setAction: (value: string) => void;
  setFrom: (value: string) => void;
  setLimit: (value: number) => void;
  setSearch: (value: string) => void;
  setSellerId: (value: string) => void;
  setTo: (value: string) => void;
  to: string;
  today: string;
}) {
  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.96),
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={2.5}>
          <Stack spacing={1}>
            <Stack direction="row" spacing={1} alignItems="center">
              <FilterAltIcon color="action" />
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Enfocar la revisión
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Elige vendedor, acción o periodo. La búsqueda solo afina los movimientos ya cargados.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" data-testid="seller-activity-shortcuts">
              <Button
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
                variant={action === "SALE_CREATED" ? "contained" : "outlined"}
                data-testid="seller-activity-quick-sales"
                onClick={() => setAction("SALE_CREATED")}
                disabled={isLoading}
              >
                Solo ventas
              </Button>
              <Button
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
                color="error"
                variant={action === "FAILED_ACCESS_ATTEMPT" ? "contained" : "outlined"}
                data-testid="seller-activity-quick-blocked"
                onClick={() => setAction("FAILED_ACCESS_ATTEMPT")}
                disabled={isLoading}
              >
                Accesos bloqueados
              </Button>
              <Button
                size="small"
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
                variant="outlined"
                data-testid="seller-activity-quick-week"
                onClick={() => {
                  setFrom(getRelativeDateInputValue(6));
                  setTo(today);
                }}
                disabled={isLoading}
              >
                Últimos 7 días
              </Button>
            </Stack>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" data-testid="seller-activity-active-filters">
            {activeFilterLabels.map((label) => (
              <Chip key={label} size="small" label={label} variant="outlined" />
            ))}
          </Stack>

          <Divider />

          <TextField
            fullWidth
            label="Buscar en resultados"
            placeholder="Nombre, correo, venta, bloqueo o IP"
            value={search}
            inputProps={{ "data-testid": "seller-activity-search" }}
            onChange={(event) => setSearch(event.target.value)}
          />

          <TextField
            select
            fullWidth
            label="Vendedor"
            value={sellerId}
            inputProps={{ "data-testid": "seller-activity-seller" }}
            onChange={(event) => setSellerId(event.target.value)}
          >
            <MenuItem value="">Todos los vendedores</MenuItem>
            {sellers.map((seller) => (
              <MenuItem key={seller.id} value={seller.id}>
                {seller.name} · {seller.email}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            select
            fullWidth
            label="Acción"
            value={action}
            inputProps={{ "data-testid": "seller-activity-action" }}
            onChange={(event) => setAction(event.target.value)}
          >
            <MenuItem value="">Todas las acciones</MenuItem>
            {sellerActions.map((currentAction) => (
              <MenuItem key={currentAction} value={currentAction}>
                {actionLabels[currentAction as SellerAction]}
              </MenuItem>
            ))}
          </TextField>

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6} lg={12} xl={6}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                value={from}
                inputProps={{ "data-testid": "seller-activity-date-from" }}
                onChange={(event) => setFrom(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6} lg={12} xl={6}>
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                value={to}
                inputProps={{ "data-testid": "seller-activity-date-to" }}
                onChange={(event) => setTo(event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Límite"
                type="number"
                value={limit}
                inputProps={{ min: 1, max: 500, "data-testid": "seller-activity-limit" }}
                error={limit < 1 || limit > 500}
                helperText="1 a 500"
                onChange={(event) => setLimit(Number(event.target.value))}
              />
            </Grid>
          </Grid>

          <Divider />

          <Stack spacing={1}>
            <Button
              fullWidth
              variant="contained"
              data-testid="seller-activity-consult-button"
              onClick={onConsult}
              disabled={invalidFilters || isLoading}
            >
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
            <Stack direction={{ xs: "column", sm: "row", lg: "column", xl: "row" }} spacing={1}>
              <Button
                fullWidth
                variant="outlined"
                data-testid="seller-activity-refresh-now-button"
                onClick={onRefreshNow}
                disabled={invalidFilters || isLoading}
              >
                Actualizar ahora
              </Button>
              <Button
                fullWidth
                variant="outlined"
                data-testid="seller-activity-toggle-refresh-button"
                onClick={onToggleAutoRefresh}
                disabled={isLoading}
              >
                {isAutoRefreshPaused ? "Reanudar auto-refresh" : "Pausar auto-refresh"}
              </Button>
            </Stack>
            <Button data-testid="seller-activity-clear-button" onClick={onResetFilters} disabled={isLoading}>
              Limpiar filtros
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

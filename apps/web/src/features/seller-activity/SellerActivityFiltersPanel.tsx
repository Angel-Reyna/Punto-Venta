import { useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import SearchIcon from "@mui/icons-material/Search";
import TuneIcon from "@mui/icons-material/Tune";

import {
  actionLabels,
  getRelativeDateInputValue,
  sellerActions,
  type Seller,
  type SellerAction,
} from "./sellerActivityShared";


function formatDateInputParts(year: number, month: number, day: number) {
  const monthText = String(month).padStart(2, "0");
  const dayText = String(day).padStart(2, "0");

  return `${year}-${monthText}-${dayText}`;
}

function buildMonthRange(today: string, monthOffset: number) {
  const [year = 0, month = 1] = today.split("-").map(Number);
  const firstDay = new Date(year, month - 1 + monthOffset, 1);
  const lastDay = new Date(year, month + monthOffset, 0);

  return {
    from: formatDateInputParts(firstDay.getFullYear(), firstDay.getMonth() + 1, 1),
    to: formatDateInputParts(lastDay.getFullYear(), lastDay.getMonth() + 1, lastDay.getDate()),
  };
}

function buildConsultedPeriodLabel(from: string, to: string, today: string) {
  if (!from || !to) return "Periodo inválido";
  if (from === today && to === today) return `Hoy · ${today}`;
  if (from === to) return `Día consultado · ${from}`;

  return `${from} → ${to}`;
}

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
  const [showFilters, setShowFilters] = useState(false);
  const consultedPeriodLabel = buildConsultedPeriodLabel(from, to, today);
  const lastSevenDaysFrom = getRelativeDateInputValue(6);
  const currentMonthRange = buildMonthRange(today, 0);
  const previousMonthRange = buildMonthRange(today, -1);
  const isTodaySelected = from === today && to === today;
  const isLastSevenDaysSelected = from === lastSevenDaysFrom && to === today;
  const isCurrentMonthSelected = from === currentMonthRange.from && to === currentMonthRange.to;
  const isPreviousMonthSelected = from === previousMonthRange.from && to === previousMonthRange.to;

  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.96),
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={1.75}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.25}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", sm: "flex-start" }}
          >
            <Stack direction="row" spacing={1} alignItems="center" minWidth={0}>
              <FilterAltIcon color="action" />
              <Box minWidth={0}>
                <Typography variant="h6" fontWeight={900}>
                  Enfocar revisión
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Busca actividad y abre filtros solo cuando necesites acotar vendedor, acción o periodo.
                </Typography>
                <Chip
                  icon={<CalendarMonthOutlinedIcon />}
                  label={`Periodo consultado: ${consultedPeriodLabel}`}
                  size="small"
                  color="primary"
                  variant="outlined"
                  data-testid="seller-activity-consulted-period-chip"
                  sx={{ mt: 1, maxWidth: "100%", fontWeight: 850, "& .MuiChip-label": { overflowWrap: "anywhere", whiteSpace: "normal" } }}
                />
              </Box>
            </Stack>

            <Button
              aria-controls="seller-activity-inline-filters"
              aria-expanded={showFilters}
              data-testid="seller-activity-filters-toggle-button"
              onClick={() => setShowFilters((current) => !current)}
              startIcon={<TuneIcon />}
              sx={{ borderRadius: 2.5, flexShrink: 0, fontWeight: 900, minHeight: 40 }}
              variant={showFilters ? "contained" : "outlined"}
            >
              Filtros
            </Button>
          </Stack>

          <TextField
            fullWidth
            label="Buscar actividad"
            placeholder="Vendedor, correo, venta, bloqueo o IP"
            size="small"
            value={search}
            inputProps={{ "data-testid": "seller-activity-search" }}
            onChange={(event) => setSearch(event.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon color="primary" fontSize="small" />
                </InputAdornment>
              ),
            }}
          />

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" data-testid="seller-activity-shortcuts">
            <Button
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
              variant={action === "SALE_CREATED" ? "contained" : "outlined"}
              data-testid="seller-activity-quick-sales"
              onClick={() => setAction("SALE_CREATED")}
              disabled={isLoading}
            >
              Solo ventas
            </Button>
            <Button
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
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
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
              variant={isTodaySelected ? "contained" : "outlined"}
              data-testid="seller-activity-quick-today"
              onClick={() => {
                setFrom(today);
                setTo(today);
              }}
              disabled={isLoading}
            >
              Hoy
            </Button>
            <Button
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
              variant={isLastSevenDaysSelected ? "contained" : "outlined"}
              data-testid="seller-activity-quick-week"
              onClick={() => {
                setFrom(lastSevenDaysFrom);
                setTo(today);
              }}
              disabled={isLoading}
            >
              Últimos 7 días
            </Button>
            <Button
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
              variant={isCurrentMonthSelected ? "contained" : "outlined"}
              data-testid="seller-activity-quick-current-month"
              onClick={() => {
                setFrom(currentMonthRange.from);
                setTo(currentMonthRange.to);
              }}
              disabled={isLoading}
            >
              Este mes
            </Button>
            <Button
              size="small"
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
              variant={isPreviousMonthSelected ? "contained" : "outlined"}
              data-testid="seller-activity-quick-previous-month"
              onClick={() => {
                setFrom(previousMonthRange.from);
                setTo(previousMonthRange.to);
              }}
              disabled={isLoading}
            >
              Mes pasado
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" data-testid="seller-activity-active-filters">
            {activeFilterLabels.length === 0 ? (
              <Chip size="small" label="Sin filtros avanzados" variant="outlined" />
            ) : (
              activeFilterLabels.map((label) => <Chip key={label} size="small" label={label} variant="outlined" />)
            )}
          </Stack>

          <Collapse in={showFilters} timeout="auto" unmountOnExit>
            <Box
              id="seller-activity-inline-filters"
              sx={(theme) => ({
                mt: 0.25,
                border: 1,
                borderColor: alpha(theme.palette.primary.main, 0.12),
                borderRadius: 2.5,
                bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.045 : 0.026),
                px: { xs: 1.25, sm: 1.5 },
                py: 1.35,
              })}
            >
              <Grid container spacing={1.35}>
                <Grid item xs={12} md={6} lg={4}>
                  <TextField
                    select
                    fullWidth
                    label="Vendedor"
                    size="small"
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
                </Grid>

                <Grid item xs={12} md={6} lg={4}>
                  <TextField
                    select
                    fullWidth
                    label="Acción"
                    size="small"
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
                </Grid>

                <Grid item xs={12} sm={6} lg={4}>
                  <TextField
                    fullWidth
                    label="Desde"
                    type="date"
                    size="small"
                    value={from}
                    inputProps={{ "data-testid": "seller-activity-date-from" }}
                    onChange={(event) => setFrom(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} lg={4}>
                  <TextField
                    fullWidth
                    label="Hasta"
                    type="date"
                    size="small"
                    value={to}
                    inputProps={{ "data-testid": "seller-activity-date-to" }}
                    onChange={(event) => setTo(event.target.value)}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6} lg={4}>
                  <TextField
                    fullWidth
                    label="Límite"
                    type="number"
                    size="small"
                    value={limit}
                    inputProps={{ min: 1, max: 500, "data-testid": "seller-activity-limit" }}
                    error={limit < 1 || limit > 500}
                    helperText="1 a 500"
                    onChange={(event) => setLimit(Number(event.target.value))}
                  />
                </Grid>
              </Grid>
            </Box>
          </Collapse>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            justifyContent="space-between"
          >
            <Button
              variant="contained"
              data-testid="seller-activity-consult-button"
              onClick={onConsult}
              disabled={invalidFilters || isLoading}
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
            >
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
            <Button
              variant="outlined"
              data-testid="seller-activity-refresh-now-button"
              onClick={onRefreshNow}
              disabled={invalidFilters || isLoading}
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
            >
              Actualizar ahora
            </Button>
            <Button
              variant="outlined"
              data-testid="seller-activity-toggle-refresh-button"
              onClick={onToggleAutoRefresh}
              disabled={isLoading}
              sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
            >
              {isAutoRefreshPaused ? "Reanudar auto-refresh" : "Pausar auto-refresh"}
            </Button>
            <Button data-testid="seller-activity-clear-button" onClick={onResetFilters} disabled={isLoading}>
              Limpiar
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

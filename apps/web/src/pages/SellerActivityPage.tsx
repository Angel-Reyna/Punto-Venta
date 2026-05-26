import { useCallback, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SecurityIcon from "@mui/icons-material/Security";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../utils/apiError";
import {
  actionLabels,
  ActivityMetricCard,
  buildQuery,
  EmptyActivityMessage,
  EmptySummaryMessage,
  filtersAreInvalid,
  formatRelativeLastUpdated,
  matchesSearch,
  Seller,
  SellerAction,
  SellerActivityCard,
  SellerActivityLog,
  SELLER_ACTIVITY_AUTO_REFRESH_INTERVAL_MS,
  sellerActions,
  SummaryCard,
  SummaryItem,
  summarizeActivity,
} from "./seller-activity/sellerActivityShared";

const DEFAULT_LIMIT = 200;

function toDateInputValue(value: Date) {
  return value.toISOString().slice(0, 10);
}

function getRelativeDateInputValue(daysBack: number) {
  const value = new Date();
  value.setDate(value.getDate() - daysBack);

  return toDateInputValue(value);
}

function getActionLabel(value: string) {
  if (!value) return "Todas las acciones";

  return sellerActions.includes(value as SellerAction)
    ? actionLabels[value as SellerAction]
    : value;
}

function getDateRangeLabel(from: string, to: string) {
  if (!from || !to) return "Periodo inválido";
  if (from === to) return from;

  return `${from} → ${to}`;
}

export function SellerActivityPage() {
  const today = toDateInputValue(new Date());

  const [rows, setRows] = useState<SellerActivityLog[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [summary, setSummary] = useState<SummaryItem[]>([]);

  const [sellerId, setSellerId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefreshPaused, setIsAutoRefreshPaused] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState("");

  async function loadSellers() {
    try {
      const response = await api.get<Seller[]>("/users");

      setSellers(response.data.filter((user) => user.role === "CASHIER"));
    } catch (err) {
      setError(
        getApiErrorMessage(err, "No se pudo cargar la lista de vendedores."),
      );
    }
  }

  const loadActivity = useCallback(async () => {
    setError("");

    if (filtersAreInvalid({ from, to, limit })) {
      setError("Revisa el rango de fechas y usa un límite entre 1 y 500.");
      return;
    }

    try {
      setIsLoading(true);
      const query = buildQuery({ sellerId, action, from, to, limit });

      const [activityResponse, summaryResponse] = await Promise.all([
        api.get<SellerActivityLog[]>(`/seller-activity?${query}`),
        api.get<SummaryItem[]>(`/seller-activity/summary?${query}`),
      ]);

      setRows(activityResponse.data);
      setSummary(summaryResponse.data);
      setLastLoadedAt(new Date());
      setNow(new Date());
    } catch (err) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cargar el historial de vendedores.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [action, from, limit, sellerId, to]);

  useEffect(() => {
    loadSellers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    void loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 5_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAutoRefreshPaused || filtersAreInvalid({ from, to, limit })) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void loadActivity();
    }, SELLER_ACTIVITY_AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [from, isAutoRefreshPaused, limit, loadActivity, to]);

  const visibleRows = useMemo(
    () => rows.filter((row) => matchesSearch(row, search)),
    [rows, search],
  );

  const activitySummary = useMemo(() => summarizeActivity(rows), [rows]);
  const relativeLastUpdated = formatRelativeLastUpdated(lastLoadedAt, now);
  const autoRefreshIntervalSeconds = Math.round(
    SELLER_ACTIVITY_AUTO_REFRESH_INTERVAL_MS / 1000,
  );
  const selectedSeller = sellers.find((seller) => seller.id === sellerId);
  const activeFilterLabels = [
    `Periodo: ${getDateRangeLabel(from, to)}`,
    `Vendedor: ${selectedSeller ? selectedSeller.name : "Todos"}`,
    `Acción: ${getActionLabel(action)}`,
    search.trim() ? `Texto: ${search.trim()}` : "Texto: sin búsqueda local",
    `Límite: ${limit}`,
  ];

  function resetFilters() {
    setSellerId("");
    setAction("");
    setFrom(today);
    setTo(today);
    setLimit(DEFAULT_LIMIT);
    setSearch("");
  }

  return (
    <>
      <PageHeader
        title="Actividad de vendedores"
        subtitle="Revisa ventas, consultas operativas e intentos de acceso por vendedor con una vista clara de filtros y eventos."
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 2 }}
      >
        <Chip
          color="primary"
          label="Acceso exclusivo ADMIN"
          icon={<SecurityIcon />}
        />
        <Typography variant="body2" color="text.secondary">
          Usa esta vista para supervisar la operación diaria, investigar ventas
          específicas y detectar accesos no permitidos.
        </Typography>
        <Chip
          color={isAutoRefreshPaused ? "warning" : "success"}
          variant="outlined"
          data-testid="seller-activity-refresh-status"
          label={
            isAutoRefreshPaused ? "Auto-refresh pausado" : "Auto-refresh activo"
          }
        />
        <Typography
          variant="body2"
          color="text.secondary"
          data-testid="seller-activity-last-updated"
        >
          {relativeLastUpdated}
        </Typography>
      </Stack>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" color="text.secondary">
                1. Enfoca
              </Typography>
              <Typography fontWeight={900}>Vendedor, acción y periodo</Typography>
              <Typography variant="body2" color="text.secondary">
                Reduce ruido antes de revisar eventos operativos.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" color="text.secondary">
                2. Prioriza
              </Typography>
              <Typography fontWeight={900}>Ventas y accesos bloqueados</Typography>
              <Typography variant="body2" color="text.secondary">
                Los atajos resaltan los eventos que suelen requerir revisión.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Typography variant="overline" color="text.secondary">
                3. Investiga
              </Typography>
              <Typography fontWeight={900}>Búsqueda local sin perder filtros</Typography>
              <Typography variant="body2" color="text.secondary">
                Pausa la actualización automática si estás revisando un caso.
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <ActivityMetricCard
            label="Movimientos cargados"
            value={rows.length}
            helper="Según filtros consultados"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ActivityMetricCard
            label="Vendedores con actividad"
            value={activitySummary.activeSellersInResults}
            helper="Usuarios únicos en resultados"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ActivityMetricCard
            label="Ventas registradas"
            value={activitySummary.saleCreatedCount}
            helper="Eventos de venta del periodo"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ActivityMetricCard
            label="Accesos bloqueados"
            value={activitySummary.failedAccessCount}
            helper="Intentos sin permiso"
          />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "flex-start", sm: "center" }}
            >
              <Stack direction="row" spacing={1} alignItems="center">
                <PersonSearchIcon color="action" />
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    Filtros de actividad
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Filtra el historial y después usa la búsqueda local para
                    afinar resultados ya cargados.
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                data-testid="seller-activity-shortcuts"
              >
                <Button
                  size="small"
                  variant={action === "SALE_CREATED" ? "contained" : "outlined"}
                  data-testid="seller-activity-quick-sales"
                  onClick={() => setAction("SALE_CREATED")}
                  disabled={isLoading}
                >
                  Solo ventas
                </Button>
                <Button
                  size="small"
                  color="error"
                  variant={
                    action === "FAILED_ACCESS_ATTEMPT" ? "contained" : "outlined"
                  }
                  data-testid="seller-activity-quick-blocked"
                  onClick={() => setAction("FAILED_ACCESS_ATTEMPT")}
                  disabled={isLoading}
                >
                  Accesos bloqueados
                </Button>
                <Button
                  size="small"
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

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              data-testid="seller-activity-active-filters"
            >
              {activeFilterLabels.map((label) => (
                <Chip key={label} size="small" label={label} variant="outlined" />
              ))}
            </Stack>

            <Divider />

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar en resultados"
                  placeholder="Vendedor, correo, acción, descripción o IP"
                  value={search}
                  inputProps={{ "data-testid": "seller-activity-search" }}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
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
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
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
                      {actionLabels[currentAction]}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
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

              <Grid item xs={12} sm={6} md={3}>
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

              <Grid item xs={12} sm={6} md={3}>
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
            </Grid>

            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", sm: "center" }}
            >
              <Typography
                variant="caption"
                color="text.secondary"
                data-testid="seller-activity-refresh-helper"
              >
                {isAutoRefreshPaused
                  ? "Actualización automática detenida. Usa Actualizar ahora para consultar sin perder filtros."
                  : `Actualización automática cada ${autoRefreshIntervalSeconds} segundos sin reiniciar búsqueda ni filtros.`}
              </Typography>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
                <Button
                  data-testid="seller-activity-clear-button"
                  onClick={resetFilters}
                  disabled={isLoading}
                >
                  Limpiar
                </Button>
                <Button
                  variant="outlined"
                  data-testid="seller-activity-toggle-refresh-button"
                  onClick={() => setIsAutoRefreshPaused((current) => !current)}
                  disabled={isLoading}
                >
                  {isAutoRefreshPaused
                    ? "Reanudar auto-refresh"
                    : "Pausar auto-refresh"}
                </Button>
                <Button
                  variant="outlined"
                  data-testid="seller-activity-refresh-now-button"
                  onClick={() => void loadActivity()}
                  disabled={filtersAreInvalid({ from, to, limit }) || isLoading}
                >
                  Actualizar ahora
                </Button>
                <Button
                  variant="contained"
                  data-testid="seller-activity-consult-button"
                  onClick={() => void loadActivity()}
                  disabled={filtersAreInvalid({ from, to, limit }) || isLoading}
                >
                  {isLoading ? "Consultando..." : "Consultar"}
                </Button>
              </Stack>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {summary.length === 0 ? (
          <Grid item xs={12}>
            <EmptySummaryMessage />
          </Grid>
        ) : (
          summary.map((item) => (
            <Grid item xs={12} sm={6} lg={3} key={item.action}>
              <SummaryCard item={item} />
            </Grid>
          ))
        )}
      </Grid>

      <Stack spacing={1.5} sx={{ mb: 2 }} data-testid="seller-activity-results-heading">
        <Typography variant="h6" fontWeight={900}>
          Eventos encontrados
        </Typography>
        <Typography variant="body2" color="text.secondary">
          {visibleRows.length} de {rows.length} movimientos visibles con la
          búsqueda local actual. Los filtros de servidor se aplican al consultar.
        </Typography>
      </Stack>

      {visibleRows.length === 0 ? (
        <EmptyActivityMessage />
      ) : (
        <Stack spacing={2} data-testid="seller-activity-results-list">
          {visibleRows.map((log) => (
            <SellerActivityCard key={log.id} log={log} />
          ))}
        </Stack>
      )}
    </>
  );
}

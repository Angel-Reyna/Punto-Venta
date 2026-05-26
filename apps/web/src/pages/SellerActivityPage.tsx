import type { ReactNode } from "react";
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
import { alpha } from "@mui/material/styles";

import AccessTimeIcon from "@mui/icons-material/AccessTime";
import BlockIcon from "@mui/icons-material/Block";
import FilterAltIcon from "@mui/icons-material/FilterAlt";
import GroupsIcon from "@mui/icons-material/Groups";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import LoginIcon from "@mui/icons-material/Login";
import LogoutIcon from "@mui/icons-material/Logout";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import PointOfSaleIcon from "@mui/icons-material/PointOfSale";
import RouterOutlinedIcon from "@mui/icons-material/RouterOutlined";
import SecurityIcon from "@mui/icons-material/Security";
import TimelineIcon from "@mui/icons-material/Timeline";
import VisibilityIcon from "@mui/icons-material/Visibility";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../utils/apiError";
import {
  actionLabels,
  buildQuery,
  EmptyActivityMessage,
  EmptySummaryMessage,
  filtersAreInvalid,
  formatDate,
  formatRelativeLastUpdated,
  getActionColor,
  matchesSearch,
  Seller,
  SellerAction,
  SellerActivityLog,
  SELLER_ACTIVITY_AUTO_REFRESH_INTERVAL_MS,
  sellerActions,
  SummaryCard,
  SummaryItem,
  summarizeActivity,
} from "./seller-activity/sellerActivityShared";

const DEFAULT_LIMIT = 200;

type MetricTone = "primary" | "success" | "warning" | "error" | "info";

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

function getActionIcon(action: SellerAction) {
  if (action === "SELLER_LOGIN") return <LoginIcon fontSize="small" />;
  if (action === "SELLER_LOGOUT") return <LogoutIcon fontSize="small" />;
  if (action === "SALE_CREATED") return <PointOfSaleIcon fontSize="small" />;
  if (action === "PRODUCT_VIEWED") {
    return <Inventory2OutlinedIcon fontSize="small" />;
  }
  if (action === "FAILED_ACCESS_ATTEMPT") return <BlockIcon fontSize="small" />;

  return <VisibilityIcon fontSize="small" />;
}

function VisualMetricCard({
  label,
  value,
  helper,
  icon,
  tone = "primary",
}: {
  label: string;
  value: string | number;
  helper: string;
  icon: ReactNode;
  tone?: MetricTone;
}) {
  return (
    <Card
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette[tone].main, 0.04),
      }}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              color: `${tone}.main`,
              bgcolor: (theme) => alpha(theme.palette[tone].main, 0.12),
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>

          <Box minWidth={0}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h4" fontWeight={900} sx={{ mt: 0.25 }}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function TimelineActivityCard({
  log,
  isLast,
}: {
  log: SellerActivityLog;
  isLast: boolean;
}) {
  const tone = getActionColor(log.action);

  return (
    <Box
      data-testid={`seller-activity-log-${log.id}`}
      sx={{
        display: "grid",
        gridTemplateColumns: { xs: "34px 1fr", sm: "42px 1fr" },
        columnGap: { xs: 1.5, sm: 2 },
      }}
    >
      <Stack alignItems="center" sx={{ pt: 1 }}>
        <Box
          sx={{
            width: { xs: 30, sm: 34 },
            height: { xs: 30, sm: 34 },
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: `${tone}.main`,
            bgcolor: (theme) => alpha(theme.palette[tone].main, 0.13),
            border: "1px solid",
            borderColor: (theme) => alpha(theme.palette[tone].main, 0.32),
          }}
        >
          {getActionIcon(log.action)}
        </Box>

        {!isLast && (
          <Box
            sx={{
              width: 2,
              flex: 1,
              minHeight: 24,
              bgcolor: "divider",
              my: 0.75,
            }}
          />
        )}
      </Stack>

      <Card
        variant="outlined"
        sx={{
          mb: isLast ? 0 : 2,
          borderLeft: "4px solid",
          borderLeftColor: `${tone}.main`,
          transition: "border-color 120ms ease, box-shadow 120ms ease",
          "&:hover": {
            boxShadow: 3,
          },
        }}
      >
        <CardContent>
          <Stack spacing={1.75}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <Chip
                  size="small"
                  label={actionLabels[log.action]}
                  color={tone}
                  variant="filled"
                />
                <Chip size="small" label={log.entityType} variant="outlined" />
              </Stack>

              <Stack direction="row" spacing={0.75} alignItems="center">
                <AccessTimeIcon color="action" fontSize="small" />
                <Typography variant="caption" color="text.secondary" fontWeight={700}>
                  {formatDate(log.createdAt)}
                </Typography>
              </Stack>
            </Stack>

            <Box>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                flexWrap="wrap"
                useFlexGap
              >
                <PersonOutlineIcon color="action" fontSize="small" />
                <Typography fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                  {log.seller.name}
                </Typography>
                <Chip
                  size="small"
                  label={log.seller.isActive ? "Activo" : "Inactivo"}
                  color={log.seller.isActive ? "success" : "default"}
                  variant="outlined"
                />
              </Stack>

              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ ml: { sm: 3.5 }, overflowWrap: "anywhere" }}
              >
                {log.seller.email}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
              {log.description}
            </Typography>

            <Divider />

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={5}>
                <Typography variant="caption" color="text.secondary">
                  Entidad
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.entityId || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={3}>
                <Stack direction="row" spacing={0.75} alignItems="center">
                  <RouterOutlinedIcon color="action" fontSize="small" />
                  <Typography variant="caption" color="text.secondary">
                    IP
                  </Typography>
                </Stack>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.ipAddress || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">
                  Dispositivo / navegador
                </Typography>
                <Typography
                  variant="body2"
                  sx={{
                    overflowWrap: "anywhere",
                    display: "-webkit-box",
                    WebkitBoxOrient: "vertical",
                    WebkitLineClamp: 2,
                    overflow: "hidden",
                  }}
                >
                  {log.userAgent || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>
    </Box>
  );
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

      <Card
        sx={{
          mb: 2,
          overflow: "hidden",
          border: "1px solid",
          borderColor: "divider",
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.background.paper, 0.96)} 46%, ${alpha(theme.palette.success.main, 0.08)})`,
        }}
      >
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          <Grid container spacing={2.5} alignItems="center">
            <Grid item xs={12} md={7}>
              <Stack spacing={1.5}>
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                  <Chip
                    color="primary"
                    label="Acceso exclusivo ADMIN"
                    icon={<SecurityIcon />}
                  />
                  <Chip
                    color={isAutoRefreshPaused ? "warning" : "success"}
                    variant="outlined"
                    data-testid="seller-activity-refresh-status"
                    label={
                      isAutoRefreshPaused
                        ? "Auto-refresh pausado"
                        : "Auto-refresh activo"
                    }
                  />
                </Stack>

                <Box>
                  <Typography variant="overline" color="text.secondary">
                    Panel operativo
                  </Typography>
                  <Typography variant="h5" fontWeight={900}>
                    Supervisa ventas, consultas y accesos en una sola línea de tiempo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                    Usa filtros rápidos para detectar eventos críticos y revisa cada
                    movimiento con contexto de vendedor, hora, entidad, IP y dispositivo.
                  </Typography>
                </Box>
              </Stack>
            </Grid>

            <Grid item xs={12} md={5}>
              <Stack
                spacing={1.5}
                sx={{
                  p: 2,
                  borderRadius: 2,
                  bgcolor: (theme) => alpha(theme.palette.background.paper, 0.72),
                  border: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Stack
                  direction="row"
                  spacing={1}
                  justifyContent="space-between"
                  alignItems="center"
                >
                  <Typography variant="body2" color="text.secondary">
                    Última carga
                  </Typography>
                  <Typography
                    variant="body2"
                    fontWeight={800}
                    data-testid="seller-activity-last-updated"
                  >
                    {relativeLastUpdated}
                  </Typography>
                </Stack>
                <Divider />
                <Typography
                  variant="caption"
                  color="text.secondary"
                  data-testid="seller-activity-refresh-helper"
                >
                  {isAutoRefreshPaused
                    ? "Actualización automática detenida. Usa Actualizar ahora para consultar sin perder filtros."
                    : `Actualización automática cada ${autoRefreshIntervalSeconds} segundos sin reiniciar búsqueda ni filtros.`}
                </Typography>
              </Stack>
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
          <VisualMetricCard
            label="Movimientos cargados"
            value={rows.length}
            helper="Según filtros consultados"
            icon={<TimelineIcon />}
            tone="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <VisualMetricCard
            label="Vendedores con actividad"
            value={activitySummary.activeSellersInResults}
            helper="Usuarios únicos en resultados"
            icon={<GroupsIcon />}
            tone="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <VisualMetricCard
            label="Ventas registradas"
            value={activitySummary.saleCreatedCount}
            helper="Eventos de venta del periodo"
            icon={<PointOfSaleIcon />}
            tone="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <VisualMetricCard
            label="Accesos bloqueados"
            value={activitySummary.failedAccessCount}
            helper="Intentos sin permiso"
            icon={<BlockIcon />}
            tone="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} lg={4}>
          <Stack spacing={2} sx={{ position: { lg: "sticky" }, top: { lg: 16 } }}>
            <Card>
              <CardContent>
                <Stack spacing={2.5}>
                  <Stack spacing={1}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <FilterAltIcon color="action" />
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
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
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
                          action === "FAILED_ACCESS_ATTEMPT"
                            ? "contained"
                            : "outlined"
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

                  <TextField
                    fullWidth
                    label="Buscar en resultados"
                    placeholder="Vendedor, correo, acción, descripción o IP"
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
                        {actionLabels[currentAction]}
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
                        inputProps={{
                          min: 1,
                          max: 500,
                          "data-testid": "seller-activity-limit",
                        }}
                        error={limit < 1 || limit > 500}
                        helperText="1 a 500"
                        onChange={(event) => setLimit(Number(event.target.value))}
                      />
                    </Grid>
                  </Grid>

                  <Divider />

                  <Stack spacing={1}>
                    <Button
                      variant="contained"
                      data-testid="seller-activity-consult-button"
                      onClick={() => void loadActivity()}
                      disabled={filtersAreInvalid({ from, to, limit }) || isLoading}
                    >
                      {isLoading ? "Consultando..." : "Consultar"}
                    </Button>
                    <Stack direction={{ xs: "column", sm: "row", lg: "column", xl: "row" }} spacing={1}>
                      <Button
                        fullWidth
                        variant="outlined"
                        data-testid="seller-activity-refresh-now-button"
                        onClick={() => void loadActivity()}
                        disabled={filtersAreInvalid({ from, to, limit }) || isLoading}
                      >
                        Actualizar ahora
                      </Button>
                      <Button
                        fullWidth
                        variant="outlined"
                        data-testid="seller-activity-toggle-refresh-button"
                        onClick={() => setIsAutoRefreshPaused((current) => !current)}
                        disabled={isLoading}
                      >
                        {isAutoRefreshPaused
                          ? "Reanudar auto-refresh"
                          : "Pausar auto-refresh"}
                      </Button>
                    </Stack>
                    <Button
                      data-testid="seller-activity-clear-button"
                      onClick={resetFilters}
                      disabled={isLoading}
                    >
                      Limpiar filtros
                    </Button>
                  </Stack>
                </Stack>
              </CardContent>
            </Card>

            <Card>
              <CardContent>
                <Stack spacing={1.5}>
                  <Typography variant="h6" fontWeight={900}>
                    Resumen por acción
                  </Typography>
                  {summary.length === 0 ? (
                    <EmptySummaryMessage />
                  ) : (
                    <Stack spacing={1}>
                      {summary.map((item) => (
                        <SummaryCard key={item.action} item={item} />
                      ))}
                    </Stack>
                  )}
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Stack spacing={2}>
            <Card variant="outlined" data-testid="seller-activity-results-heading">
              <CardContent>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  justifyContent="space-between"
                  alignItems={{ xs: "flex-start", sm: "center" }}
                >
                  <Box>
                    <Typography variant="h6" fontWeight={900}>
                      Línea de tiempo
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {visibleRows.length} de {rows.length} movimientos visibles con la
                      búsqueda local actual. Los filtros de servidor se aplican al consultar.
                    </Typography>
                  </Box>
                  <Chip
                    size="small"
                    color={visibleRows.length === 0 ? "default" : "primary"}
                    label={`${visibleRows.length} eventos`}
                  />
                </Stack>
              </CardContent>
            </Card>

            {visibleRows.length === 0 ? (
              <EmptyActivityMessage />
            ) : (
              <Stack spacing={0} data-testid="seller-activity-results-list">
                {visibleRows.map((log, index) => (
                  <TimelineActivityCard
                    key={log.id}
                    log={log}
                    isLast={index === visibleRows.length - 1}
                  />
                ))}
              </Stack>
            )}
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

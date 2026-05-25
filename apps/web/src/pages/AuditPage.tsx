import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import SearchIcon from "@mui/icons-material/Search";
import SecurityIcon from "@mui/icons-material/Security";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../utils/apiError";
import {
  AuditLogCard,
  AuditMetricCard,
  buildAuditQuery,
  filterAuditLogsBySeverity,
  formatDate,
  getAuditSeverity,
  initialFilters,
  type AuditFilters,
  type AuditLog
} from "./audit/auditShared";

export function AuditPage() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  async function load(currentFilters = filters) {
    try {
      setError("");
      setIsLoading(true);

      const query = buildAuditQuery(currentFilters);
      const response = await api.get<AuditLog[]>(`/audit?${query}`);

      setRows(response.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar la auditoría."));
    } finally {
      setIsLoading(false);
    }
  }

  function updateFilter<K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) {
    setFilters((current) => ({
      ...current,
      [key]: value
    }));
  }

  function clearFilters() {
    setFilters(initialFilters);
    load(initialFilters);
  }

  useEffect(() => {
    load(initialFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const actionOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.action))).sort(),
    [rows]
  );

  const tableOptions = useMemo(
    () => Array.from(new Set(rows.map((row) => row.tableName))).sort(),
    [rows]
  );

  const visibleRows = useMemo(
    () => filterAuditLogsBySeverity(rows, filters.severity),
    [rows, filters.severity]
  );

  const uniqueUsers = useMemo(
    () => new Set(visibleRows.map((row) => row.user?.id ?? "system")).size,
    [visibleRows]
  );

  const criticalEvents = useMemo(
    () => visibleRows.filter((row) => getAuditSeverity(row).level === "critical").length,
    [visibleRows]
  );

  const latestEvent = visibleRows[0]?.createdAt ? formatDate(visibleRows[0].createdAt) : "Sin actividad";

  return (
    <>
      <PageHeader
        title="Auditoría"
        subtitle="Revisa acciones críticas del sistema, usuarios involucrados y evidencia operativa."
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 2 }}
      >
        <Chip color="primary" label="Acceso exclusivo ADMIN" icon={<SecurityIcon />} />
        <Typography variant="body2" color="text.secondary">
          La auditoría conserva trazabilidad administrativa; úsala para investigar cambios sensibles.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard label="Eventos visibles" value={visibleRows.length} helper="Resultados después de filtros operativos" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard label="Usuarios involucrados" value={uniqueUsers} helper="Incluye acciones de sistema" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard label="Eventos críticos" value={criticalEvents} helper="Acciones destructivas o de acceso" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard label="Último evento" value={latestEvent} helper="Actividad más reciente" />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <SearchIcon color="action" />
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Filtros de auditoría
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Busca por acción, entidad, severidad, registro, usuario o correo.
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Producto, usuario, acción o registro"
                  value={filters.q}
                  inputProps={{ "data-testid": "audit-search" }}
                  onChange={(event) => updateFilter("q", event.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Acción"
                  value={filters.action}
                  inputProps={{ "data-testid": "audit-action" }}
                  onChange={(event) => updateFilter("action", event.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {actionOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Entidad"
                  value={filters.tableName}
                  inputProps={{ "data-testid": "audit-entity" }}
                  onChange={(event) => updateFilter("tableName", event.target.value)}
                >
                  <MenuItem value="">Todas</MenuItem>
                  {tableOptions.map((option) => (
                    <MenuItem key={option} value={option}>
                      {option}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Severidad"
                  value={filters.severity}
                  inputProps={{ "data-testid": "audit-severity" }}
                  onChange={(event) => updateFilter("severity", event.target.value as AuditFilters["severity"])}
                >
                  <MenuItem value="">Todas</MenuItem>
                  <MenuItem value="critical">Crítica</MenuItem>
                  <MenuItem value="high">Alta</MenuItem>
                  <MenuItem value="medium">Media</MenuItem>
                  <MenuItem value="low">Baja</MenuItem>
                </TextField>
              </Grid>

              <Grid item xs={12} sm={6} md={1.5}>
                <TextField
                  fullWidth
                  label="Desde"
                  type="date"
                  value={filters.dateFrom}
                  inputProps={{ "data-testid": "audit-date-from" }}
                  onChange={(event) => updateFilter("dateFrom", event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={1.5}>
                <TextField
                  fullWidth
                  label="Hasta"
                  type="date"
                  value={filters.dateTo}
                  inputProps={{ "data-testid": "audit-date-to" }}
                  onChange={(event) => updateFilter("dateTo", event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
              <Button data-testid="audit-clear-button" onClick={clearFilters} disabled={isLoading}>
                Limpiar
              </Button>
              <Button data-testid="audit-consult-button" variant="contained" onClick={() => load()} disabled={isLoading}>
                {isLoading ? "Consultando..." : "Consultar"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {visibleRows.length === 0 ? (
        <Card>
          <CardContent>
            <Typography fontWeight={800}>No hay eventos de auditoría.</Typography>
            <Typography variant="body2" color="text.secondary">
              Ajusta los filtros o registra una acción administrativa para generar actividad auditable.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {visibleRows.map((log) => (
            <Grid item xs={12} lg={6} key={log.id}>
              <AuditLogCard log={log} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}

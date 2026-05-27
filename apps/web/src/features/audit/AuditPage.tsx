import { useEffect, useMemo, useState } from "react";

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
  Typography
} from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import HistoryIcon from "@mui/icons-material/History";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import PeopleAltIcon from "@mui/icons-material/PeopleAlt";
import SecurityIcon from "@mui/icons-material/Security";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { api } from "../../api/client";
import { PageHeader } from "../../components/PageHeader";
import { getApiErrorMessage } from "../../utils/apiError";
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
} from "./auditShared";

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
  const severityLabels: Record<Exclude<AuditFilters["severity"], "">, string> = {
    critical: "Crítica",
    high: "Alta",
    medium: "Media",
    low: "Baja"
  };
  const activeFilterLabels = [
    filters.severity ? `Severidad: ${severityLabels[filters.severity]}` : "Severidad: Todas",
    filters.action ? `Acción: ${filters.action}` : "Acción: Todas",
    filters.tableName ? `Entidad: ${filters.tableName}` : "Entidad: Todas",
    filters.dateFrom || filters.dateTo
      ? `Periodo: ${filters.dateFrom || "inicio"} → ${filters.dateTo || "hoy"}`
      : "Periodo: últimos registros",
    filters.q.trim() ? `Búsqueda: ${filters.q.trim()}` : "Búsqueda: sin texto"
  ];

  return (
    <>
      <PageHeader
        title="Auditoría"
        subtitle="Revisa acciones críticas del sistema, usuarios involucrados y evidencia operativa."
      />

      <Card
        sx={{
          mb: 2,
          overflow: "hidden",
          border: 1,
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(25, 118, 210, 0.12), rgba(237, 108, 2, 0.08) 52%, rgba(211, 47, 47, 0.09))"
        }}
      >
        <CardContent>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} justifyContent="space-between">
            <Stack spacing={1.25} sx={{ maxWidth: 760 }}>
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip color="primary" label="Acceso exclusivo ADMIN" icon={<SecurityIcon />} />
                <Chip color={criticalEvents > 0 ? "error" : "success"} variant="outlined" label={`${criticalEvents} críticos visibles`} />
              </Stack>

              <Typography variant="h5" fontWeight={950}>
                Centro de investigación operativa
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Prioriza eventos críticos, identifica al actor y compara el antes/después sin perder contexto.
                La auditoría debe servir para responder qué cambió, quién lo hizo y cuándo ocurrió.
              </Typography>
            </Stack>

            <Stack
              spacing={0.75}
              sx={{
                minWidth: { md: 260 },
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                bgcolor: "background.paper",
                p: 1.5
              }}
            >
              <Typography variant="caption" color="text.secondary">
                Último evento auditable
              </Typography>
              <Typography fontWeight={900}>{latestEvent}</Typography>
              <Typography variant="caption" color="text.secondary">
                {visibleRows.length} evento(s) visibles con los filtros actuales
              </Typography>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard
            label="Eventos visibles"
            value={visibleRows.length}
            helper="Resultados después de filtros operativos"
            icon={<HistoryIcon fontSize="small" />}
            tone="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard
            label="Usuarios involucrados"
            value={uniqueUsers}
            helper="Incluye acciones de sistema"
            icon={<PeopleAltIcon fontSize="small" />}
            tone="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard
            label="Eventos críticos"
            value={criticalEvents}
            helper="Acciones destructivas o de acceso"
            icon={<WarningAmberIcon fontSize="small" />}
            tone="error"
          />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard
            label="Último evento"
            value={latestEvent}
            helper="Actividad más reciente"
            icon={<AdminPanelSettingsIcon fontSize="small" />}
            tone="warning"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} alignItems="flex-start">
        <Grid item xs={12} lg={4}>
          <Card sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
            <CardContent>
              <Stack spacing={2}>
                <Stack direction="row" spacing={1} alignItems="center">
                  <ManageSearchIcon color="primary" />
                  <Box>
                    <Typography variant="h6" fontWeight={900}>
                      Panel de investigación
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Filtra por acción, entidad, severidad, fecha y evidencia textual.
                    </Typography>
                  </Box>
                </Stack>

                <Divider />

                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Buscar"
                      placeholder="Producto, usuario, acción o registro"
                      value={filters.q}
                      inputProps={{ "data-testid": "audit-search" }}
                      onChange={(event) => updateFilter("q", event.target.value)}
                    />
                  </Grid>

                  <Grid item xs={12} sm={6} lg={12}>
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

                  <Grid item xs={12} sm={6} lg={12}>
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

                  <Grid item xs={12} sm={6} lg={12}>
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

                  <Grid item xs={12} sm={6}>
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

                  <Grid item xs={12} sm={6}>
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

                <Stack spacing={1} data-testid="audit-active-filters">
                  <Typography variant="subtitle2" fontWeight={900}>
                    Vista actual
                  </Typography>
                  <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                    {activeFilterLabels.map((label) => (
                      <Chip key={label} size="small" label={label} variant="outlined" />
                    ))}
                  </Stack>
                </Stack>

                <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1}>
                  <Button data-testid="audit-clear-button" onClick={clearFilters} disabled={isLoading} fullWidth>
                    Limpiar
                  </Button>
                  <Button data-testid="audit-consult-button" variant="contained" onClick={() => load()} disabled={isLoading} fullWidth>
                    {isLoading ? "Consultando..." : "Consultar"}
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} lg={8}>
          <Stack spacing={2}>
            <Card variant="outlined">
              <CardContent>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="space-between">
                  <Box>
                    <Typography variant="h6" fontWeight={900} data-testid="audit-results-heading">
                      {visibleRows.length} evento(s) visibles
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Revisión secuencial con severidad, actor, entidad afectada y evidencia redactada.
                    </Typography>
                  </Box>
                  <Chip
                    color={criticalEvents > 0 ? "error" : "success"}
                    label={criticalEvents > 0 ? "Requiere revisión prioritaria" : "Sin críticos visibles"}
                    icon={criticalEvents > 0 ? <WarningAmberIcon /> : <SecurityIcon />}
                  />
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
              <Stack spacing={1.5}>
                {visibleRows.map((log) => (
                  <AuditLogCard key={log.id} log={log} />
                ))}
              </Stack>
            )}
          </Stack>
        </Grid>
      </Grid>
    </>
  );
}

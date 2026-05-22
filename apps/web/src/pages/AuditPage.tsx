import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardActionArea,
  CardContent,
  Chip,
  Divider,
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

type AuditLog = {
  id: string;
  action: string;
  tableName: string;
  recordId?: string | null;
  oldData?: unknown;
  newData?: unknown;
  ipAddress?: string | null;
  createdAt: string;

  user?: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER";
  } | null;
};

type AuditFilters = {
  q: string;
  action: string;
  tableName: string;
  dateFrom: string;
  dateTo: string;
};

const initialFilters: AuditFilters = {
  q: "",
  action: "",
  tableName: "",
  dateFrom: "",
  dateTo: ""
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function formatRole(role?: "ADMIN" | "CASHIER") {
  if (role === "ADMIN") return "Administrador";
  if (role === "CASHIER") return "Vendedor";
  return "Sistema";
}

function getActionColor(action: string): "default" | "primary" | "success" | "warning" | "error" {
  const normalized = action.toLowerCase();

  if (
    normalized.includes("delete") ||
    normalized.includes("cancel") ||
    normalized.includes("deactivate") ||
    normalized.includes("reset")
  ) {
    return "error";
  }

  if (
    normalized.includes("create") ||
    normalized.includes("open") ||
    normalized.includes("login")
  ) {
    return "success";
  }

  if (
    normalized.includes("update") ||
    normalized.includes("close") ||
    normalized.includes("return")
  ) {
    return "warning";
  }

  return "primary";
}

function buildAuditQuery(filters: AuditFilters) {
  const params = new URLSearchParams();

  if (filters.q.trim()) {
    params.set("q", filters.q.trim());
  }

  if (filters.action.trim()) {
    params.set("action", filters.action.trim());
  }

  if (filters.tableName.trim()) {
    params.set("tableName", filters.tableName.trim());
  }

  if (filters.dateFrom) {
    params.set("dateFrom", filters.dateFrom);
  }

  if (filters.dateTo) {
    params.set("dateTo", filters.dateTo);
  }

  params.set("pageSize", "100");

  return params.toString();
}

function AuditMetricCard({
  label,
  value,
  helper
}: {
  label: string;
  value: string | number;
  helper: string;
}) {
  return (
    <Card sx={{ height: "100%" }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>

        <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
          {value}
        </Typography>

        <Typography variant="caption" color="text.secondary">
          {helper}
        </Typography>
      </CardContent>
    </Card>
  );
}

function AuditLogCard({ log }: { log: AuditLog }) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardActionArea component="div" disableRipple sx={{ height: "100%", cursor: "default" }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack
              direction={{ xs: "column", sm: "row" }}
              spacing={1}
              alignItems={{ xs: "flex-start", sm: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Chip
                  size="small"
                  label={log.action}
                  color={getActionColor(log.action)}
                  variant="outlined"
                />
                <Chip size="small" label={log.tableName} />
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {formatDate(log.createdAt)}
              </Typography>
            </Stack>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Usuario
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
                <Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                  {log.user?.name ?? "Sistema"}
                </Typography>

                <Chip
                  size="small"
                  label={formatRole(log.user?.role)}
                  color={log.user?.role === "ADMIN" ? "primary" : "success"}
                  variant="outlined"
                />
              </Stack>

              {log.user?.email && (
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  {log.user.email}
                </Typography>
              )}
            </Box>

            <Divider />

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Registro
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.recordId || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Dirección IP
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.ipAddress || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

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

  const uniqueUsers = useMemo(
    () => new Set(rows.map((row) => row.user?.id ?? "system")).size,
    [rows]
  );

  const latestEvent = rows[0]?.createdAt ? formatDate(rows[0].createdAt) : "Sin actividad";

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
          <AuditMetricCard label="Eventos cargados" value={rows.length} helper="Últimos resultados del filtro" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard label="Usuarios involucrados" value={uniqueUsers} helper="Incluye acciones de sistema" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <AuditMetricCard label="Entidades afectadas" value={tableOptions.length} helper="Tablas o módulos con cambios" />
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
                  Busca por acción, entidad, registro, usuario o correo.
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar"
                  placeholder="Producto, usuario, acción o registro"
                  value={filters.q}
                  onChange={(event) => updateFilter("q", event.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  select
                  fullWidth
                  label="Acción"
                  value={filters.action}
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
                  fullWidth
                  label="Desde"
                  type="date"
                  value={filters.dateFrom}
                  onChange={(event) => updateFilter("dateFrom", event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={2}>
                <TextField
                  fullWidth
                  label="Hasta"
                  type="date"
                  value={filters.dateTo}
                  onChange={(event) => updateFilter("dateTo", event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
              <Button onClick={clearFilters} disabled={isLoading}>
                Limpiar
              </Button>
              <Button variant="contained" onClick={() => load()} disabled={isLoading}>
                {isLoading ? "Consultando..." : "Consultar"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {rows.length === 0 ? (
        <Card>
          <CardContent>
            <Typography fontWeight={800}>No hay eventos de auditoría.</Typography>
            <Typography variant="body2" color="text.secondary">
              Ajusta los filtros o registra una acción administrativa para generar actividad.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {rows.map((log) => (
            <Grid item xs={12} lg={6} key={log.id}>
              <AuditLogCard log={log} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}

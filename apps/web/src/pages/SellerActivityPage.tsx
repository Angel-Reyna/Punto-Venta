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

import PersonSearchIcon from "@mui/icons-material/PersonSearch";
import SecurityIcon from "@mui/icons-material/Security";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../utils/apiError";

type SellerAction =
  | "SELLER_LOGIN"
  | "SELLER_LOGOUT"
  | "SALE_CREATED"
  | "SALE_VIEWED"
  | "PRODUCT_VIEWED"
  | "FAILED_ACCESS_ATTEMPT";

type SellerActivityLog = {
  id: string;
  sellerId: string;
  action: SellerAction;
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: unknown;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: string;

  seller: {
    id: string;
    name: string;
    email: string;
    role: "ADMIN" | "CASHIER";
    isActive: boolean;
  };
};

type Seller = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "CASHIER";
  isActive: boolean;
};

type SummaryItem = {
  action: SellerAction;
  count: number;
};

const sellerActions: SellerAction[] = [
  "SELLER_LOGIN",
  "SELLER_LOGOUT",
  "SALE_CREATED",
  "SALE_VIEWED",
  "PRODUCT_VIEWED",
  "FAILED_ACCESS_ATTEMPT"
];

const actionLabels: Record<SellerAction, string> = {
  SELLER_LOGIN: "Inicio de sesión",
  SELLER_LOGOUT: "Cierre de sesión",
  SALE_CREATED: "Venta registrada",
  SALE_VIEWED: "Venta consultada",
  PRODUCT_VIEWED: "Producto consultado",
  FAILED_ACCESS_ATTEMPT: "Acceso bloqueado"
};

function formatDate(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    dateStyle: "medium",
    timeStyle: "short"
  });
}

function getActionColor(action: SellerAction): "primary" | "success" | "warning" | "error" {
  if (action === "SALE_CREATED") return "success";
  if (action === "FAILED_ACCESS_ATTEMPT") return "error";
  if (action === "SELLER_LOGOUT") return "warning";
  return "primary";
}

function matchesSearch(log: SellerActivityLog, search: string) {
  const normalized = search.trim().toLowerCase();

  if (!normalized) return true;

  return [
    log.seller.name,
    log.seller.email,
    actionLabels[log.action],
    log.action,
    log.entityType,
    log.entityId,
    log.description,
    log.ipAddress,
    log.userAgent
  ]
    .filter(Boolean)
    .some((value) => String(value).toLowerCase().includes(normalized));
}

function buildQuery(args: {
  sellerId: string;
  action: string;
  from: string;
  to: string;
  limit: number;
}) {
  const params = new URLSearchParams();

  if (args.sellerId) {
    params.set("sellerId", args.sellerId);
  }

  if (args.action) {
    params.set("action", args.action);
  }

  if (args.from) {
    params.set("from", args.from);
  }

  if (args.to) {
    params.set("to", args.to);
  }

  params.set("limit", String(args.limit));

  return params.toString();
}

function ActivityMetricCard({
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

function SellerActivityCard({ log }: { log: SellerActivityLog }) {
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
                  label={actionLabels[log.action]}
                  color={getActionColor(log.action)}
                  variant="outlined"
                />
                <Chip size="small" label={log.entityType} />
              </Stack>

              <Typography variant="caption" color="text.secondary">
                {formatDate(log.createdAt)}
              </Typography>
            </Stack>

            <Box>
              <Typography variant="body2" color="text.secondary">
                Vendedor
              </Typography>

              <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
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

              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                {log.seller.email}
              </Typography>
            </Box>

            <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
              {log.description}
            </Typography>

            <Divider />

            <Grid container spacing={1.5}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  Entidad
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.entityId || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">
                  IP
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.ipAddress || "N/A"}
                </Typography>
              </Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary">
                  Dispositivo / navegador
                </Typography>
                <Typography variant="body2" sx={{ overflowWrap: "anywhere" }}>
                  {log.userAgent || "N/A"}
                </Typography>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </CardActionArea>
    </Card>
  );
}

export function SellerActivityPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [rows, setRows] = useState<SellerActivityLog[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [summary, setSummary] = useState<SummaryItem[]>([]);

  const [sellerId, setSellerId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [limit, setLimit] = useState(200);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function filtersAreInvalid() {
    return !from || !to || new Date(from) > new Date(to) || limit < 1 || limit > 500;
  }

  async function loadSellers() {
    try {
      const response = await api.get<Seller[]>("/users");

      setSellers(response.data.filter((user) => user.role === "CASHIER"));
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar la lista de vendedores."));
    }
  }

  async function loadActivity() {
    setError("");

    if (filtersAreInvalid()) {
      setError("Revisa el rango de fechas y usa un límite entre 1 y 500.");
      return;
    }

    try {
      setIsLoading(true);
      const query = buildQuery({ sellerId, action, from, to, limit });

      const [activityResponse, summaryResponse] = await Promise.all([
        api.get<SellerActivityLog[]>(`/seller-activity?${query}`),
        api.get<SummaryItem[]>(`/seller-activity/summary?${query}`)
      ]);

      setRows(activityResponse.data);
      setSummary(summaryResponse.data);
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar el historial de vendedores."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSellers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    loadActivity();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleRows = useMemo(
    () => rows.filter((row) => matchesSearch(row, search)),
    [rows, search]
  );

  const failedAccessCount = useMemo(
    () => rows.filter((row) => row.action === "FAILED_ACCESS_ATTEMPT").length,
    [rows]
  );

  const saleCreatedCount = useMemo(
    () => rows.filter((row) => row.action === "SALE_CREATED").length,
    [rows]
  );

  const activeSellersInResults = useMemo(
    () => new Set(rows.map((row) => row.seller.id)).size,
    [rows]
  );

  return (
    <>
      <PageHeader
        title="Historial de vendedores"
        subtitle="Consulta actividad operativa, ventas registradas y accesos bloqueados por vendedor."
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        sx={{ mb: 2 }}
      >
        <Chip color="primary" label="Acceso exclusivo ADMIN" icon={<SecurityIcon />} />
        <Typography variant="body2" color="text.secondary">
          Este historial ayuda a revisar operación diaria y detectar intentos de acceso no permitidos.
        </Typography>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <ActivityMetricCard label="Movimientos cargados" value={rows.length} helper="Según filtros consultados" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ActivityMetricCard label="Vendedores con actividad" value={activeSellersInResults} helper="Usuarios únicos en resultados" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ActivityMetricCard label="Ventas registradas" value={saleCreatedCount} helper="Eventos de venta del periodo" />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <ActivityMetricCard label="Accesos bloqueados" value={failedAccessCount} helper="Intentos sin permiso" />
        </Grid>
      </Grid>

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={1} alignItems="center">
              <PersonSearchIcon color="action" />
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Filtros de actividad
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Consulta por vendedor, acción, rango de fechas y texto dentro de resultados.
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <TextField
                  fullWidth
                  label="Buscar en resultados"
                  placeholder="Vendedor, correo, acción, descripción o IP"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  select
                  fullWidth
                  label="Vendedor"
                  value={sellerId}
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
                  inputProps={{ min: 1, max: 500 }}
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
                  onChange={(event) => setTo(event.target.value)}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
            </Grid>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
              <Button
                onClick={() => {
                  setSellerId("");
                  setAction("");
                  setFrom(today);
                  setTo(today);
                  setLimit(200);
                  setSearch("");
                }}
                disabled={isLoading}
              >
                Limpiar
              </Button>
              <Button variant="contained" onClick={loadActivity} disabled={filtersAreInvalid() || isLoading}>
                {isLoading ? "Consultando..." : "Consultar"}
              </Button>
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {summary.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  No hay movimientos agrupados en este rango.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          summary.map((item) => (
            <Grid item xs={12} sm={6} lg={3} key={item.action}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Chip
                    size="small"
                    label={actionLabels[item.action]}
                    color={getActionColor(item.action)}
                    variant="outlined"
                  />

                  <Typography variant="h5" fontWeight={900} sx={{ mt: 1 }}>
                    {item.count}
                  </Typography>

                  <Typography variant="caption" color="text.secondary">
                    Eventos registrados
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      {visibleRows.length === 0 ? (
        <Card>
          <CardContent>
            <Typography fontWeight={800}>No hay actividad con los filtros actuales.</Typography>
            <Typography variant="body2" color="text.secondary">
              Ajusta el rango, vendedor, acción o texto de búsqueda.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2}>
          {visibleRows.map((log) => (
            <Grid item xs={12} lg={6} key={log.id}>
              <SellerActivityCard log={log} />
            </Grid>
          ))}
        </Grid>
      )}
    </>
  );
}

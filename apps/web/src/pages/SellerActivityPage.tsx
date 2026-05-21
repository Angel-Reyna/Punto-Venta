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
  TextField,
  Typography
} from "@mui/material";

import { GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { DataGridCard } from "../components/DataGridCard";
import { PageHeader } from "../components/PageHeader";

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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  function buildQuery() {
    const params = new URLSearchParams();

    if (sellerId) {
      params.set("sellerId", sellerId);
    }

    if (action) {
      params.set("action", action);
    }

    if (from) {
      params.set("from", from);
    }

    if (to) {
      params.set("to", to);
    }

    params.set("limit", String(limit));

    return params.toString();
  }

  function filtersAreInvalid() {
    return !from || !to || new Date(from) > new Date(to) || limit < 1 || limit > 500;
  }

  async function loadSellers() {
    try {
      const response = await api.get<Seller[]>("/users");

      setSellers(
        response.data.filter((user) => user.role === "CASHIER")
      );
    } catch {
      setError("No se pudo cargar la lista de vendedores.");
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
      const query = buildQuery();

      const [activityResponse, summaryResponse] = await Promise.all([
        api.get<SellerActivityLog[]>(`/seller-activity?${query}`),
        api.get<SummaryItem[]>(`/seller-activity/summary?${query}`)
      ]);

      setRows(activityResponse.data);
      setSummary(summaryResponse.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No se pudo cargar el historial de vendedores"
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadSellers();
  }, []);

  useEffect(() => {
    loadActivity();
  }, []);

  const columns = useMemo<GridColDef[]>(() => [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 190,
      valueFormatter: (value) => new Date(value).toLocaleString()
    },
    {
      field: "seller",
      headerName: "Vendedor",
      flex: 1,
      minWidth: 260,
      valueGetter: (_value, row) =>
        `${row.seller.name} (${row.seller.email})`
    },
    {
      field: "action",
      headerName: "Acción",
      width: 190,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={
            params.value === "SALE_CREATED"
              ? "success"
              : params.value === "FAILED_ACCESS_ATTEMPT"
              ? "error"
              : "primary"
          }
          variant="outlined"
        />
      )
    },
    {
      field: "entityType",
      headerName: "Entidad",
      width: 140
    },
    {
      field: "entityId",
      headerName: "ID entidad",
      width: 240,
      valueGetter: (_value, row) => row.entityId || "N/A"
    },
    {
      field: "description",
      headerName: "Descripción",
      flex: 1,
      minWidth: 320
    },
    {
      field: "ipAddress",
      headerName: "IP",
      width: 160,
      valueGetter: (_value, row) => row.ipAddress || "N/A"
    },
    {
      field: "userAgent",
      headerName: "Dispositivo / navegador",
      flex: 1,
      minWidth: 320,
      valueGetter: (_value, row) => row.userAgent || "N/A"
    }
  ], []);

  return (
    <>
      <PageHeader
        title="Historial de vendedores"
        subtitle="Movimientos operativos realizados por vendedores"
      />

      <Box sx={{ mb: 2 }}>
        <Chip color="primary" label="Acceso exclusivo ADMIN" />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "flex",
              flexDirection: {
                xs: "column",
                md: "row"
              },
              gap: 2
            }}
          >
            <TextField
              select
              fullWidth
              label="Vendedor"
              value={sellerId}
              onChange={(event) => setSellerId(event.target.value)}
            >
              <MenuItem value="">
                Todos los vendedores
              </MenuItem>

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
              onChange={(event) => setAction(event.target.value)}
            >
              <MenuItem value="">
                Todas las acciones
              </MenuItem>

              {sellerActions.map((currentAction) => (
                <MenuItem key={currentAction} value={currentAction}>
                  {currentAction}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              fullWidth
              label="Desde"
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />

            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              InputLabelProps={{
                shrink: true
              }}
            />

            <TextField
              fullWidth
              label="Límite"
              type="number"
              value={limit}
              inputProps={{
                min: 1,
                max: 500
              }}
              error={limit < 1 || limit > 500}
              helperText="1 a 500 registros"
              onChange={(event) => setLimit(Number(event.target.value))}
            />

            <Button fullWidth onClick={loadActivity} disabled={filtersAreInvalid() || isLoading}>
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        {summary.length === 0 ? (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography color="text.secondary">
                  No hay movimientos registrados en este rango.
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ) : (
          summary.map((item) => (
            <Grid item xs={12} sm={6} lg={3} key={item.action}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">
                    {item.action}
                  </Typography>

                  <Typography variant="h5" fontWeight={800}>
                    {item.count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))
        )}
      </Grid>

      <DataGridCard
        rows={rows}
        columns={columns}
        minWidth={1400}
        loading={isLoading}
        noRowsLabel="No hay actividad registrada con los filtros actuales."
      />
    </>
  );
}
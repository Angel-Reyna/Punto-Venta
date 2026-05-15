import { useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  Typography,
  TextField
} from "@mui/material";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

type PaymentSummary = Record<string, number>;

type ReportSale = {
  id: string;
  folio: string;
  status: "COMPLETED" | "CANCELLED" | "REFUNDED";
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  createdAt: string;

  cashier?: {
    id: string;
    name: string;
    email: string;
  };

  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;

  payments?: Array<{
    id: string;
    method: string;
    amount: number;
    createdAt: string;
  }>;
};

type ReportData = {
  from: string;
  to: string;
  count: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentSummary: PaymentSummary;
  sales: ReportSale[];
};

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);

  const [data, setData] = useState<ReportData | null>(null);

  const [error, setError] = useState("");

  function datesAreInvalid() {
    return !from || !to || new Date(from) > new Date(to);
  }

  async function consult() {
    setError("");

    if (datesAreInvalid()) {
      setError("El rango de fechas no es válido");
      return;
    }

    try {
      const response = await api.get<ReportData>(
        `/reports/sales?from=${from}&to=${to}`
      );

      setData(response.data);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No se pudo consultar el reporte"
      );
    }
  }

  async function downloadPdf() {
    setError("");

    if (datesAreInvalid()) {
      setError("El rango de fechas no es válido");
      return;
    }

    try {
      const response = await api.get(
        `/reports/sales/pdf?from=${from}&to=${to}`,
        {
          responseType: "blob"
        }
      );

      const url = URL.createObjectURL(response.data);

      const anchor = document.createElement("a");

      anchor.href = url;
      anchor.download = `reporte-ventas-${from}-${to}.pdf`;
      anchor.click();

      URL.revokeObjectURL(url);
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No se pudo descargar el PDF"
      );
    }
  }

  const columns: GridColDef[] = [
    {
      field: "folio",
      headerName: "Folio",
      width: 180
    },
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 190,
      valueFormatter: (value) => new Date(value).toLocaleString()
    },
    {
      field: "customer",
      headerName: "Cliente",
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.customer?.name ?? "Sin cliente"
    },
    {
      field: "cashier",
      headerName: "Cajero",
      flex: 1,
      minWidth: 240,
      valueGetter: (_value, row) =>
        row.cashier
          ? `${row.cashier.name} (${row.cashier.email})`
          : "N/A"
    },
    {
      field: "payments",
      headerName: "Pago",
      width: 160,
      valueGetter: (_value, row) =>
        row.payments?.map((payment: any) => payment.method).join(", ") ??
        "N/A"
    },
    {
      field: "subtotal",
      headerName: "Subtotal",
      width: 130,
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`
    },
    {
      field: "discount",
      headerName: "Descuento",
      width: 130,
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`
    },
    {
      field: "tax",
      headerName: "Impuesto",
      width: 130,
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`
    },
    {
      field: "total",
      headerName: "Total",
      width: 130,
      valueFormatter: (value) => `$${Number(value).toFixed(2)}`
    }
  ];

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Consulta administrativa de ventas completadas por rango de fechas"
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

            <Button
              fullWidth
              onClick={consult}
              disabled={datesAreInvalid()}
            >
              Consultar
            </Button>

            <Button
              fullWidth
              onClick={downloadPdf}
              disabled={datesAreInvalid()}
            >
              Descargar PDF
            </Button>
          </Box>
        </CardContent>
      </Card>

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">
                    Ventas completadas
                  </Typography>

                  <Typography variant="h5" fontWeight={800}>
                    {data.count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">
                    Subtotal
                  </Typography>

                  <Typography variant="h5" fontWeight={800}>
                    ${data.subtotal.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">
                    Descuentos
                  </Typography>

                  <Typography variant="h5" fontWeight={800}>
                    ${data.discount.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">
                    Total
                  </Typography>

                  <Typography variant="h5" fontWeight={800}>
                    ${data.total.toFixed(2)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 2 }}>
            <CardContent>
              <Typography variant="h6" fontWeight={800} mb={1}>
                Resumen por método de pago
              </Typography>

              <Divider sx={{ mb: 2 }} />

              {Object.keys(data.paymentSummary).length === 0 ? (
                <Typography color="text.secondary">
                  No hay pagos registrados en este rango.
                </Typography>
              ) : (
                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1
                  }}
                >
                  {Object.entries(data.paymentSummary).map(
                    ([method, amount]) => (
                      <Chip
                        key={method}
                        label={`${method}: $${amount.toFixed(2)}`}
                        color="primary"
                        variant="outlined"
                      />
                    )
                  )}
                </Box>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ overflowX: "auto" }}>
              <Box sx={{ minWidth: 1280 }}>
                <DataGrid
                  autoHeight
                  rows={data.sales}
                  columns={columns}
                  disableRowSelectionOnClick
                />
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}
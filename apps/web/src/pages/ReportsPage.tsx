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
  Stack,
  TextField,
  Typography
} from "@mui/material";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../utils/apiError";

type MoneySummary = Record<string, number>;

type OperationsReport = {
  from: string;
  to: string;
  sales: {
    count: number;
    byStatus: Record<string, number>;
    gross: number;
    refunded: number;
    net: number;
    paymentSummary: MoneySummary;
  };
  returns: {
    count: number;
    total: number;
    latest: Array<{
      id: string;
      reason: string;
      refundMethod: string;
      refundTotal: number;
      createdAt: string;
      cashier?: {
        name: string;
        email: string;
      };
    }>;
  };
  cashRegister: {
    sessions: Array<{
      id: string;
      status: "OPEN" | "CLOSED";
      openingAmount: number;
      expectedClosingAmount: number | null;
      closingAmount: number | null;
      difference: number | null;
      openedAt: string;
      closedAt: string | null;
      cashier?: {
        name: string;
        email: string;
      };
    }>;
    movements: {
      count: number;
      summary: MoneySummary;
    };
  };
  topProducts: Array<{
    product: {
      id: string;
      sku: string | null;
      name: string;
    };
    quantity: number;
    total: number;
  }>;
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}

function statusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Completadas";
    case "CANCELLED":
      return "Canceladas";
    case "PARTIALLY_REFUNDED":
      return "Devolución parcial";
    case "REFUNDED":
      return "Devueltas";
    default:
      return status;
  }
}

function paymentMethodLabel(method: string) {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "TRANSFER":
      return "Transferencia";
    case "MIXED":
      return "Mixto";
    default:
      return method;
  }
}

function cashMovementLabel(type: string) {
  switch (type) {
    case "OPENING":
      return "Aperturas";
    case "CASH_IN":
      return "Entradas manuales";
    case "CASH_OUT":
      return "Salidas manuales";
    case "SALE_CASH":
      return "Ventas en efectivo";
    case "RETURN_CASH":
      return "Devoluciones en efectivo";
    default:
      return type;
  }
}

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<OperationsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState("");

  function datesAreInvalid() {
    return !from || !to || new Date(from) > new Date(to);
  }

  async function consult() {
    setError("");

    if (datesAreInvalid()) {
      setError("El rango de fechas no es válido.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.get<OperationsReport>(
        `/reports/operations?from=${from}&to=${to}`
      );

      setData(response.data);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "No se pudo consultar el reporte operativo.")
      );
    } finally {
      setIsLoading(false);
    }
  }

  async function downloadPdf() {
    setError("");

    if (datesAreInvalid()) {
      setError("El rango de fechas no es válido.");
      return;
    }

    try {
      setIsDownloadingPdf(true);

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
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo descargar el PDF."));
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  const topProductsRows =
    data?.topProducts.map((item, index) => ({
      id: item.product.id || index,
      position: index + 1,
      sku: item.product.sku ?? "—",
      name: item.product.name,
      quantity: item.quantity,
      total: item.total
    })) ?? [];

  const topProductsColumns: GridColDef[] = [
    {
      field: "position",
      headerName: "#",
      width: 80
    },
    {
      field: "sku",
      headerName: "SKU",
      width: 160
    },
    {
      field: "name",
      headerName: "Producto",
      flex: 1,
      minWidth: 220
    },
    {
      field: "quantity",
      headerName: "Unidades",
      width: 130
    },
    {
      field: "total",
      headerName: "Vendido",
      width: 140,
      valueFormatter: (value) => formatMoney(Number(value))
    }
  ];

  const returnsColumns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 180,
      valueFormatter: (value) => formatDate(value as string)
    },
    {
      field: "cashier",
      headerName: "Responsable",
      flex: 1,
      minWidth: 220,
      valueGetter: (_value, row) =>
        row.cashier ? `${row.cashier.name} (${row.cashier.email})` : "—"
    },
    {
      field: "reason",
      headerName: "Motivo",
      flex: 1,
      minWidth: 260
    },
    {
      field: "refundMethod",
      headerName: "Método",
      width: 150,
      valueFormatter: (value) => paymentMethodLabel(String(value))
    },
    {
      field: "refundTotal",
      headerName: "Total devuelto",
      width: 160,
      valueFormatter: (value) => formatMoney(Number(value))
    }
  ];

  const sessionsColumns: GridColDef[] = [
    {
      field: "openedAt",
      headerName: "Apertura",
      width: 180,
      valueFormatter: (value) => formatDate(value as string)
    },
    {
      field: "closedAt",
      headerName: "Cierre",
      width: 180,
      valueFormatter: (value) => formatDate(value as string | null)
    },
    {
      field: "cashier",
      headerName: "Cajero",
      flex: 1,
      minWidth: 220,
      valueGetter: (_value, row) =>
        row.cashier ? `${row.cashier.name} (${row.cashier.email})` : "—"
    },
    {
      field: "status",
      headerName: "Estado",
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === "OPEN" ? "Abierta" : "Cerrada"}
          color={params.value === "OPEN" ? "success" : "default"}
        />
      )
    },
    {
      field: "openingAmount",
      headerName: "Inicial",
      width: 130,
      valueFormatter: (value) => formatMoney(Number(value))
    },
    {
      field: "expectedClosingAmount",
      headerName: "Esperado",
      width: 130,
      valueFormatter: (value) => formatMoney(value as number | null)
    },
    {
      field: "closingAmount",
      headerName: "Contado",
      width: 130,
      valueFormatter: (value) => formatMoney(value as number | null)
    },
    {
      field: "difference",
      headerName: "Diferencia",
      width: 130,
      valueFormatter: (value) => formatMoney(value as number | null)
    }
  ];

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Consulta ventas netas, devoluciones, cortes de caja y productos más vendidos."
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
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
            />

            <Button fullWidth onClick={consult} disabled={datesAreInvalid() || isLoading || isDownloadingPdf}>
              {isLoading ? "Consultando..." : "Consultar reporte"}
            </Button>

            <Button fullWidth onClick={downloadPdf} disabled={datesAreInvalid() || isLoading || isDownloadingPdf}>
              {isDownloadingPdf ? "Descargando..." : "Descargar PDF ventas"}
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
                  <Typography color="text.secondary">Ventas registradas</Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {data.sales.count}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Venta bruta</Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {formatMoney(data.sales.gross)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Devoluciones</Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {formatMoney(data.sales.refunded)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} sm={6} lg={3}>
              <Card>
                <CardContent>
                  <Typography color="text.secondary">Venta neta</Typography>
                  <Typography variant="h5" fontWeight={800}>
                    {formatMoney(data.sales.net)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={800} mb={1}>
                    Ventas por estado
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {Object.entries(data.sales.byStatus).length === 0 ? (
                      <Typography color="text.secondary">Sin ventas.</Typography>
                    ) : (
                      Object.entries(data.sales.byStatus).map(([status, count]) => (
                        <Chip key={status} label={`${statusLabel(status)}: ${count}`} />
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={800} mb={1}>
                    Pagos
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {Object.entries(data.sales.paymentSummary).length === 0 ? (
                      <Typography color="text.secondary">Sin pagos registrados.</Typography>
                    ) : (
                      Object.entries(data.sales.paymentSummary).map(([method, amount]) => (
                        <Chip
                          key={method}
                          color="primary"
                          variant="outlined"
                          label={`${paymentMethodLabel(method)}: ${formatMoney(amount)}`}
                        />
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Card sx={{ height: "100%" }}>
                <CardContent>
                  <Typography variant="h6" fontWeight={800} mb={1}>
                    Caja
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Typography color="text.secondary" mb={1}>
                    Movimientos: {data.cashRegister.movements.count}
                  </Typography>
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {Object.entries(data.cashRegister.movements.summary).length === 0 ? (
                      <Typography color="text.secondary">Sin movimientos de caja.</Typography>
                    ) : (
                      Object.entries(data.cashRegister.movements.summary).map(([type, amount]) => (
                        <Chip
                          key={type}
                          variant="outlined"
                          label={`${cashMovementLabel(type)}: ${formatMoney(amount)}`}
                        />
                      ))
                    )}
                  </Stack>
                </CardContent>
              </Card>
            </Grid>
          </Grid>

          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ overflowX: "auto" }}>
              <Typography variant="h6" fontWeight={800} mb={2}>
                Productos más vendidos
              </Typography>
              <Box sx={{ minWidth: 820 }}>
                <DataGrid
                  autoHeight
                  rows={topProductsRows}
                  columns={topProductsColumns}
                  disableRowSelectionOnClick
                  loading={isLoading}
                />
              </Box>
            </CardContent>
          </Card>

          <Card sx={{ mb: 2 }}>
            <CardContent sx={{ overflowX: "auto" }}>
              <Typography variant="h6" fontWeight={800} mb={2}>
                Devoluciones recientes
              </Typography>
              <Box sx={{ minWidth: 1020 }}>
                <DataGrid
                  autoHeight
                  rows={data.returns.latest}
                  columns={returnsColumns}
                  disableRowSelectionOnClick
                  loading={isLoading}
                />
              </Box>
            </CardContent>
          </Card>

          <Card>
            <CardContent sx={{ overflowX: "auto" }}>
              <Typography variant="h6" fontWeight={800} mb={2}>
                Cortes de caja del periodo
              </Typography>
              <Box sx={{ minWidth: 1120 }}>
                <DataGrid
                  autoHeight
                  rows={data.cashRegister.sessions}
                  columns={sessionsColumns}
                  disableRowSelectionOnClick
                  loading={isLoading}
                />
              </Box>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
}

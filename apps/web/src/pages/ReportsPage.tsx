import { useMemo, useState } from "react";

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
  Typography,
  type ChipProps
} from "@mui/material";

import { GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { DataGridCard } from "../components/DataGridCard";
import { PageHeader } from "../components/PageHeader";
import { StatusFeedback } from "../components/StatusFeedback";
import { getApiErrorMessage } from "../utils/apiError";
import { downloadBlob } from "../utils/downloadBlob";

type MoneySummary = Record<string, number>;

type OperationsReport = {
  from: string;
  to: string;
  fromLabel?: string;
  toLabel?: string;
  sales: {
    count: number;
    byStatus: Record<string, number>;
    gross: number;
    refunded: number;
    net: number;
    paymentSummary: MoneySummary;
    recent: Array<{
      id: string;
      folio: string;
      status: string;
      total: number;
      createdAt: string;
      cashier: {
        id: string;
        name: string;
        email: string;
      };
      payments: Array<{
        id: string;
        method: string;
        amount: number;
      }>;
    }>;
  };
  returns: {
    count: number;
    total: number;
    byMethod: MoneySummary;
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

  return new Date(value).toLocaleString("es-MX");
}

function statusLabel(status: string) {
  switch (status) {
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    case "PARTIALLY_REFUNDED":
      return "Devolución parcial";
    case "REFUNDED":
      return "Devuelta";
    default:
      return status;
  }
}

function statusColor(status: string): ChipProps["color"] {
  switch (status) {
    case "COMPLETED":
      return "success";
    case "CANCELLED":
      return "default";
    case "PARTIALLY_REFUNDED":
      return "warning";
    case "REFUNDED":
      return "error";
    default:
      return "default";
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

function buildQuery(from: string, to: string) {
  return new URLSearchParams({
    from,
    to
  }).toString();
}

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<OperationsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState("");

  const dateRangeIsInvalid = !from || !to || from > to;

  const periodLabel = data
    ? `${data.fromLabel ?? from} al ${data.toLabel ?? to}`
    : `${from || "—"} al ${to || "—"}`;

  const hasReportActivity = Boolean(
    data &&
      (data.sales.count > 0 ||
        data.returns.count > 0 ||
        data.cashRegister.movements.count > 0 ||
        data.cashRegister.sessions.length > 0)
  );

  async function consult() {
    setError("");

    if (dateRangeIsInvalid) {
      setError("El rango de fechas no es válido.");
      return;
    }

    try {
      setIsLoading(true);

      const response = await api.get<OperationsReport>(
        `/reports/operations?${buildQuery(from, to)}`
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

    if (dateRangeIsInvalid) {
      setError("El rango de fechas no es válido.");
      return;
    }

    try {
      setIsDownloadingPdf(true);

      const response = await api.get(
        `/reports/operations/pdf?${buildQuery(from, to)}`,
        {
          responseType: "blob"
        }
      );

      downloadBlob(response.data, `reporte-operativo-${from}-${to}.pdf`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo descargar el PDF."));
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  const recentSalesRows = data?.sales.recent ?? [];

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
      headerName: "Unidades netas",
      width: 150
    },
    {
      field: "total",
      headerName: "Vendido neto",
      width: 150,
      valueFormatter: (value) => formatMoney(Number(value))
    }
  ];

  const recentSalesColumns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 180,
      valueFormatter: (value) => formatDate(value as string)
    },
    {
      field: "folio",
      headerName: "Folio",
      minWidth: 190,
      flex: 1
    },
    {
      field: "cashier",
      headerName: "Cajero",
      flex: 1,
      minWidth: 220,
      valueGetter: (_value, row) => `${row.cashier.name} (${row.cashier.email})`
    },
    {
      field: "status",
      headerName: "Estado",
      width: 170,
      renderCell: (params) => (
        <Chip
          size="small"
          label={statusLabel(String(params.value))}
          color={statusColor(String(params.value))}
        />
      )
    },
    {
      field: "payments",
      headerName: "Pagos",
      flex: 1,
      minWidth: 220,
      valueGetter: (_value, row) =>
        row.payments
          .map(
            (payment: { method: string; amount: number }) =>
              `${paymentMethodLabel(payment.method)} ${formatMoney(payment.amount)}`
          )
          .join(", ") || "—"
    },
    {
      field: "total",
      headerName: "Total",
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

  const summaryCards = useMemo(
    () => [
      {
        label: "Ventas registradas",
        value: data?.sales.count ?? 0,
        helper: "Incluye completadas, canceladas y con devolución."
      },
      {
        label: "Venta bruta",
        value: formatMoney(data?.sales.gross),
        helper: "Ventas no canceladas antes de devoluciones."
      },
      {
        label: "Devoluciones",
        value: formatMoney(data?.sales.refunded),
        helper: "Reembolsos registrados dentro del periodo."
      },
      {
        label: "Venta neta",
        value: formatMoney(data?.sales.net),
        helper: "Venta bruta menos devoluciones."
      }
    ],
    [data]
  );

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Consulta ventas netas, devoluciones, caja y productos vendidos con un corte operativo consistente."
      />

      <Box sx={{ mb: 2 }}>
        <Chip color="primary" label="Reporte operativo ADMIN" />
      </Box>

      <StatusFeedback error={error} onErrorClose={() => setError("")} />

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
              error={dateRangeIsInvalid}
            />

            <TextField
              fullWidth
              label="Hasta"
              type="date"
              value={to}
              onChange={(event) => setTo(event.target.value)}
              InputLabelProps={{ shrink: true }}
              error={dateRangeIsInvalid}
              helperText={dateRangeIsInvalid ? "Revisa el rango." : undefined}
            />

            <Button
              fullWidth
              variant="contained"
              onClick={consult}
              disabled={dateRangeIsInvalid || isLoading || isDownloadingPdf}
            >
              {isLoading ? "Consultando..." : "Consultar reporte"}
            </Button>

            <Button
              fullWidth
              variant="outlined"
              onClick={downloadPdf}
              disabled={dateRangeIsInvalid || isLoading || isDownloadingPdf}
            >
              {isDownloadingPdf ? "Descargando..." : "Descargar PDF"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {data && !hasReportActivity && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay ventas, devoluciones ni movimientos de caja en el periodo {periodLabel}.
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {summaryCards.map((card) => (
              <Grid key={card.label} item xs={12} sm={6} lg={3}>
                <Card sx={{ height: "100%" }}>
                  <CardContent>
                    <Typography color="text.secondary">{card.label}</Typography>
                    <Typography variant="h5" fontWeight={800}>
                      {card.value}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" mt={0.5}>
                      {card.helper}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            ))}
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
                        <Chip
                          key={status}
                          color={statusColor(status)}
                          label={`${statusLabel(status)}: ${count}`}
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
                    Cobros y devoluciones
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                  <Stack spacing={1.5}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Cobros por método
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {Object.entries(data.sales.paymentSummary).length === 0 ? (
                          <Typography color="text.secondary">Sin cobros registrados.</Typography>
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
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Devoluciones por método
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {Object.entries(data.returns.byMethod).length === 0 ? (
                          <Typography color="text.secondary">Sin devoluciones registradas.</Typography>
                        ) : (
                          Object.entries(data.returns.byMethod).map(([method, amount]) => (
                            <Chip
                              key={method}
                              color="warning"
                              variant="outlined"
                              label={`${paymentMethodLabel(method)}: ${formatMoney(amount)}`}
                            />
                          ))
                        )}
                      </Stack>
                    </Box>
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

          <DataGridCard
            title="Ventas recientes del periodo"
            subtitle="Incluye estado, cajero, métodos de pago y total para detectar cancelaciones o devoluciones."
            rows={recentSalesRows}
            columns={recentSalesColumns}
            minWidth={1120}
            loading={isLoading}
            cardSx={{ mb: 2 }}
            noRowsLabel="No hay ventas en el periodo."
            tableLabel="Ventas recientes del periodo"
          />

          <DataGridCard
            title="Productos más vendidos netos"
            subtitle="Calculado con ventas no canceladas menos devoluciones registradas en el periodo."
            rows={topProductsRows}
            columns={topProductsColumns}
            minWidth={820}
            loading={isLoading}
            cardSx={{ mb: 2 }}
            noRowsLabel="No hay productos vendidos en el periodo."
            tableLabel="Productos más vendidos netos"
          />

          <DataGridCard
            title="Devoluciones recientes"
            rows={data.returns.latest}
            columns={returnsColumns}
            minWidth={1020}
            loading={isLoading}
            cardSx={{ mb: 2 }}
            noRowsLabel="No hay devoluciones en el periodo."
            tableLabel="Devoluciones recientes"
          />

          <DataGridCard
            title="Cortes de caja del periodo"
            rows={data.cashRegister.sessions}
            columns={sessionsColumns}
            minWidth={1120}
            loading={isLoading}
            noRowsLabel="No hay cortes de caja en el periodo."
            tableLabel="Cortes de caja del periodo"
          />
        </>
      )}
    </>
  );
}

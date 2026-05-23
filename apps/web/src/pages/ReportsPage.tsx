import { useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import { api } from "../api/client";
import { LabelWithInfo } from "../components/InfoTooltip";
import { PageHeader } from "../components/PageHeader";
import { StatusFeedback } from "../components/StatusFeedback";
import { getApiErrorMessage } from "../utils/apiError";
import { downloadBlob } from "../utils/downloadBlob";
import {
  DetailLine,
  EmptyText,
  MetricCard,
  REPORT_INFO_TEXT,
  ReportPanel,
  buildQuery,
  cashMovementLabel,
  formatDate,
  formatMoney,
  includesQuery,
  paymentMethodLabel,
  statusColor,
  statusLabel,
  type OperationsReport
} from "./reports/reportShared";

export function ReportsPage() {
  const today = new Date().toISOString().slice(0, 10);

  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<OperationsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

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
      setError(getApiErrorMessage(err, "No se pudo consultar el reporte operativo."));
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

      const response = await api.get(`/reports/operations/pdf?${buildQuery(from, to)}`, {
        responseType: "blob"
      });

      downloadBlob(response.data, `reporte-operativo-${from}-${to}.pdf`);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo descargar el PDF."));
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  const summaryCards = useMemo(
    () => [
      {
        label: "Ventas registradas",
        value: data?.sales.count ?? 0,
        helper: "Incluye completadas, canceladas y con devolución.",
        info: REPORT_INFO_TEXT.salesCount
      },
      {
        label: "Venta bruta",
        value: formatMoney(data?.sales.gross),
        helper: "Ventas no canceladas antes de devoluciones.",
        info: REPORT_INFO_TEXT.grossSales
      },
      {
        label: "Devoluciones",
        value: formatMoney(data?.sales.refunded),
        helper: "Reembolsos registrados dentro del periodo.",
        info: REPORT_INFO_TEXT.refunds
      },
      {
        label: "Venta neta",
        value: formatMoney(data?.sales.net),
        helper: "Venta bruta menos devoluciones.",
        info: REPORT_INFO_TEXT.netSales
      }
    ],
    [data]
  );

  const filteredSellers = useMemo(
    () =>
      data?.sales.bySeller.filter((item) =>
        includesQuery(
          [item.seller.name, item.seller.email, item.count, item.gross, item.refunded, item.net],
          search
        )
      ) ?? [],
    [data, search]
  );

  const filteredTopProducts = useMemo(
    () =>
      data?.topProducts.filter((item) =>
        includesQuery([item.product.sku, item.product.name, item.quantity, item.total], search)
      ) ?? [],
    [data, search]
  );

  const filteredRecentSales = useMemo(
    () =>
      data?.sales.recent.filter((sale) =>
        includesQuery(
          [
            sale.folio,
            sale.cashier.name,
            sale.cashier.email,
            statusLabel(sale.status),
            sale.total,
            sale.payments.map((payment) => paymentMethodLabel(payment.method)).join(" ")
          ],
          search
        )
      ) ?? [],
    [data, search]
  );

  const filteredReturns = useMemo(
    () =>
      data?.returns.latest.filter((saleReturn) =>
        includesQuery(
          [
            saleReturn.reason,
            saleReturn.cashier?.name,
            saleReturn.cashier?.email,
            paymentMethodLabel(saleReturn.refundMethod),
            saleReturn.refundTotal
          ],
          search
        )
      ) ?? [],
    [data, search]
  );

  const hasCashActivity = Boolean(
    data && (data.cashRegister.movements.count > 0 || data.cashRegister.sessions.length > 0)
  );

  return (
    <>
      <PageHeader
        title="Reportes"
        subtitle="Consulta ventas netas, devoluciones, productos vendidos y desempeño por vendedor."
      />

      <Box sx={{ mb: 2 }}>
        <Chip color="primary" label="Reporte operativo ADMIN" />
      </Box>

      <StatusFeedback error={error} onErrorClose={() => setError("")} />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                sm: "1fr 1fr",
                lg: "repeat(4, minmax(0, 1fr))"
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

      {data && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <TextField
              fullWidth
              label="Buscar dentro del reporte"
              placeholder="Folio, vendedor, producto, método de pago, estado..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </CardContent>
        </Card>
      )}

      {data && !hasReportActivity && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay ventas, devoluciones ni movimientos registrados en el periodo {periodLabel}.
        </Alert>
      )}

      {data && (
        <>
          <Grid container spacing={2} sx={{ mb: 2 }}>
            {summaryCards.map((card) => (
              <Grid key={card.label} item xs={12} sm={6} lg={3}>
                <MetricCard {...card} />
              </Grid>
            ))}
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} lg={7}>
              <ReportPanel
                title="Ventas por vendedor"
                subtitle="Desempeño neto por vendedor en el periodo consultado."
              >
                {filteredSellers.length === 0 ? (
                  <EmptyText>No hay vendedores que coincidan con la búsqueda.</EmptyText>
                ) : (
                  <Stack spacing={1.5}>
                    {filteredSellers.map((item) => (
                      <Card key={item.seller.id} variant="outlined">
                        <CardContent>
                          <Stack spacing={1.5}>
                            <Box sx={{ minWidth: 0 }}>
                              <Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                                {item.seller.name}
                              </Typography>
                              <Typography
                                variant="body2"
                                color="text.secondary"
                                sx={{ overflowWrap: "anywhere" }}
                              >
                                {item.seller.email}
                              </Typography>
                            </Box>

                            <Box
                              sx={{
                                display: "grid",
                                gridTemplateColumns: {
                                  xs: "1fr",
                                  sm: "repeat(2, minmax(0, 1fr))",
                                  md: "repeat(4, minmax(0, 1fr))"
                                },
                                gap: 1.5
                              }}
                            >
                              <DetailLine label="Ventas" value={item.count} />
                              <DetailLine label="Bruto" value={formatMoney(item.gross)} />
                              <DetailLine label="Devoluciones" value={formatMoney(item.refunded)} />
                              <DetailLine
                                label="Venta neta"
                                value={
                                  <LabelWithInfo
                                    label={formatMoney(item.net)}
                                    info={REPORT_INFO_TEXT.sellerNet}
                                    ariaLabel={REPORT_INFO_TEXT.sellerNet}
                                  />
                                }
                              />
                            </Box>
                          </Stack>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </ReportPanel>
            </Grid>

            <Grid item xs={12} lg={5}>
              <ReportPanel
                title="Estados y métodos"
                subtitle="Resumen rápido de estados de venta, cobros y devoluciones."
              >
                <Stack spacing={2}>
                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Ventas por estado
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {Object.entries(data.sales.byStatus).length === 0 ? (
                        <EmptyText>Sin ventas.</EmptyText>
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
                  </Box>

                  <Box>
                    <Typography variant="body2" color="text.secondary" mb={1}>
                      Cobros por método
                    </Typography>
                    <Stack direction="row" flexWrap="wrap" gap={1}>
                      {Object.entries(data.sales.paymentSummary).length === 0 ? (
                        <EmptyText>Sin cobros registrados.</EmptyText>
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
                        <EmptyText>Sin devoluciones registradas.</EmptyText>
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
              </ReportPanel>
            </Grid>
          </Grid>

          <Grid container spacing={2} sx={{ mb: 2 }}>
            <Grid item xs={12} lg={5}>
              <ReportPanel
                title="Productos más vendidos"
                subtitle="Ranking neto: ventas no canceladas menos devoluciones del periodo."
              >
                {filteredTopProducts.length === 0 ? (
                  <EmptyText>No hay productos vendidos que coincidan con la búsqueda.</EmptyText>
                ) : (
                  <Stack spacing={1.25}>
                    {filteredTopProducts.map((item, index) => (
                      <Card key={`${item.product.id}-${index}`} variant="outlined">
                        <CardContent
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "minmax(0, 1.5fr) repeat(2, minmax(110px, 0.7fr))"
                            },
                            gap: 1.5,
                            alignItems: "center"
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary">
                              #{index + 1} · SKU {item.product.sku ?? "—"}
                            </Typography>
                            <Typography fontWeight={800} noWrap>
                              {item.product.name}
                            </Typography>
                          </Box>
                          <DetailLine
                            label="Unidades netas"
                            value={
                              <LabelWithInfo
                                label={item.quantity}
                                info={REPORT_INFO_TEXT.netUnits}
                                ariaLabel={REPORT_INFO_TEXT.netUnits}
                              />
                            }
                          />
                          <DetailLine
                            label="Vendido neto"
                            value={
                              <LabelWithInfo
                                label={formatMoney(item.total)}
                                info={REPORT_INFO_TEXT.netSold}
                                ariaLabel={REPORT_INFO_TEXT.netSold}
                              />
                            }
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </ReportPanel>
            </Grid>

            <Grid item xs={12} lg={7}>
              <ReportPanel
                title="Ventas recientes"
                subtitle="Historial operativo del periodo con folio, vendedor, estado y pagos."
              >
                {filteredRecentSales.length === 0 ? (
                  <EmptyText>No hay ventas que coincidan con la búsqueda.</EmptyText>
                ) : (
                  <Stack spacing={1.25}>
                    {filteredRecentSales.map((sale) => (
                      <Card key={sale.id} variant="outlined">
                        <CardContent>
                          <Stack
                            direction={{ xs: "column", sm: "row" }}
                            justifyContent="space-between"
                            alignItems={{ xs: "flex-start", sm: "center" }}
                            gap={1}
                          >
                            <Box sx={{ minWidth: 0 }}>
                              <Typography fontWeight={800}>{sale.folio}</Typography>
                              <Typography variant="body2" color="text.secondary">
                                {formatDate(sale.createdAt)}
                              </Typography>
                            </Box>
                            <Chip
                              size="small"
                              label={statusLabel(sale.status)}
                              color={statusColor(sale.status)}
                            />
                          </Stack>

                          <Box
                            sx={{
                              mt: 2,
                              display: "grid",
                              gridTemplateColumns: {
                                xs: "1fr",
                                sm: "repeat(2, minmax(0, 1fr))",
                                md: "minmax(0, 1.4fr) minmax(0, 1.2fr) minmax(110px, 0.6fr)"
                              },
                              gap: 1.5
                            }}
                          >
                            <DetailLine
                              label="Vendedor"
                              value={`${sale.cashier.name} (${sale.cashier.email})`}
                            />
                            <DetailLine
                              label="Pagos"
                              value={
                                sale.payments.length === 0
                                  ? "—"
                                  : sale.payments
                                      .map(
                                        (payment) =>
                                          `${paymentMethodLabel(payment.method)} ${formatMoney(
                                            payment.amount
                                          )}`
                                      )
                                      .join(", ")
                              }
                            />
                            <DetailLine label="Total" value={formatMoney(sale.total)} />
                          </Box>
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </ReportPanel>
            </Grid>
          </Grid>

          <Grid container spacing={2}>
            <Grid item xs={12} lg={hasCashActivity ? 7 : 12}>
              <ReportPanel
                title="Devoluciones recientes"
                subtitle="Reembolsos registrados dentro del periodo."
              >
                {filteredReturns.length === 0 ? (
                  <EmptyText>No hay devoluciones que coincidan con la búsqueda.</EmptyText>
                ) : (
                  <Stack spacing={1.25}>
                    {filteredReturns.map((saleReturn) => (
                      <Card key={saleReturn.id} variant="outlined">
                        <CardContent
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              sm: "minmax(0, 1.4fr) repeat(2, minmax(120px, 0.7fr))"
                            },
                            gap: 1.5
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Typography fontWeight={800}>{saleReturn.reason}</Typography>
                            <Typography variant="body2" color="text.secondary">
                              {formatDate(saleReturn.createdAt)}
                            </Typography>
                            <Typography variant="body2" color="text.secondary" noWrap>
                              {saleReturn.cashier
                                ? `${saleReturn.cashier.name} (${saleReturn.cashier.email})`
                                : "Sin responsable"}
                            </Typography>
                          </Box>
                          <DetailLine
                            label="Método"
                            value={paymentMethodLabel(saleReturn.refundMethod)}
                          />
                          <DetailLine
                            label="Total devuelto"
                            value={formatMoney(saleReturn.refundTotal)}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Stack>
                )}
              </ReportPanel>
            </Grid>

            {hasCashActivity && (
              <Grid item xs={12} lg={5}>
                <ReportPanel
                  title="Movimientos de efectivo registrados"
                  subtitle="Aparece solo si existen datos históricos del módulo de caja."
                >
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Movimientos: {data.cashRegister.movements.count}
                      </Typography>
                      <Stack direction="row" flexWrap="wrap" gap={1}>
                        {Object.entries(data.cashRegister.movements.summary).length === 0 ? (
                          <EmptyText>Sin movimientos de efectivo.</EmptyText>
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
                    </Box>

                    <Box>
                      <Typography variant="body2" color="text.secondary" mb={1}>
                        Cortes históricos
                      </Typography>
                      {data.cashRegister.sessions.length === 0 ? (
                        <EmptyText>Sin cortes registrados.</EmptyText>
                      ) : (
                        <Stack spacing={1}>
                          {data.cashRegister.sessions.slice(0, 5).map((session) => (
                            <Card key={session.id} variant="outlined">
                              <CardContent>
                                <Stack direction="row" justifyContent="space-between" gap={1}>
                                  <Typography fontWeight={800}>
                                    {session.cashier?.name ?? "Sin vendedor"}
                                  </Typography>
                                  <Chip
                                    size="small"
                                    label={session.status === "OPEN" ? "Abierta" : "Cerrada"}
                                    color={session.status === "OPEN" ? "success" : "default"}
                                  />
                                </Stack>
                                <Box
                                  sx={{
                                    mt: 1.5,
                                    display: "grid",
                                    gridTemplateColumns: {
                                      xs: "1fr",
                                      sm: "repeat(2, minmax(0, 1fr))"
                                    },
                                    gap: 1
                                  }}
                                >
                                  <DetailLine label="Apertura" value={formatDate(session.openedAt)} />
                                  <DetailLine label="Cierre" value={formatDate(session.closedAt)} />
                                  <DetailLine
                                    label="Esperado"
                                    value={
                                      <LabelWithInfo
                                        label={formatMoney(session.expectedClosingAmount)}
                                        info={REPORT_INFO_TEXT.expectedCash}
                                        ariaLabel={REPORT_INFO_TEXT.expectedCash}
                                      />
                                    }
                                  />
                                  <DetailLine
                                    label="Diferencia"
                                    value={
                                      <LabelWithInfo
                                        label={formatMoney(session.difference)}
                                        info={REPORT_INFO_TEXT.cashDifference}
                                        ariaLabel={REPORT_INFO_TEXT.cashDifference}
                                      />
                                    }
                                  />
                                </Box>
                              </CardContent>
                            </Card>
                          ))}
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </ReportPanel>
              </Grid>
            )}
          </Grid>
        </>
      )}
    </>
  );
}

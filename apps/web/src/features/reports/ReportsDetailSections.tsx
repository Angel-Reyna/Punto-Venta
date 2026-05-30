import type { ReactNode } from "react";

import { Box, Card, CardContent, Chip, Grid, Stack, Typography } from "@mui/material";

import { LabelWithInfo } from "../../components/InfoTooltip";
import {
  DetailLine,
  EmptyText,
  REPORT_INFO_TEXT,
  ReportPanel,
  cashMovementLabel,
  formatDate,
  formatMoney,
  paymentMethodLabel,
  statusColor,
  statusLabel,
  type OperationsReport
} from "./reportShared";

type SellerReportItem = OperationsReport["sales"]["bySeller"][number];
type ProductReportItem = OperationsReport["topProducts"][number];
type RecentSaleItem = OperationsReport["sales"]["recent"][number];
type ReturnReportItem = OperationsReport["returns"]["latest"][number];

export function ReportsDetailSections({
  data,
  filteredRecentSales,
  filteredReturns,
  filteredSellers,
  filteredTopProducts,
  hasCashActivity
}: {
  data: OperationsReport;
  filteredRecentSales: RecentSaleItem[];
  filteredReturns: ReturnReportItem[];
  filteredSellers: SellerReportItem[];
  filteredTopProducts: ProductReportItem[];
  hasCashActivity: boolean;
}) {
  return (
    <>
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} lg={7}>
          <SellersPanel sellers={filteredSellers} />
        </Grid>

        <Grid item xs={12} lg={5}>
          <StatusAndMethodsPanel data={data} />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} lg={5}>
          <TopProductsPanel products={filteredTopProducts} />
        </Grid>

        <Grid item xs={12} lg={7}>
          <RecentSalesPanel sales={filteredRecentSales} />
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} lg={hasCashActivity ? 7 : 12}>
          <ReturnsPanel returns={filteredReturns} />
        </Grid>

        {hasCashActivity && (
          <Grid item xs={12} lg={5}>
            <CashActivityPanel data={data} />
          </Grid>
        )}
      </Grid>
    </>
  );
}

function SellersPanel({ sellers }: { sellers: SellerReportItem[] }) {
  return (
    <ReportPanel title="Ventas por vendedor" subtitle="Quién vendió, cuánto aportó y qué tanto se afectó por devoluciones.">
      {sellers.length === 0 ? (
        <EmptyText>No hay vendedores que coincidan con la búsqueda.</EmptyText>
      ) : (
        <Stack spacing={1.5}>
          {sellers.map((item) => (
            <Card key={item.seller.id} variant="outlined">
              <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
                <Stack spacing={1.5}>
                  <Stack direction={{ xs: "column", sm: "row" }} justifyContent="space-between" gap={1}>
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={800} sx={{ overflowWrap: "anywhere" }}>
                        {item.seller.name}
                      </Typography>
                      <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                        {item.seller.email}
                      </Typography>
                    </Box>
                    <Chip color="primary" variant="outlined" label={`${item.count} venta(s)`} />
                  </Stack>

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        sm: "repeat(2, minmax(0, 1fr))",
                        md: "repeat(4, minmax(0, 1fr))"
                      },
                      gap: 1
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
  );
}

function StatusAndMethodsPanel({ data }: { data: OperationsReport }) {
  return (
    <ReportPanel title="Estados y métodos" subtitle="Cómo se cerraron las ventas y por dónde entró o salió el dinero.">
      <Stack spacing={2}>
        <SummaryChipGroup title="Ventas por estado">
          {Object.entries(data.sales.byStatus).length === 0 ? (
            <EmptyText>Sin ventas.</EmptyText>
          ) : (
            Object.entries(data.sales.byStatus).map(([status, count]) => (
              <Chip key={status} color={statusColor(status)} label={`${statusLabel(status)}: ${count}`} />
            ))
          )}
        </SummaryChipGroup>

        <SummaryChipGroup title="Cobros por método">
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
        </SummaryChipGroup>

        <SummaryChipGroup title="Devoluciones por método">
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
        </SummaryChipGroup>
      </Stack>
    </ReportPanel>
  );
}

function SummaryChipGroup({ children, title }: { children: ReactNode; title: string }) {
  return (
    <Box>
      <Typography variant="body2" color="text.secondary" mb={1}>
        {title}
      </Typography>
      <Stack direction="row" flexWrap="wrap" gap={1}>
        {children}
      </Stack>
    </Box>
  );
}

function TopProductsPanel({ products }: { products: ProductReportItem[] }) {
  return (
    <ReportPanel title="Productos más vendidos" subtitle="Qué productos movieron unidades, dinero y utilidad en el periodo.">
      {products.length === 0 ? (
        <EmptyText>No hay productos vendidos que coincidan con la búsqueda.</EmptyText>
      ) : (
        <Stack spacing={1.25}>
          {products.map((item, index) => (
            <Card key={`${item.product.id}-${index}`} variant="outlined">
              <CardContent
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    sm: "repeat(3, minmax(0, 1fr))"
                  },
                  gap: 1,
                  alignItems: "start",
                  p: { xs: 2, md: 2.25 }
                }}
              >
                <Stack direction="row" spacing={1} alignItems="flex-start" sx={{ gridColumn: "1 / -1", minWidth: 0 }}>
                  <Chip color="primary" label={`#${index + 1}`} />
                  <Box sx={{ minWidth: 0 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      SKU {item.product.sku ?? "—"}
                    </Typography>
                    <Typography
                      component="p"
                      fontWeight={800}
                      sx={{
                        display: "block",
                        minWidth: 0,
                        overflowWrap: "anywhere",
                        wordBreak: "break-word"
                      }}
                    >
                      {item.product.name}
                    </Typography>
                  </Box>
                </Stack>
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
                <DetailLine
                  label="Utilidad"
                  value={
                    <LabelWithInfo
                      label={formatMoney(item.grossProfit)}
                      info={REPORT_INFO_TEXT.productProfit}
                      ariaLabel={REPORT_INFO_TEXT.productProfit}
                    />
                  }
                />
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </ReportPanel>
  );
}

function RecentSalesPanel({ sales }: { sales: RecentSaleItem[] }) {
  return (
    <ReportPanel title="Ventas recientes" subtitle="Últimas operaciones del periodo con folio, vendedor, cobro y estado.">
      {sales.length === 0 ? (
        <EmptyText>No hay ventas que coincidan con la búsqueda.</EmptyText>
      ) : (
        <Stack spacing={1.25}>
          {sales.map((sale) => (
            <Card key={sale.id} variant="outlined">
              <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
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
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Chip size="small" label={statusLabel(sale.status)} color={statusColor(sale.status)} />
                    <Typography fontWeight={900}>{formatMoney(sale.total)}</Typography>
                  </Stack>
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
                  <DetailLine label="Vendedor" value={`${sale.cashier.name} (${sale.cashier.email})`} />
                  <DetailLine
                    label="Pagos"
                    value={
                      sale.payments.length === 0
                        ? "—"
                        : sale.payments
                            .map(
                              (payment) =>
                                `${paymentMethodLabel(payment.method)} ${formatMoney(payment.amount)}`
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
  );
}

function ReturnsPanel({ returns }: { returns: ReturnReportItem[] }) {
  return (
    <ReportPanel title="Devoluciones recientes" subtitle="Reembolsos que reducen la venta neta del periodo.">
      {returns.length === 0 ? (
        <EmptyText>No hay devoluciones que coincidan con la búsqueda.</EmptyText>
      ) : (
        <Stack spacing={1.25}>
          {returns.map((saleReturn) => (
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
                <DetailLine label="Método" value={paymentMethodLabel(saleReturn.refundMethod)} />
                <DetailLine label="Total devuelto" value={formatMoney(saleReturn.refundTotal)} />
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </ReportPanel>
  );
}

function CashActivityPanel({ data }: { data: OperationsReport }) {
  return (
    <ReportPanel title="Movimientos de efectivo registrados" subtitle="Control secundario de caja; no es requisito para registrar ventas.">
      <Stack spacing={2}>
        <SummaryChipGroup title={`Movimientos: ${data.cashRegister.movements.count}`}>
          {Object.entries(data.cashRegister.movements.summary).length === 0 ? (
            <EmptyText>Sin movimientos de efectivo.</EmptyText>
          ) : (
            Object.entries(data.cashRegister.movements.summary).map(([type, amount]) => (
              <Chip key={type} variant="outlined" label={`${cashMovementLabel(type)}: ${formatMoney(amount)}`} />
            ))
          )}
        </SummaryChipGroup>

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
                      <Typography fontWeight={800}>{session.cashier?.name ?? "Sin vendedor"}</Typography>
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
  );
}

import { useMemo, useState } from "react";

import { Box, Button, Card, CardContent, Chip, MenuItem, Stack, TextField, Typography } from "@mui/material";

import UndoIcon from "@mui/icons-material/Undo";
import CancelIcon from "@mui/icons-material/Cancel";

import { SearchToolbar } from "../../components/SearchToolbar";

import {
  formatMoney,
  getFilteredSales,
  getReturnableQuantity,
  PAYMENT_METHOD_OPTIONS,
  saleItemsSummary,
  salePaymentSummary,
  SALE_STATUS_FILTER_OPTIONS,
  statusColor,
  statusLabel,
  summarizeSales,
  type PaymentMethod,
  type Sale,
  type SalesAdjustmentRequest,
  type SaleStatus,
} from "./salesShared";
import type { SalesOperationMode } from "./useSalesOperations";

type SalesHistoryPanelProps = {
  adjustmentRequests: SalesAdjustmentRequest[];
  canCancelSales: boolean;
  canRequestSalesAdjustments: boolean;
  canReturnSales: boolean;
  canShowSellerInfo: boolean;
  isSubmitting: boolean;
  sales: Sale[];
  onOpenCancelDialog: (sale: Sale, mode?: SalesOperationMode) => void;
  onOpenReturnDialog: (sale: Sale, mode?: SalesOperationMode) => void;
};

export function SalesHistoryPanel({
  adjustmentRequests,
  canCancelSales,
  canRequestSalesAdjustments,
  canReturnSales,
  canShowSellerInfo,
  isSubmitting,
  sales,
  onOpenCancelDialog,
  onOpenReturnDialog,
}: SalesHistoryPanelProps) {
  const [saleSearch, setSaleSearch] = useState("");
  const [saleStatusFilter, setSaleStatusFilter] = useState<SaleStatus | "ALL">("ALL");
  const [salePaymentFilter, setSalePaymentFilter] = useState<PaymentMethod | "ALL">("ALL");

  const filteredSales = useMemo(
    () => getFilteredSales(sales, saleSearch, saleStatusFilter, salePaymentFilter),
    [salePaymentFilter, saleSearch, saleStatusFilter, sales],
  );

  const salesSummary = useMemo(() => summarizeSales(sales), [sales]);

  return (
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {[
          ["Ventas cargadas", salesSummary.totalCount.toString()],
          ["Completadas", salesSummary.completedCount.toString()],
          ["Total completado", formatMoney(salesSummary.totalSold)],
          ["Canceladas/devueltas", salesSummary.cancelledOrReturned.toString()],
        ].map(([label, value]) => (
          <Card key={label} variant="outlined" sx={{ boxShadow: "none" }}>
            <CardContent>
              <Typography variant="caption" color="text.secondary">
                {label}
              </Typography>
              <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

      <SearchToolbar
        query={saleSearch}
        onQueryChange={setSaleSearch}
        resultCount={filteredSales.length}
        totalCount={sales.length}
        label="Buscar ventas"
        placeholder="Folio, cliente, vendedor, estado o método de pago"
        helperText="Filtra el historial cargado. Usa Actualizar venta para traer los datos más recientes."
      />

      <Card>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
            sx={{ mb: 2 }}
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Historial operativo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ventas recientes sin tabla horizontal; usa filtros para revisar estados y pagos.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
              <TextField
                select
                size="small"
                label="Estado"
                value={saleStatusFilter}
                onChange={(event) => setSaleStatusFilter(event.target.value as SaleStatus | "ALL")}
                sx={{ minWidth: { xs: "100%", sm: 180 } }}
              >
                {SALE_STATUS_FILTER_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                size="small"
                label="Pago"
                value={salePaymentFilter}
                onChange={(event) => setSalePaymentFilter(event.target.value as PaymentMethod | "ALL")}
                sx={{ minWidth: { xs: "100%", sm: 180 } }}
              >
                <MenuItem value="ALL">Todos</MenuItem>
                {PAYMENT_METHOD_OPTIONS.map((option) => (
                  <MenuItem key={option.value} value={option.value}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Stack>
          </Stack>

          {filteredSales.length === 0 ? (
            <Box
              sx={{
                border: "1px dashed #cbd5e1",
                borderRadius: 2,
                color: "text.secondary",
                py: 6,
                textAlign: "center",
              }}
            >
              No hay ventas que coincidan con los filtros actuales.
            </Box>
          ) : (
            <Box sx={{ display: "grid", gap: 1.5 }}>
              {filteredSales.map((sale) => {
                const hasReturnableItems = (sale.items ?? []).some(
                  (item) => getReturnableQuantity(sale, item) > 0,
                );
                const pendingAdjustmentRequest = adjustmentRequests.find(
                  (request) => request.saleId === sale.id && request.status === "PENDING",
                );
                const hasSaleActions = canCancelSales || canReturnSales || canRequestSalesAdjustments;
                const desktopColumns = canShowSellerInfo && hasSaleActions
                  ? "minmax(0, 1.5fr) minmax(180px, 0.8fr) minmax(180px, 0.8fr) auto"
                  : canShowSellerInfo || hasSaleActions
                    ? "minmax(0, 1.5fr) minmax(180px, 0.8fr) auto"
                    : "minmax(0, 1.5fr) minmax(180px, 0.8fr)";

                return (
                  <Card key={sale.id} variant="outlined" data-testid={`sales-history-sale-${sale.id}`} sx={{ boxShadow: "none" }}>
                    <CardContent
                      sx={{
                        display: "grid",
                        gridTemplateColumns: {
                          xs: "1fr",
                          lg: desktopColumns,
                        },
                        gap: 2,
                        alignItems: "center",
                      }}
                    >
                      <Box sx={{ minWidth: 0 }}>
                        <Stack
                          direction="row"
                          spacing={1}
                          flexWrap="wrap"
                          useFlexGap
                          alignItems="center"
                          sx={{ mb: 0.75 }}
                        >
                          <Typography fontWeight={900}>{sale.folio}</Typography>
                          <Chip
                            size="small"
                            label={statusLabel(sale.status)}
                            color={statusColor(sale.status)}
                          />
                          {pendingAdjustmentRequest && (
                            <Chip size="small" label="Ajuste pendiente" color="warning" />
                          )}
                        </Stack>

                        <Typography variant="body2" color="text.secondary">
                          {new Date(sale.createdAt).toLocaleString()}
                        </Typography>
                        <Typography fontWeight={700} sx={{ mt: 0.5 }} noWrap>
                          {sale.customer?.name ?? "Sin cliente"}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {saleItemsSummary(sale)}
                        </Typography>
                      </Box>

                      {canShowSellerInfo && (
                        <Box sx={{ minWidth: 0 }}>
                          <Typography variant="caption" color="text.secondary">
                            Vendedor
                          </Typography>
                          <Typography fontWeight={800} noWrap>
                            {sale.cashier?.name ?? "Sin vendedor"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {sale.cashier?.email ?? ""}
                          </Typography>
                        </Box>
                      )}

                      <Box>
                        <Typography variant="caption" color="text.secondary">
                          Pago
                        </Typography>
                        <Typography fontWeight={800}>{salePaymentSummary(sale)}</Typography>
                        <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5 }}>
                          {formatMoney(sale.total)}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          Almacén: {sale.warehouse?.name ?? "Principal"}
                        </Typography>
                      </Box>

                      {hasSaleActions && (
                        <Stack
                          direction={{ xs: "column", sm: "row", lg: "column" }}
                          spacing={1}
                          alignItems="stretch"
                          justifyContent="center"
                        >
                          {(canReturnSales || canRequestSalesAdjustments) && (
                            <Button
                              size="small"
                              color="warning"
                              startIcon={<UndoIcon />}
                              disabled={
                                isSubmitting ||
                                sale.status === "CANCELLED" ||
                                !hasReturnableItems ||
                                (!canReturnSales && Boolean(pendingAdjustmentRequest))
                              }
                              onClick={() => onOpenReturnDialog(sale, canReturnSales ? "direct" : "request")}
                            >
                              {canReturnSales ? "Devolver" : "Solicitar devolución"}
                            </Button>
                          )}

                          {(canCancelSales || canRequestSalesAdjustments) && (
                            <Button
                              size="small"
                              color={canCancelSales ? "error" : "primary"}
                              startIcon={<CancelIcon />}
                              disabled={
                                isSubmitting ||
                                sale.status !== "COMPLETED" ||
                                (!canCancelSales && Boolean(pendingAdjustmentRequest))
                              }
                              onClick={() => onOpenCancelDialog(sale, canCancelSales ? "direct" : "request")}
                            >
                              {canCancelSales ? "Cancelar" : "Solicitar cancelación"}
                            </Button>
                          )}
                        </Stack>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </Box>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

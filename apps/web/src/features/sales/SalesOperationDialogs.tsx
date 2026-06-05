import { Alert, Box, Button, Chip, Divider, MenuItem, Stack, TextField, Typography } from "@mui/material";

import { ResponsiveDialog } from "../../components/ResponsiveDialog";

import { PAYMENT_METHOD_OPTIONS, type PaymentMethod, type Sale } from "./salesShared";
import type { ReturnItemDraft, ReturnQuantityDrafts } from "./useSalesOperations";

type SalesOperationDialogsProps = {
  cancelDialogOpen: boolean;
  cancelReason: string;
  cancelReasonIsInvalid: boolean;
  cancelRefundMethod: PaymentMethod;
  isSubmitting: boolean;
  returnDialogOpen: boolean;
  returnFormIsInvalid: boolean;
  returnItemsDraft: ReturnItemDraft[];
  returnQuantities: ReturnQuantityDrafts;
  returnReason: string;
  returnRefundMethod: PaymentMethod;
  selectedReturnItemsCount: number;
  selectedReturnUnits: number;
  selectedSale: Sale | null;
  onCancelReasonChange: (reason: string) => void;
  onCancelRefundMethodChange: (method: PaymentMethod) => void;
  onCloseCancelDialog: () => void;
  onCloseReturnDialog: () => void;
  onConfirmCancel: () => void;
  onConfirmReturn: () => void;
  onReturnItemQuantityChange: (saleItemId: string, quantity: string) => void;
  onReturnReasonChange: (reason: string) => void;
  onReturnRefundMethodChange: (method: PaymentMethod) => void;
};

function getSaleItemName(item: ReturnItemDraft["saleItem"]) {
  return item.product?.name ?? item.productName ?? "Producto";
}

function getSaleItemSku(item: ReturnItemDraft["saleItem"]) {
  return item.product?.sku ?? item.productSku ?? item.productId ?? "Sin clave";
}

export function SalesOperationDialogs({
  cancelDialogOpen,
  cancelReason,
  cancelReasonIsInvalid,
  cancelRefundMethod,
  isSubmitting,
  returnDialogOpen,
  returnFormIsInvalid,
  returnItemsDraft,
  returnQuantities,
  returnReason,
  returnRefundMethod,
  selectedReturnItemsCount,
  selectedReturnUnits,
  selectedSale,
  onCancelReasonChange,
  onCancelRefundMethodChange,
  onCloseCancelDialog,
  onCloseReturnDialog,
  onConfirmCancel,
  onConfirmReturn,
  onReturnItemQuantityChange,
  onReturnReasonChange,
  onReturnRefundMethodChange,
}: SalesOperationDialogsProps) {
  return (
    <>
      <ResponsiveDialog
        open={cancelDialogOpen}
        onClose={onCloseCancelDialog}
        disableClose={isSubmitting}
        maxWidth="sm"
        title={`Cancelar venta ${selectedSale?.folio ?? ""}`.trim()}
        description="Confirma la cancelación solo cuando la venta deba anularse por completo."
        actions={
          <>
            <Button variant="outlined" onClick={onCloseCancelDialog} disabled={isSubmitting}>
              Cerrar
            </Button>
            <Button color="error" onClick={onConfirmCancel} disabled={isSubmitting || cancelReasonIsInvalid}>
              Confirmar cancelación
            </Button>
          </>
        }
      >
        <Box sx={{ display: "grid", gap: 2 }}>
          <Alert severity="warning">
            Esta acción restaura el stock de todos los productos vendidos y marca la venta como cancelada.
          </Alert>

          <TextField
            select
            label="Método de devolución"
            value={cancelRefundMethod}
            onChange={(event) => onCancelRefundMethodChange(event.target.value as PaymentMethod)}
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Motivo de cancelación"
            value={cancelReason}
            multiline
            minRows={3}
            error={Boolean(cancelReason) && cancelReasonIsInvalid}
            helperText="Mínimo 5 caracteres para auditoría."
            onChange={(event) => onCancelReasonChange(event.target.value)}
          />
        </Box>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={returnDialogOpen}
        onClose={onCloseReturnDialog}
        disableClose={isSubmitting}
        maxWidth="md"
        title={`Registrar devolución ${selectedSale?.folio ?? ""}`.trim()}
        description="Devuelve una o varias partidas vendidas en la misma operación."
        actions={
          <>
            <Button variant="outlined" onClick={onCloseReturnDialog} disabled={isSubmitting}>
              Cerrar
            </Button>
            <Button
              color="warning"
              data-testid="sales-return-submit"
              onClick={onConfirmReturn}
              disabled={isSubmitting || returnFormIsInvalid}
            >
              Registrar devolución
            </Button>
          </>
        }
      >
        <Box sx={{ display: "grid", gap: 2 }}>
          <Alert severity="info">
            Indica cantidad solo en los productos que se devolverán. La operación restaura stock y conserva el
            detalle para auditoría.
          </Alert>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
            <Chip label={`${selectedReturnItemsCount} productos seleccionados`} />
            <Chip
              label={`${selectedReturnUnits} unidades a devolver`}
              color={selectedReturnUnits > 0 ? "warning" : "default"}
            />
          </Stack>

          <Box sx={{ display: "grid", gap: 1.25 }}>
            {returnItemsDraft.length === 0 ? (
              <Alert severity="warning">Esta venta no tiene productos disponibles para devolver.</Alert>
            ) : (
              returnItemsDraft.map(({ available, rawQuantity, saleItem }) => {
                const hasValue = rawQuantity.trim().length > 0;
                const quantity = Number(rawQuantity);
                const quantityIsInvalid =
                  hasValue && (!Number.isInteger(quantity) || quantity <= 0 || quantity > available);
                const disabled = available <= 0;

                return (
                  <Box
                    key={saleItem.id}
                    data-testid={`sales-return-item-${saleItem.id}`}
                    sx={{
                      border: "1px solid",
                      borderColor: quantityIsInvalid ? "error.main" : "divider",
                      borderRadius: 2,
                      display: "grid",
                      gap: 1.25,
                      gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) 180px" },
                      p: 1.5,
                    }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography fontWeight={900} noWrap>
                        {getSaleItemSku(saleItem)} · {getSaleItemName(saleItem)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Vendidas: {saleItem.quantity} · disponibles para devolver: {available}
                      </Typography>
                    </Box>

                    <TextField
                      label="Cantidad"
                      type="number"
                      size="small"
                      value={returnQuantities[saleItem.id] ?? ""}
                      disabled={disabled}
                      error={quantityIsInvalid}
                      helperText={disabled ? "Ya fue devuelto" : `Máximo ${available}`}
                      inputProps={{
                        min: 1,
                        max: available,
                        "data-testid": `sales-return-quantity-${saleItem.id}`,
                      }}
                      onChange={(event) => onReturnItemQuantityChange(saleItem.id, event.target.value)}
                    />
                  </Box>
                );
              })
            )}
          </Box>

          <Divider />

          <TextField
            select
            label="Método de devolución"
            value={returnRefundMethod}
            onChange={(event) => onReturnRefundMethodChange(event.target.value as PaymentMethod)}
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            inputProps={{ "data-testid": "sales-return-reason" }}
            label="Motivo de devolución"
            value={returnReason}
            multiline
            minRows={3}
            error={Boolean(returnReason) && returnReason.trim().length < 5}
            helperText="Mínimo 5 caracteres para auditoría."
            onChange={(event) => onReturnReasonChange(event.target.value)}
          />
        </Box>
      </ResponsiveDialog>
    </>
  );
}

import { Alert, Box, Button, MenuItem, TextField } from "@mui/material";

import { ResponsiveDialog } from "../../components/ResponsiveDialog";

import { PAYMENT_METHOD_OPTIONS, getReturnableQuantity, type PaymentMethod, type Sale } from "./salesShared";

type SalesOperationDialogsProps = {
  cancelDialogOpen: boolean;
  cancelReason: string;
  cancelReasonIsInvalid: boolean;
  cancelRefundMethod: PaymentMethod;
  isSubmitting: boolean;
  returnDialogOpen: boolean;
  returnFormIsInvalid: boolean;
  returnQuantity: string;
  returnReason: string;
  returnRefundMethod: PaymentMethod;
  returnSaleItemId: string;
  selectedReturnItemAvailable: number;
  selectedSale: Sale | null;
  onCancelReasonChange: (reason: string) => void;
  onCancelRefundMethodChange: (method: PaymentMethod) => void;
  onCloseCancelDialog: () => void;
  onCloseReturnDialog: () => void;
  onConfirmCancel: () => void;
  onConfirmReturn: () => void;
  onReturnQuantityChange: (quantity: string) => void;
  onReturnReasonChange: (reason: string) => void;
  onReturnRefundMethodChange: (method: PaymentMethod) => void;
  onReturnSaleItemChange: (saleItemId: string) => void;
};

export function SalesOperationDialogs({
  cancelDialogOpen,
  cancelReason,
  cancelReasonIsInvalid,
  cancelRefundMethod,
  isSubmitting,
  returnDialogOpen,
  returnFormIsInvalid,
  returnQuantity,
  returnReason,
  returnRefundMethod,
  returnSaleItemId,
  selectedReturnItemAvailable,
  selectedSale,
  onCancelReasonChange,
  onCancelRefundMethodChange,
  onCloseCancelDialog,
  onCloseReturnDialog,
  onConfirmCancel,
  onConfirmReturn,
  onReturnQuantityChange,
  onReturnReasonChange,
  onReturnRefundMethodChange,
  onReturnSaleItemChange,
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
        maxWidth="sm"
        title={`Registrar devolución ${selectedSale?.folio ?? ""}`.trim()}
        description="Devuelve unidades vendidas y registra el motivo para auditoría."
        actions={
          <>
            <Button variant="outlined" onClick={onCloseReturnDialog} disabled={isSubmitting}>
              Cerrar
            </Button>
            <Button color="warning" onClick={onConfirmReturn} disabled={isSubmitting || returnFormIsInvalid}>
              Registrar devolución
            </Button>
          </>
        }
      >
        <Box sx={{ display: "grid", gap: 2 }}>
          <Alert severity="info">La devolución restaura stock y actualiza el estado de la venta.</Alert>

          <TextField
            select
            label="Producto vendido"
            value={returnSaleItemId}
            onChange={(event) => onReturnSaleItemChange(event.target.value)}
          >
            {(selectedSale?.items ?? []).map((item) => {
              const available = selectedSale ? getReturnableQuantity(selectedSale, item) : 0;

              return (
                <MenuItem key={item.id} value={item.id} disabled={available <= 0}>
                  {item.product?.sku ?? item.productId} · {item.product?.name ?? "Producto"} · disponible{" "}
                  {available}
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            label="Cantidad a devolver"
            type="number"
            value={returnQuantity}
            inputProps={{ min: 1, max: selectedReturnItemAvailable }}
            helperText={`Disponible para devolver: ${selectedReturnItemAvailable}`}
            onChange={(event) => onReturnQuantityChange(event.target.value)}
          />

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

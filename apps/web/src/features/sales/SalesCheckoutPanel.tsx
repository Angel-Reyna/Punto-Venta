import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";

import {
  formatMoney,
  PAYMENT_METHOD_OPTIONS,
  type PaymentMethod,
} from "./salesShared";

export type SalesCheckoutPanelProps = {
  cartItemsCount: number;
  cartLinesCount: number;
  change: number;
  checkoutDisabledReason: string;
  customerName: string;
  isCheckoutDisabled: boolean;
  isPaymentInsufficient: boolean;
  normalizedPaid: number;
  paidAmount: string;
  paymentMethod: PaymentMethod;
  total: number;
  onCheckout: () => void;
  onCustomerNameChange: (value: string) => void;
  onPaidAmountChange: (value: string) => void;
  onPaymentMethodChange: (value: PaymentMethod) => void;
};

export function SalesCheckoutPanel({
  cartItemsCount,
  cartLinesCount,
  change,
  checkoutDisabledReason,
  customerName,
  isCheckoutDisabled,
  isPaymentInsufficient,
  normalizedPaid,
  paidAmount,
  paymentMethod,
  total,
  onCheckout,
  onCustomerNameChange,
  onPaidAmountChange,
  onPaymentMethodChange,
}: SalesCheckoutPanelProps) {
  return (
    <Card variant="outlined" sx={{ boxShadow: "none" }}>
      <CardContent sx={{ display: "grid", gap: 2 }}>
        <Typography variant="h6" fontWeight={900}>
          Orden de venta
        </Typography>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Total vendido
          </Typography>
          <Typography
            variant="h3"
            fontWeight={900}
            color="primary"
            aria-live="polite"
            sx={{ letterSpacing: "-0.04em" }}
          >
            {formatMoney(total)}
          </Typography>
        </Box>

        <Divider />

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 1,
          }}
        >
          <Typography color="text.secondary">Artículos</Typography>
          <Typography fontWeight={800}>{cartItemsCount}</Typography>
          <Typography color="text.secondary">Partidas</Typography>
          <Typography fontWeight={800}>{cartLinesCount}</Typography>
          <Typography color="text.secondary">Cambio estimado</Typography>
          <Typography fontWeight={800}>{formatMoney(change)}</Typography>
        </Box>

        <TextField
          label="Cliente opcional"
          value={customerName}
          helperText="Déjalo vacío para público general."
          onChange={(event) => onCustomerNameChange(event.target.value)}
        />

        <TextField
          select
          label="Método de pago"
          value={paymentMethod}
          onChange={(event) => onPaymentMethodChange(event.target.value as PaymentMethod)}
        >
          {PAYMENT_METHOD_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>

        <TextField
          label="Pago con"
          type="number"
          value={paidAmount}
          inputProps={{
            "data-testid": "sales-paid-amount",
            min: 0,
            step: 0.01,
          }}
          error={isPaymentInsufficient}
          helperText={
            isPaymentInsufficient
              ? `Pago insuficiente. Falta ${formatMoney(total - normalizedPaid)}.`
              : "Debe cubrir el total para poder cobrar. El cambio se calcula arriba."
          }
          onChange={(event) => onPaidAmountChange(event.target.value)}
        />

        <Box>
          <Button
            color="success"
            size="large"
            fullWidth
            onClick={onCheckout}
            disabled={isCheckoutDisabled}
            title={isCheckoutDisabled ? checkoutDisabledReason : "Registrar venta"}
            data-testid="sales-checkout-button"
            sx={{ minHeight: 58, fontSize: "1rem" }}
          >
            F12 · Cobrar venta
          </Button>
          <ActionDisabledReason message={isCheckoutDisabled ? checkoutDisabledReason : ""} />
        </Box>
      </CardContent>
    </Card>
  );
}

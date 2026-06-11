import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import LocalAtmIcon from "@mui/icons-material/LocalAtm";
import PaymentsIcon from "@mui/icons-material/Payments";

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
  const paymentIsCovered = cartItemsCount > 0 && !isPaymentInsufficient;

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        boxShadow: "none",
        borderRadius: 3,
        borderColor: isPaymentInsufficient ? "warning.main" : "divider",
        background:
          theme.palette.mode === "dark"
            ? "linear-gradient(145deg, rgba(34,197,94,0.12), rgba(15,23,42,0.88))"
            : "linear-gradient(145deg, rgba(34,197,94,0.10), rgba(255,255,255,0.92))",
      })}
    >
      <CardContent sx={{ display: "grid", gap: 1.5, p: { xs: 1.25, sm: 1.5 } }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography
              variant="overline"
              color="success.main"
              fontWeight={900}
            >
              Cobro
            </Typography>
            <Typography variant="h6" fontWeight={900} letterSpacing="-0.025em">
              Cobrar
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Orden de venta
            </Typography>
          </Box>

          {paymentIsCovered && (
            <Box
              sx={{
                display: "inline-flex",
                alignItems: "center",
                gap: 0.75,
                borderRadius: 999,
                px: 1.15,
                py: 0.45,
                bgcolor: "success.main",
                color: "success.contrastText",
                fontSize: 12,
                fontWeight: 900,
              }}
            >
              <CheckCircleIcon sx={{ fontSize: 16 }} />
              Pago suficiente
            </Box>
          )}
        </Stack>

        <Box>
          <Typography variant="caption" color="text.secondary">
            Total a cobrar
          </Typography>
          <Typography
            variant="h3"
            fontWeight={900}
            color="success.main"
            aria-live="polite"
            sx={{ letterSpacing: "-0.04em", lineHeight: 1 }}
          >
            {formatMoney(total)}
          </Typography>
        </Box>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr auto",
            gap: 0.75,
            borderRadius: 2,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: "divider",
            p: 1.15,
          }}
        >
          <Typography color="text.secondary">
            Unidades
          </Typography>
          <Typography fontWeight={800}>{cartItemsCount}</Typography>
          <Typography color="text.secondary">
            Productos
          </Typography>
          <Typography fontWeight={800}>{cartLinesCount}</Typography>
          <Typography color="text.secondary">Pago recibido</Typography>
          <Typography fontWeight={800}>
            {formatMoney(normalizedPaid)}
          </Typography>
        </Box>

        <Divider />

        <Box
          sx={{
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
          }}
        >
          <TextField
            label="Cliente opcional"
            value={customerName}
            helperText="Vacío = público general."
            onChange={(event) => onCustomerNameChange(event.target.value)}
            size="small"
          />

          <TextField
            select
            label="Método de pago"
            value={paymentMethod}
            onChange={(event) =>
              onPaymentMethodChange(event.target.value as PaymentMethod)
            }
            size="small"
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>

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
              : "Debe cubrir el total."
          }
          onChange={(event) => onPaidAmountChange(event.target.value)}
          size="small"
        />

        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 1,
            borderRadius: 2,
            bgcolor: "background.paper",
            border: "1px solid",
            borderColor: change > 0 ? "success.light" : "divider",
            px: 1.25,
            py: 1,
          }}
        >
          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            minWidth={0}
          >
            <LocalAtmIcon color="success" fontSize="small" />
            <Typography fontWeight={900}>Cambio</Typography>
          </Stack>
          <Typography fontWeight={900} color="success.main">
            {formatMoney(change)}
          </Typography>
        </Box>

        <Box>
          <Button
            color="success"
            size="large"
            fullWidth
            startIcon={<PaymentsIcon />}
            variant="contained"
            onClick={onCheckout}
            disabled={isCheckoutDisabled}
            title={
              isCheckoutDisabled ? checkoutDisabledReason : "Registrar venta"
            }
            data-testid="sales-checkout-button"
            sx={{ minHeight: 54, fontSize: "1rem", fontWeight: 900 }}
          >
            F12 · Cobrar venta
          </Button>
          <ActionDisabledReason
            message={isCheckoutDisabled ? checkoutDisabledReason : ""}
          />
        </Box>
      </CardContent>
    </Card>
  );
}

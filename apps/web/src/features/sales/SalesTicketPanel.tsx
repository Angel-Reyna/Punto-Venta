import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import ReceiptLongIcon from "@mui/icons-material/ReceiptLong";

import { formatMoney, type CartRow } from "./salesShared";

export type SalesTicketPanelProps = {
  cartRows: CartRow[];
  cartItemsCount: number;
  isDisabled: boolean;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
};

export function SalesTicketPanel({
  cartRows,
  cartItemsCount,
  isDisabled,
  onQuantityChange,
  onRemoveItem,
}: SalesTicketPanelProps) {
  const ticketTotal = cartRows.reduce((sum, item) => sum + item.total, 0);

  return (
    <Card variant="outlined" sx={{ boxShadow: "none", borderRadius: 3 }}>
      <CardContent
        sx={{ display: "grid", gap: 1.25, p: { xs: 1.25, sm: 1.5 } }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="overline" color="primary" fontWeight={900}>
              Ticket
            </Typography>
            <Typography variant="h6" fontWeight={900} letterSpacing="-0.025em">
              Ticket actual
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Cantidades, stock e importes antes de cobrar.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={0.75}
            alignItems="center"
            flexWrap="wrap"
          >
            <Chip
              size="small"
              color="primary"
              variant="outlined"
              icon={<ReceiptLongIcon />}
              label={`${cartItemsCount} artículo(s) · unidades`}
              sx={{ fontWeight: 800 }}
            />
            <Chip
              size="small"
              variant="outlined"
              icon={<AddShoppingCartIcon />}
              label={`${cartRows.length} partida(s) · productos distintos`}
              sx={{ fontWeight: 800 }}
            />
          </Stack>
        </Stack>

        {cartRows.length === 0 ? (
          <Box
            data-testid="sales-ticket-empty"
            sx={{
              py: 4.5,
              textAlign: "center",
              color: "text.secondary",
              border: "1px dashed #cbd5e1",
              borderRadius: 2.5,
            }}
          >
            Busca o selecciona un producto para iniciar la venta.
          </Box>
        ) : (
          <Box
            data-testid="sales-cart-items"
            sx={{ display: "grid", gap: 0.85 }}
          >
            {cartRows.map((item) => (
              <Card
                key={item.productId}
                variant="outlined"
                sx={{ boxShadow: "none", borderRadius: 2.5 }}
              >
                <CardContent
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "minmax(0, 1fr) 92px auto",
                    },
                    gap: { xs: 1, sm: 1.25 },
                    alignItems: { xs: "stretch", sm: "center" },
                    p: { xs: 1.15, sm: 1.25 },
                    "&:last-child": { pb: { xs: 1.15, sm: 1.25 } },
                  }}
                >
                  <Box sx={{ minWidth: 0 }}>
                    <Stack
                      direction="row"
                      spacing={0.75}
                      alignItems="center"
                      flexWrap="wrap"
                      sx={{ minWidth: 0, mb: 0.25 }}
                    >
                      <Typography fontWeight={900} noWrap>
                        {item.product?.name ?? "Producto"}
                      </Typography>
                      <Chip
                        size="small"
                        variant="outlined"
                        label={item.product?.sku ?? item.productId}
                        sx={{ fontWeight: 800 }}
                      />
                      <Chip
                        size="small"
                        variant="outlined"
                        label={`Stock ${item.product?.stock ?? 0}`}
                      />
                    </Stack>
                    <Typography variant="caption" color="text.secondary" noWrap>
                      {formatMoney(item.unitPrice)} c/u
                    </Typography>
                  </Box>

                  <TextField
                    label="Cantidad"
                    type="number"
                    value={item.quantity}
                    size="small"
                    inputProps={{
                      min: 1,
                      max: item.product?.stock ?? undefined,
                      step: 1,
                    }}
                    disabled={isDisabled}
                    onChange={(event) =>
                      onQuantityChange(
                        item.productId,
                        Number(event.target.value),
                      )
                    }
                  />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: { xs: "1fr auto", sm: "1fr auto" },
                      gap: 1,
                      alignItems: "center",
                    }}
                  >
                    <Box>
                      <Typography variant="caption" color="text.secondary">
                        Importe
                      </Typography>
                      <Typography fontWeight={900}>
                        {formatMoney(item.total)}
                      </Typography>
                    </Box>

                    <IconButton
                      onClick={() => onRemoveItem(item.productId)}
                      disabled={isDisabled}
                      aria-label="Quitar producto"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            ))}
          </Box>
        )}

        <Divider />

        <Stack direction="row" justifyContent="space-between" spacing={1}>
          <Typography color="text.secondary" fontWeight={800}>
            Total del ticket
          </Typography>
          <Typography fontSize={22} fontWeight={900}>
            {formatMoney(ticketTotal)}
          </Typography>
        </Stack>
      </CardContent>
    </Card>
  );
}

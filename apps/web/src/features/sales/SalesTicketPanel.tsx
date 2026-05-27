import { Box, Card, CardContent, Chip, IconButton, Stack, TextField, Typography } from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

import { formatMoney, type CartRow } from "./salesShared";

export type SalesTicketPanelProps = {
  cartRows: CartRow[];
  isDisabled: boolean;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemoveItem: (productId: string) => void;
};

export function SalesTicketPanel({
  cartRows,
  isDisabled,
  onQuantityChange,
  onRemoveItem,
}: SalesTicketPanelProps) {
  return (
    <Box>
      <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
        Ticket actual
      </Typography>

      {cartRows.length === 0 ? (
        <Box
          data-testid="sales-ticket-empty"
          sx={{
            py: 6,
            textAlign: "center",
            color: "text.secondary",
            border: "1px dashed #cbd5e1",
            borderRadius: 2,
          }}
        >
          Escanea o busca un producto para iniciar la venta.
        </Box>
      ) : (
        <Box data-testid="sales-cart-items" sx={{ display: "grid", gap: 1 }}>
          {cartRows.map((item) => (
            <Card key={item.productId} variant="outlined" sx={{ boxShadow: "none" }}>
              <CardContent
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1.5fr) 110px 120px 120px auto",
                  },
                  gap: 1.5,
                  alignItems: { xs: "stretch", md: "center" },
                  p: { xs: 1.5, sm: 2 },
                  "&:last-child": { pb: { xs: 1.5, sm: 2 } },
                }}
              >
                <Box sx={{ minWidth: 0 }}>
                  <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, mb: 0.25 }}>
                    <Typography fontWeight={900} noWrap>
                      {item.product?.name ?? "Producto"}
                    </Typography>
                    <Chip size="small" variant="outlined" label={`Stock ${item.product?.stock ?? 0}`} />
                  </Stack>
                  <Typography variant="caption" color="text.secondary" noWrap>
                    {item.product?.sku ?? item.productId}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Precio
                  </Typography>
                  <Typography fontWeight={800}>{formatMoney(item.unitPrice)}</Typography>
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
                  onChange={(event) => onQuantityChange(item.productId, Number(event.target.value))}
                />

                <Box>
                  <Typography variant="caption" color="text.secondary">
                    Importe
                  </Typography>
                  <Typography fontWeight={900}>{formatMoney(item.total)}</Typography>
                </Box>

                <IconButton
                  onClick={() => onRemoveItem(item.productId)}
                  disabled={isDisabled}
                  aria-label="Quitar producto"
                  sx={{ justifySelf: { xs: "flex-end", md: "center" } }}
                >
                  <DeleteIcon />
                </IconButton>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

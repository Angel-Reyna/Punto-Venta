import { Box, Card, CardContent, Chip, Divider, IconButton, Stack, TextField, Typography } from "@mui/material";

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
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={0.75}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
        sx={{ mb: 1 }}
      >
        <Box>
          <Typography variant="overline" color="primary" fontWeight={900}>
            Paso 2 · Revisar ticket
          </Typography>
          <Typography variant="subtitle2" fontWeight={900}>
            Ticket actual
          </Typography>
        </Box>
        <Chip size="small" variant="outlined" label={`${cartRows.length} partida(s)`} />
      </Stack>

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
          Busca o selecciona un producto para iniciar la venta.
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
                  gap: { xs: 1.25, md: 1.5 },
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

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: { xs: "1fr 1fr", md: "1fr" },
                    gap: { xs: 1.5, md: 0 },
                  }}
                >
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Precio
                    </Typography>
                    <Typography fontWeight={800}>{formatMoney(item.unitPrice)}</Typography>
                  </Box>
                  <Box sx={{ display: { xs: "block", md: "none" } }}>
                    <Typography variant="caption" color="text.secondary">
                      Importe
                    </Typography>
                    <Typography fontWeight={900}>{formatMoney(item.total)}</Typography>
                  </Box>
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

                <Box sx={{ display: { xs: "none", md: "block" } }}>
                  <Typography variant="caption" color="text.secondary">
                    Importe
                  </Typography>
                  <Typography fontWeight={900}>{formatMoney(item.total)}</Typography>
                </Box>

                <Box sx={{ display: "grid", gap: 1 }}>
                  <Divider sx={{ display: { xs: "block", md: "none" } }} />
                  <IconButton
                    onClick={() => onRemoveItem(item.productId)}
                    disabled={isDisabled}
                    aria-label="Quitar producto"
                    sx={{ justifySelf: { xs: "flex-end", md: "center" } }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}
    </Box>
  );
}

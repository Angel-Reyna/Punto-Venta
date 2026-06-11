import type { KeyboardEventHandler, RefObject } from "react";

import { Alert, Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";

import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import SearchIcon from "@mui/icons-material/Search";

import { formatMoney, getProductFinalPrice, type Product } from "./salesShared";

export type SalesProductSearchPanelProps = {
  filteredProducts: Product[];
  productSearch: string;
  requiresAssignedSellerStock: boolean;
  selectedWarehouseCanBeUsed: boolean;
  searchInputRef: RefObject<HTMLInputElement | null>;
  canAddExactSearchMatch: boolean;
  isDisabled: boolean;
  onProductSearchChange: (value: string) => void;
  onProductSearchKeyDown: KeyboardEventHandler<HTMLDivElement>;
  onAddExactSearchMatch: () => void;
  onAddProduct: (productId: string) => void;
};

export function SalesProductSearchPanel({
  filteredProducts,
  productSearch,
  requiresAssignedSellerStock,
  selectedWarehouseCanBeUsed,
  searchInputRef,
  canAddExactSearchMatch,
  isDisabled,
  onProductSearchChange,
  onProductSearchKeyDown,
  onAddExactSearchMatch,
  onAddProduct,
}: SalesProductSearchPanelProps) {
  return (
    <Box
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
        boxShadow: "none",
        display: "grid",
        gap: { xs: 1.25, md: 1.5 },
        p: { xs: 1.25, sm: 1.5 },
      }}
    >
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        alignItems={{ xs: "flex-start", sm: "center" }}
        justifyContent="space-between"
      >
        <Box>
          <Typography variant="overline" color="primary" fontWeight={900}>
            Venta
          </Typography>
          <Typography variant="h6" fontWeight={900} letterSpacing="-0.025em">
            Elegir productos
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 680 }}>
            Toca una tarjeta para agregarla al ticket. Solo aparecen productos con stock en el almacén seleccionado.
          </Typography>
        </Box>

        <Chip
          color="success"
          variant="outlined"
          size="small"
          label={`${filteredProducts.length} visibles`}
          sx={{ fontWeight: 800 }}
        />
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) 170px",
          },
          gap: 1,
        }}
      >
        <TextField
          inputRef={searchInputRef}
          label="F3 · Buscar por SKU o nombre"
          value={productSearch}
          autoFocus
          placeholder="SKU o producto"
          inputProps={{
            "data-testid": "sales-product-search",
          }}
          helperText="Enter agrega solo SKU exacto; en táctil selecciona una tarjeta."
          onKeyDown={onProductSearchKeyDown}
          onChange={(event) => onProductSearchChange(event.target.value)}
          disabled={isDisabled}
          size="small"
          InputProps={{
            startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />,
          }}
        />

        <Button
          startIcon={<AddShoppingCartIcon />}
          onClick={onAddExactSearchMatch}
          disabled={!canAddExactSearchMatch}
          data-testid="sales-add-search-match"
          title={
            canAddExactSearchMatch
              ? "Agregar coincidencia exacta"
              : "Busca por SKU exacto para agregar con Enter."
          }
          sx={{ minHeight: 40 }}
        >
          Enter
        </Button>
      </Box>

      {!selectedWarehouseCanBeUsed && requiresAssignedSellerStock && (
        <Alert severity="info" data-testid="sales-seller-stock-required-alert">
          No tienes un stock físico asignado disponible para vender. Solicita retiro de producto al administrador y vuelve a actualizar la venta cuando sea aprobado.
        </Alert>
      )}

      {selectedWarehouseCanBeUsed && filteredProducts.length === 0 && (
        <Alert severity="info" data-testid="sales-products-empty-alert">
          No hay productos con stock que coincidan con la búsqueda actual en este almacén. Cambia el almacén de salida o limpia la búsqueda.
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            sm: "repeat(4, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
          gap: { xs: 0.65, md: 0.75 },
        }}
      >
        {filteredProducts.map((product) => {
          const finalPrice = getProductFinalPrice(product);
          const canAddProduct = selectedWarehouseCanBeUsed && product.stock > 0 && !isDisabled;

          return (
            <Button
              key={product.id}
              variant="outlined"
              color="inherit"
              onClick={() => {
                if (canAddProduct) {
                  onAddProduct(product.id);
                }
              }}
              disabled={!canAddProduct}
              title="Agregar al ticket"
              sx={(theme) => ({
                minHeight: { xs: 72, md: 76 },
                textAlign: "center",
                alignItems: "center",
                display: "grid",
                gap: 0.35,
                justifyItems: "center",
                p: { xs: 0.7, md: 0.8 },
                borderRadius: 2.5,
                borderColor: product.stock <= 3 ? theme.palette.warning.light : "divider",
                bgcolor:
                  product.stock <= 3
                    ? theme.palette.mode === "dark"
                      ? "rgba(245, 158, 11, 0.12)"
                      : "rgba(245, 158, 11, 0.08)"
                    : "background.paper",
                "&:hover": {
                  bgcolor:
                    product.stock <= 3
                      ? theme.palette.mode === "dark"
                        ? "rgba(245, 158, 11, 0.18)"
                        : "rgba(245, 158, 11, 0.14)"
                      : "action.hover",
                },
              })}
            >
              <Typography
                fontSize={{ xs: 12.2, md: 12.6 }}
                fontWeight={900}
                lineHeight={1.15}
                sx={{
                  display: "-webkit-box",
                  overflow: "hidden",
                  WebkitBoxOrient: "vertical",
                  WebkitLineClamp: 2,
                }}
              >
                {product.name}
              </Typography>

              <Typography variant="caption" color="text.secondary" lineHeight={1} noWrap sx={{ maxWidth: "100%" }}>
                {product.sku}
              </Typography>

              <Stack alignItems="center" spacing={0.1} sx={{ minWidth: 0 }}>
                <Typography fontSize={13.5} fontWeight={900} lineHeight={1.05}>
                  {formatMoney(finalPrice)}
                </Typography>
                <Typography
                  color={product.stock <= 3 ? "warning.main" : "text.secondary"}
                  fontSize={11.3}
                  fontWeight={800}
                  lineHeight={1.1}
                >
                  Disp. {product.stock}
                </Typography>
              </Stack>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

import type { KeyboardEventHandler, RefObject } from "react";

import { Box, Button, Chip, Stack, TextField, Typography } from "@mui/material";

import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import SearchIcon from "@mui/icons-material/Search";

import { formatMoney, getProductFinalPrice, type Product } from "./salesShared";

export type SalesProductSearchPanelProps = {
  filteredProducts: Product[];
  productSearch: string;
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
  searchInputRef,
  canAddExactSearchMatch,
  isDisabled,
  onProductSearchChange,
  onProductSearchKeyDown,
  onAddExactSearchMatch,
  onAddProduct,
}: SalesProductSearchPanelProps) {
  return (
    <Box sx={{ display: "grid", gap: { xs: 1.5, md: 2 } }}>
      <Box>
        <Typography variant="overline" color="primary" fontWeight={900}>
          Paso 1 · Elegir productos
        </Typography>
        <Typography variant="body2" color="text.secondary">
          En celular trabaja como una lista táctil; en PC usa F3, escribe SKU o nombre y selecciona el producto correcto.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) 220px",
          },
          gap: 1.5,
        }}
      >
        <TextField
          inputRef={searchInputRef}
          label="F3 · Buscar por SKU o nombre"
          value={productSearch}
          autoFocus
          placeholder="Escribe SKU o nombre para buscar"
          inputProps={{
            "data-testid": "sales-product-search",
          }}
          helperText="Enter agrega solo SKU exacto; en táctil selecciona una tarjeta."
          onKeyDown={onProductSearchKeyDown}
          onChange={(event) => onProductSearchChange(event.target.value)}
          disabled={isDisabled}
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
          sx={{ minHeight: { xs: 52, md: "auto" } }}
        >
          Enter · Agregar
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: { xs: 1, md: 1.25 },
        }}
      >
        {filteredProducts.map((product) => {
          const finalPrice = getProductFinalPrice(product);

          return (
            <Button
              key={product.id}
              variant="outlined"
              color="inherit"
              onClick={() => onAddProduct(product.id)}
              disabled={isDisabled}
              sx={(theme) => ({
                justifyContent: "space-between",
                minHeight: { xs: 92, md: 104 },
                textAlign: "left",
                alignItems: "stretch",
                display: "grid",
                gap: 0.75,
                p: { xs: 1.25, md: 1.5 },
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
              <Stack spacing={0.5} sx={{ minWidth: 0 }}>
                <Typography
                  fontWeight={900}
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {product.name}
                </Typography>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  sx={{
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    minWidth: 0,
                  }}
                >
                  {product.sku}
                </Typography>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                sx={{ minWidth: 0 }}
              >
                <Typography fontWeight={900}>{formatMoney(finalPrice)}</Typography>
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Stock ${product.stock}`}
                  sx={{
                    maxWidth: "100%",
                    flexShrink: 0,
                    ".MuiChip-label": {
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                    },
                  }}
                />
              </Stack>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

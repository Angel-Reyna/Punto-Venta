import type { KeyboardEventHandler, RefObject } from "react";

import { Box, Button, TextField, Typography } from "@mui/material";

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
    <Box sx={{ display: "grid", gap: 2 }}>
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1fr) 220px",
          },
          gap: 2,
        }}
      >
        <TextField
          inputRef={searchInputRef}
          label="F3 · Buscar por código, SKU o nombre"
          value={productSearch}
          autoFocus
          placeholder="Escanea código de barras o escribe para buscar"
          inputProps={{
            "data-testid": "sales-product-search",
          }}
          helperText="Enter agrega solo SKU o código exacto; para búsquedas parciales selecciona una tarjeta."
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
              : "Busca por SKU o código exacto para agregar con Enter."
          }
        >
          Enter · Agregar
        </Button>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 1,
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
              sx={{
                justifyContent: "space-between",
                minHeight: 78,
                textAlign: "left",
                alignItems: "stretch",
                display: "grid",
                gap: 0.5,
                p: 1.25,
              }}
            >
              <Typography fontWeight={800} noWrap>
                {product.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {product.sku} · stock {product.stock}
              </Typography>
              <Typography fontWeight={800}>{formatMoney(finalPrice)}</Typography>
            </Button>
          );
        })}
      </Box>
    </Box>
  );
}

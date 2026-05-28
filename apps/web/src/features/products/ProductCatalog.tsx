import { ReactNode } from "react";

import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { EmptyStatePanel } from "../../components/data-display";
import { InfoTooltip } from "../../components/InfoTooltip";
import {
  FINAL_PRICE_INFO_TEXT,
  MIN_STOCK_INFO_TEXT,
  PRODUCT_CODE_INFO_TEXT,
  PROMO_INFO_TEXT,
  Product,
  SKU_INFO_TEXT,
  formatCurrency,
  formatPercent,
} from "./productShared";

const MARGIN_INFO_TEXT = "Porcentaje de ganancia estimado entre el costo unitario y el precio de venta.";

type StockChip = {
  color: "error" | "warning" | "success";
  label: string;
};

function getStockChip(product: Product): StockChip {
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.minStock ?? 0);

  if (stock <= 0) {
    return {
      color: "error",
      label: "Sin stock",
    };
  }

  if (minStock > 0 && stock <= minStock) {
    return {
      color: "warning",
      label: "Bajo inventario",
    };
  }

  return {
    color: "success",
    label: "Disponible",
  };
}

type ProductFieldProps = {
  label: string;
  value: ReactNode;
  info?: ReactNode;
  emphasize?: boolean;
};

function ProductField({ label, value, info, emphasize = false }: ProductFieldProps) {
  return (
    <Stack spacing={0.25} sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ fontWeight: 700, letterSpacing: 0.2, lineHeight: 1.3 }}
        >
          {label}
        </Typography>
        {info && <InfoTooltip title={info} ariaLabel={typeof info === "string" ? info : undefined} />}
      </Stack>

      <Typography
        variant="body2"
        sx={{
          fontWeight: emphasize ? 800 : 600,
          minWidth: 0,
          overflowWrap: "anywhere",
        }}
      >
        {value === null || value === undefined || value === "" ? "N/A" : value}
      </Typography>
    </Stack>
  );
}

type ProductActionsProps = {
  canDeleteProducts: boolean;
  canToggleProducts: boolean;
  canUpdateProducts: boolean;
  deletingProductId: string | null;
  onDeleteProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onToggleProduct: (productId: string) => void;
  product: Product;
  togglingProductId: string | null;
};

function ProductActions({
  canDeleteProducts,
  canToggleProducts,
  canUpdateProducts,
  deletingProductId,
  onDeleteProduct,
  onEditProduct,
  onToggleProduct,
  product,
  togglingProductId,
}: ProductActionsProps) {
  const isToggleInProgress = togglingProductId === product.id;
  const isDeleteInProgress = deletingProductId === product.id;
  const hasActions = canUpdateProducts || canToggleProducts || canDeleteProducts;

  if (!hasActions) return null;

  return (
    <Stack
      spacing={1}
      direction={{ xs: "column", sm: "row", md: "column" }}
      alignItems="stretch"
      justifyContent="center"
      sx={{
        borderTop: { xs: 1, md: 0 },
        borderColor: "divider",
        pt: { xs: 1.5, md: 0 },
      }}
    >
      {canUpdateProducts && (
        <Button
          onClick={() => onEditProduct(product)}
          disabled={Boolean(togglingProductId) || Boolean(deletingProductId)}
          title="Editar producto"
          aria-label={`Editar ${product.name}`}
          data-testid={`product-edit-${product.sku}`}
          size="small"
          variant="outlined"
          startIcon={<EditIcon fontSize="small" />}
          sx={{ justifyContent: "flex-start", minWidth: { md: 44 } }}
        >
          Editar
        </Button>
      )}

      {canToggleProducts && (
        <Button
          onClick={() => onToggleProduct(product.id)}
          disabled={Boolean(togglingProductId) || Boolean(deletingProductId)}
          title="Activar/desactivar producto"
          aria-label={`Activar o desactivar ${product.name}`}
          data-testid={`product-toggle-${product.sku}`}
          size="small"
          variant="outlined"
          color={product.isActive === false ? "success" : "inherit"}
          startIcon={<ToggleOffIcon fontSize="small" />}
          sx={{ justifyContent: "flex-start", minWidth: { md: 44 } }}
        >
          {isToggleInProgress ? "Actualizando" : product.isActive === false ? "Activar" : "Desactivar"}
        </Button>
      )}

      {canDeleteProducts && (
        <Button
          onClick={() => onDeleteProduct(product)}
          disabled={Boolean(deletingProductId) || Boolean(togglingProductId)}
          title="Eliminar producto"
          aria-label={`Eliminar ${product.name}`}
          data-testid={`product-delete-${product.sku}`}
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon fontSize="small" />}
          sx={{ justifyContent: "flex-start", minWidth: { md: 44 } }}
        >
          {isDeleteInProgress ? "Eliminando" : "Eliminar"}
        </Button>
      )}
    </Stack>
  );
}

type ProductCatalogItemProps = {
  canDeleteProducts: boolean;
  canToggleProducts: boolean;
  canUpdateProducts: boolean;
  canViewAdminColumns: boolean;
  deletingProductId: string | null;
  onDeleteProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onToggleProduct: (productId: string) => void;
  product: Product;
  togglingProductId: string | null;
};

function ProductCatalogItem({
  canDeleteProducts,
  canToggleProducts,
  canUpdateProducts,
  canViewAdminColumns,
  deletingProductId,
  onDeleteProduct,
  onEditProduct,
  onToggleProduct,
  product,
  togglingProductId,
}: ProductCatalogItemProps) {
  const stockChip = getStockChip(product);
  const hasPromo = Number(product.promoPercent ?? 0) > 0;
  const hasActions = canUpdateProducts || canToggleProducts || canDeleteProducts;

  return (
    <Box
      data-testid={`product-row-${product.sku}`}
      sx={(theme) => ({
        display: "grid",
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          md: hasActions
            ? "minmax(0, 1.6fr) minmax(190px, 0.85fr) minmax(190px, 0.85fr) minmax(130px, auto)"
            : "minmax(0, 1.6fr) minmax(190px, 0.85fr) minmax(190px, 0.85fr)",
        },
        px: { xs: 1.5, sm: 2.5 },
        py: { xs: 1.75, sm: 2.25 },
        borderLeft: 4,
        borderLeftColor: `${stockChip.color}.main`,
        backgroundColor:
          product.isActive === false
            ? alpha(theme.palette.action.disabledBackground, 0.7)
            : "background.paper",
        transition: "background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
        "&:hover": {
          backgroundColor:
            product.isActive === false
              ? alpha(theme.palette.action.disabledBackground, 0.85)
              : "action.hover",
          boxShadow: theme.shadows[1],
          transform: "translateY(-1px)",
        },
      })}
    >
      <Stack spacing={1.25} sx={{ minWidth: 0 }}>
        <Stack spacing={0.5} sx={{ minWidth: 0 }}>
          <Typography variant="subtitle1" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
            {product.name}
          </Typography>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
            <Chip size="small" variant="outlined" label={product.category?.name ?? "Sin categoría"} />
            {canViewAdminColumns && (
              <Chip
                size="small"
                color={product.isActive ? "success" : "default"}
                label={product.isActive ? "Activo" : "Inactivo"}
              />
            )}
          </Stack>
        </Stack>

        {product.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              overflow: "hidden",
              WebkitBoxOrient: "vertical",
              WebkitLineClamp: 2,
            }}
          >
            {product.description}
          </Typography>
        )}

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          <ProductField label="Clave interna/SKU" value={product.sku} info={SKU_INFO_TEXT} />
          <ProductField
            label="Código del producto"
            value={product.barcode || "N/A"}
            info={PRODUCT_CODE_INFO_TEXT}
          />
        </Box>
      </Stack>

      <Stack spacing={1.25}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900, lineHeight: 1 }}>
          Precios
        </Typography>

        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
            },
          }}
        >
          {canViewAdminColumns && <ProductField label="Costo" value={formatCurrency(product.costPrice)} />}
          <ProductField label="Venta" value={formatCurrency(product.salePrice)} />
          <ProductField
            label="Precio final"
            value={formatCurrency(product.finalPrice)}
            info={FINAL_PRICE_INFO_TEXT}
            emphasize
          />
          <ProductField label="Promo %" value={formatPercent(product.promoPercent)} info={PROMO_INFO_TEXT} />
          {canViewAdminColumns && (
            <ProductField
              label="Margen"
              value={formatPercent(product.marginPercent)}
              info={MARGIN_INFO_TEXT}
            />
          )}
        </Box>

        {hasPromo && (
          <Chip
            size="small"
            color="info"
            variant="outlined"
            label={`Promoción aplicada: ${formatPercent(product.promoPercent)}`}
            sx={{ alignSelf: "flex-start" }}
          />
        )}
      </Stack>

      <Stack spacing={1.25}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 900, lineHeight: 1 }}>
          Inventario
        </Typography>

        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
          <Chip size="small" label={`${product.stock} en stock`} color={stockChip.color} variant="outlined" />
          <Chip size="small" label={stockChip.label} color={stockChip.color} />
        </Stack>

        {canViewAdminColumns && (
          <ProductField label="Stock mínimo" value={product.minStock ?? 0} info={MIN_STOCK_INFO_TEXT} />
        )}
      </Stack>

      <ProductActions
        canDeleteProducts={canDeleteProducts}
        canToggleProducts={canToggleProducts}
        canUpdateProducts={canUpdateProducts}
        deletingProductId={deletingProductId}
        onDeleteProduct={onDeleteProduct}
        onEditProduct={onEditProduct}
        onToggleProduct={onToggleProduct}
        product={product}
        togglingProductId={togglingProductId}
      />
    </Box>
  );
}

type ProductCatalogProps = {
  canDeleteProducts: boolean;
  canToggleProducts: boolean;
  canUpdateProducts: boolean;
  canViewAdminColumns: boolean;
  deletingProductId: string | null;
  onDeleteProduct: (product: Product) => void;
  onEditProduct: (product: Product) => void;
  onToggleProduct: (productId: string) => void;
  rows: Product[];
  searchQuery: string;
  togglingProductId: string | null;
};

export function ProductCatalog({
  canDeleteProducts,
  canToggleProducts,
  canUpdateProducts,
  canViewAdminColumns,
  deletingProductId,
  onDeleteProduct,
  onEditProduct,
  onToggleProduct,
  rows,
  searchQuery,
  togglingProductId,
}: ProductCatalogProps) {
  if (rows.length === 0) {
    return (
      <EmptyStatePanel>
        <Stack spacing={1} alignItems="center">
          <Typography variant="h6" fontWeight={800} color="text.primary">
            {searchQuery.trim()
              ? "No hay productos que coincidan con la búsqueda"
              : "No hay productos registrados"}
          </Typography>
          <Typography color="text.secondary">
            {searchQuery.trim()
              ? "Intenta buscar por nombre, clave interna/SKU, código, categoría o descripción."
              : "Crea un producto o importa un archivo Excel para iniciar tu catálogo."}
          </Typography>
        </Stack>
      </EmptyStatePanel>
    );
  }

  return (
    <Card
      sx={(theme) => ({
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.16),
      })}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box
          sx={(theme) => ({
            px: 2.5,
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.08,
            )}, ${alpha(theme.palette.background.paper, 0.94)})`,
          })}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Catálogo de productos
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Vista compacta y responsive; cada fila agrupa identidad, precios e inventario sin depender de
                desplazamiento horizontal.
              </Typography>
            </Box>

            <Chip
              color="primary"
              variant="outlined"
              label={`${rows.length} producto${rows.length === 1 ? "" : "s"}`}
            />
          </Stack>
        </Box>

        <Stack divider={<Divider flexItem />}>
          {rows.map((product) => (
            <ProductCatalogItem
              key={product.id}
              canDeleteProducts={canDeleteProducts}
              canToggleProducts={canToggleProducts}
              canUpdateProducts={canUpdateProducts}
              canViewAdminColumns={canViewAdminColumns}
              deletingProductId={deletingProductId}
              onDeleteProduct={onDeleteProduct}
              onEditProduct={onEditProduct}
              onToggleProduct={onToggleProduct}
              product={product}
              togglingProductId={togglingProductId}
            />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

import { ReactNode } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { EmptyStatePanel } from "../../components/data-display";
import { CategoryInlineLabel } from "./categoryVisuals";
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

const MARGIN_INFO_TEXT =
  "Porcentaje de ganancia estimado entre el costo unitario y el precio de venta.";

type StockChip = {
  color: "error" | "warning" | "success";
  label: string;
  shortLabel: string;
};

function getStockChip(product: Product): StockChip {
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.minStock ?? 0);

  if (stock <= 0) {
    return {
      color: "error",
      label: "Sin stock disponible",
      shortLabel: "Sin stock",
    };
  }

  if (minStock > 0 && stock <= minStock) {
    return {
      color: "warning",
      label: "Necesita reposición",
      shortLabel: "Bajo stock",
    };
  }

  return {
    color: "success",
    label: "Listo para vender",
    shortLabel: "Disponible",
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
          sx={{ fontWeight: 800, letterSpacing: 0.18, lineHeight: 1.25 }}
        >
          {label}
        </Typography>
        {info && (
          <InfoTooltip
            title={info}
            ariaLabel={typeof info === "string" ? info : undefined}
          />
        )}
      </Stack>

      <Typography
        variant="body2"
        sx={{
          fontWeight: emphasize ? 900 : 650,
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
  onToggleProduct: (product: Product) => void;
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

  if (!canUpdateProducts && !canToggleProducts && !canDeleteProducts) return null;

  return (
    <Stack
      aria-label={`Acciones para ${product.name}`}
      direction={{ xs: "column", sm: "row", lg: "column" }}
      spacing={1}
      sx={{ alignItems: "stretch" }}
    >
      {canUpdateProducts && (
        <Button
          title="Editar producto"
          aria-label={`Editar ${product.name}`}
          data-testid={`product-edit-${product.sku}`}
          size="small"
          variant="contained"
          startIcon={<EditIcon fontSize="small" />}
          onClick={() => onEditProduct(product)}
          sx={{ justifyContent: "flex-start" }}
        >
          Editar
        </Button>
      )}

      {canToggleProducts && (
        <Button
          title="Activar/desactivar producto"
          aria-label={`${product.isActive ? "Desactivar" : "Activar"} ${product.name}`}
          data-testid={`product-toggle-${product.sku}`}
          size="small"
          variant="outlined"
          color={product.isActive ? "warning" : "success"}
          startIcon={<ToggleOffIcon fontSize="small" />}
          onClick={() => onToggleProduct(product)}
          disabled={isToggleInProgress}
          sx={{ justifyContent: "flex-start" }}
        >
          {isToggleInProgress
            ? "Guardando"
            : product.isActive
              ? "Desactivar"
              : "Activar"}
        </Button>
      )}

      {canDeleteProducts && (
        <Button
          title="Eliminar producto"
          aria-label={`Eliminar ${product.name}`}
          data-testid={`product-delete-${product.sku}`}
          size="small"
          variant="outlined"
          color="error"
          startIcon={<DeleteIcon fontSize="small" />}
          onClick={() => onDeleteProduct(product)}
          disabled={isDeleteInProgress}
          sx={{ justifyContent: "flex-start" }}
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
  onToggleProduct: (product: Product) => void;
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
        gap: { xs: 1.75, lg: 2.25 },
        gridTemplateColumns: {
          xs: "1fr",
          lg: hasActions
            ? "minmax(0, 1.35fr) minmax(190px, 0.82fr) minmax(160px, 0.68fr) minmax(150px, auto)"
            : "minmax(0, 1.35fr) minmax(190px, 0.82fr) minmax(160px, 0.68fr)",
        },
        p: { xs: 1.75, sm: 2, lg: 2.25 },
        border: 1,
        borderColor:
          product.isActive === false
            ? alpha(theme.palette.text.secondary, 0.16)
            : alpha(theme.palette[stockChip.color].main, 0.28),
        borderRadius: { xs: 3, lg: 0 },
        borderLeft: { xs: 1, lg: 5 },
        borderLeftColor: `${stockChip.color}.main`,
        background:
          product.isActive === false
            ? alpha(theme.palette.action.disabledBackground, 0.65)
            : `linear-gradient(135deg, ${alpha(
                theme.palette[stockChip.color].main,
                0.06,
              )}, ${alpha(theme.palette.background.paper, 0.97)} 40%)`,
        boxShadow: { xs: theme.shadows[1], lg: "none" },
        transition: "background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
        "&:hover": {
          backgroundColor:
            product.isActive === false
              ? alpha(theme.palette.action.disabledBackground, 0.82)
              : "action.hover",
          boxShadow: theme.shadows[2],
          transform: "translateY(-1px)",
        },
      })}
    >
      <Stack spacing={1.4} sx={{ minWidth: 0 }}>
        <Stack spacing={0.75} sx={{ minWidth: 0 }}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="flex-start"
            justifyContent="space-between"
            sx={{ minWidth: 0 }}
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                variant="subtitle1"
                fontWeight={950}
                sx={{ overflowWrap: "anywhere", lineHeight: 1.25 }}
              >
                {product.name}
              </Typography>
              <Box sx={{ mt: 0.5 }}>
                <CategoryInlineLabel label={product.category?.name} />
              </Box>
            </Box>

            <Chip
              size="small"
              color={stockChip.color}
              label={stockChip.shortLabel}
              sx={{ flexShrink: 0, fontWeight: 800 }}
            />
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
            {canViewAdminColumns && (
              <Chip
                size="small"
                color={product.isActive ? "success" : "default"}
                variant={product.isActive ? "filled" : "outlined"}
                label={product.isActive ? "Activo para venta" : "Oculto para venta"}
              />
            )}
            {hasPromo && (
              <Chip
                size="small"
                color="info"
                variant="outlined"
                label={`Promo ${formatPercent(product.promoPercent)}`}
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
            gap: 1.2,
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "1fr",
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
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 950, lineHeight: 1 }}>
            Precio para venta
          </Typography>
          <Typography variant="h6" fontWeight={950} color="primary.main">
            {formatCurrency(product.finalPrice)}
          </Typography>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gap: 1.15,
            gridTemplateColumns: {
              xs: "repeat(2, minmax(0, 1fr))",
              lg: "1fr",
            },
          }}
        >
          <ProductField label="Venta" value={formatCurrency(product.salePrice)} />
          <ProductField
            label="Final"
            value={formatCurrency(product.finalPrice)}
            info={FINAL_PRICE_INFO_TEXT}
            emphasize
          />
          <ProductField label="Promo" value={formatPercent(product.promoPercent)} info={PROMO_INFO_TEXT} />
          {canViewAdminColumns && <ProductField label="Costo" value={formatCurrency(product.costPrice)} />}
          {canViewAdminColumns && (
            <ProductField label="Margen de ganancia" value={formatPercent(product.marginPercent)} info={MARGIN_INFO_TEXT} />
          )}
        </Box>
      </Stack>

      <Stack spacing={1.25}>
        <Typography variant="overline" color="text.secondary" sx={{ fontWeight: 950, lineHeight: 1 }}>
          Inventario
        </Typography>

        <Box
          sx={(theme) => ({
            p: 1.25,
            borderRadius: 2.5,
            border: 1,
            borderColor: alpha(theme.palette[stockChip.color].main, 0.24),
            bgcolor: alpha(theme.palette[stockChip.color].main, 0.07),
          })}
        >
          <Stack spacing={0.8}>
            <Typography variant="h5" fontWeight={950}>
              {product.stock}
            </Typography>
            <Typography variant="body2" fontWeight={800} color={`${stockChip.color}.main`}>
              {stockChip.label}
            </Typography>
            {canViewAdminColumns && (
              <ProductField
                label="Stock mínimo"
                value={product.minStock ?? 0}
                info={MIN_STOCK_INFO_TEXT}
              />
            )}
          </Stack>
        </Box>
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
  onToggleProduct: (product: Product) => void;
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
        <Stack spacing={1} alignItems="center" textAlign="center">
          <Typography variant="h6" fontWeight={850} color="text.primary">
            {searchQuery.trim()
              ? "No hay productos que coincidan con la búsqueda"
              : "No hay productos registrados"}
          </Typography>
          <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
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
            px: { xs: 1.75, sm: 2.25, lg: 2.75 },
            py: { xs: 1.75, sm: 2 },
            borderBottom: 1,
            borderColor: "divider",
            background: `linear-gradient(135deg, ${alpha(
              theme.palette.primary.main,
              0.08,
            )}, ${alpha(theme.palette.background.paper, 0.96)})`,
          })}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={950}>
                Productos encontrados
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Celular muestra tarjetas simples, tablet usa catálogo táctil y PC conserva lectura detallada.
              </Typography>
            </Box>

            <Chip
              color="primary"
              variant="outlined"
              label={`${rows.length} producto${rows.length === 1 ? "" : "s"}`}
            />
          </Stack>
        </Box>

        <Box
          sx={{
            display: "grid",
            gap: { xs: 1.25, lg: 0 },
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "1fr",
            },
            p: { xs: 1.25, sm: 1.5, lg: 0 },
          }}
        >
          {rows.map((product, index) => (
            <Box key={product.id} sx={{ display: "contents" }}>
              <ProductCatalogItem
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
              {index < rows.length - 1 && (
                <Divider
                  flexItem
                  sx={{
                    display: { xs: "none", lg: "block" },
                    gridColumn: "1 / -1",
                  }}
                />
              )}
            </Box>
          ))}
        </Box>
      </CardContent>
    </Card>
  );
}

import { ReactNode } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  IconButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import DeleteIcon from "@mui/icons-material/Delete";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { InfoTooltip } from "../../components/InfoTooltip";

export type Product = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  description?: string | null;

  category?: {
    id: string;
    name: string;
  } | null;

  salePrice: number;
  promoPercent: number;
  finalPrice: number;
  stock: number;

  costPrice?: number;
  marginPercent?: number;
  minStock?: number;
  isActive?: boolean;
};

export type ProductCategory = {
  id: string;
  name: string;
};

export const SKU_INFO_TEXT =
  "SKU es la clave única de inventario del producto; significa Stock Keeping Unit, es decir, una unidad para identificar y controlar existencias.";
export const PRODUCT_CODE_INFO_TEXT =
  "Código físico o comercial del producto. Puede ser código de barras, código del proveedor o un código generado por el sistema.";
export const PROMO_INFO_TEXT =
  "Descuento porcentual aplicado sobre el precio de venta antes de calcular el precio final.";
export const FINAL_PRICE_INFO_TEXT =
  "Precio que pagará el cliente después de aplicar la promoción configurada.";
const MARGIN_INFO_TEXT =
  "Porcentaje de ganancia estimado entre el costo unitario y el precio de venta.";
export const INITIAL_STOCK_INFO_TEXT =
  "Cantidad disponible al crear el producto. Se registra como inventario real en el almacén principal.";
export const MIN_STOCK_INFO_TEXT =
  "Nivel de alerta: cuando el stock llega a este número o queda por debajo, el producto aparece como bajo inventario.";

export const initialForm = {
  categoryId: "",
  sku: "",
  barcode: "",
  name: "",
  description: "",
  costPrice: "",
  salePrice: "",
  promoPercent: "",
  initialStock: "",
  minStock: "",
};

export function safeTrim(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function toNonNegativeNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed) return 0;

  return Number(trimmed);
}

export function isInvalidNonNegativeNumber(value: string) {
  const numberValue = toNonNegativeNumber(value);

  return !Number.isFinite(numberValue) || numberValue < 0;
}

export function isInvalidNonNegativeInteger(value: string) {
  const numberValue = toNonNegativeNumber(value);

  return !Number.isInteger(numberValue) || numberValue < 0;
}

export function generateLocalProductCode() {
  const bytes = new Uint32Array(1);

  globalThis.crypto?.getRandomValues(bytes);

  const randomPart = (bytes[0] || Math.floor(Math.random() * 1_000_000))
    .toString(36)
    .toUpperCase()
    .padStart(6, "0")
    .slice(0, 6);
  const timePart = Date.now().toString(36).toUpperCase().slice(-6);

  return `PV-${timePart}-${randomPart}`;
}

const currencyFormatter = new Intl.NumberFormat("es-MX", {
  currency: "MXN",
  style: "currency",
});

export function formatCurrency(value: unknown) {
  return currencyFormatter.format(Number(value ?? 0));
}

export function formatPercent(value: unknown) {
  return `${Number(value ?? 0).toFixed(2)}%`;
}

function getStockChip(product: Product) {
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.minStock ?? 0);

  if (stock <= 0) {
    return {
      color: "error" as const,
      label: "Sin stock",
    };
  }

  if (minStock > 0 && stock <= minStock) {
    return {
      color: "warning" as const,
      label: "Bajo inventario",
    };
  }

  return {
    color: "success" as const,
    label: "Disponible",
  };
}

type ProductFieldProps = {
  label: string;
  value: ReactNode;
  info?: ReactNode;
  emphasize?: boolean;
};

function ProductField({
  label,
  value,
  info,
  emphasize = false,
}: ProductFieldProps) {
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

type ProductCatalogProps = {
  canDeleteProducts: boolean;
  canToggleProducts: boolean;
  canViewAdminColumns: boolean;
  deletingProductId: string | null;
  onDeleteProduct: (product: Product) => void;
  onToggleProduct: (productId: string) => void;
  rows: Product[];
  searchQuery: string;
  togglingProductId: string | null;
};

export function ProductCatalog({
  canDeleteProducts,
  canToggleProducts,
  canViewAdminColumns,
  deletingProductId,
  onDeleteProduct,
  onToggleProduct,
  rows,
  searchQuery,
  togglingProductId,
}: ProductCatalogProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent>
          <Stack
            spacing={1}
            alignItems="center"
            sx={{ py: 4, textAlign: "center" }}
          >
            <Typography variant="h6" fontWeight={800}>
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
        </CardContent>
      </Card>
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
                Vista compacta y responsive; cada fila agrupa identidad, precios
                e inventario sin depender de desplazamiento horizontal.
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
          {rows.map((product) => {
            const stockChip = getStockChip(product);
            const hasPromo = Number(product.promoPercent ?? 0) > 0;
            const isToggleInProgress = togglingProductId === product.id;
            const isDeleteInProgress = deletingProductId === product.id;

            return (
              <Box
                key={product.id}
                data-testid={`product-row-${product.sku}`}
                sx={(theme) => ({
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md:
                      canToggleProducts || canDeleteProducts
                        ? "minmax(0, 1.6fr) minmax(190px, 0.85fr) minmax(190px, 0.85fr) auto"
                        : "minmax(0, 1.6fr) minmax(190px, 0.85fr) minmax(190px, 0.85fr)",
                  },
                  px: 2.5,
                  py: 2.25,
                  borderLeft: 4,
                  borderLeftColor: `${stockChip.color}.main`,
                  backgroundColor:
                    product.isActive === false
                      ? alpha(theme.palette.action.disabledBackground, 0.7)
                      : "background.paper",
                  transition:
                    "background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
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
                    <Typography
                      variant="subtitle1"
                      fontWeight={900}
                      sx={{ overflowWrap: "anywhere" }}
                    >
                      {product.name}
                    </Typography>

                    <Stack
                      direction="row"
                      spacing={1}
                      useFlexGap
                      flexWrap="wrap"
                      alignItems="center"
                    >
                      <Chip
                        size="small"
                        variant="outlined"
                        label={product.category?.name ?? "Sin categoría"}
                      />
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
                    <ProductField
                      label="Clave interna/SKU"
                      value={product.sku}
                      info={SKU_INFO_TEXT}
                    />
                    <ProductField
                      label="Código del producto"
                      value={product.barcode || "N/A"}
                      info={PRODUCT_CODE_INFO_TEXT}
                    />
                  </Box>
                </Stack>

                <Stack spacing={1.25}>
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 900, lineHeight: 1 }}
                  >
                    Precios
                  </Typography>

                  <Box
                    sx={{
                      display: "grid",
                      gap: 1.25,
                      gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                    }}
                  >
                    {canViewAdminColumns && (
                      <ProductField
                        label="Costo"
                        value={formatCurrency(product.costPrice)}
                      />
                    )}
                    <ProductField
                      label="Venta"
                      value={formatCurrency(product.salePrice)}
                    />
                    <ProductField
                      label="Precio final"
                      value={formatCurrency(product.finalPrice)}
                      info={FINAL_PRICE_INFO_TEXT}
                      emphasize
                    />
                    <ProductField
                      label="Promo %"
                      value={formatPercent(product.promoPercent)}
                      info={PROMO_INFO_TEXT}
                    />
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
                  <Typography
                    variant="overline"
                    color="text.secondary"
                    sx={{ fontWeight: 900, lineHeight: 1 }}
                  >
                    Inventario
                  </Typography>

                  <Stack
                    direction="row"
                    spacing={1}
                    useFlexGap
                    flexWrap="wrap"
                    alignItems="center"
                  >
                    <Chip
                      size="small"
                      label={`${product.stock} en stock`}
                      color={stockChip.color}
                      variant="outlined"
                    />
                    <Chip
                      size="small"
                      label={stockChip.label}
                      color={stockChip.color}
                    />
                  </Stack>

                  {canViewAdminColumns && (
                    <ProductField
                      label="Stock mínimo"
                      value={product.minStock ?? 0}
                      info={MIN_STOCK_INFO_TEXT}
                    />
                  )}
                </Stack>

                {(canToggleProducts || canDeleteProducts) && (
                  <Stack
                    spacing={1}
                    alignItems={{ xs: "stretch", md: "flex-end" }}
                    justifyContent="center"
                  >
                    {canToggleProducts && (
                      <IconButton
                        onClick={() => onToggleProduct(product.id)}
                        disabled={
                          Boolean(togglingProductId) ||
                          Boolean(deletingProductId)
                        }
                        title="Activar/desactivar producto"
                        aria-label={`Activar o desactivar ${product.name}`}
                        data-testid={`product-toggle-${product.sku}`}
                        sx={{
                          border: 1,
                          borderColor: "divider",
                          borderRadius: 2,
                        }}
                      >
                        <ToggleOffIcon
                          color={isToggleInProgress ? "disabled" : "action"}
                        />
                      </IconButton>
                    )}

                    {canDeleteProducts && (
                      <IconButton
                        onClick={() => onDeleteProduct(product)}
                        disabled={
                          Boolean(deletingProductId) ||
                          Boolean(togglingProductId)
                        }
                        title="Eliminar producto"
                        aria-label={`Eliminar ${product.name}`}
                        data-testid={`product-delete-${product.sku}`}
                        sx={{
                          border: 1,
                          borderColor: "error.light",
                          borderRadius: 2,
                        }}
                      >
                        <DeleteIcon
                          color={isDeleteInProgress ? "disabled" : "error"}
                        />
                      </IconButton>
                    )}
                  </Stack>
                )}
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

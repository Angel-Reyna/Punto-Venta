import { ReactNode, useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Pagination,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import FilterListIcon from "@mui/icons-material/FilterList";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalOfferIcon from "@mui/icons-material/LocalOffer";
import QrCode2Icon from "@mui/icons-material/QrCode2";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";

import { EmptyStatePanel } from "../../components/data-display";
import { InfoTooltip } from "../../components/InfoTooltip";
import { CategoryPill } from "./categoryVisuals";
import {
  PRODUCT_FILTER_OPTIONS,
  PRODUCT_SORT_OPTIONS,
  type ProductFilterOption,
  type ProductSortOption,
} from "./ProductCatalogToolbar";
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

const PRODUCT_PAGE_SIZE_OPTIONS = [5, 10, 25] as const;

type ProductTone = "error" | "warning" | "success" | "secondary";

type StockChip = {
  color: ProductTone;
  label: string;
  shortLabel: string;
};

function formatNumber(value: unknown) {
  return new Intl.NumberFormat("es-MX").format(Number(value ?? 0));
}

function getStockChip(product: Product): StockChip {
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.minStock ?? 0);

  if (product.isActive === false) {
    return {
      color: "secondary",
      label: "Producto inactivo",
      shortLabel: "Inactivo",
    };
  }

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

function getStockProgress(product: Product) {
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.minStock ?? 0);

  if (stock <= 0) return 0;

  return Math.min(100, Math.round((stock / Math.max(minStock * 2, 1)) * 100));
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
    <Box sx={{ minWidth: 0 }}>
      <Stack direction="row" spacing={0.5} alignItems="center">
        <Typography
          color="text.secondary"
          fontSize={11.5}
          fontWeight={850}
          lineHeight={1.25}
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
        fontSize={13.5}
        fontWeight={emphasize ? 950 : 850}
        sx={{ minWidth: 0, overflowWrap: "anywhere" }}
      >
        {value === null || value === undefined || value === "" ? "N/A" : value}
      </Typography>
    </Box>
  );
}

function ProductIconTile({ tone }: { tone: ProductTone }) {
  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        background: `radial-gradient(circle at 30% 20%, ${alpha(
          theme.palette[tone].main,
          0.28,
        )}, ${alpha(theme.palette[tone].main, 0.08)} 68%)`,
        border: 1,
        borderColor: alpha(theme.palette[tone].main, 0.28),
        borderRadius: 3.25,
        color: theme.palette[tone].main,
        display: "grid",
        flex: "0 0 58px",
        height: 58,
        placeItems: "center",
        width: 58,
      })}
    >
      <Inventory2Icon sx={{ fontSize: 32 }} />
    </Box>
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
  const buttonSx = {
    borderRadius: 2.25,
    fontSize: 12.5,
    fontWeight: 900,
    justifyContent: "flex-start",
    minHeight: 34,
  } as const;

  if (!canUpdateProducts && !canToggleProducts && !canDeleteProducts)
    return null;

  return (
    <Stack
      aria-label={`Acciones para ${product.name}`}
      spacing={0.7}
      sx={{ alignItems: "stretch" }}
    >
      <Typography
        color="text.secondary"
        fontSize={10.5}
        fontWeight={900}
        letterSpacing="0.08em"
        textTransform="uppercase"
      >
        Acciones admin
      </Typography>

      {canUpdateProducts && (
        <Button
          title="Editar producto"
          aria-label={`Editar ${product.name}`}
          data-testid={`product-edit-${product.sku}`}
          size="small"
          variant="contained"
          startIcon={<EditIcon fontSize="small" />}
          onClick={() => onEditProduct(product)}
          sx={buttonSx}
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
          sx={buttonSx}
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
          sx={buttonSx}
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

function ProductIdentity({
  canViewAdminColumns,
  product,
  stockChip,
}: {
  canViewAdminColumns: boolean;
  product: Product;
  stockChip: StockChip;
}) {
  const hasPromo = Number(product.promoPercent ?? 0) > 0;

  return (
    <Stack direction="row" minWidth={0} spacing={1.25}>
      <ProductIconTile tone={stockChip.color} />
      <Stack minWidth={0} spacing={0.7}>
        <Stack alignItems="center" direction="row" flexWrap="wrap" gap={0.75}>
          <Typography
            fontWeight={950}
            sx={{ lineHeight: 1.25, overflowWrap: "anywhere" }}
          >
            {product.name}
          </Typography>
          {canViewAdminColumns && (
            <Chip
              color={product.isActive ? "success" : "default"}
              label={product.isActive ? "Activo" : "Inactivo"}
              size="small"
              sx={{ fontWeight: 850 }}
            />
          )}
          <Chip
            color={stockChip.color}
            label={stockChip.shortLabel}
            size="small"
            variant="outlined"
            sx={{ fontWeight: 850 }}
          />
          {hasPromo && (
            <Chip
              color="info"
              label={`Promo ${formatPercent(product.promoPercent)}`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 850 }}
            />
          )}
        </Stack>

        {product.description && (
          <Typography
            color="text.secondary"
            fontSize={12.5}
            lineHeight={1.35}
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

        <CategoryPill label={product.category?.name} />
      </Stack>
    </Stack>
  );
}

function ProductCodeBlock({ product }: { product: Product }) {
  return (
    <Stack spacing={0.75}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <QrCode2Icon color="primary" fontSize="small" />
        <Typography
          color="text.secondary"
          fontSize={10.5}
          fontWeight={900}
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Identificación
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gap: 0.7 }}>
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
  );
}

function ProductPriceBlock({
  canViewAdminColumns,
  product,
}: {
  canViewAdminColumns: boolean;
  product: Product;
}) {
  const hasPromo = Number(product.promoPercent ?? 0) > 0;

  return (
    <Stack spacing={0.8}>
      <Stack direction="row" spacing={0.75} alignItems="center">
        <LocalOfferIcon color="primary" fontSize="small" />
        <Typography
          color="text.secondary"
          fontSize={10.5}
          fontWeight={900}
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Precio y margen
        </Typography>
      </Stack>

      <Box sx={{ display: "grid", gap: 0.7, gridTemplateColumns: "1fr 1fr" }}>
        {canViewAdminColumns && (
          <ProductField
            label="Costo"
            value={formatCurrency(product.costPrice)}
          />
        )}
        <ProductField label="Venta" value={formatCurrency(product.salePrice)} />
        <ProductField
          label="Final"
          value={formatCurrency(product.finalPrice)}
          info={FINAL_PRICE_INFO_TEXT}
          emphasize
        />
        {canViewAdminColumns && (
          <ProductField
            label="Margen"
            value={formatPercent(product.marginPercent)}
            info={MARGIN_INFO_TEXT}
          />
        )}
      </Box>

      {hasPromo ? (
        <Chip
          color="info"
          label={`${formatPercent(product.promoPercent)} de promoción`}
          size="small"
          sx={{ alignSelf: "flex-start", fontWeight: 850 }}
        />
      ) : null}
      {!hasPromo && (
        <ProductField
          label="Promo"
          value={formatPercent(product.promoPercent)}
          info={PROMO_INFO_TEXT}
        />
      )}
    </Stack>
  );
}

function ProductStockBlock({
  canViewAdminColumns,
  product,
  stockChip,
}: {
  canViewAdminColumns: boolean;
  product: Product;
  stockChip: StockChip;
}) {
  const stock = Number(product.stock ?? 0);
  const minStock = Number(product.minStock ?? 0);
  const delta = stock - minStock;

  return (
    <Box
      sx={(theme) => ({
        backgroundColor: alpha(theme.palette[stockChip.color].main, 0.08),
        border: 1,
        borderColor: alpha(theme.palette[stockChip.color].main, 0.22),
        borderRadius: 3,
        display: "flex",
        alignItems: "center",
        height: "100%",
        p: 1.15,
      })}
    >
      <Stack spacing={0.9} sx={{ width: "100%" }}>
        <Stack
          alignItems="center"
          direction="row"
          justifyContent="space-between"
          spacing={1}
        >
          <Typography
            color="text.secondary"
            fontSize={10.5}
            fontWeight={900}
            letterSpacing="0.08em"
            textTransform="uppercase"
            sx={{ pl: { xs: 1.05, sm: 1.4 } }}
          >
            Stock actual/mínimo
          </Typography>
          <Typography
            color={`${stockChip.color}.main`}
            fontSize={12.5}
            fontWeight={950}
            sx={{ transform: "translateX(-6px)" }}
          >
            {stockChip.label}
          </Typography>
        </Stack>

        <Stack
          alignItems="center"
          direction="row"
          spacing={1}
          sx={{ pl: { xs: 1.05, sm: 1.4 } }}
        >
          <Typography
            color={`${stockChip.color}.main`}
            fontSize={34}
            fontWeight={950}
            lineHeight={1}
          >
            {formatNumber(stock)}
          </Typography>
          <Typography
            color="text.secondary"
            fontSize={12.5}
            fontWeight={850}
            lineHeight={1.1}
          >
            mínimo {formatNumber(minStock)}
          </Typography>
        </Stack>

        <LinearProgress
          color={stockChip.color}
          value={getStockProgress(product)}
          variant="determinate"
          sx={{ borderRadius: 999, height: 7 }}
        />

        {canViewAdminColumns ? (
          <Stack spacing={0.4} sx={{ pl: { xs: 1.05, sm: 1.4 } }}>
            <Typography color="text.secondary" fontSize={12.25}>
              {delta >= 0
                ? `+${formatNumber(delta)} sobre el mínimo`
                : `Faltan ${formatNumber(Math.abs(delta))} unidades`}
            </Typography>
            <ProductField
              label="Stock mínimo"
              value={product.minStock ?? 0}
              info={MIN_STOCK_INFO_TEXT}
            />
          </Stack>
        ) : (
          <Typography
            color="text.secondary"
            fontSize={12.25}
            sx={{ pl: { xs: 1.05, sm: 1.4 } }}
          >
            {stockChip.shortLabel}
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

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
  const hasActions =
    canUpdateProducts || canToggleProducts || canDeleteProducts;

  return (
    <Box
      data-testid={`product-row-${product.sku}`}
      sx={(theme) => ({
        background:
          product.isActive === false
            ? alpha(theme.palette.action.disabledBackground, 0.62)
            : `linear-gradient(135deg, ${alpha(
                theme.palette[stockChip.color].main,
                0.08,
              )}, ${alpha(theme.palette.background.paper, 0.84)} 44%)`,
        border: 1,
        borderColor: alpha(
          theme.palette[stockChip.color].main,
          product.isActive === false ? 0.14 : 0.26,
        ),
        borderLeft: 5,
        borderLeftColor: theme.palette[stockChip.color].main,
        borderRadius: 3.5,
        display: "grid",
        gap: 1.35,
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1.25fr) minmax(170px, 0.7fr) minmax(190px, 0.75fr)",
          xl: hasActions
            ? "minmax(0, 1.3fr) minmax(180px, 0.64fr) minmax(220px, 0.74fr) minmax(220px, 0.76fr) 126px"
            : "minmax(0, 1.3fr) minmax(180px, 0.64fr) minmax(220px, 0.74fr) minmax(220px, 0.76fr)",
        },
        p: 1.35,
        transition:
          "background-color 120ms ease, box-shadow 120ms ease, transform 120ms ease",
        "&:hover": {
          boxShadow: theme.shadows[2],
          transform: "translateY(-1px)",
        },
      })}
    >
      <ProductIdentity
        canViewAdminColumns={canViewAdminColumns}
        product={product}
        stockChip={stockChip}
      />
      <ProductCodeBlock product={product} />
      <ProductPriceBlock
        canViewAdminColumns={canViewAdminColumns}
        product={product}
      />
      <ProductStockBlock
        canViewAdminColumns={canViewAdminColumns}
        product={product}
        stockChip={stockChip}
      />
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
  onFilterChange: (filter: ProductFilterOption) => void;
  onSearchQueryChange: (query: string) => void;
  onSortChange: (sort: ProductSortOption) => void;
  onToggleProduct: (product: Product) => void;
  productSearchHelper: string;
  resultCount: number;
  rows: Product[];
  searchQuery: string;
  selectedFilter: ProductFilterOption;
  selectedSort: ProductSortOption;
  togglingProductId: string | null;
  totalCount: number;
};

function getProductFilterColor(
  filter: ProductFilterOption,
): "default" | "success" | "warning" | "error" | "info" {
  if (filter === "Activos") return "success";
  if (filter === "Bajo stock") return "warning";
  if (filter === "Sin stock") return "error";
  if (filter === "Con promoción") return "info";

  return "default";
}

function ProductCatalogControls({
  onFilterChange,
  onSearchQueryChange,
  onSortChange,
  pageSize,
  productSearchHelper,
  searchQuery,
  selectedFilter,
  selectedSort,
  setPageSize,
}: {
  onFilterChange: (filter: ProductFilterOption) => void;
  onSearchQueryChange: (query: string) => void;
  onSortChange: (sort: ProductSortOption) => void;
  pageSize: number;
  productSearchHelper: string;
  searchQuery: string;
  selectedFilter: ProductFilterOption;
  selectedSort: ProductSortOption;
  setPageSize: (pageSize: number) => void;
}) {
  const [showProductFilters, setShowProductFilters] = useState(
    selectedFilter !== "Todos",
  );
  const selectedSortLabel =
    PRODUCT_SORT_OPTIONS.find((option) => option.value === selectedSort)
      ?.label ?? "Nombre A-Z";
  const selectedFilterLabel =
    selectedFilter === "Todos" ? "Todos los productos" : selectedFilter;

  useEffect(() => {
    if (selectedFilter !== "Todos") {
      setShowProductFilters(true);
    }
  }, [selectedFilter]);

  function cycleProductSort() {
    const currentIndex = PRODUCT_SORT_OPTIONS.findIndex(
      (option) => option.value === selectedSort,
    );
    const nextOption =
      PRODUCT_SORT_OPTIONS[
        (Math.max(currentIndex, 0) + 1) % PRODUCT_SORT_OPTIONS.length
      ];

    onSortChange(nextOption.value);
  }

  function toggleProductFilters() {
    setShowProductFilters((current) => {
      if (current) {
        onFilterChange("Todos");
      }

      return !current;
    });
  }

  const controlButtonSx = {
    borderRadius: 2.5,
    flexShrink: 0,
    fontWeight: 900,
    minHeight: 40,
    px: 1.35,
    whiteSpace: "nowrap",
  } as const;

  return (
    <Stack spacing={0.85}>
      <Box
        sx={{
          alignItems: "center",
          display: "grid",
          gap: 1,
          gridTemplateColumns: {
            xs: "1fr",
            lg: "minmax(280px, 1fr) auto auto auto",
          },
        }}
      >
        <TextField
          fullWidth
          label="Buscar productos"
          placeholder="SKU, nombre o código"
          size="small"
          value={searchQuery}
          onChange={(event) => onSearchQueryChange(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="primary" fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        <TextField
          select
          size="small"
          label="Por página"
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value))}
          sx={{
            minWidth: 118,
            "& .MuiSelect-select": {
              pr: "30px !important",
            },
          }}
        >
          {PRODUCT_PAGE_SIZE_OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option} productos
            </MenuItem>
          ))}
        </TextField>

        <Button
          aria-label={`Ordenar productos. Orden actual: ${selectedSortLabel}`}
          data-testid="products-sort-button"
          onClick={cycleProductSort}
          startIcon={<SortIcon />}
          sx={controlButtonSx}
          title={`Orden actual: ${selectedSortLabel}`}
          variant="outlined"
        >
          Ordenar: {selectedSortLabel}
        </Button>

        <Button
          aria-controls="products-inline-filters"
          aria-expanded={showProductFilters}
          aria-label={`Filtros de productos. Filtro actual: ${selectedFilterLabel}`}
          data-testid="products-filter-button"
          onClick={toggleProductFilters}
          startIcon={<FilterListIcon />}
          sx={controlButtonSx}
          title={`Filtro actual: ${selectedFilterLabel}`}
          variant={showProductFilters ? "contained" : "outlined"}
        >
          Filtros
        </Button>
      </Box>

      {showProductFilters && (
        <Box
          id="products-inline-filters"
          sx={(theme) => ({
            border: 1,
            borderColor: alpha(theme.palette.primary.main, 0.12),
            borderRadius: 2.5,
            bgcolor: alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.045 : 0.026,
            ),
            px: { xs: 1.25, sm: 1.5 },
            py: 1.15,
          })}
        >
          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            alignItems="center"
          >
            <Typography
              variant="body2"
              color="text.secondary"
              fontWeight={900}
              sx={{ mr: 0.5 }}
            >
              Mostrar:
            </Typography>
            {PRODUCT_FILTER_OPTIONS.map((filter) => (
              <Chip
                key={filter}
                clickable
                color={getProductFilterColor(filter)}
                variant={selectedFilter === filter ? "filled" : "outlined"}
                label={filter === "Todos" ? "Todos los productos" : filter}
                onClick={() => onFilterChange(filter)}
                sx={{ fontWeight: 900 }}
              />
            ))}
          </Stack>
        </Box>
      )}

      {productSearchHelper && (
        <Typography color="text.secondary" variant="caption">
          {productSearchHelper}
        </Typography>
      )}
    </Stack>
  );
}

export function ProductCatalog({
  canDeleteProducts,
  canToggleProducts,
  canUpdateProducts,
  canViewAdminColumns,
  deletingProductId,
  onDeleteProduct,
  onEditProduct,
  onFilterChange,
  onSearchQueryChange,
  onSortChange,
  onToggleProduct,
  productSearchHelper,
  resultCount,
  rows,
  searchQuery,
  selectedFilter,
  selectedSort,
  togglingProductId,
  totalCount,
}: ProductCatalogProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(5);
  const hasActiveSearchOrFilter =
    Boolean(searchQuery.trim()) || selectedFilter !== "Todos";
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));

  useEffect(() => {
    setPage(1);
  }, [pageSize, searchQuery, selectedFilter, selectedSort]);

  useEffect(() => {
    setPage((currentPage) => Math.min(currentPage, pageCount));
  }, [pageCount]);

  const visibleRows = useMemo(() => {
    const start = (page - 1) * pageSize;

    return rows.slice(start, start + pageSize);
  }, [page, pageSize, rows]);

  const fromItem = rows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const toItem = rows.length === 0 ? 0 : Math.min(page * pageSize, rows.length);

  return (
    <Card
      sx={(theme) => ({
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.16),
        borderRadius: 4,
      })}
    >
      <CardContent sx={{ p: { xs: 1.4, sm: 1.6, lg: 1.8 } }}>
        <Stack spacing={1.6}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.25}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography
                color="primary.main"
                fontWeight={850}
                letterSpacing="0.08em"
                textTransform="uppercase"
                variant="caption"
              >
                Catálogo
              </Typography>
              <Typography
                variant="h5"
                fontWeight={950}
                letterSpacing="-0.025em"
              >
                Productos actuales
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ maxWidth: 900 }}
              >
                Busca, filtra, ordena y revisa el catálogo en una sola vista
                compacta.
              </Typography>
            </Box>

            <Chip
              color={hasActiveSearchOrFilter ? "primary" : "default"}
              variant={hasActiveSearchOrFilter ? "filled" : "outlined"}
              label={`${resultCount} de ${totalCount} producto${totalCount === 1 ? "" : "s"}`}
              sx={{ fontWeight: 850 }}
            />
          </Stack>

          <ProductCatalogControls
            onFilterChange={onFilterChange}
            onSearchQueryChange={onSearchQueryChange}
            onSortChange={onSortChange}
            pageSize={pageSize}
            productSearchHelper={productSearchHelper}
            searchQuery={searchQuery}
            selectedFilter={selectedFilter}
            selectedSort={selectedSort}
            setPageSize={setPageSize}
          />

          {rows.length === 0 ? (
            <EmptyStatePanel>
              <Stack spacing={1} alignItems="center" textAlign="center">
                <Typography variant="h6" fontWeight={850} color="text.primary">
                  {searchQuery.trim() || selectedFilter !== "Todos"
                    ? "No hay productos que coincidan con la búsqueda o filtro"
                    : "No hay productos registrados"}
                </Typography>
                <Typography color="text.secondary" sx={{ maxWidth: 560 }}>
                  {searchQuery.trim() || selectedFilter !== "Todos"
                    ? "Intenta buscar por nombre, clave interna/SKU, código, categoría o descripción, o cambia el filtro rápido."
                    : "Crea un producto o importa un archivo Excel para iniciar tu catálogo."}
                </Typography>
              </Stack>
            </EmptyStatePanel>
          ) : (
            <>
              <Stack spacing={1.05}>
                {visibleRows.map((product) => (
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

              <Stack
                direction={{ xs: "column", sm: "row" }}
                spacing={1}
                alignItems={{ xs: "stretch", sm: "center" }}
                justifyContent="space-between"
              >
                <Typography
                  color="text.secondary"
                  fontSize={12.5}
                  fontWeight={750}
                >
                  Mostrando {fromItem}-{toItem} de {rows.length} producto
                  {rows.length === 1 ? "" : "s"}
                </Typography>
                <Pagination
                  color="primary"
                  count={pageCount}
                  page={page}
                  onChange={(_, nextPage) => setPage(nextPage)}
                  shape="rounded"
                  size="small"
                  sx={{ alignSelf: { xs: "center", sm: "auto" } }}
                />
              </Stack>
            </>
          )}
        </Stack>
      </CardContent>
    </Card>
  );
}

import { useState } from "react";

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
import { alpha, type Theme } from "@mui/material/styles";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import FilterListIcon from "@mui/icons-material/FilterList";
import GridViewIcon from "@mui/icons-material/GridView";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import SortIcon from "@mui/icons-material/Sort";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { EmptyStatePanel } from "../../components/data-display";
import { SearchToolbar } from "../../components/SearchToolbar";
import { CategoryPill } from "../products/categoryVisuals";
import type { StockItem, StockStatusFilter } from "./inventoryShared";
import {
  STOCK_FILTER_LABELS,
  filterStockRowsByStatus,
  getInventoryStockSummary,
  getStockStatus,
} from "./inventoryShared";

export function InventoryStockSection({
  rows,
  searchQuery,
  onSearchChange,
}: {
  rows: StockItem[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>("all");
  const filteredRows = filterStockRowsByStatus(rows, statusFilter);

  return (
    <>
      <SearchToolbar
        label="Buscar existencias"
        placeholder="Ej. COCA-600, refresco, 750..., bebidas"
        query={searchQuery}
        onQueryChange={onSearchChange}
        resultCount={filteredRows.length}
        helperText="Busca productos por nombre, clave interna/SKU, código o categoría para revisar su stock real."
      />

      <InventoryStockHealthPanel
        rows={rows}
        value={statusFilter}
        onChange={setStatusFilter}
      />

      <InventoryStockOverview
        rows={filteredRows}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
      />
    </>
  );
}

function InventoryStockHealthPanel({
  rows,
  value,
  onChange,
}: {
  rows: StockItem[];
  value: StockStatusFilter;
  onChange: (value: StockStatusFilter) => void;
}) {
  const summary = getInventoryStockSummary(rows);
  const hasOutOfStock = summary.outOfStock > 0;
  const hasLowStock = summary.lowStock > 0;
  const tone = hasOutOfStock ? "error" : hasLowStock ? "warning" : "success";
  const StatusIcon = hasOutOfStock
    ? ErrorOutlineIcon
    : hasLowStock
      ? WarningAmberIcon
      : CheckCircleIcon;
  const title = hasOutOfStock || hasLowStock
    ? "Algunos productos requieren atención"
    : "Inventario estable";
  const description = hasOutOfStock
    ? "Hay productos sin unidades. Revisa la distribución por almacén y programa reposición antes de prometer venta."
    : hasLowStock
      ? "Algunos productos están cerca del mínimo. Revisa la distribución por almacén y programa reposición."
      : "No hay alertas críticas visibles. Mantén seguimiento de entradas, salidas e historial.";
  const options: Array<{
    value: StockStatusFilter;
    count: number;
    color: "default" | "success" | "warning" | "error";
  }> = [
    { value: "all", count: summary.total, color: "default" },
    { value: "available", count: summary.available, color: "success" },
    { value: "low", count: summary.lowStock, color: "warning" },
    { value: "out", count: summary.outOfStock, color: "error" },
  ];

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        mb: 2,
        overflow: "hidden",
        borderColor: alpha(theme.palette[tone].main, 0.28),
        background: `linear-gradient(135deg, ${alpha(
          theme.palette[tone].main,
          theme.palette.mode === "dark" ? 0.1 : 0.052,
        )}, transparent 48%), ${alpha(
          theme.palette.background.paper,
          theme.palette.mode === "dark" ? 0.72 : 0.96,
        )}`,
      })}
    >
      <CardContent>
        <Stack spacing={2.2}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ minWidth: 0 }}>
              <Box
                sx={(theme) => ({
                  display: "grid",
                  placeItems: "center",
                  flex: "0 0 auto",
                  width: 48,
                  height: 48,
                  borderRadius: 3,
                  color: theme.palette[tone].contrastText,
                  bgcolor: theme.palette[tone].main,
                  boxShadow: `0 14px 28px ${alpha(theme.palette[tone].main, 0.24)}`,
                })}
              >
                <StatusIcon />
              </Box>

              <Box sx={{ minWidth: 0 }}>
                <Typography
                  variant="caption"
                  color="text.secondary"
                  fontWeight={900}
                  sx={{ display: "block", letterSpacing: 0.4, textTransform: "uppercase" }}
                >
                  Estado de existencias
                </Typography>
                <Typography variant="h6" fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                  {title}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  {description}
                </Typography>
              </Box>
            </Stack>

            <Box
              sx={(theme) => ({
                display: "grid",
                gridTemplateColumns: "auto 1fr",
                gap: 1.15,
                alignItems: "center",
                border: 1,
                borderColor: alpha(theme.palette.info.main, 0.2),
                borderRadius: 3,
                bgcolor: alpha(theme.palette.info.main, theme.palette.mode === "dark" ? 0.08 : 0.045),
                px: { xs: 1.35, sm: 1.5 },
                py: { xs: 1.1, sm: 1.25 },
                minWidth: { md: 260 },
              })}
            >
              <Box
                sx={(theme) => ({
                  display: "grid",
                  placeItems: "center",
                  width: 38,
                  height: 38,
                  borderRadius: 2.25,
                  color: theme.palette.info.main,
                  bgcolor: alpha(theme.palette.info.main, 0.13),
                })}
              >
                <LocalShippingIcon fontSize="small" />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={950} lineHeight={1.05}>
                  {summary.units}
                </Typography>
                <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
                  Unidades totales
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Stock registrado en productos visibles
                </Typography>
              </Box>
            </Box>
          </Stack>

          <Box
            sx={(theme) => ({
              display: "grid",
              gap: { xs: 1, sm: 1.25 },
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.16),
              borderRadius: 2.75,
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.055 : 0.035),
              px: { xs: 1.25, sm: 1.5 },
              py: { xs: 1.15, sm: 1.35 },
            })}
          >
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.25}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={900}>
                  Revisar por estado
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
                  Filtra la lista por prioridad sin duplicar el total visible.
                </Typography>
              </Box>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
              >
                {options.map((option) => (
                  <Chip
                    key={option.value}
                    clickable
                    color={option.color}
                    variant={value === option.value ? "filled" : "outlined"}
                    label={
                      option.value === "all"
                        ? STOCK_FILTER_LABELS[option.value]
                        : `${STOCK_FILTER_LABELS[option.value]} · ${option.count}`
                    }
                    onClick={() => onChange(option.value)}
                    sx={{ flexGrow: { xs: 1, sm: 0 }, fontWeight: 900 }}
                  />
                ))}
              </Stack>
            </Stack>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

function InventoryStockOverview({
  rows,
  searchQuery,
  statusFilter = "all",
}: {
  rows: StockItem[];
  searchQuery: string;
  statusFilter?: StockStatusFilter;
}) {
  if (rows.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <EmptyStatePanel>
            {searchQuery.trim()
              ? "No hay existencias que coincidan con la búsqueda. Intenta buscar por nombre, clave interna/SKU, código o categoría."
              : statusFilter === "all"
                ? "No hay existencias registradas. Cuando crees productos con stock inicial o registres entradas, aparecerán aquí."
                : "No hay productos en esta división. Cambia el filtro de estado para revisar otros grupos de inventario."}
          </EmptyStatePanel>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box
          sx={(theme) => ({
            px: { xs: 2, sm: 2.5 },
            py: 2,
            borderBottom: 1,
            borderColor: alpha(theme.palette.primary.main, 0.16),
            background: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.035 : 0.02),
          })}
        >
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
            justifyContent="space-between"
          >
            <Stack direction="row" spacing={1.4} alignItems="center" sx={{ minWidth: 0 }}>
              <Box
                sx={(theme) => ({
                  alignItems: "center",
                  bgcolor: alpha(theme.palette.primary.main, 0.13),
                  borderRadius: 2.35,
                  color: "primary.main",
                  display: "inline-flex",
                  flex: "0 0 auto",
                  height: 48,
                  justifyContent: "center",
                  width: 48,
                })}
              >
                <GridViewIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.35 }}>
                  Existencias actuales
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Control rápido del stock real por producto, con estado visual para reposición.
                </Typography>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
              <Button variant="outlined" startIcon={<SortIcon />} sx={{ borderRadius: 2.5 }}>
                Ordenar
              </Button>
              <Button variant="outlined" startIcon={<FilterListIcon />} sx={{ borderRadius: 2.5 }}>
                Filtros
              </Button>
              <Button variant="contained" startIcon={<FileDownloadIcon />} sx={{ borderRadius: 2.5 }}>
                Exportar
              </Button>
            </Stack>
          </Stack>
        </Box>

        <Stack divider={<Divider flexItem />}>
          {rows.map((item) => (
            <InventoryStockItem key={item.id} item={item} />
          ))}
        </Stack>
      </CardContent>
    </Card>
  );
}

function getStockLocations(item: StockItem) {
  const locations = (item.locations ?? [])
    .map((location) => ({
      ...location,
      quantity: Math.max(Number(location.quantity) || 0, 0),
      warehouseName: location.warehouseName?.trim() || "Principal",
    }));

  if (locations.length > 0) {
    return locations;
  }

  if (item.stock > 0) {
    return [
      {
        warehouseId: "default",
        warehouseName: "Principal",
        quantity: item.stock,
      },
    ];
  }

  return [];
}

function getWarehouseDisplayName(warehouseName: string) {
  const normalized = warehouseName.trim() || "Principal";
  return normalized.toLowerCase() === "principal" ? "Principal" : normalized;
}

function formatAvailableUnits(quantity: number) {
  return `${quantity} disponible${quantity === 1 ? "" : "s"}`;
}

function getLocationStatus(quantity: number, minStock: number) {
  if (quantity <= 0) {
    return {
      color: "error" as const,
      label: "Sin stock",
    };
  }

  if (minStock > 0 && quantity <= minStock) {
    return {
      color: "warning" as const,
      label: "Bajo stock",
    };
  }

  return {
    color: "success" as const,
    label: "Disponible",
  };
}

function InventoryStockItem({ item }: { item: StockItem }) {
  const stockStatus = getStockStatus(item);
  const minStock = Math.max(Number(item.minStock ?? 0), 0);
  const stock = Math.max(Number(item.stock ?? 0), 0);
  const stockLocations = getStockLocations(item);
  const hasMultipleLocations = stockLocations.length > 1;
  const singleLocation = stockLocations[0];

  return (
    <Box
      data-testid={`inventory-stock-item-${item.sku}`}
      sx={(theme) => ({
        px: { xs: 1.5, sm: 2.25 },
        py: { xs: 1.5, sm: 1.75 },
        bgcolor: alpha(theme.palette[stockStatus.color].main, 0.026),
        "&:hover": {
          bgcolor: alpha(theme.palette[stockStatus.color].main, 0.055),
        },
      })}
    >
      <Box
        sx={(theme) => ({
          display: "grid",
          gap: { xs: 1.5, md: 2.5 },
          gridTemplateColumns: {
            xs: "1fr",
            md: hasMultipleLocations
              ? "minmax(240px, 0.72fr) minmax(0, 1.28fr)"
              : "minmax(240px, 0.82fr) minmax(0, 1.18fr)",
          },
          border: 1,
          borderColor: alpha(theme.palette[stockStatus.color].main, 0.16),
          borderRadius: 3,
          bgcolor: alpha(
            theme.palette.background.paper,
            theme.palette.mode === "dark" ? 0.18 : 0.82,
          ),
          p: { xs: 1.5, sm: 2 },
        })}
      >
        <Stack spacing={1.35} sx={{ minWidth: 0 }}>
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={900}
              sx={{ overflowWrap: "anywhere" }}
            >
              {item.name}
            </Typography>
            <Stack spacing={0.25} sx={{ mt: 0.25 }}>
              <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                Clave interna/SKU: {item.sku}
              </Typography>
              {item.barcode && (
                <Typography variant="body2" color="text.secondary" sx={{ overflowWrap: "anywhere" }}>
                  Código del producto: {item.barcode}
                </Typography>
              )}
            </Stack>
          </Box>

          <Box>
            <Typography variant="caption" color="text.secondary" fontWeight={800}>
              {hasMultipleLocations ? "Stock total" : "Stock actual"}
            </Typography>
            <Stack
              direction="row"
              spacing={0.75}
              useFlexGap
              flexWrap="wrap"
              alignItems="center"
            >
              <Typography variant="h4" fontWeight={950} lineHeight={1.05}>
                {stock} unidad{stock === 1 ? "" : "es"}
              </Typography>
              {hasMultipleLocations && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`${stockLocations.length} almacenes`}
                />
              )}
            </Stack>
          </Box>

          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
            <Chip
              data-testid={`inventory-stock-status-${item.sku}`}
              color={stockStatus.color}
              size="small"
              variant="outlined"
              label={stockStatus.label === "Bajo mínimo" ? "Bajo stock" : stockStatus.label}
            />
            <Chip
              size="small"
              variant="outlined"
              label={`Mínimo: ${minStock}`}
            />
            <CategoryPill label={item.category?.name} />
          </Stack>
        </Stack>

        {hasMultipleLocations ? (
          <WarehouseDistribution
            item={item}
            locations={stockLocations}
            minStock={minStock}
          />
        ) : (
          <SingleWarehouseStock
            helper={stockStatus.helper}
            location={singleLocation}
            statusColor={stockStatus.color}
            statusLabel={stockStatus.label === "Bajo mínimo" ? "Bajo stock" : stockStatus.label}
          />
        )}
      </Box>
    </Box>
  );
}

type NormalizedStockLocation = ReturnType<typeof getStockLocations>[number];

type StockVisualColor = "success" | "warning" | "error";

function getAttentionSurfaceStyles(theme: Theme, color: StockVisualColor) {
  const baseAlpha = theme.palette.mode === "dark" ? 0.12 : 0.055;

  if (color === "success") {
    return {
      bgcolor: alpha(theme.palette[color].main, baseAlpha),
      boxShadow: `inset 0 0 0 1px ${alpha(theme.palette[color].main, 0.12)}`,
    };
  }

  const stripeAlpha = color === "error"
    ? theme.palette.mode === "dark"
      ? 0.22
      : 0.16
    : theme.palette.mode === "dark"
      ? 0.22
      : 0.18;
  const glowAlpha = color === "error"
    ? theme.palette.mode === "dark"
      ? 0.24
      : 0.16
    : theme.palette.mode === "dark"
      ? 0.22
      : 0.14;

  return {
    bgcolor: alpha(theme.palette[color].main, baseAlpha),
    backgroundImage: `linear-gradient(90deg, ${alpha(
      theme.palette[color].main,
      theme.palette.mode === "dark" ? 0.08 : 0.04,
    )}, transparent 45%), repeating-linear-gradient(135deg, ${alpha(
      theme.palette[color].main,
      stripeAlpha,
    )} 0, ${alpha(theme.palette[color].main, stripeAlpha)} 8px, transparent 8px, transparent 26px)`,
    boxShadow: `0 12px 28px ${alpha(theme.palette[color].main, glowAlpha)}, inset 0 0 0 1px ${alpha(theme.palette[color].main, 0.24)}`,
  };
}

function StockStatusIcon({ color }: { color: StockVisualColor }) {
  if (color === "error") {
    return <ErrorOutlineIcon fontSize="small" />;
  }

  if (color === "warning") {
    return <WarningAmberIcon fontSize="small" />;
  }

  return <CheckCircleIcon fontSize="small" />;
}

function WarehouseIdentity({
  color,
  warehouseName,
}: {
  color: StockVisualColor;
  warehouseName: string;
}) {
  return (
    <Stack direction="row" spacing={1.15} alignItems="center" sx={{ minWidth: 0 }}>
      <Box
        aria-hidden="true"
        sx={(theme) => ({
          display: "grid",
          placeItems: "center",
          flex: "0 0 auto",
          width: 42,
          height: 42,
          borderRadius: "50%",
          color: theme.palette[color].contrastText,
          bgcolor: theme.palette[color].main,
          boxShadow: `0 10px 22px ${alpha(theme.palette[color].main, 0.28)}`,
        })}
      >
        <StockStatusIcon color={color} />
      </Box>

      <Box sx={{ minWidth: 0 }}>
        <Typography
          variant="caption"
          color="text.secondary"
          fontWeight={900}
          sx={{ display: "block", letterSpacing: 0.4, textTransform: "uppercase" }}
        >
          Ubicación de stock
        </Typography>
        <Typography
          variant="h6"
          fontWeight={950}
          lineHeight={1.05}
          sx={{
            color: "text.primary",
            overflowWrap: "anywhere",
            textShadow: (theme) =>
              theme.palette.mode === "dark"
                ? `0 1px 0 ${alpha(theme.palette.common.black, 0.35)}`
                : `0 1px 0 ${alpha(theme.palette.common.white, 0.65)}`,
          }}
        >
          <Box component="span" sx={{ color: "text.secondary", fontWeight: 900 }}>
            Almacén:{" "}
          </Box>
          {getWarehouseDisplayName(warehouseName)}
        </Typography>
      </Box>
    </Stack>
  );
}

function SingleWarehouseStock({
  helper,
  location,
  statusColor,
  statusLabel,
}: {
  helper: string;
  location: NormalizedStockLocation | undefined;
  statusColor: "success" | "warning" | "error";
  statusLabel: string;
}) {
  return (
    <Box
      sx={(theme) => ({
        alignSelf: "stretch",
        border: 1,
        borderLeft: 5,
        borderColor: alpha(theme.palette[statusColor].main, 0.22),
        borderLeftColor: theme.palette[statusColor].main,
        borderRadius: 2.5,
        ...getAttentionSurfaceStyles(theme, statusColor),
        px: { xs: 1.25, sm: 1.5 },
        py: { xs: 1.05, sm: 1.25 },
      })}
    >
      <Stack spacing={0.75} sx={{ minHeight: "100%", justifyContent: "center" }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          {location ? (
            <WarehouseIdentity color={statusColor} warehouseName={location.warehouseName} />
          ) : (
            <Typography variant="body2" fontWeight={900} sx={{ overflowWrap: "anywhere" }}>
              Sin unidades asignadas a un almacén específico.
            </Typography>
          )}
          <Chip
            color={statusColor}
            size="medium"
            variant={statusColor === "success" ? "outlined" : "filled"}
            label={statusLabel}
            sx={{
              fontWeight: 950,
              letterSpacing: 0.2,
              px: statusColor === "success" ? 0.25 : 0.75,
            }}
          />
        </Stack>

        <Typography variant="body2" color="text.secondary" fontWeight={700}>
          {helper}
        </Typography>
      </Stack>
    </Box>
  );
}

function WarehouseDistribution({
  item,
  locations,
  minStock,
}: {
  item: StockItem;
  locations: NormalizedStockLocation[];
  minStock: number;
}) {
  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="subtitle1" fontWeight={900} sx={{ mb: 0.85 }}>
        Distribución
      </Typography>

      <Stack spacing={0.8}>
        {locations.map((location) => (
          <WarehouseDistributionRow
            key={`${item.id}-${location.warehouseId}`}
            item={item}
            location={location}
            minStock={minStock}
          />
        ))}
      </Stack>
    </Box>
  );
}

function WarehouseDistributionRow({
  item,
  location,
  minStock,
}: {
  item: StockItem;
  location: NormalizedStockLocation;
  minStock: number;
}) {
  const locationStatus = getLocationStatus(location.quantity, minStock);

  return (
    <Box
      data-testid={`inventory-stock-location-${item.sku}-${location.warehouseId}`}
      sx={(theme) => ({
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          sm: "minmax(0, 1.15fr) auto",
          lg: "minmax(0, 1.2fr) minmax(130px, auto) auto",
        },
        gap: { xs: 0.75, sm: 1.15 },
        alignItems: "center",
        borderLeft: 5,
        borderLeftColor: theme.palette[locationStatus.color].main,
        borderRadius: 2.5,
        ...getAttentionSurfaceStyles(theme, locationStatus.color),
        px: { xs: 1.15, sm: 1.4 },
        py: { xs: 1.05, sm: 1.2 },
        minWidth: 0,
      })}
    >
      <WarehouseIdentity color={locationStatus.color} warehouseName={location.warehouseName} />

      <Typography
        variant="h6"
        fontWeight={950}
        sx={{ color: "text.primary", whiteSpace: { sm: "nowrap" } }}
      >
        {formatAvailableUnits(location.quantity)}
      </Typography>

      <Chip
        color={locationStatus.color}
        size="medium"
        variant={locationStatus.color === "success" ? "outlined" : "filled"}
        label={locationStatus.label}
        sx={{
          justifySelf: { xs: "flex-start", lg: "end" },
          fontWeight: 950,
          letterSpacing: 0.2,
          px: locationStatus.color === "success" ? 0.25 : 0.75,
        }}
      />
    </Box>
  );
}

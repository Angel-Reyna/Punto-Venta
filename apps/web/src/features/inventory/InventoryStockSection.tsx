import { useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import GridViewIcon from "@mui/icons-material/GridView";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { EmptyStatePanel } from "../../components/data-display";
import { CategoryPill } from "../products/categoryVisuals";
import type { StockItem, StockStatusFilter } from "./inventoryShared";
import {
  STOCK_FILTER_LABELS,
  filterStockRowsByStatus,
  getInventoryStockSummary,
  getStockStatus,
} from "./inventoryShared";

type StockSortMode = "name" | "stock-desc" | "stock-asc" | "status";

const STOCK_SORT_LABELS: Record<StockSortMode, string> = {
  name: "Nombre",
  "stock-desc": "Mayor stock",
  "stock-asc": "Menor stock",
  status: "Atención",
};

const STOCK_SORT_SEQUENCE: StockSortMode[] = [
  "name",
  "stock-desc",
  "stock-asc",
  "status",
];

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
  const [sortMode, setSortMode] = useState<StockSortMode>("name");
  const [showStockFilters, setShowStockFilters] = useState(false);
  const statusFilteredRows = useMemo(
    () => filterStockRowsByStatus(rows, statusFilter),
    [rows, statusFilter],
  );
  const filteredRows = useMemo(
    () => sortStockRows(statusFilteredRows, sortMode),
    [statusFilteredRows, sortMode],
  );

  function cycleSortMode() {
    setSortMode((current) => {
      const currentIndex = STOCK_SORT_SEQUENCE.indexOf(current);
      return STOCK_SORT_SEQUENCE[
        (currentIndex + 1) % STOCK_SORT_SEQUENCE.length
      ];
    });
  }

  return (
    <InventoryStockOverview
      allRows={rows}
      rows={filteredRows}
      searchQuery={searchQuery}
      showFilters={showStockFilters}
      sortMode={sortMode}
      statusFilter={statusFilter}
      onFilterChange={setStatusFilter}
      onSearchChange={onSearchChange}
      onSortModeChange={cycleSortMode}
      onToggleFilters={() => setShowStockFilters((current) => !current)}
    />
  );
}

function InventoryStockOverview({
  allRows,
  rows,
  searchQuery,
  showFilters,
  sortMode,
  statusFilter = "all",
  onFilterChange,
  onSearchChange,
  onSortModeChange,
  onToggleFilters,
}: {
  allRows: StockItem[];
  rows: StockItem[];
  searchQuery: string;
  showFilters: boolean;
  sortMode: StockSortMode;
  statusFilter?: StockStatusFilter;
  onFilterChange: (value: StockStatusFilter) => void;
  onSearchChange: (query: string) => void;
  onSortModeChange: () => void;
  onToggleFilters: () => void;
}) {
  const summary = getInventoryStockSummary(allRows);
  const filterOptions: Array<{
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
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box
          sx={(theme) => ({
            px: { xs: 1.5, sm: 2.25 },
            py: { xs: 1.5, sm: 1.85 },
            borderBottom: 1,
            borderColor: alpha(theme.palette.primary.main, 0.16),
            background: alpha(
              theme.palette.primary.main,
              theme.palette.mode === "dark" ? 0.035 : 0.02,
            ),
          })}
        >
          <Stack spacing={1.45}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.35}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Stack
                direction="row"
                spacing={1.2}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                <Box
                  sx={(theme) => ({
                    alignItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.13),
                    borderRadius: 2.35,
                    color: "primary.main",
                    display: "inline-flex",
                    flex: "0 0 auto",
                    height: 44,
                    justifyContent: "center",
                    width: 44,
                  })}
                >
                  <GridViewIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography
                    variant="h5"
                    fontWeight={950}
                    sx={{ letterSpacing: -0.35 }}
                  >
                    Existencias actuales
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Busca, ordena y filtra el stock real por producto y almacén.
                  </Typography>
                </Box>
              </Stack>

              <Stack
                direction="row"
                spacing={1}
                useFlexGap
                flexWrap="wrap"
                justifyContent={{ xs: "flex-start", md: "flex-end" }}
              >
                <Button
                  variant="outlined"
                  startIcon={<SortIcon />}
                  onClick={onSortModeChange}
                  aria-label="Cambiar orden de existencias"
                  sx={{ borderRadius: 2.5 }}
                >
                  Ordenar: {STOCK_SORT_LABELS[sortMode]}
                </Button>
                <Button
                  variant={showFilters ? "contained" : "outlined"}
                  startIcon={<FilterListIcon />}
                  onClick={onToggleFilters}
                  aria-expanded={showFilters}
                  aria-controls="inventory-stock-inline-filters"
                  sx={{ borderRadius: 2.5 }}
                >
                  Filtros
                </Button>
              </Stack>
            </Stack>

            <Box
              sx={{
                display: "grid",
                gap: 1,
                gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
                alignItems: "center",
              }}
            >
              <TextField
                fullWidth
                size="small"
                label="Buscar existencias"
                placeholder="Ej. COCA-600, refresco, 750..., bebidas"
                value={searchQuery}
                onChange={(event) => onSearchChange(event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />
              <Chip
                color="primary"
                variant="outlined"
                label={`${rows.length} registro${rows.length === 1 ? "" : "s"}`}
                sx={{
                  fontWeight: 900,
                  justifySelf: { xs: "flex-start", md: "end" },
                }}
              />
            </Box>
          </Stack>
        </Box>

        {showFilters && (
          <Box
            id="inventory-stock-inline-filters"
            sx={(theme) => ({
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              borderBottom: 1,
              borderColor: alpha(theme.palette.primary.main, 0.12),
              bgcolor: alpha(
                theme.palette.primary.main,
                theme.palette.mode === "dark" ? 0.045 : 0.026,
              ),
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
              {filterOptions.map((option) => (
                <Chip
                  key={option.value}
                  clickable
                  color={option.color}
                  variant={
                    statusFilter === option.value ? "filled" : "outlined"
                  }
                  label={
                    option.value === "all"
                      ? STOCK_FILTER_LABELS[option.value]
                      : `${STOCK_FILTER_LABELS[option.value]} · ${option.count}`
                  }
                  onClick={() => onFilterChange(option.value)}
                  sx={{ fontWeight: 900 }}
                />
              ))}
            </Stack>
          </Box>
        )}

        {rows.length === 0 ? (
          <Box sx={{ px: { xs: 1.5, sm: 2.25 }, py: 2 }}>
            <EmptyStatePanel>
              {searchQuery.trim()
                ? "No hay existencias que coincidan con la búsqueda. Intenta buscar por nombre, clave interna/SKU, código o categoría."
                : statusFilter === "all"
                  ? "No hay existencias registradas. Cuando crees productos con stock inicial o registres entradas, aparecerán aquí."
                  : "No hay productos en este filtro. Cambia el estado o revisa la búsqueda actual."}
            </EmptyStatePanel>
          </Box>
        ) : (
          <Stack divider={<Divider flexItem />}>
            {rows.map((item) => (
              <InventoryStockItem
                key={item.id}
                item={item}
                statusFilter={statusFilter}
              />
            ))}
          </Stack>
        )}
      </CardContent>
    </Card>
  );
}

function sortStockRows(rows: StockItem[], sortMode: StockSortMode) {
  const statusPriority = (item: StockItem) => {
    const status = getStockStatus(item);
    if (status.color === "error") return 0;
    if (status.color === "warning") return 1;
    return 2;
  };

  return [...rows].sort((left, right) => {
    if (sortMode === "stock-desc") {
      return right.stock - left.stock || left.name.localeCompare(right.name);
    }

    if (sortMode === "stock-asc") {
      return left.stock - right.stock || left.name.localeCompare(right.name);
    }

    if (sortMode === "status") {
      return (
        statusPriority(left) - statusPriority(right) ||
        left.name.localeCompare(right.name)
      );
    }

    return left.name.localeCompare(right.name);
  });
}

function getStockLocations(item: StockItem) {
  const locations = (item.locations ?? []).map((location) => ({
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

function filterLocationsByStatus(
  locations: NormalizedStockLocation[],
  minStock: number,
  statusFilter: StockStatusFilter,
) {
  if (statusFilter === "all") {
    return locations;
  }

  return locations.filter((location) => {
    const status = getLocationStatus(location.quantity, minStock);

    if (statusFilter === "available") {
      return status.color === "success";
    }

    if (statusFilter === "low") {
      return status.color === "warning";
    }

    return status.color === "error";
  });
}

function getDisplayStockStatus({
  fallbackStatus,
  minStock,
  statusFilter,
  visibleLocations,
}: {
  fallbackStatus: ReturnType<typeof getStockStatus>;
  item: StockItem;
  minStock: number;
  statusFilter: StockStatusFilter;
  visibleLocations: NormalizedStockLocation[];
}) {
  if (statusFilter === "all") {
    return {
      color: fallbackStatus.color,
      helper: fallbackStatus.helper,
      label:
        fallbackStatus.label === "Bajo mínimo"
          ? "Bajo stock"
          : fallbackStatus.label,
    };
  }

  if (statusFilter === "available") {
    return {
      color: "success" as const,
      helper:
        visibleLocations.length > 1
          ? "Ubicaciones con stock suficiente para venta."
          : "Inventario suficiente para venta.",
      label: "Disponible",
    };
  }

  if (statusFilter === "low") {
    return {
      color: "warning" as const,
      helper:
        minStock > 0
          ? "Ubicaciones en el umbral de reposición."
          : "Ubicaciones que requieren revisión preventiva.",
      label: "Bajo stock",
    };
  }

  return {
    color: "error" as const,
    helper:
      visibleLocations.length > 1
        ? "Ubicaciones sin unidades disponibles."
        : "Ubicación sin unidades disponibles.",
    label: "Sin stock",
  };
}

function InventoryStockItem({
  item,
  statusFilter,
}: {
  item: StockItem;
  statusFilter: StockStatusFilter;
}) {
  const stockStatus = getStockStatus(item);
  const minStock = Math.max(Number(item.minStock ?? 0), 0);
  const stock = Math.max(Number(item.stock ?? 0), 0);
  const stockLocations = getStockLocations(item);
  const visibleStockLocations = filterLocationsByStatus(
    stockLocations,
    minStock,
    statusFilter,
  );
  const displayedLocations =
    visibleStockLocations.length > 0 ? visibleStockLocations : stockLocations;
  const hasMultipleLocations = displayedLocations.length > 1;
  const singleLocation = displayedLocations[0];
  const displayStatus = getDisplayStockStatus({
    fallbackStatus: stockStatus,
    item,
    minStock,
    statusFilter,
    visibleLocations: displayedLocations,
  });

  return (
    <Box
      data-testid={`inventory-stock-item-${item.sku}`}
      sx={(theme) => ({
        px: { xs: 1.5, sm: 2.25 },
        py: { xs: 1.5, sm: 1.75 },
        bgcolor: alpha(theme.palette[displayStatus.color].main, 0.026),
        "&:hover": {
          bgcolor: alpha(theme.palette[displayStatus.color].main, 0.055),
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
          borderColor: alpha(theme.palette[displayStatus.color].main, 0.16),
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ overflowWrap: "anywhere" }}
              >
                Clave interna/SKU: {item.sku}
              </Typography>
              {item.barcode && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ overflowWrap: "anywhere" }}
                >
                  Código del producto: {item.barcode}
                </Typography>
              )}
            </Stack>
          </Box>

          <Box>
            <Typography
              variant="caption"
              color="text.secondary"
              fontWeight={800}
            >
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
              color={displayStatus.color}
              size="small"
              variant="outlined"
              label={displayStatus.label}
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
            locations={displayedLocations}
            minStock={minStock}
          />
        ) : (
          <SingleWarehouseStock
            helper={displayStatus.helper}
            location={singleLocation}
            statusColor={displayStatus.color}
            statusLabel={displayStatus.label}
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

  const stripeAlpha =
    color === "error"
      ? theme.palette.mode === "dark"
        ? 0.22
        : 0.16
      : theme.palette.mode === "dark"
        ? 0.22
        : 0.18;
  const glowAlpha =
    color === "error"
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
    <Stack
      direction="row"
      spacing={1.15}
      alignItems="center"
      sx={{ minWidth: 0 }}
    >
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
          sx={{
            display: "block",
            letterSpacing: 0.4,
            textTransform: "uppercase",
          }}
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
          <Box
            component="span"
            sx={{ color: "text.secondary", fontWeight: 900 }}
          >
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
      <Stack
        spacing={0.75}
        sx={{ minHeight: "100%", justifyContent: "center" }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          {location ? (
            <WarehouseIdentity
              color={statusColor}
              warehouseName={location.warehouseName}
            />
          ) : (
            <Typography
              variant="body2"
              fontWeight={900}
              sx={{ overflowWrap: "anywhere" }}
            >
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
      <WarehouseIdentity
        color={locationStatus.color}
        warehouseName={location.warehouseName}
      />

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

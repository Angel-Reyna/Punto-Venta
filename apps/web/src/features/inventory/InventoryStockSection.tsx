import { useEffect, useMemo, useState, type ElementType } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { alpha, type Theme, useTheme } from "@mui/material/styles";

import FilterListIcon from "@mui/icons-material/FilterList";
import GridViewIcon from "@mui/icons-material/GridView";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import PersonIcon from "@mui/icons-material/Person";
import SearchIcon from "@mui/icons-material/Search";
import SortIcon from "@mui/icons-material/Sort";
import WarehouseIcon from "@mui/icons-material/Warehouse";

import { EmptyStatePanel } from "../../components/data-display";
import { CategoryPill } from "../products/categoryVisuals";
import type {
  StockItem,
  StockLocation,
  StockStatusFilter,
} from "./inventoryShared";
import {
  STOCK_FILTER_LABELS,
  filterStockRowsByStatus,
  getInventoryStockSummary,
  getStockStatus,
} from "./inventoryShared";

type StockSortMode = "name" | "stock-desc" | "stock-asc" | "status";
type StockVisualColor = "success" | "warning" | "error";
type DistributionTone = "info" | "secondary" | "error";

type NormalizedStockLocation = StockLocation & {
  quantity: number;
  warehouseName: string;
  warehouseType: "STORAGE" | "SELLER";
};

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

const STOCK_PAGE_SIZE_OPTIONS = [5, 10] as const;
type StockPageSize = (typeof STOCK_PAGE_SIZE_OPTIONS)[number];

export function InventoryStockSection({
  rows,
  searchQuery,
  initialStatusFilter = "all",
  onSearchChange,
}: {
  rows: StockItem[];
  searchQuery: string;
  initialStatusFilter?: StockStatusFilter;
  onSearchChange: (query: string) => void;
}) {
  const [statusFilter, setStatusFilter] = useState<StockStatusFilter>(initialStatusFilter);
  const [sortMode, setSortMode] = useState<StockSortMode>("name");
  const [showStockFilters, setShowStockFilters] = useState(false);
  useEffect(() => {
    setStatusFilter(initialStatusFilter);
    setShowStockFilters(initialStatusFilter !== "all");
  }, [initialStatusFilter]);

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

  function toggleStockFilters() {
    setShowStockFilters((current) => {
      if (current) {
        setStatusFilter("all");
      }

      return !current;
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
      onToggleFilters={toggleStockFilters}
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
    { value: "attention", count: summary.attention, color: "warning" },
    { value: "low", count: summary.lowStock, color: "warning" },
    { value: "out", count: summary.outOfStock, color: "error" },
  ];
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<StockPageSize>(5);
  const pageCount = Math.max(1, Math.ceil(rows.length / pageSize));
  const visibleRows = useMemo(() => {
    const start = (page - 1) * pageSize;

    return rows.slice(start, start + pageSize);
  }, [rows, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [rows, pageSize, searchQuery, statusFilter, sortMode]);

  function handlePageSizeChange(event: SelectChangeEvent) {
    setPageSize(Number(event.target.value) as StockPageSize);
    setPage(1);
  }

  function handleFilterChange(value: StockStatusFilter) {
    onFilterChange(value);
    setPage(1);
  }

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
                    Resumen compacto por producto; cuando hay muchas ubicaciones,
                    solo se muestran las principales y el resto queda resumido.
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Box
              sx={{
                alignItems: "center",
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "minmax(280px, 1fr) auto auto auto auto",
                },
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

              <FormControl size="small" sx={{ minWidth: 142 }}>
                <InputLabel id="inventory-stock-page-size-label">
                  Por página
                </InputLabel>
                <Select
                  labelId="inventory-stock-page-size-label"
                  id="inventory-stock-page-size"
                  label="Por página"
                  value={String(pageSize)}
                  onChange={handlePageSizeChange}
                >
                  {STOCK_PAGE_SIZE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={String(option)}>
                      {option} productos
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button
                variant="outlined"
                startIcon={<SortIcon />}
                onClick={onSortModeChange}
                aria-label="Cambiar orden de existencias"
                sx={{ borderRadius: 2.5, whiteSpace: "nowrap" }}
              >
                Ordenar: {STOCK_SORT_LABELS[sortMode]}
              </Button>
              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<FilterListIcon />}
                onClick={onToggleFilters}
                aria-expanded={showFilters}
                aria-controls="inventory-stock-inline-filters"
                sx={{ borderRadius: 2.5, whiteSpace: "nowrap" }}
              >
                Filtros
              </Button>
              <Chip
                color="primary"
                variant="outlined"
                label={`${rows.length} registro${rows.length === 1 ? "" : "s"}`}
                sx={{
                  fontWeight: 900,
                  justifySelf: { xs: "flex-start", lg: "end" },
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
                  onClick={() => handleFilterChange(option.value)}
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
                ? "No hay existencias que coincidan con la búsqueda. Intenta buscar por nombre, código interno, código del producto o categoría."
                : statusFilter === "all"
                  ? "No hay existencias registradas. Cuando crees productos con stock inicial o registres entradas, aparecerán aquí."
                  : "No hay productos en este filtro. Cambia el estado o revisa la búsqueda actual."}
            </EmptyStatePanel>
          </Box>
        ) : (
          <>
            <Stack divider={<Divider flexItem />}>
              {visibleRows.map((item) => (
                <InventoryStockItem
                  key={item.id}
                  item={item}
                  statusFilter={statusFilter}
                />
              ))}
            </Stack>

            <Box
              sx={{
                px: { xs: 2, sm: 2.5 },
                py: { xs: 1.5, sm: 2 },
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1.25,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Pagination
                color="primary"
                count={pageCount}
                page={page}
                onChange={(_, value) => setPage(value)}
              />
            </Box>
          </>
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
      return (
        right.stock - left.stock || left.name.localeCompare(right.name, "es")
      );
    }

    if (sortMode === "stock-asc") {
      return (
        left.stock - right.stock || left.name.localeCompare(right.name, "es")
      );
    }

    if (sortMode === "status") {
      return (
        statusPriority(left) - statusPriority(right) ||
        left.name.localeCompare(right.name, "es")
      );
    }

    return left.name.localeCompare(right.name, "es");
  });
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
  const displayStatus = getDisplayStockStatus({
    fallbackStatus: stockStatus,
    minStock,
    statusFilter,
    visibleLocations: displayedLocations,
  });
  const ProductIcon = Inventory2Icon;
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
          background: alpha(theme.palette.background.paper, 0.72),
          border: "1px solid",
          borderColor: alpha(theme.palette[displayStatus.color].main, 0.24),
          borderLeft: "5px solid",
          borderLeftColor: theme.palette[displayStatus.color].main,
          borderRadius: 3.5,
          display: "grid",
          gap: 1.25,
          gridTemplateColumns: {
            xs: "1fr",
            md: "minmax(0, 1.25fr) minmax(270px, 0.75fr)",
            lg: "minmax(0, 1.2fr) 300px minmax(360px, 1fr)",
          },
          p: { xs: 1.2, sm: 1.35 },
        })}
      >
        <Stack alignItems="center" direction="row" minWidth={0} spacing={1.25}>
          <CategoryIconTile icon={ProductIcon} tone={displayStatus.color} />
          <Stack minWidth={0} spacing={0.55}>
            <Stack
              alignItems="center"
              direction="row"
              flexWrap="wrap"
              gap={0.75}
            >
              <Typography fontWeight={950} sx={{ overflowWrap: "anywhere" }}>
                {item.name}
              </Typography>
              <Chip
                data-testid={`inventory-stock-status-${item.sku}`}
                color={displayStatus.color}
                label={displayStatus.label}
                size="small"
                variant="outlined"
                sx={{ fontWeight: 900 }}
              />
            </Stack>
            <Typography
              color="text.secondary"
              variant="body2"
              sx={{ overflowWrap: "anywhere" }}
            >
              Código interno: {item.sku}
            </Typography>
            {item.barcode ? (
              <Typography
                color="text.secondary"
                variant="body2"
                sx={{ overflowWrap: "anywhere" }}
              >
                Código del producto: {item.barcode}
              </Typography>
            ) : null}
            <CategoryPill label={item.category?.name} />
          </Stack>
        </Stack>

        <StockMeterCard
          color={displayStatus.color}
          minStock={minStock}
          stock={stock}
        />

        <DistributionSummary
          item={item}
          locations={displayedLocations}
          minStock={minStock}
        />
      </Box>
    </Box>
  );
}

function CategoryIconTile({
  icon: Icon,
  tone,
}: {
  icon: ElementType;
  tone: StockVisualColor;
}) {
  return (
    <Box
      aria-hidden="true"
      sx={(theme) => ({
        alignItems: "center",
        background: `radial-gradient(circle at 30% 20%, ${alpha(theme.palette[tone].main, 0.28)}, ${alpha(theme.palette[tone].main, 0.08)} 68%)`,
        border: "1px solid",
        borderColor: alpha(theme.palette[tone].main, 0.28),
        borderRadius: 3.25,
        color: theme.palette[tone].main,
        display: "grid",
        flex: "0 0 58px",
        height: 58,
        justifyContent: "center",
        width: 58,
      })}
    >
      <Icon sx={{ fontSize: 32 }} />
    </Box>
  );
}

function StockMeterCard({
  color,
  minStock,
  stock,
}: {
  color: StockVisualColor;
  minStock: number;
  stock: number;
}) {
  const theme = useTheme();
  const mainColor = theme.palette[color].main;
  const diff = stock - minStock;
  const diffLabel =
    diff >= 0
      ? `+${formatInventoryNumber(diff)} sobre el mínimo`
      : `Faltan ${formatInventoryNumber(Math.abs(diff))}`;

  return (
    <Box
      sx={{
        alignItems: "center",
        background: `linear-gradient(135deg, ${alpha(mainColor, 0.2)} 0%, ${alpha(theme.palette.background.paper, 0.72)} 45%, ${alpha(mainColor, 0.08)} 100%)`,
        border: "1px solid",
        borderColor: alpha(mainColor, 0.38),
        borderRadius: 3,
        boxShadow: `inset 0 0 0 1px ${alpha(theme.palette.common.white, theme.palette.mode === "dark" ? 0.035 : 0.22)}`,
        display: "grid",
        minHeight: 112,
        overflow: "hidden",
        placeItems: "center",
        position: "relative",
        px: 1.25,
        py: 1,
        textAlign: "center",
        "&::before": {
          background: mainColor,
          borderRadius: 999,
          bottom: 14,
          content: '""',
          left: 10,
          position: "absolute",
          top: 14,
          width: 5,
        },
        "&::after": {
          background: `linear-gradient(90deg, ${alpha(mainColor, 0.9)} 0%, ${alpha(mainColor, 0.34)} 60%, ${alpha(mainColor, 0.14)} 100%)`,
          borderRadius: 999,
          bottom: 8,
          content: '""',
          height: 4,
          left: 18,
          position: "absolute",
          right: 18,
        },
      }}
    >
      <Stack
        alignItems="center"
        justifyContent="center"
        spacing={0.8}
        sx={{ width: "100%" }}
      >
        <Typography
          color="text.secondary"
          fontSize={10.5}
          fontWeight={900}
          letterSpacing="0.08em"
          textTransform="uppercase"
        >
          Stock actual y mínimo
        </Typography>
        <Box
          sx={{
            alignItems: "center",
            display: "grid",
            gap: 1.2,
            gridTemplateColumns: "auto minmax(0, 1fr)",
            justifyContent: "center",
            maxWidth: 250,
            width: "100%",
          }}
        >
          <Typography
            color={mainColor}
            fontSize={38}
            fontWeight={950}
            lineHeight={1}
            sx={{ minWidth: 72, textAlign: "center" }}
          >
            {formatInventoryNumber(stock)}
          </Typography>
          <Box
            component="ul"
            sx={{
              color: "text.primary",
              fontSize: 12.5,
              fontWeight: 850,
              lineHeight: 1.4,
              listStylePosition: "inside",
              m: 0,
              p: 0,
              textAlign: "left",
            }}
          >
            <li>Actual: {formatInventoryNumber(stock)}</li>
            <li>Mínimo: {formatInventoryNumber(minStock)}</li>
            <li>{diffLabel}</li>
          </Box>
        </Box>
      </Stack>
    </Box>
  );
}

function DistributionSummary({
  item,
  locations,
  minStock,
}: {
  item: StockItem;
  locations: NormalizedStockLocation[];
  minStock: number;
}) {
  const [showAllLocations, setShowAllLocations] = useState(false);
  const sortedLocations = sortLocationsForDisplay(locations);
  const visibleLocations = showAllLocations
    ? sortedLocations
    : sortedLocations.slice(0, 2);
  const hiddenCount = Math.max(sortedLocations.length - 2, 0);
  const warehouseCount = locations.filter(
    (location) => location.warehouseType !== "SELLER",
  ).length;
  const sellerCount = locations.filter(
    (location) => location.warehouseType === "SELLER",
  ).length;
  const emptyCount = locations.filter(
    (location) => location.quantity === 0,
  ).length;

  return (
    <Stack minWidth={0} spacing={0.85}>
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
          letterSpacing="0.07em"
          textTransform="uppercase"
        >
          Distribución real
        </Typography>
        <Chip
          label={`${locations.length} ubicaciones`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, fontWeight: 900, height: 24 }}
        />
      </Stack>

      <Stack direction="row" flexWrap="wrap" gap={0.55}>
        <Chip
          label={`${warehouseCount} ${warehouseCount === 1 ? "almacén" : "almacenes"}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, fontWeight: 850, height: 23 }}
        />
        <Chip
          label={`${sellerCount} ${sellerCount === 1 ? "vendedor" : "vendedores"}`}
          size="small"
          variant="outlined"
          sx={{ fontSize: 11, fontWeight: 850, height: 23 }}
        />
        {emptyCount > 0 ? (
          <Chip
            color="error"
            label={`${emptyCount} sin stock`}
            size="small"
            variant="outlined"
            sx={{ fontSize: 11, fontWeight: 850, height: 23 }}
          />
        ) : null}
      </Stack>

      <Stack spacing={0.55}>
        {visibleLocations.map((location) => (
          <DistributionLocationLine
            key={`${item.id}-${location.warehouseId}`}
            item={item}
            location={location}
            minStock={minStock}
          />
        ))}
        {hiddenCount > 0 ? (
          <Button
            size="small"
            variant="outlined"
            onClick={() => setShowAllLocations((current) => !current)}
            sx={(theme) => ({
              border: "1px dashed",
              borderColor: alpha(theme.palette.primary.main, 0.32),
              borderRadius: 2,
              color: "text.secondary",
              fontSize: 12,
              fontWeight: 900,
              minHeight: 30,
              px: 1,
              py: 0.65,
              textTransform: "none",
            })}
          >
            {showAllLocations
              ? "Ocultar ubicaciones adicionales"
              : `+${hiddenCount} ubicaci${hiddenCount === 1 ? "ón" : "ones"} más`}
          </Button>
        ) : null}
      </Stack>
    </Stack>
  );
}

function DistributionLocationLine({
  item,
  location,
  minStock,
}: {
  item: StockItem;
  location: NormalizedStockLocation;
  minStock: number;
}) {
  const theme = useTheme();
  const status = getLocationStatus(location.quantity, minStock);
  const tone = getDistributionTone(location, status.color);
  const color = getDistributionColor(theme, tone);
  const Icon = location.warehouseType === "SELLER" ? PersonIcon : WarehouseIcon;

  return (
    <Box
      data-testid={`inventory-stock-location-${item.sku}-${location.warehouseId}`}
      sx={{
        alignItems: "center",
        background: alpha(color, theme.palette.mode === "dark" ? 0.11 : 0.08),
        border: "1px solid",
        borderColor: alpha(color, 0.26),
        borderRadius: 2.25,
        display: "grid",
        gap: 0.9,
        gridTemplateColumns: "30px minmax(0, 1fr) auto",
        minHeight: 34,
        px: 0.8,
        py: 0.55,
      }}
    >
      <Box
        aria-hidden="true"
        sx={{
          alignItems: "center",
          background: alpha(color, 0.18),
          border: "1px solid",
          borderColor: alpha(color, 0.28),
          borderRadius: "50%",
          color,
          display: "grid",
          height: 28,
          justifyContent: "center",
          width: 28,
        }}
      >
        <Icon sx={{ fontSize: 16 }} />
      </Box>
      <Typography
        color="text.primary"
        fontSize={12.25}
        fontWeight={850}
        lineHeight={1.15}
        noWrap
      >
        {getDistributionLabel(location)}
      </Typography>
      <Typography
        color={location.quantity === 0 ? "error.main" : "text.primary"}
        fontSize={13}
        fontWeight={950}
        whiteSpace="nowrap"
      >
        {formatInventoryNumber(location.quantity)} disponibles
      </Typography>
    </Box>
  );
}

function getStockLocations(item: StockItem): NormalizedStockLocation[] {
  const locations = (item.locations ?? []).map((location) => ({
    ...location,
    quantity: Math.max(Number(location.quantity) || 0, 0),
    warehouseName: location.warehouseName?.trim() || "Principal",
    warehouseType: location.warehouseType ?? "STORAGE",
  }));

  if (locations.length > 0) {
    return locations;
  }

  return [
    {
      warehouseId: "default",
      warehouseName: "Principal",
      warehouseType: "STORAGE",
      sellerId: null,
      quantity: Math.max(Number(item.stock ?? 0), 0),
    },
  ];
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

    if (statusFilter === "attention") {
      return status.color === "warning" || status.color === "error";
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
  minStock: number;
  statusFilter: StockStatusFilter;
  visibleLocations: NormalizedStockLocation[];
}) {
  if (statusFilter === "all") {
    return {
      color: fallbackStatus.color,
      helper: fallbackStatus.helper,
      label:
        fallbackStatus.label === "Bajo inventario"
          ? "Stock bajo"
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

  if (statusFilter === "attention") {
    const hasCriticalLocation = visibleLocations.some((location) => location.quantity <= 0);

    return {
      color: hasCriticalLocation ? "error" as const : "warning" as const,
      helper: "Productos sin stock o en el umbral de reposición.",
      label: "Requiere atención",
    };
  }

  if (statusFilter === "low") {
    return {
      color: "warning" as const,
      helper:
        minStock > 0
          ? "Ubicaciones en el umbral de reposición."
          : "Ubicaciones que requieren revisión preventiva.",
      label: "Stock bajo",
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
      label: "Stock bajo",
    };
  }

  return {
    color: "success" as const,
    label: "Disponible",
  };
}

function sortLocationsForDisplay(locations: NormalizedStockLocation[]) {
  return [...locations].sort((left, right) => {
    if (left.quantity === 0 && right.quantity !== 0) return -1;
    if (left.quantity !== 0 && right.quantity === 0) return 1;
    if (left.warehouseType !== right.warehouseType) {
      return left.warehouseType === "STORAGE" ? -1 : 1;
    }

    return (
      right.quantity - left.quantity ||
      left.warehouseName.localeCompare(right.warehouseName, "es")
    );
  });
}

function getDistributionTone(
  location: NormalizedStockLocation,
  statusColor: StockVisualColor,
): DistributionTone {
  if (statusColor === "error") return "error";

  return location.warehouseType === "SELLER" ? "secondary" : "info";
}

function getDistributionColor(theme: Theme, tone: DistributionTone) {
  return theme.palette[tone].main;
}

function getDistributionLabel(location: NormalizedStockLocation) {
  const name = location.warehouseName.trim() || "Principal";
  return location.warehouseType === "SELLER"
    ? `Vendedor: ${name}`
    : `Almacén: ${name}`;
}

function formatInventoryNumber(value: number) {
  return new Intl.NumberFormat("es-MX").format(Math.max(Number(value) || 0, 0));
}

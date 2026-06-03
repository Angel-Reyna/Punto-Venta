import { useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  LinearProgress,
  Stack,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { EmptyStatePanel } from "../../components/data-display";
import { SearchToolbar } from "../../components/SearchToolbar";
import { VisualMetricCard } from "../../components/VisualMetricCard";
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

      <InventoryPriorityPanel rows={rows} />

      <InventorySummaryCards rows={rows} />

      <InventoryStatusFilterBar
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

function InventoryPriorityPanel({ rows }: { rows: StockItem[] }) {
  const summary = getInventoryStockSummary(rows);
  const hasAlerts = summary.attention > 0;
  const headline = summary.outOfStock
    ? "Primero revisa productos sin stock"
    : summary.lowStock
      ? "Hay productos cerca del mínimo"
      : "Inventario listo para operar";
  const helper = summary.outOfStock
    ? "Hay productos que no deberían prometerse en venta hasta reponer existencias."
    : summary.lowStock
      ? "Todavía pueden venderse, pero conviene preparar reposición antes de agotarlos."
      : "No hay alertas críticas visibles. Mantén seguimiento de movimientos y ventas.";

  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        mb: 2,
        borderColor: alpha(
          hasAlerts ? theme.palette.warning.main : theme.palette.success.main,
          0.24,
        ),
        bgcolor: alpha(
          hasAlerts ? theme.palette.warning.main : theme.palette.success.main,
          theme.palette.mode === "dark" ? 0.08 : 0.05,
        ),
      })}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
        >
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Box
              sx={(theme) => ({
                display: "grid",
                placeItems: "center",
                flex: "0 0 auto",
                width: 44,
                height: 44,
                borderRadius: 3,
                color: hasAlerts
                  ? theme.palette.warning.main
                  : theme.palette.success.main,
                bgcolor: alpha(
                  hasAlerts ? theme.palette.warning.main : theme.palette.success.main,
                  0.14,
                ),
              })}
            >
              {summary.outOfStock ? <ErrorOutlineIcon /> : <WarningAmberIcon />}
            </Box>

            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle1" fontWeight={900}>
                {headline}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {helper}
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
          >
            <Chip color="error" variant="outlined" label={`Sin stock · ${summary.outOfStock}`} />
            <Chip color="warning" variant="outlined" label={`Bajo mínimo · ${summary.lowStock}`} />
            <Chip color="success" variant="outlined" label={`Listos · ${summary.available}`} />
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

function InventorySummaryCards({ rows }: { rows: StockItem[] }) {
  const summary = getInventoryStockSummary(rows);
  const cards = [
    {
      label: "Productos monitoreados",
      value: summary.total,
      description: "Registros de stock visibles en inventario.",
      color: "primary" as const,
      icon: <Inventory2Icon />,
    },
    {
      label: "Stock saludable",
      value: summary.available,
      description: "Productos con unidades por encima del mínimo.",
      color: "success" as const,
      icon: <CheckCircleIcon />,
    },
    {
      label: "Requieren atención",
      value: summary.attention,
      description: `${summary.lowStock} bajo stock · ${summary.outOfStock} sin stock`,
      color: summary.attention > 0 ? ("warning" as const) : ("info" as const),
      icon: <WarningAmberIcon />,
    },
    {
      label: "Unidades totales",
      value: summary.units,
      description: `${summary.categories} categoría${summary.categories === 1 ? "" : "s"} visible${summary.categories === 1 ? "" : "s"}`,
      color: "info" as const,
      icon: <LocalShippingIcon />,
    },
  ];

  return (
    <Box
      sx={{
        display: "grid",
        gap: { xs: 1.5, sm: 2 },
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        mb: 2,
      }}
    >
      {cards.map((card) => (
        <VisualMetricCard
          key={card.label}
          tone={card.color}
          helper={card.description}
          icon={card.icon}
          label={card.label}
          value={card.value}
        />
      ))}
    </Box>
  );
}

function InventoryStatusFilterBar({
  rows,
  value,
  onChange,
}: {
  rows: StockItem[];
  value: StockStatusFilter;
  onChange: (value: StockStatusFilter) => void;
}) {
  const summary = getInventoryStockSummary(rows);
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
        borderColor: alpha(theme.palette.primary.main, 0.16),
      })}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", md: "center" }}
          justifyContent="space-between"
        >
          <Box>
            <Typography variant="subtitle1" fontWeight={900}>
              Vista rápida de existencias
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Divide el catálogo por salud de stock para priorizar reposición,
              merma o revisión de productos sin unidades.
            </Typography>
          </Box>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{ width: { xs: "100%", md: "auto" } }}
          >
            {options.map((option) => (
              <Chip
                key={option.value}
                clickable
                color={option.color}
                variant={value === option.value ? "filled" : "outlined"}
                label={`${STOCK_FILTER_LABELS[option.value]} · ${option.count}`}
                onClick={() => onChange(option.value)}
                sx={{ flexGrow: { xs: 1, sm: 0 } }}
              />
            ))}
          </Stack>
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
          sx={{
            px: { xs: 2, sm: 2.5 },
            py: 2,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Existencias actuales
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Control rápido del stock real por producto, con estado visual
                para reposición.
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

function formatSingleStockLocation(location: { warehouseName: string }) {
  return `Ubicación: Almacén ${getWarehouseDisplayName(location.warehouseName)}`;
}

function getLocationShare(quantity: number, totalStock: number) {
  if (quantity <= 0 || totalStock <= 0) return 0;
  return Math.max(4, Math.min((quantity / totalStock) * 100, 100));
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
      label: "Bajo mínimo",
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
  const progressValue = minStock > 0 ? Math.min((stock / minStock) * 100, 100) : 100;
  const stockLocations = getStockLocations(item);
  const hasMultipleLocations = stockLocations.length > 1;
  const singleLocation = stockLocations[0];

  return (
    <Box
      data-testid={`inventory-stock-item-${item.sku}`}
      sx={(theme) => ({
        display: "grid",
        gap: { xs: 1, md: 1.5 },
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1.15fr) minmax(270px, 0.85fr)",
        },
        px: { xs: 1.5, sm: 2 },
        py: { xs: 1.35, sm: 1.55 },
        borderLeft: 4,
        borderColor: `${stockStatus.color}.main`,
        background: alpha(theme.palette[stockStatus.color].main, 0.035),
        "&:hover": {
          backgroundColor: alpha(theme.palette[stockStatus.color].main, 0.07),
        },
      })}
    >
      <Stack spacing={0.9} sx={{ minWidth: 0 }}>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
        >
          <Box sx={{ minWidth: 0 }}>
            <Typography
              variant="subtitle1"
              fontWeight={900}
              sx={{ overflowWrap: "anywhere" }}
            >
              {item.name}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {item.category?.name ?? "Sin categoría"}
            </Typography>
          </Box>

          <Chip
            data-testid={`inventory-stock-status-${item.sku}`}
            color={hasMultipleLocations ? "info" : stockStatus.color}
            variant="outlined"
            label={hasMultipleLocations ? `${stockLocations.length} almacenes` : stockStatus.label}
          />
        </Stack>

        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
          <Chip size="small" variant="outlined" label={`Clave interna/SKU: ${item.sku}`} />
          {item.barcode && (
            <Chip
              size="small"
              variant="outlined"
              label={`Código del producto: ${item.barcode}`}
            />
          )}
        </Stack>
      </Stack>

      <Box
        sx={(theme) => ({
          border: 1,
          borderColor: alpha(theme.palette[stockStatus.color].main, 0.18),
          borderRadius: 3,
          p: { xs: 1.1, sm: 1.25 },
          bgcolor: alpha(
            theme.palette.background.paper,
            theme.palette.mode === "dark" ? 0.18 : 0.72,
          ),
          minWidth: 0,
        })}
      >
        <Stack spacing={hasMultipleLocations ? 0.95 : 0.8}>
          <Stack
            direction="row"
            spacing={1}
            alignItems="flex-start"
            justifyContent="space-between"
          >
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                {hasMultipleLocations ? "Stock total" : "Stock actual"}
              </Typography>
              <Typography variant="h5" fontWeight={900} lineHeight={1.08}>
                {item.stock} unidad{item.stock === 1 ? "" : "es"}
              </Typography>
            </Box>

            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ pt: 0.35, textAlign: "right", flex: "0 0 auto" }}
            >
              Mínimo: {item.minStock}
            </Typography>
          </Stack>

          {hasMultipleLocations ? (
            <Stack spacing={0.85}>
              <Typography variant="caption" color="text.secondary">
                {stockStatus.helper}
              </Typography>
              <Typography variant="caption" color="text.secondary" fontWeight={800}>
                Distribución por almacén
              </Typography>

              {stockLocations.map((location) => {
                const locationStatus = getLocationStatus(location.quantity, minStock);
                return (
                  <Box
                    key={`${item.id}-${location.warehouseId}`}
                    data-testid={`inventory-stock-location-${item.sku}-${location.warehouseId}`}
                    sx={(theme) => ({
                      border: 1,
                      borderColor: alpha(theme.palette[locationStatus.color].main, 0.2),
                      borderRadius: 2,
                      bgcolor: alpha(theme.palette[locationStatus.color].main, 0.045),
                      p: 0.85,
                    })}
                  >
                    <Stack spacing={0.65}>
                      <Stack
                        direction="row"
                        spacing={1}
                        alignItems="center"
                        justifyContent="space-between"
                      >
                        <Typography variant="body2" fontWeight={850} sx={{ overflowWrap: "anywhere" }}>
                          Almacén: {getWarehouseDisplayName(location.warehouseName)}
                        </Typography>
                        <Typography variant="body2" fontWeight={900}>
                          {location.quantity} disponible{location.quantity === 1 ? "" : "s"}
                        </Typography>
                      </Stack>

                      <LinearProgress
                        color={locationStatus.color}
                        variant="determinate"
                        value={getLocationShare(location.quantity, stock)}
                        sx={{ height: 7, borderRadius: 99 }}
                      />

                      <Typography variant="caption" color="text.secondary">
                        {locationStatus.label}
                      </Typography>
                    </Stack>
                  </Box>
                );
              })}
            </Stack>
          ) : (
            <>
              <LinearProgress
                color={stockStatus.color}
                variant="determinate"
                value={progressValue}
                sx={{ height: 8, borderRadius: 99 }}
              />
              <Typography variant="caption" color="text.secondary">
                {singleLocation
                  ? formatSingleStockLocation(singleLocation)
                  : "Sin unidades asignadas a almacén."}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stockStatus.helper}
              </Typography>
            </>
          )}
        </Stack>
      </Box>
    </Box>
  );
}

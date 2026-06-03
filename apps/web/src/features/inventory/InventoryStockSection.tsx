import { useState } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, type Theme } from "@mui/material/styles";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";

import { EmptyStatePanel } from "../../components/data-display";
import { SearchToolbar } from "../../components/SearchToolbar";
import { VisualMetricCard } from "../../components/VisualMetricCard";
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
            <Chip color="warning" variant="outlined" label={`Bajo stock · ${summary.lowStock}`} />
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

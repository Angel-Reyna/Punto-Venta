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
import { alpha } from "@mui/material/styles";

import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

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

function InventoryStockItem({ item }: { item: StockItem }) {
  const stockStatus = getStockStatus(item);

  return (
    <Box
      sx={(theme) => ({
        display: "grid",
        gap: { xs: 1.5, md: 2 },
        gridTemplateColumns: {
          xs: "1fr",
          md: "minmax(0, 1.5fr) minmax(180px, 0.7fr) minmax(180px, 0.7fr)",
        },
        px: { xs: 2, sm: 2.5 },
        py: { xs: 2, sm: 2.25 },
        borderLeft: 4,
        borderColor: `${stockStatus.color}.main`,
        background: alpha(theme.palette[stockStatus.color].main, 0.035),
        "&:hover": {
          backgroundColor: alpha(theme.palette[stockStatus.color].main, 0.07),
        },
      })}
    >
      <Stack spacing={0.75} sx={{ minWidth: 0 }}>
        <Typography
          variant="subtitle1"
          fontWeight={900}
          sx={{ overflowWrap: "anywhere" }}
        >
          {item.name}
        </Typography>

        <Stack
          direction="row"
          spacing={1}
          useFlexGap
          flexWrap="wrap"
          alignItems="center"
        >
          <Chip size="small" variant="outlined" label={item.sku} />
          {item.barcode && (
            <Chip size="small" variant="outlined" label={item.barcode} />
          )}
          <Chip
            size="small"
            variant="outlined"
            label={item.category?.name ?? "Sin categoría"}
          />
        </Stack>
      </Stack>

      <Stack spacing={0.75}>
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          Stock actual
        </Typography>
        <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
          <Chip
            color={stockStatus.color}
            label={`${item.stock} unidad${item.stock === 1 ? "" : "es"}`}
          />
          <Chip
            color={stockStatus.color}
            variant="outlined"
            label={stockStatus.label}
          />
        </Stack>
        <Typography variant="caption" color="text.secondary">
          {stockStatus.helper}
        </Typography>
      </Stack>

      <Stack spacing={0.75}>
        <Typography variant="caption" color="text.secondary" fontWeight={800}>
          Reposición
        </Typography>
        <Typography variant="body2" fontWeight={700}>
          Stock mínimo: {item.minStock}
        </Typography>
        {item.lowStock && (
          <Typography variant="body2" color="warning.main">
            Requiere revisión de existencias.
          </Typography>
        )}
      </Stack>
    </Box>
  );
}

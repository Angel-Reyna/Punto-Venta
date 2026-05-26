import type { ReactElement, ReactNode } from "react";

import {
  Box,
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { GridColDef } from "@mui/x-data-grid";

import AddCircleIcon from "@mui/icons-material/AddCircle";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import HistoryIcon from "@mui/icons-material/History";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import LocalShippingIcon from "@mui/icons-material/LocalShipping";
import RemoveCircleIcon from "@mui/icons-material/RemoveCircle";
import ReplayIcon from "@mui/icons-material/Replay";
import TuneIcon from "@mui/icons-material/Tune";
import WarningAmberIcon from "@mui/icons-material/WarningAmber";

import { LabelWithInfo } from "../../components/InfoTooltip";

export type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};

export type StockItem = {
  id: string;
  sku: string;
  barcode?: string | null;
  name: string;
  category?: {
    id: string;
    name: string;
  } | null;
  minStock: number;
  stock: number;
  lowStock: boolean;
};

export type Warehouse = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

export type Movement = {
  id: string;
  type: "IN" | "OUT" | "ADJUSTMENT" | "SALE" | "RETURN";
  quantity: number;
  reason?: string | null;
  createdAt: string;

  productId?: string | null;
  productSku: string;
  productName: string;

  product?: {
    id: string;
    sku: string;
    barcode?: string | null;
    name: string;
  } | null;

  warehouse?: {
    id: string;
    name: string;
  } | null;
};

export type InventoryMovementForm = {
  productId: string;
  warehouseId: string;
  quantity: number;
  reason: string;
};

export type StockStatusFilter = "all" | "available" | "low" | "out";

type InventoryMetricColor =
  | "primary"
  | "success"
  | "warning"
  | "error"
  | "info";
type InventoryView = "stock" | "adjustments" | "movements";

export const initialInventoryMovementForm: InventoryMovementForm = {
  productId: "",
  warehouseId: "",
  quantity: 1,
  reason: "",
};

export const WAREHOUSE_INFO_TEXT =
  "Ubicación donde se registra el stock. Si lo dejas vacío, el movimiento se aplica al almacén principal.";

const MOVEMENT_TYPE_INFO_TEXT =
  "IN es entrada, OUT salida manual, SALE venta, RETURN devolución y ADJUSTMENT ajuste de inventario.";

const STOCK_FILTER_LABELS: Record<StockStatusFilter, string> = {
  all: "Todos",
  available: "Disponibles",
  low: "Bajo stock",
  out: "Sin stock",
};

function renderHeaderWithInfo(label: string, info: string) {
  return <LabelWithInfo label={label} info={info} ariaLabel={info} />;
}

function getStockStatus(item: StockItem) {
  if (item.stock <= 0) {
    return {
      color: "error" as const,
      helper: "Producto sin unidades disponibles.",
      label: "Sin stock",
    };
  }

  if (item.lowStock) {
    return {
      color: "warning" as const,
      helper: "Está en el umbral de reposición.",
      label: "Bajo inventario",
    };
  }

  return {
    color: "success" as const,
    helper: "Inventario suficiente para venta.",
    label: "Disponible",
  };
}

function getMovementTypeMeta(type: Movement["type"]) {
  const meta: Record<
    Movement["type"],
    {
      color: InventoryMetricColor;
      icon: ReactElement;
      label: string;
    }
  > = {
    ADJUSTMENT: {
      color: "info",
      icon: <TuneIcon fontSize="small" />,
      label: "Ajuste",
    },
    IN: {
      color: "success",
      icon: <AddCircleIcon fontSize="small" />,
      label: "Entrada",
    },
    OUT: {
      color: "warning",
      icon: <RemoveCircleIcon fontSize="small" />,
      label: "Salida",
    },
    RETURN: {
      color: "success",
      icon: <ReplayIcon fontSize="small" />,
      label: "Devolución",
    },
    SALE: {
      color: "warning",
      icon: <LocalShippingIcon fontSize="small" />,
      label: "Venta",
    },
  };

  return meta[type];
}

export function getInventoryFormDisabledReason(form: InventoryMovementForm) {
  if (!form.productId) return "Selecciona un producto.";
  if (form.quantity <= 0) return "La cantidad debe ser mayor a cero.";
  if (!form.reason.trim() || form.reason.trim().length < 3) {
    return "Captura un motivo de al menos 3 caracteres.";
  }

  return "";
}

export function isInventoryFormInvalid(form: InventoryMovementForm) {
  return Boolean(getInventoryFormDisabledReason(form));
}

export function getInventoryStockSummary(rows: StockItem[]) {
  const outOfStock = rows.filter((item) => item.stock <= 0).length;
  const lowStock = rows.filter(
    (item) => item.stock > 0 && item.lowStock,
  ).length;
  const available = rows.filter(
    (item) => item.stock > 0 && !item.lowStock,
  ).length;
  const units = rows.reduce((total, item) => total + item.stock, 0);
  const categories = new Set(
    rows.map((item) => item.category?.name).filter(Boolean),
  ).size;

  return {
    total: rows.length,
    available,
    lowStock,
    outOfStock,
    attention: lowStock + outOfStock,
    categories,
    units,
  };
}

export function filterStockRowsByStatus(
  rows: StockItem[],
  status: StockStatusFilter,
) {
  if (status === "available") {
    return rows.filter((item) => item.stock > 0 && !item.lowStock);
  }

  if (status === "low") {
    return rows.filter((item) => item.stock > 0 && item.lowStock);
  }

  if (status === "out") {
    return rows.filter((item) => item.stock <= 0);
  }

  return rows;
}

function InventoryMetricCard({
  color,
  helper,
  icon,
  label,
  value,
}: {
  color: InventoryMetricColor;
  helper: string;
  icon: ReactNode;
  label: string;
  value: number | string;
}) {
  return (
    <Card
      variant="outlined"
      sx={(theme) => ({
        height: "100%",
        borderColor: alpha(theme.palette[color].main, 0.28),
        background: `linear-gradient(135deg, ${alpha(
          theme.palette[color].main,
          0.1,
        )}, ${alpha(theme.palette.background.paper, 0.94)})`,
      })}
    >
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Box
            sx={(theme) => ({
              display: "grid",
              placeItems: "center",
              width: 42,
              height: 42,
              borderRadius: 2,
              color: theme.palette[color].main,
              bgcolor: alpha(theme.palette[color].main, 0.12),
              flexShrink: 0,
            })}
          >
            {icon}
          </Box>

          <Stack spacing={0.25} sx={{ minWidth: 0 }}>
            <Typography variant="h5" fontWeight={900} lineHeight={1.1}>
              {value}
            </Typography>
            <Typography variant="body2" fontWeight={800}>
              {label}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function InventoryControlHero({
  activeView,
  canAdjustInventory,
  movementsCount,
  onViewChange,
  stockRows,
}: {
  activeView: InventoryView;
  canAdjustInventory: boolean;
  movementsCount: number;
  onViewChange: (value: InventoryView) => void;
  stockRows: StockItem[];
}) {
  const summary = getInventoryStockSummary(stockRows);

  return (
    <Card
      data-testid="inventory-visual-dashboard"
      sx={(theme) => ({
        mb: 2,
        overflow: "hidden",
        border: 1,
        borderColor: alpha(theme.palette.primary.main, 0.18),
        background: `linear-gradient(135deg, ${alpha(
          theme.palette.primary.main,
          0.14,
        )}, ${alpha(theme.palette.background.paper, 0.96)} 48%, ${alpha(
          theme.palette.warning.main,
          summary.attention > 0 ? 0.1 : 0.03,
        )})`,
      })}
    >
      <CardContent>
        <Stack spacing={2.5}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={1} sx={{ maxWidth: 720 }}>
              <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                <Chip
                  color={canAdjustInventory ? "primary" : "success"}
                  label={
                    canAdjustInventory
                      ? "Permiso: lectura y ajuste"
                      : "Permiso: solo consulta"
                  }
                />
                <Chip
                  color={summary.attention > 0 ? "warning" : "success"}
                  variant="outlined"
                  label={
                    summary.attention > 0
                      ? `${summary.attention} alerta${summary.attention === 1 ? "" : "s"} de stock`
                      : "Stock operativo estable"
                  }
                />
              </Stack>

              <Box>
                <Typography variant="h5" fontWeight={900}>
                  Control de inventario
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Revisa existencias, detecta reposición y consulta movimientos
                  con una lectura más visual antes de registrar ajustes
                  manuales.
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
              <Chip
                icon={<Inventory2Icon />}
                label={`${summary.total} productos`}
              />
              <Chip
                icon={<HistoryIcon />}
                label={`${movementsCount} movimientos`}
              />
            </Stack>
          </Stack>

          <Tabs
            value={activeView}
            onChange={(_event, value: InventoryView) => onViewChange(value)}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label="Secciones de inventario"
            sx={(theme) => ({
              minHeight: 44,
              "& .MuiTabs-flexContainer": {
                gap: 1,
              },
              "& .MuiTab-root": {
                border: 1,
                borderColor: "divider",
                borderRadius: 999,
                minHeight: 40,
                textTransform: "none",
              },
              "& .Mui-selected": {
                bgcolor: alpha(theme.palette.primary.main, 0.1),
              },
            })}
          >
            <Tab value="stock" label="Existencias" />
            <Tab value="adjustments" label="Entradas y salidas" />
            <Tab value="movements" label="Historial" />
          </Tabs>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function InventorySummaryCards({ rows }: { rows: StockItem[] }) {
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
        gap: 2,
        gridTemplateColumns: {
          xs: "1fr",
          sm: "repeat(2, minmax(0, 1fr))",
          lg: "repeat(4, minmax(0, 1fr))",
        },
        mb: 2,
      }}
    >
      {cards.map((card) => (
        <InventoryMetricCard
          key={card.label}
          color={card.color}
          helper={card.description}
          icon={card.icon}
          label={card.label}
          value={card.value}
        />
      ))}
    </Box>
  );
}

export function InventoryStatusFilterBar({
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

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {options.map((option) => (
              <Chip
                key={option.value}
                clickable
                color={option.color}
                variant={value === option.value ? "filled" : "outlined"}
                label={`${STOCK_FILTER_LABELS[option.value]} · ${option.count}`}
                onClick={() => onChange(option.value)}
              />
            ))}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function buildMovementColumns(): GridColDef<Movement>[] {
  return [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 190,
      valueFormatter: (value) => new Date(value).toLocaleString(),
    },
    {
      field: "product",
      headerName: "Producto",
      flex: 1,
      minWidth: 240,
      valueGetter: (_value, row) => {
        const sku = row.product?.sku ?? row.productSku;
        const name = row.product?.name ?? `${row.productName} (eliminado)`;
        const barcode = row.product?.barcode ? ` · ${row.product.barcode}` : "";

        return `${sku}${barcode} · ${name}`;
      },
    },
    {
      field: "warehouse",
      headerName: "Almacén",
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) => row.warehouse?.name ?? "Sin almacén",
    },
    {
      field: "type",
      headerName: "Tipo",
      renderHeader: () => renderHeaderWithInfo("Tipo", MOVEMENT_TYPE_INFO_TEXT),
      width: 130,
      renderCell: (params) => {
        const meta = getMovementTypeMeta(params.value);

        return (
          <Chip
            size="small"
            icon={meta.icon}
            label={meta.label}
            color={meta.color}
          />
        );
      },
    },
    {
      field: "quantity",
      headerName: "Cantidad",
      width: 120,
    },
    {
      field: "reason",
      headerName: "Motivo",
      flex: 1,
      minWidth: 240,
      valueGetter: (_value, row) => row.reason || "N/A",
    },
  ];
}

export function InventoryStockOverview({
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
          <Stack
            spacing={1}
            alignItems="center"
            sx={{ py: 4, textAlign: "center" }}
          >
            <Typography variant="h6" fontWeight={800}>
              {searchQuery.trim()
                ? "No hay existencias que coincidan con la búsqueda"
                : statusFilter === "all"
                  ? "No hay existencias registradas"
                  : "No hay productos en esta división"}
            </Typography>
            <Typography color="text.secondary">
              {searchQuery.trim()
                ? "Intenta buscar por nombre, clave interna/SKU, código o categoría."
                : statusFilter === "all"
                  ? "Cuando crees productos con stock inicial o registres entradas, aparecerán aquí."
                  : "Cambia el filtro de estado para revisar otros grupos de inventario."}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}>
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
          {rows.map((item) => {
            const stockStatus = getStockStatus(item);

            return (
              <Box
                key={item.id}
                sx={(theme) => ({
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1.5fr) minmax(180px, 0.7fr) minmax(180px, 0.7fr)",
                  },
                  px: 2.5,
                  py: 2.25,
                  borderLeft: 4,
                  borderColor: `${stockStatus.color}.main`,
                  background: alpha(
                    theme.palette[stockStatus.color].main,
                    0.035,
                  ),
                  "&:hover": {
                    backgroundColor: alpha(
                      theme.palette[stockStatus.color].main,
                      0.07,
                    ),
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
                      <Chip
                        size="small"
                        variant="outlined"
                        label={item.barcode}
                      />
                    )}
                    <Chip
                      size="small"
                      variant="outlined"
                      label={item.category?.name ?? "Sin categoría"}
                    />
                  </Stack>
                </Stack>

                <Stack spacing={0.75}>
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={800}
                  >
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
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    fontWeight={800}
                  >
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
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

export function InventoryMovementTimeline({
  movements,
  searchQuery,
}: {
  movements: Movement[];
  searchQuery: string;
}) {
  if (movements.length === 0) {
    return (
      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            spacing={1}
            alignItems="center"
            sx={{ py: 4, textAlign: "center" }}
          >
            <Typography variant="h6" fontWeight={900}>
              {searchQuery.trim()
                ? "No hay movimientos que coincidan con la búsqueda"
                : "No hay movimientos de inventario registrados"}
            </Typography>
            <Typography color="text.secondary">
              {searchQuery.trim()
                ? "Busca por tipo, producto, SKU, almacén o motivo."
                : "Las entradas, salidas, ventas y devoluciones aparecerán aquí con trazabilidad."}
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box sx={{ px: 2.5, py: 2, borderBottom: 1, borderColor: "divider" }}>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Historial operativo
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Línea de tiempo de entradas, salidas, ventas y devoluciones que
                afectan stock.
              </Typography>
            </Box>

            <Chip
              color="primary"
              variant="outlined"
              label={`${movements.length} movimiento${movements.length === 1 ? "" : "s"}`}
            />
          </Stack>
        </Box>

        <Stack sx={{ p: 2.5 }} spacing={1.5}>
          {movements.map((movement, index) => {
            const meta = getMovementTypeMeta(movement.type);
            const productSku = movement.product?.sku ?? movement.productSku;
            const productName =
              movement.product?.name ?? `${movement.productName} (eliminado)`;
            const barcode = movement.product?.barcode;

            return (
              <Box
                key={movement.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "auto minmax(0, 1fr)",
                  gap: 1.5,
                }}
              >
                <Stack alignItems="center" sx={{ pt: 0.25 }}>
                  <Box
                    sx={(theme) => ({
                      display: "grid",
                      placeItems: "center",
                      width: 36,
                      height: 36,
                      borderRadius: "50%",
                      color: theme.palette[meta.color].main,
                      bgcolor: alpha(theme.palette[meta.color].main, 0.12),
                      border: `1px solid ${alpha(theme.palette[meta.color].main, 0.28)}`,
                    })}
                  >
                    {meta.icon}
                  </Box>
                  {index < movements.length - 1 && (
                    <Box
                      sx={{ width: 2, flex: 1, bgcolor: "divider", my: 0.75 }}
                    />
                  )}
                </Stack>

                <Card
                  variant="outlined"
                  data-testid={`inventory-movement-${movement.id}`}
                  sx={(theme) => ({
                    borderColor: alpha(theme.palette[meta.color].main, 0.24),
                    backgroundColor: alpha(
                      theme.palette[meta.color].main,
                      0.035,
                    ),
                  })}
                >
                  <CardContent>
                    <Stack spacing={1.25}>
                      <Stack
                        direction={{ xs: "column", sm: "row" }}
                        spacing={1}
                        alignItems={{ xs: "flex-start", sm: "center" }}
                        justifyContent="space-between"
                      >
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                        >
                          <Chip
                            color={meta.color}
                            icon={meta.icon}
                            label={meta.label}
                          />
                          <Chip
                            variant="outlined"
                            label={`${movement.quantity} unidad${movement.quantity === 1 ? "" : "es"}`}
                          />
                        </Stack>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                          fontWeight={800}
                        >
                          {new Date(movement.createdAt).toLocaleString()}
                        </Typography>
                      </Stack>

                      <Box>
                        <Typography
                          variant="subtitle1"
                          fontWeight={900}
                          sx={{ overflowWrap: "anywhere" }}
                        >
                          {productName}
                        </Typography>
                        <Stack
                          direction="row"
                          spacing={1}
                          useFlexGap
                          flexWrap="wrap"
                          sx={{ mt: 0.75 }}
                        >
                          <Chip
                            size="small"
                            variant="outlined"
                            label={productSku}
                          />
                          {barcode && (
                            <Chip
                              size="small"
                              variant="outlined"
                              label={barcode}
                            />
                          )}
                          <Chip
                            size="small"
                            variant="outlined"
                            label={movement.warehouse?.name ?? "Sin almacén"}
                          />
                        </Stack>
                      </Box>

                      <Typography variant="body2" color="text.secondary">
                        {movement.reason || "Sin motivo capturado."}
                      </Typography>
                    </Stack>
                  </CardContent>
                </Card>
              </Box>
            );
          })}
        </Stack>
      </CardContent>
    </Card>
  );
}

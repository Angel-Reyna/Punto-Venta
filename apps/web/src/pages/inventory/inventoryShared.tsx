import {
  Card,
  CardContent,
  Chip,
  Divider,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";

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

  product: {
    id: string;
    sku: string;
    barcode?: string | null;
    name: string;
  };

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

function renderHeaderWithInfo(label: string, info: string) {
  return <LabelWithInfo label={label} info={info} ariaLabel={info} />;
}

function getStockStatus(item: StockItem) {
  if (item.stock <= 0) {
    return { color: "error" as const, label: "Sin stock" };
  }

  if (item.lowStock) {
    return { color: "warning" as const, label: "Bajo inventario" };
  }

  return { color: "success" as const, label: "Disponible" };
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
      valueGetter: (_value, row) =>
        row.product
          ? `${row.product.sku}${row.product.barcode ? ` · ${row.product.barcode}` : ""} · ${row.product.name}`
          : "N/A",
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
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value}
          color={
            params.value === "IN" || params.value === "RETURN"
              ? "success"
              : params.value === "OUT" || params.value === "SALE"
                ? "warning"
                : "default"
          }
        />
      ),
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
}: {
  rows: StockItem[];
  searchQuery: string;
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
                : "No hay existencias registradas"}
            </Typography>
            <Typography color="text.secondary">
              {searchQuery.trim()
                ? "Intenta buscar por nombre, clave interna/SKU, código o categoría."
                : "Cuando crees productos con stock inicial o registres entradas, aparecerán aquí."}
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
                sx={{
                  display: "grid",
                  gap: 2,
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1.5fr) minmax(180px, 0.7fr) minmax(180px, 0.7fr)",
                  },
                  px: 2.5,
                  py: 2.25,
                  "&:hover": {
                    backgroundColor: "action.hover",
                  },
                }}
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

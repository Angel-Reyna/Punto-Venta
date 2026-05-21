import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { ActionDisabledReason } from "../components/ActionDisabledReason";
import { DataGridCard } from "../components/DataGridCard";
import { LabelWithInfo } from "../components/InfoTooltip";
import { PageHeader } from "../components/PageHeader";
import { SearchToolbar } from "../components/SearchToolbar";
import { StatusFeedback } from "../components/StatusFeedback";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../auth/permissions";
import { getApiErrorMessage } from "../utils/apiError";

type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};

type StockItem = {
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

type Warehouse = {
  id: string;
  name: string;
  description?: string | null;
  isActive: boolean;
};

type Movement = {
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

const WAREHOUSE_INFO_TEXT =
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

function InventoryStockOverview({
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

export function InventoryPage() {
  const { can } = useAuth();
  const canAdjustInventory = can(PERMISSIONS.InventoryAdjust);

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockRows, setStockRows] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [stockSearch, setStockSearch] = useState("");
  const [movementSearch, setMovementSearch] = useState("");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    productId: "",
    warehouseId: "",
    quantity: 1,
    reason: "",
  });

  async function loadStaticData() {
    try {
      setError("");

      const [productsResponse, warehousesResponse] = await Promise.all([
        api.get<Product[]>("/products", {
          params: {
            pageSize: 100,
          },
        }),
        api.get<Warehouse[]>("/inventory/warehouses"),
      ]);

      setProducts(productsResponse.data);
      setWarehouses(warehousesResponse.data);
    } catch {
      setError("No se pudo cargar productos ni almacenes de inventario.");
    }
  }

  async function loadStock(query = stockSearch) {
    try {
      setError("");

      const response = await api.get<StockItem[]>("/inventory/stock", {
        params: {
          q: query.trim() || undefined,
          pageSize: 100,
        },
      });

      setStockRows(response.data);
    } catch {
      setError("No se pudieron cargar las existencias actuales.");
    }
  }

  async function loadMovements(query = movementSearch) {
    try {
      setError("");

      const response = await api.get<Movement[]>("/inventory/movements", {
        params: {
          q: query.trim() || undefined,
          pageSize: 100,
        },
      });

      setMovements(response.data);
    } catch {
      setError("No se pudieron cargar los movimientos recientes.");
    }
  }

  async function reloadInventoryViews() {
    await Promise.all([
      loadStaticData(),
      loadStock(stockSearch),
      loadMovements(movementSearch),
    ]);
  }

  useEffect(() => {
    void loadStaticData();
  }, []);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadStock(stockSearch);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [stockSearch]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      void loadMovements(movementSearch);
    }, 250);

    return () => window.clearTimeout(timeoutId);
  }, [movementSearch]);

  async function submit(type: "in" | "out") {
    setMessage("");
    setError("");

    try {
      await api.post(`/inventory/${type}`, {
        productId: form.productId,

        warehouseId: form.warehouseId || undefined,

        quantity: form.quantity,

        reason: form.reason.trim(),
      });

      setMessage(
        type === "in"
          ? "Entrada registrada correctamente."
          : "Salida registrada correctamente.",
      );

      setForm({
        productId: "",
        warehouseId: "",
        quantity: 1,
        reason: "",
      });

      await reloadInventoryViews();
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo registrar el movimiento. Verifica producto, cantidad y motivo.",
        ),
      );
    }
  }

  const columns: GridColDef[] = [
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

  const formIsInvalid =
    !form.productId ||
    !form.reason.trim() ||
    form.reason.trim().length < 3 ||
    form.quantity <= 0;

  const inventoryFormDisabledReason = (() => {
    if (!form.productId) return "Selecciona un producto.";
    if (form.quantity <= 0) return "La cantidad debe ser mayor a cero.";
    if (!form.reason.trim() || form.reason.trim().length < 3) {
      return "Captura un motivo de al menos 3 caracteres.";
    }

    return "";
  })();

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle={
          canAdjustInventory
            ? "Consulta movimientos y registra entradas o salidas manuales con validación de stock."
            : "Consulta movimientos, almacenes y stock disponible. Los ajustes manuales requieren permiso administrativo."
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={canAdjustInventory ? "primary" : "success"}
          label={
            canAdjustInventory
              ? "Permiso: lectura y ajuste de inventario"
              : "Permiso: consulta de inventario"
          }
        />
      </Box>

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

      <SearchToolbar
        label="Buscar existencias"
        placeholder="Ej. COCA-600, refresco, 750..., bebidas"
        query={stockSearch}
        onQueryChange={setStockSearch}
        resultCount={stockRows.length}
        helperText="Busca productos por nombre, clave interna/SKU, código o categoría para revisar su stock real."
      />

      <InventoryStockOverview rows={stockRows} searchQuery={stockSearch} />

      {canAdjustInventory && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  md: "row",
                },
                gap: 2,
              }}
            >
              <TextField
                select
                fullWidth
                label="Producto"
                value={form.productId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    productId: event.target.value,
                  })
                }
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 320,
                  },
                }}
              >
                {products.map((product) => (
                  <MenuItem key={product.id} value={product.id}>
                    {product.sku} · {product.name} · stock {product.stock}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                select
                fullWidth
                label={
                  <LabelWithInfo
                    label="Almacén"
                    info={WAREHOUSE_INFO_TEXT}
                    ariaLabel={WAREHOUSE_INFO_TEXT}
                  />
                }
                value={form.warehouseId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    warehouseId: event.target.value,
                  })
                }
                helperText="Si no eliges almacén, se usará el principal"
              >
                <MenuItem value="">Almacén principal automático</MenuItem>

                {warehouses.map((warehouse) => (
                  <MenuItem key={warehouse.id} value={warehouse.id}>
                    {warehouse.name}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                fullWidth
                label="Cantidad"
                type="number"
                value={form.quantity}
                inputProps={{
                  min: 1,
                }}
                onChange={(event) =>
                  setForm({
                    ...form,
                    quantity: Number(event.target.value),
                  })
                }
              />

              <TextField
                fullWidth
                label="Motivo del movimiento"
                value={form.reason}
                helperText="Mínimo 3 caracteres"
                onChange={(event) =>
                  setForm({
                    ...form,
                    reason: event.target.value,
                  })
                }
              />

              <Box>
                <Button
                  fullWidth
                  onClick={() => submit("in")}
                  disabled={formIsInvalid}
                >
                  Registrar entrada
                </Button>
                <ActionDisabledReason
                  message={formIsInvalid ? inventoryFormDisabledReason : ""}
                />
              </Box>

              <Box>
                <Button
                  fullWidth
                  color="warning"
                  onClick={() => submit("out")}
                  disabled={formIsInvalid}
                >
                  Registrar salida
                </Button>
                <ActionDisabledReason
                  message={formIsInvalid ? inventoryFormDisabledReason : ""}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <SearchToolbar
        label="Buscar movimientos"
        placeholder="Ej. entrada, salida, venta, producto, almacén o motivo"
        query={movementSearch}
        onQueryChange={setMovementSearch}
        resultCount={movements.length}
        helperText="Filtra movimientos recientes por producto, clave interna/SKU, código, almacén, tipo o motivo."
      />

      <DataGridCard
        rows={movements}
        columns={columns}
        minWidth={980}
        noRowsLabel="No hay movimientos de inventario registrados."
        tableLabel="Movimientos de inventario"
      />
    </>
  );
}

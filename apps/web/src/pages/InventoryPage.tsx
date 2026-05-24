import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

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
import {
  buildMovementColumns,
  getInventoryFormDisabledReason,
  initialInventoryMovementForm,
  InventoryStockOverview,
  isInventoryFormInvalid,
  WAREHOUSE_INFO_TEXT,
} from "./inventory/inventoryShared";
import type {
  Movement,
  Product,
  StockItem,
  Warehouse,
} from "./inventory/inventoryShared";

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

  const [form, setForm] = useState(initialInventoryMovementForm);

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

      setForm(initialInventoryMovementForm);

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

  const columns = buildMovementColumns();

  const inventoryFormDisabledReason = getInventoryFormDisabledReason(form);
  const formIsInvalid = isInventoryFormInvalid(form);

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
            <Grid container spacing={2} alignItems="flex-start">
              <Grid item xs={12} md={6}>
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
                >
                  {products.map((product) => (
                    <MenuItem key={product.id} value={product.id}>
                      {product.sku} · {product.name} · stock {product.stock}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>

              <Grid item xs={12} md={6}>
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
              </Grid>

              <Grid item xs={12} sm={4}>
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
              </Grid>

              <Grid item xs={12} sm={8}>
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
              </Grid>

              <Grid item xs={12}>
                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  sx={{
                    alignItems: { xs: "stretch", sm: "flex-start" },
                    justifyContent: "flex-end",
                  }}
                >
                  <Button onClick={() => submit("in")} disabled={formIsInvalid}>
                    Registrar entrada
                  </Button>

                  <Button
                    color="warning"
                    onClick={() => submit("out")}
                    disabled={formIsInvalid}
                  >
                    Registrar salida
                  </Button>
                </Stack>

                <ActionDisabledReason
                  message={formIsInvalid ? inventoryFormDisabledReason : ""}
                />
              </Grid>
            </Grid>
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

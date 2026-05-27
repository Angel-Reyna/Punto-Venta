import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { api } from "../../api/client";
import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { LabelWithInfo } from "../../components/InfoTooltip";
import { PageHeader } from "../../components/PageHeader";
import { SearchToolbar } from "../../components/SearchToolbar";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  InventoryControlHero,
  filterStockRowsByStatus,
  getInventoryFormDisabledReason,
  initialInventoryMovementForm,
  InventoryStatusFilterBar,
  InventoryMovementTimeline,
  InventoryStockOverview,
  InventorySummaryCards,
  isInventoryFormInvalid,
  WAREHOUSE_INFO_TEXT,
} from "./inventoryShared";
import type {
  Movement,
  Product,
  StockItem,
  StockStatusFilter,
  Warehouse,
} from "./inventoryShared";

type InventoryView = "stock" | "adjustments" | "movements";

export function InventoryPage() {
  const { can } = useAuth();
  const canAdjustInventory = can(PERMISSIONS.InventoryAdjust);

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [stockRows, setStockRows] = useState<StockItem[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [activeView, setActiveView] = useState<InventoryView>("stock");
  const [stockStatusFilter, setStockStatusFilter] =
    useState<StockStatusFilter>("all");
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
      setActiveView("stock");

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

  const filteredStockRows = filterStockRowsByStatus(
    stockRows,
    stockStatusFilter,
  );

  const inventoryFormDisabledReason = getInventoryFormDisabledReason(form);
  const formIsInvalid = isInventoryFormInvalid(form);

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle={
          canAdjustInventory
            ? "Consulta stock, divide productos por estado y registra entradas o salidas manuales con trazabilidad."
            : "Consulta stock disponible, alertas de reposición y movimientos. Los ajustes manuales requieren permiso administrativo."
        }
      />

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

      <InventoryControlHero
        activeView={activeView}
        canAdjustInventory={canAdjustInventory}
        movementsCount={movements.length}
        onViewChange={setActiveView}
        stockRows={stockRows}
      />

      {activeView === "stock" && (
        <>
          <SearchToolbar
            label="Buscar existencias"
            placeholder="Ej. COCA-600, refresco, 750..., bebidas"
            query={stockSearch}
            onQueryChange={setStockSearch}
            resultCount={filteredStockRows.length}
            helperText="Busca productos por nombre, clave interna/SKU, código o categoría para revisar su stock real."
          />

          <InventorySummaryCards rows={stockRows} />

          <InventoryStatusFilterBar
            rows={stockRows}
            value={stockStatusFilter}
            onChange={setStockStatusFilter}
          />

          <InventoryStockOverview
            rows={filteredStockRows}
            searchQuery={stockSearch}
            statusFilter={stockStatusFilter}
          />
        </>
      )}

      {activeView === "adjustments" && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Registrar entrada o salida manual
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Usa esta sección para ajustes operativos justificados. Las
                  ventas y devoluciones generan movimientos automáticamente.
                </Typography>
              </Box>

              {canAdjustInventory ? (
                <Grid container spacing={2} alignItems="flex-start">
                  <Grid item xs={12} md={6}>
                    <TextField
                      select
                      fullWidth
                      label="Producto"
                      value={form.productId}
                      inputProps={{
                        "data-testid": "inventory-form-product",
                      }}
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
                        "data-testid": "inventory-form-quantity",
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
                      inputProps={{
                        "data-testid": "inventory-form-reason",
                      }}
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
                      <Button
                        onClick={() => submit("in")}
                        disabled={formIsInvalid}
                        data-testid="inventory-submit-in"
                      >
                        Registrar entrada
                      </Button>

                      <Button
                        color="warning"
                        onClick={() => submit("out")}
                        disabled={formIsInvalid}
                        data-testid="inventory-submit-out"
                      >
                        Registrar salida
                      </Button>
                    </Stack>

                    <ActionDisabledReason
                      message={formIsInvalid ? inventoryFormDisabledReason : ""}
                    />
                  </Grid>
                </Grid>
              ) : (
                <Typography color="text.secondary">
                  Tu usuario puede consultar inventario, pero no registrar
                  ajustes manuales.
                </Typography>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeView === "movements" && (
        <>
          <SearchToolbar
            label="Buscar movimientos"
            placeholder="Ej. entrada, salida, venta, producto, almacén o motivo"
            query={movementSearch}
            onQueryChange={setMovementSearch}
            resultCount={movements.length}
            helperText="Filtra movimientos recientes por producto, clave interna/SKU, código, almacén, tipo o motivo."
          />

          <InventoryMovementTimeline
            movements={movements}
            searchQuery={movementSearch}
          />
        </>
      )}
    </>
  );
}

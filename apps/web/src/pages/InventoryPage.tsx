import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  TextField
} from "@mui/material";

import { GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { ActionDisabledReason } from "../components/ActionDisabledReason";
import { DataGridCard } from "../components/DataGridCard";
import { PageHeader } from "../components/PageHeader";
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
    name: string;
  };

  warehouse?: {
    id: string;
    name: string;
  } | null;
};

export function InventoryPage() {
  const { can } = useAuth();
  const canAdjustInventory = can(PERMISSIONS.InventoryAdjust);

  const [products, setProducts] = useState<Product[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    productId: "",
    warehouseId: "",
    quantity: 1,
    reason: ""
  });

  async function load() {
    try {
      setError("");

      const [
        productsResponse,
        warehousesResponse,
        movementsResponse
      ] = await Promise.all([
        api.get("/products"),
        api.get("/inventory/warehouses"),
        api.get("/inventory/movements")
      ]);

      setProducts(productsResponse.data);
      setWarehouses(warehousesResponse.data);
      setMovements(movementsResponse.data);
    } catch {
      setError("No se pudo cargar el inventario ni los movimientos recientes.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(type: "in" | "out") {
    setMessage("");
    setError("");

    try {
      await api.post(`/inventory/${type}`, {
        productId: form.productId,

        warehouseId: form.warehouseId || undefined,

        quantity: form.quantity,

        reason: form.reason.trim()
      });

      setMessage(
        type === "in"
          ? "Entrada registrada correctamente."
          : "Salida registrada correctamente."
      );

      setForm({
        productId: "",
        warehouseId: "",
        quantity: 1,
        reason: ""
      });

      await load();
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo registrar el movimiento. Verifica producto, cantidad y motivo."
        )
      );
    }
  }

  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 190,
      valueFormatter: (value) =>
        new Date(value).toLocaleString()
    },
    {
      field: "product",
      headerName: "Producto",
      flex: 1,
      minWidth: 240,
      valueGetter: (_value, row) =>
        row.product
          ? `${row.product.sku} · ${row.product.name}`
          : "N/A"
    },
    {
      field: "warehouse",
      headerName: "Almacén",
      flex: 1,
      minWidth: 180,
      valueGetter: (_value, row) =>
        row.warehouse?.name ?? "Sin almacén"
    },
    {
      field: "type",
      headerName: "Tipo",
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
      )
    },
    {
      field: "quantity",
      headerName: "Cantidad",
      width: 120
    },
    {
      field: "reason",
      headerName: "Motivo",
      flex: 1,
      minWidth: 240,
      valueGetter: (_value, row) => row.reason || "N/A"
    }
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

      {canAdjustInventory && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Box
              sx={{
                display: "flex",
                flexDirection: {
                  xs: "column",
                  md: "row"
                },
                gap: 2
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
                    productId: event.target.value
                  })
                }
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 320
                  }
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
                label="Almacén"
                value={form.warehouseId}
                onChange={(event) =>
                  setForm({
                    ...form,
                    warehouseId: event.target.value
                  })
                }
                helperText="Si no eliges almacén, se usará el principal"
              >
                <MenuItem value="">
                  Almacén principal automático
                </MenuItem>

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
                  min: 1
                }}
                onChange={(event) =>
                  setForm({
                    ...form,
                    quantity: Number(event.target.value)
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
                    reason: event.target.value
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
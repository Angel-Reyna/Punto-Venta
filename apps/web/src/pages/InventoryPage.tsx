import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  TextField
} from "@mui/material";

import {
  DataGrid,
  GridColDef
} from "@mui/x-data-grid";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

type Product = {
  id: string;
  name: string;
  sku: string;
  stock: number;
};

type Movement = {
  id: string;
  type: string;
  quantity: number;
  reason?: string;
  createdAt: string;
  product: Product;
};

export function InventoryPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<Movement[]>([]);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    productId: "",
    quantity: 1,
    reason: ""
  });

  async function load() {
    try {
      const productsResponse = await api.get("/products");
      const movementsResponse = await api.get("/inventory/movements");

      setProducts(productsResponse.data);
      setMovements(movementsResponse.data);
    } catch {
      setError("No se pudo cargar el inventario");
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(type: "in" | "out") {
    setMessage("");
    setError("");

    try {
      await api.post(`/inventory/${type}`, form);

      setMessage(
        type === "in"
          ? "Entrada registrada correctamente"
          : "Salida registrada correctamente"
      );

      setForm({
        productId: "",
        quantity: 1,
        reason: ""
      });

      await load();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ??
          "No se pudo registrar el movimiento"
      );
    }
  }

  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 190
    },
    {
      field: "product",
      headerName: "Producto",
      flex: 1,
      minWidth: 220,
      valueGetter: (_value, row) => row.product?.name
    },
    {
      field: "type",
      headerName: "Tipo",
      width: 120
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
      minWidth: 220
    }
  ];

  const formIsInvalid =
    !form.productId ||
    !form.reason.trim() ||
    form.reason.trim().length < 3 ||
    form.quantity <= 0;

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Entradas y salidas manuales exclusivas para ADMIN"
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color="primary"
          label="Acceso exclusivo ADMIN"
        />
      </Box>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
              label="Motivo"
              value={form.reason}
              helperText="Mínimo 3 caracteres"
              onChange={(event) =>
                setForm({
                  ...form,
                  reason: event.target.value
                })
              }
            />

            <Button
              fullWidth
              onClick={() => submit("in")}
              disabled={formIsInvalid}
            >
              Entrada
            </Button>

            <Button
              fullWidth
              color="warning"
              onClick={() => submit("out")}
              disabled={formIsInvalid}
            >
              Salida
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: 760 }}>
            <DataGrid
              autoHeight
              rows={movements}
              columns={columns}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
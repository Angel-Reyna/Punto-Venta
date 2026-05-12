import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
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
  const [products, setProducts] =
    useState<Product[]>([]);

  const [movements, setMovements] =
    useState<Movement[]>([]);

  const [form, setForm] = useState({
    productId: "",
    quantity: 1,
    reason: ""
  });

  async function load() {
    const productsResponse =
      await api.get("/products");

    const movementsResponse =
      await api.get(
        "/inventory/movements"
      );

    setProducts(productsResponse.data);
    setMovements(
      movementsResponse.data
    );
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(
    type: "in" | "out"
  ) {
    await api.post(
      `/inventory/${type}`,
      form
    );

    setForm({
      productId: "",
      quantity: 1,
      reason: ""
    });

    load();
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
      valueGetter: (
        _value,
        row
      ) => row.product?.name
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

  return (
    <>
      <PageHeader
        title="Inventario"
        subtitle="Entradas, salidas y movimientos"
      />

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
                  productId:
                    event.target.value
                })
              }
              sx={{
                minWidth: {
                  xs: "100%",
                  md: 320
                }
              }}
            >
              {products.map(
                (product) => (
                  <MenuItem
                    key={product.id}
                    value={product.id}
                  >
                    {product.sku} ·{" "}
                    {product.name} ·
                    stock{" "}
                    {product.stock}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
              fullWidth
              label="Cantidad"
              type="number"
              value={form.quantity}
              onChange={(event) =>
                setForm({
                  ...form,
                  quantity: Number(
                    event.target.value
                  )
                })
              }
            />

            <TextField
              fullWidth
              label="Motivo"
              value={form.reason}
              onChange={(event) =>
                setForm({
                  ...form,
                  reason:
                    event.target.value
                })
              }
            />

            <Button
              fullWidth
              onClick={() =>
                submit("in")
              }
              disabled={!form.productId}
            >
              Entrada
            </Button>

            <Button
              fullWidth
              color="warning"
              onClick={() =>
                submit("out")
              }
              disabled={!form.productId}
            >
              Salida
            </Button>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent
          sx={{
            overflowX: "auto"
          }}
        >
          <Box
            sx={{
              minWidth: 760
            }}
          >
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
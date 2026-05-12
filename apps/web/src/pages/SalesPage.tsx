import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  IconButton,
  MenuItem,
  TextField,
  Typography
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";

import {
  DataGrid,
  GridColDef
} from "@mui/x-data-grid";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";

type Product = {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  stock: number;
  promoPercent: number;
  isActive: boolean;
};

type CartItem = {
  productId: string;
  quantity: number;
};

export function SalesPage() {
  const [products, setProducts] =
    useState<Product[]>([]);

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [sales, setSales] =
    useState<any[]>([]);

  const [customerName, setCustomerName] =
    useState("");

  async function load() {
    const productsResponse =
      await api.get("/products");

    const salesResponse =
      await api.get("/sales");

    setProducts(
      productsResponse.data.filter(
        (product: Product) =>
          product.isActive
      )
    );

    setSales(salesResponse.data);
  }

  useEffect(() => {
    load();
  }, []);

  const total = useMemo(() => {
    return cart.reduce(
      (sum, item) => {
        const product = products.find(
          (current) =>
            current.id ===
            item.productId
        );

        if (!product) return sum;

        return (
          sum +
          product.salePrice *
            item.quantity *
            (1 -
              product.promoPercent /
                100)
        );
      },
      0
    );
  }, [cart, products]);

  async function createSale() {
    if (!cart.length) return;

    await api.post("/sales", {
      customerName,
      items: cart
    });

    setCart([]);
    setCustomerName("");

    load();
  }

  const columns: GridColDef[] = [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 190
    },
    {
      field: "customerName",
      headerName: "Cliente",
      flex: 1,
      minWidth: 180
    },
    {
      field: "total",
      headerName: "Total",
      width: 120,
      valueFormatter: (value) =>
        `$${Number(value).toFixed(2)}`
    }
  ];

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle="Registro de ventas por cajero"
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Box
            sx={{
              display: "grid",
              gap: 2
            }}
          >
            <TextField
              fullWidth
              label="Cliente"
              value={customerName}
              onChange={(event) =>
                setCustomerName(
                  event.target.value
                )
              }
            />

            {cart.map((item, index) => (
              <Box
                key={index}
                sx={{
                  display: "flex",

                  flexDirection: {
                    xs: "column",
                    md: "row"
                  },

                  gap: 1
                }}
              >
                <TextField
                  select
                  fullWidth
                  label="Producto"
                  value={item.productId}
                  onChange={(event) =>
                    setCart(
                      cart.map(
                        (
                          current,
                          currentIndex
                        ) =>
                          currentIndex ===
                          index
                            ? {
                                ...current,
                                productId:
                                  event
                                    .target
                                    .value
                              }
                            : current
                      )
                    )
                  }
                  sx={{
                    minWidth: {
                      xs: "100%",
                      md: 360
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
                  value={item.quantity}
                  onChange={(event) =>
                    setCart(
                      cart.map(
                        (
                          current,
                          currentIndex
                        ) =>
                          currentIndex ===
                          index
                            ? {
                                ...current,
                                quantity:
                                  Number(
                                    event
                                      .target
                                      .value
                                  )
                              }
                            : current
                      )
                    )
                  }
                />

                <IconButton
                  onClick={() =>
                    setCart(
                      cart.filter(
                        (
                          _,
                          currentIndex
                        ) =>
                          currentIndex !==
                          index
                      )
                    )
                  }
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            ))}

            <Box
              sx={{
                display: "flex",

                flexDirection: {
                  xs: "column",
                  md: "row"
                },

                gap: 1,

                alignItems: {
                  xs: "stretch",
                  md: "center"
                }
              }}
            >
              <Button
                fullWidth
                onClick={() =>
                  setCart([
                    ...cart,
                    {
                      productId:
                        products[0]?.id ??
                        "",
                      quantity: 1
                    }
                  ])
                }
                disabled={!products.length}
              >
                Agregar producto
              </Button>

              <Button
                fullWidth
                color="success"
                onClick={createSale}
                disabled={!cart.length}
              >
                Cobrar
              </Button>

              <Typography
                variant="h6"
                fontWeight={800}
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 180
                  }
                }}
              >
                Total: ${total.toFixed(2)}
              </Typography>
            </Box>
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
              minWidth: 620
            }}
          >
            <DataGrid
              autoHeight
              rows={sales}
              columns={columns}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>
    </>
  );
}
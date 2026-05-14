import { useEffect, useMemo, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import { useAuth } from "../auth/AuthContext";

type Product = {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  stock: number;
  promoPercent: number;
  finalPrice?: number;
  isActive?: boolean;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type Sale = {
  id: string;
  customerName?: string;
  total: number;
  createdAt: string;
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
};

export function SalesPage() {
  const { isAdmin } = useAuth();

  const [products, setProducts] =
    useState<Product[]>([]);

  const [cart, setCart] =
    useState<CartItem[]>([]);

  const [sales, setSales] =
    useState<Sale[]>([]);

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
          product.isActive !== false
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

        const price =
          product.finalPrice ??
          product.salePrice *
            (1 -
              product.promoPercent /
                100);

        return (
          sum +
          price * item.quantity
        );
      },
      0
    );
  }, [cart, products]);

  async function createSale() {
    if (!cart.length) return;

    await api.post("/sales", {
      customerName:
        customerName || undefined,

      items: cart
    });

    setCart([]);
    setCustomerName("");

    await load();
  }

  const columns =
    useMemo<GridColDef[]>(() => {
      const baseColumns: GridColDef[] = [
        {
          field: "createdAt",
          headerName: "Fecha",
          width: 190
        },

        {
          field: "customerName",
          headerName: "Cliente",
          flex: 1,
          minWidth: 180,
          valueGetter: (_value, row) =>
            row.customerName || "Sin cliente"
        },

        {
          field: "total",
          headerName: "Total",
          width: 130,
          valueFormatter: (value) =>
            `$${Number(value).toFixed(2)}`
        }
      ];

      if (!isAdmin) {
        return baseColumns;
      }

      return [
        ...baseColumns,

        {
          field: "cashier",
          headerName: "Cajero",
          flex: 1,
          minWidth: 220,
          valueGetter: (_value, row) =>
            row.cashier
              ? `${row.cashier.name} (${row.cashier.email})`
              : "Sin cajero"
        }
      ];
    }, [isAdmin]);

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle={
          isAdmin
            ? "Registro de ventas y consulta global"
            : "Registro de ventas y consulta de tus ventas"
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={
            isAdmin
              ? "primary"
              : "success"
          }
          label={
            isAdmin
              ? "Vista administrador: todas las ventas"
              : "Vista vendedor: solo tus ventas"
          }
        />
      </Box>

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
                                  event.target.value
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
                        disabled={
                          product.stock <= 0
                        }
                      >
                        {product.sku} ·{" "}
                        {product.name} · stock{" "}
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
                  inputProps={{
                    min: 1
                  }}
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
                                    event.target.value
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
                          currentIndex !== index
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
                        products[0]?.id ?? "",
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
                disabled={
                  !cart.length ||
                  cart.some(
                    (item) =>
                      !item.productId ||
                      item.quantity <= 0
                  )
                }
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
              minWidth: isAdmin
                ? 860
                : 620
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
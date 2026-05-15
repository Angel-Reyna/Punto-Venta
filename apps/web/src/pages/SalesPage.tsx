import { useEffect, useMemo, useState } from "react";

import {
  Alert,
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
import { getApiErrorMessage } from "../utils/apiError";

type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "MIXED";

type Product = {
  id: string;
  sku: string;
  name: string;
  salePrice: number;
  stock: number;
  promoPercent: number;
  finalPrice?: number;
};

type CartItem = {
  productId: string;
  quantity: number;
};

type Sale = {
  id: string;
  folio: string;
  customerId?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: "COMPLETED" | "CANCELLED" | "REFUNDED";
  createdAt: string;

  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;

  cashier?: {
    id: string;
    name: string;
    email: string;
  };

  payments?: Array<{
    id: string;
    method: PaymentMethod;
    amount: number;
    createdAt: string;
  }>;
};

export function SalesPage() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");

      const [productsResponse, salesResponse] = await Promise.all([
        api.get("/products"),
        api.get("/sales")
      ]);

      setProducts(productsResponse.data);
      setSales(salesResponse.data);
    } catch {
      setError("No se pudo cargar la venta ni el catálogo de productos.");
    }
  }

  useEffect(() => {
    load();
  }, []);

  function getProduct(productId: string) {
    return products.find((product) => product.id === productId);
  }

  const total = useMemo(() => {
    return cart.reduce((sum, item) => {
      const product = getProduct(item.productId);

      if (!product) return sum;

      const finalPrice =
        product.finalPrice ??
        product.salePrice * (1 - product.promoPercent / 100);

      return sum + finalPrice * item.quantity;
    }, 0);
  }, [cart, products]);

  const cartIsInvalid =
    cart.length === 0 ||
    cart.some((item) => {
      const product = getProduct(item.productId);

      return (
        !item.productId ||
        !product ||
        item.quantity <= 0 ||
        item.quantity > product.stock
      );
    });

  async function createSale() {
    setMessage("");
    setError("");

    if (cartIsInvalid) {
      setError("Agrega al menos un producto y verifica que la cantidad no supere el stock disponible.");
      return;
    }

    try {
      await api.post("/sales", {
        customerName:
          typeof customerName === "string" && customerName.trim()
            ? customerName.trim()
            : undefined,
        paymentMethod,
        items: cart
      });

      setMessage("Venta registrada correctamente");

      setCart([]);
      setCustomerName("");
      setPaymentMethod("CASH");

      await load();
    } catch (err: any) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo registrar la venta. Verifica productos, stock y método de pago."
        )
      );
    }
  }

  function addProductToCart() {
    const firstAvailableProduct = products.find((product) => product.stock > 0);

    if (!firstAvailableProduct) {
      setError("No hay productos con stock disponible para vender.");
      return;
    }

    setCart([
      ...cart,
      {
        productId: firstAvailableProduct.id,
        quantity: 1
      }
    ]);
  }

  const columns = useMemo<GridColDef[]>(() => {
    const baseColumns: GridColDef[] = [
      {
        field: "folio",
        headerName: "Folio",
        width: 180
      },
      {
        field: "createdAt",
        headerName: "Fecha",
        width: 190,
        valueFormatter: (value) => new Date(value).toLocaleString()
      },
      {
        field: "customer",
        headerName: "Cliente",
        flex: 1,
        minWidth: 180,
        valueGetter: (_value, row) => row.customer?.name ?? "Sin cliente"
      },
      {
        field: "status",
        headerName: "Estado",
        width: 140,
        renderCell: (params) => (
          <Chip
            size="small"
            label={params.value}
            color={
              params.value === "COMPLETED"
                ? "success"
                : params.value === "CANCELLED"
                ? "default"
                : "warning"
            }
          />
        )
      },
      {
        field: "payments",
        headerName: "Pago",
        width: 150,
        valueGetter: (_value, row) =>
          row.payments?.map((payment: any) => payment.method).join(", ") ?? "N/A"
      },
      {
        field: "total",
        headerName: "Total",
        width: 130,
        valueFormatter: (value) => `$${Number(value).toFixed(2)}`
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
        minWidth: 240,
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
            ? "Registra ventas, revisa tickets recientes y consulta el historial global."
            : "Registra ventas y consulta únicamente tus tickets recientes."
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={isAdmin ? "primary" : "success"}
          label={
            isAdmin
              ? "Vista administrador: todas las ventas"
              : "Vista vendedor: solo tus ventas"
          }
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
          <Box sx={{ display: "grid", gap: 2 }}>
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
                fullWidth
                label="Cliente opcional"
                value={customerName}
                helperText="Déjalo vacío para venta sin cliente."
                onChange={(event) => setCustomerName(event.target.value)}
              />

              <TextField
                select
                fullWidth
                label="Método de pago"
                value={paymentMethod}
                onChange={(event) =>
                  setPaymentMethod(event.target.value as PaymentMethod)
                }
              >
                <MenuItem value="CASH">Efectivo</MenuItem>
                <MenuItem value="CARD">Tarjeta</MenuItem>
                <MenuItem value="TRANSFER">Transferencia</MenuItem>
                <MenuItem value="MIXED">Mixto</MenuItem>
              </TextField>
            </Box>

            {cart.map((item, index) => {
              const selectedProduct = getProduct(item.productId);

              return (
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
                        cart.map((current, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...current,
                                productId: event.target.value
                              }
                            : current
                        )
                      )
                    }
                    sx={{
                      minWidth: {
                        xs: "100%",
                        md: 380
                      }
                    }}
                  >
                    {products.map((product) => (
                      <MenuItem
                        key={product.id}
                        value={product.id}
                        disabled={product.stock <= 0}
                      >
                        {product.sku} · {product.name} · stock {product.stock}
                      </MenuItem>
                    ))}
                  </TextField>

                  <TextField
                    fullWidth
                    label="Cantidad"
                    type="number"
                    value={item.quantity}
                    inputProps={{
                      min: 1,
                      max: selectedProduct?.stock ?? undefined
                    }}
                    helperText={
                      selectedProduct
                        ? `Disponible: ${selectedProduct.stock}`
                        : "Selecciona producto"
                    }
                    onChange={(event) =>
                      setCart(
                        cart.map((current, currentIndex) =>
                          currentIndex === index
                            ? {
                                ...current,
                                quantity: Number(event.target.value)
                              }
                            : current
                        )
                      )
                    }
                  />

                  <IconButton
                    onClick={() =>
                      setCart(
                        cart.filter((_, currentIndex) => currentIndex !== index)
                      )
                    }
                  >
                    <DeleteIcon />
                  </IconButton>
                </Box>
              );
            })}

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
                onClick={addProductToCart}
                disabled={!products.some((product) => product.stock > 0)}
              >
                Agregar producto
              </Button>

              <Button
                fullWidth
                color="success"
                onClick={createSale}
                disabled={cartIsInvalid}
              >
                Registrar venta
              </Button>

              <Typography
                variant="h6"
                fontWeight={800}
                aria-live="polite"
                sx={{
                  minWidth: {
                    xs: "100%",
                    md: 190
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
        <CardContent sx={{ overflowX: "auto" }}>
          <Box
            sx={{
              minWidth: isAdmin ? 1120 : 900
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
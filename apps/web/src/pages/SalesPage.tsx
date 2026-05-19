import { useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import DeleteIcon from "@mui/icons-material/Delete";
import UndoIcon from "@mui/icons-material/Undo";
import CancelIcon from "@mui/icons-material/Cancel";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../auth/AuthContext";
import { getApiErrorMessage } from "../utils/apiError";

type PaymentMethod = "CASH" | "CARD" | "TRANSFER" | "MIXED";
type SaleStatus = "COMPLETED" | "CANCELLED" | "PARTIALLY_REFUNDED" | "REFUNDED";

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

type SaleItem = {
  id: string;
  productId: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
  product?: {
    id: string;
    sku: string;
    name: string;
  };
};

type SaleReturn = {
  id: string;
  reason: string;
  refundMethod: PaymentMethod;
  refundTotal: number;
  createdAt: string;
  items: Array<{
    id: string;
    saleItemId: string;
    productId: string;
    quantity: number;
    total: number;
  }>;
};

type Sale = {
  id: string;
  folio: string;
  customerId?: string | null;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: SaleStatus;
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

  items?: SaleItem[];
  returns?: SaleReturn[];

  payments?: Array<{
    id: string;
    method: PaymentMethod;
    amount: number;
    createdAt: string;
  }>;
};

function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

function statusLabel(status: SaleStatus) {
  switch (status) {
    case "COMPLETED":
      return "Completada";
    case "CANCELLED":
      return "Cancelada";
    case "PARTIALLY_REFUNDED":
      return "Devolución parcial";
    case "REFUNDED":
      return "Devuelta";
    default:
      return status;
  }
}

function statusColor(status: SaleStatus) {
  switch (status) {
    case "COMPLETED":
      return "success" as const;
    case "PARTIALLY_REFUNDED":
      return "warning" as const;
    case "REFUNDED":
      return "info" as const;
    case "CANCELLED":
    default:
      return "default" as const;
  }
}

function paymentMethodLabel(method: PaymentMethod) {
  switch (method) {
    case "CASH":
      return "Efectivo";
    case "CARD":
      return "Tarjeta";
    case "TRANSFER":
      return "Transferencia";
    case "MIXED":
      return "Mixto";
    default:
      return method;
  }
}

function getReturnedQuantity(sale: Sale, saleItemId: string) {
  return (sale.returns ?? []).reduce((sum, saleReturn) => {
    return (
      sum +
      saleReturn.items.reduce((itemSum, item) => {
        return item.saleItemId === saleItemId ? itemSum + item.quantity : itemSum;
      }, 0)
    );
  }, 0);
}

function getReturnableQuantity(sale: Sale, saleItem: SaleItem) {
  return Math.max(saleItem.quantity - getReturnedQuantity(sale, saleItem.id), 0);
}

export function SalesPage() {
  const { isAdmin } = useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");

  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefundMethod, setCancelRefundMethod] = useState<PaymentMethod>("CASH");
  const [returnReason, setReturnReason] = useState("");
  const [returnRefundMethod, setReturnRefundMethod] = useState<PaymentMethod>("CASH");
  const [returnSaleItemId, setReturnSaleItemId] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("1");

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    try {
      setError("");

      const [productsResponse, salesResponse] = await Promise.all([
        api.get("/products?page=1&pageSize=100"),
        api.get("/sales?page=1&pageSize=100")
      ]);

      setProducts(productsResponse.data);
      setSales(salesResponse.data);
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cargar la venta ni el catálogo de productos."
        )
      );
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
        product.finalPrice ?? product.salePrice * (1 - product.promoPercent / 100);

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
      setIsSubmitting(true);

      await api.post("/sales", {
        customerName:
          typeof customerName === "string" && customerName.trim()
            ? customerName.trim()
            : undefined,
        paymentMethod,
        items: cart
      });

      setMessage("Venta registrada correctamente.");

      setCart([]);
      setCustomerName("");
      setPaymentMethod("CASH");

      await load();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo registrar la venta. Verifica productos, stock, método de pago y caja."
        )
      );
    } finally {
      setIsSubmitting(false);
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

  function openCancelDialog(sale: Sale) {
    setSelectedSale(sale);
    setCancelReason("");
    setCancelRefundMethod(sale.payments?.[0]?.method ?? "CASH");
    setCancelDialogOpen(true);
  }

  function openReturnDialog(sale: Sale) {
    const firstReturnableItem = (sale.items ?? []).find(
      (item) => getReturnableQuantity(sale, item) > 0
    );

    setSelectedSale(sale);
    setReturnReason("");
    setReturnRefundMethod(sale.payments?.[0]?.method ?? "CASH");
    setReturnSaleItemId(firstReturnableItem?.id ?? "");
    setReturnQuantity("1");
    setReturnDialogOpen(true);
  }

  async function cancelSale() {
    if (!selectedSale) return;

    if (cancelReason.trim().length < 5) {
      setError("Escribe un motivo claro para cancelar la venta.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      await api.post(`/sales/${selectedSale.id}/cancel`, {
        reason: cancelReason.trim(),
        refundMethod: cancelRefundMethod
      });

      setCancelDialogOpen(false);
      setSelectedSale(null);
      setMessage("Venta cancelada correctamente. El stock fue restaurado.");
      await load();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cancelar la venta. Si la devolución es en efectivo, verifica que la caja esté abierta."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function returnSaleItem() {
    if (!selectedSale) return;

    const quantity = Number(returnQuantity);
    const saleItem = selectedSale.items?.find((item) => item.id === returnSaleItemId);
    const available = saleItem ? getReturnableQuantity(selectedSale, saleItem) : 0;

    if (!saleItem) {
      setError("Selecciona un producto vendido para devolver.");
      return;
    }

    if (!Number.isInteger(quantity) || quantity <= 0 || quantity > available) {
      setError(`La cantidad a devolver debe estar entre 1 y ${available}.`);
      return;
    }

    if (returnReason.trim().length < 5) {
      setError("Escribe un motivo claro para registrar la devolución.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      await api.post(`/sales/${selectedSale.id}/returns`, {
        reason: returnReason.trim(),
        refundMethod: returnRefundMethod,
        items: [
          {
            saleItemId: saleItem.id,
            quantity
          }
        ]
      });

      setReturnDialogOpen(false);
      setSelectedSale(null);
      setMessage("Devolución registrada correctamente. El stock fue restaurado.");
      await load();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo registrar la devolución. Si es en efectivo, verifica que la caja esté abierta."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedReturnItem = selectedSale?.items?.find(
    (item) => item.id === returnSaleItemId
  );
  const selectedReturnItemAvailable =
    selectedSale && selectedReturnItem
      ? getReturnableQuantity(selectedSale, selectedReturnItem)
      : 0;

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
        valueFormatter: (value) => new Date(value as string).toLocaleString()
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
        width: 170,
        renderCell: (params) => (
          <Chip
            size="small"
            label={statusLabel(params.value as SaleStatus)}
            color={statusColor(params.value as SaleStatus)}
          />
        )
      },
      {
        field: "payments",
        headerName: "Pago",
        width: 170,
        valueGetter: (_value, row) =>
          row.payments
            ?.map((payment: { method: PaymentMethod }) => paymentMethodLabel(payment.method))
            .join(", ") ?? "N/A"
      },
      {
        field: "total",
        headerName: "Total",
        width: 130,
        valueFormatter: (value) => formatMoney(Number(value))
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
          row.cashier ? `${row.cashier.name} (${row.cashier.email})` : "Sin cajero"
      },
      {
        field: "actions",
        headerName: "Acciones",
        width: 260,
        sortable: false,
        filterable: false,
        renderCell: (params) => {
          const sale = params.row as Sale;
          const hasReturnableItems = (sale.items ?? []).some(
            (item) => getReturnableQuantity(sale, item) > 0
          );

          return (
            <Stack direction="row" spacing={1}>
              <Button
                size="small"
                color="warning"
                startIcon={<UndoIcon />}
                disabled={
                  isSubmitting || sale.status === "CANCELLED" || !hasReturnableItems
                }
                onClick={() => openReturnDialog(sale)}
              >
                Devolver
              </Button>

              <Button
                size="small"
                color="error"
                startIcon={<CancelIcon />}
                disabled={isSubmitting || sale.status !== "COMPLETED"}
                onClick={() => openCancelDialog(sale)}
              >
                Cancelar
              </Button>
            </Stack>
          );
        }
      }
    ];
  }, [isAdmin, isSubmitting]);

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle={
          isAdmin
            ? "Registra ventas, revisa tickets recientes y administra cancelaciones o devoluciones."
            : "Registra ventas y consulta únicamente tus tickets recientes."
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={isAdmin ? "primary" : "success"}
          label={isAdmin ? "Vista administrador: todas las ventas" : "Vista vendedor: solo tus ventas"}
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
                onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
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
                  key={`${item.productId}-${index}`}
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
                      selectedProduct ? `Disponible: ${selectedProduct.stock}` : "Selecciona producto"
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
                      setCart(cart.filter((_, currentIndex) => currentIndex !== index))
                    }
                    aria-label="Quitar producto"
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
                disabled={!products.some((product) => product.stock > 0) || isSubmitting}
              >
                Agregar producto
              </Button>

              <Button
                fullWidth
                color="success"
                onClick={createSale}
                disabled={cartIsInvalid || isSubmitting}
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
                Total: {formatMoney(total)}
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: isAdmin ? 1380 : 900 }}>
            <DataGrid
              autoHeight
              rows={sales}
              columns={columns}
              disableRowSelectionOnClick
              loading={isSubmitting}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Cancelar venta {selectedSale?.folio}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <Alert severity="warning">
            Esta acción restaura el stock de todos los productos vendidos y marca la venta como cancelada.
          </Alert>

          <TextField
            select
            label="Método de devolución"
            value={cancelRefundMethod}
            onChange={(event) => setCancelRefundMethod(event.target.value as PaymentMethod)}
          >
            <MenuItem value="CASH">Efectivo</MenuItem>
            <MenuItem value="CARD">Tarjeta</MenuItem>
            <MenuItem value="TRANSFER">Transferencia</MenuItem>
            <MenuItem value="MIXED">Mixto</MenuItem>
          </TextField>

          <TextField
            label="Motivo de cancelación"
            value={cancelReason}
            multiline
            minRows={3}
            onChange={(event) => setCancelReason(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCancelDialogOpen(false)}>Cerrar</Button>
          <Button color="error" onClick={cancelSale} disabled={isSubmitting}>
            Confirmar cancelación
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Registrar devolución {selectedSale?.folio}</DialogTitle>
        <DialogContent sx={{ display: "grid", gap: 2, pt: 2 }}>
          <Alert severity="info">
            La devolución restaura stock y actualiza el estado de la venta.
          </Alert>

          <TextField
            select
            label="Producto vendido"
            value={returnSaleItemId}
            onChange={(event) => {
              setReturnSaleItemId(event.target.value);
              setReturnQuantity("1");
            }}
          >
            {(selectedSale?.items ?? []).map((item) => {
              const available = selectedSale ? getReturnableQuantity(selectedSale, item) : 0;

              return (
                <MenuItem key={item.id} value={item.id} disabled={available <= 0}>
                  {item.product?.sku ?? item.productId} · {item.product?.name ?? "Producto"} · disponible {available}
                </MenuItem>
              );
            })}
          </TextField>

          <TextField
            label="Cantidad a devolver"
            type="number"
            value={returnQuantity}
            inputProps={{ min: 1, max: selectedReturnItemAvailable }}
            helperText={`Disponible para devolver: ${selectedReturnItemAvailable}`}
            onChange={(event) => setReturnQuantity(event.target.value)}
          />

          <TextField
            select
            label="Método de devolución"
            value={returnRefundMethod}
            onChange={(event) => setReturnRefundMethod(event.target.value as PaymentMethod)}
          >
            <MenuItem value="CASH">Efectivo</MenuItem>
            <MenuItem value="CARD">Tarjeta</MenuItem>
            <MenuItem value="TRANSFER">Transferencia</MenuItem>
            <MenuItem value="MIXED">Mixto</MenuItem>
          </TextField>

          <TextField
            label="Motivo de devolución"
            value={returnReason}
            multiline
            minRows={3}
            onChange={(event) => setReturnReason(event.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setReturnDialogOpen(false)}>Cerrar</Button>
          <Button color="warning" onClick={returnSaleItem} disabled={isSubmitting}>
            Registrar devolución
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

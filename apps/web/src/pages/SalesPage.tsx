import { KeyboardEvent, useEffect, useMemo, useRef, useState } from "react";

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
  Divider,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import AddShoppingCartIcon from "@mui/icons-material/AddShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import SearchIcon from "@mui/icons-material/Search";
import UndoIcon from "@mui/icons-material/Undo";
import CancelIcon from "@mui/icons-material/Cancel";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { PageHeader } from "../components/PageHeader";
import { useAuth } from "../auth/AuthContext";
import { PERMISSIONS } from "../auth/permissions";
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
  const { can } = useAuth();

  const canCreateSales = can(PERMISSIONS.SalesCreate);
  const canCancelSales = can(PERMISSIONS.SalesCancel);
  const canReturnSales = can(PERMISSIONS.SalesReturn);
  const canManageSales = canCancelSales || canReturnSales;

  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);

  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [productSearch, setProductSearch] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

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

  const paid = Number(paidAmount || 0);
  const change = Math.max((Number.isFinite(paid) ? paid : 0) - total, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const saleDialogIsOpen = cancelDialogOpen || returnDialogOpen;

  function normalizeSearch(value: string) {
    return value.trim().toLowerCase();
  }

  const filteredProducts = useMemo(() => {
    const query = normalizeSearch(productSearch);
    const activeProducts = products.filter((product) => product.stock > 0);

    if (!query) {
      return activeProducts.slice(0, 8);
    }

    return activeProducts
      .filter((product) => {
        return [product.sku, product.name, product.id]
          .some((value) => value.toLowerCase().includes(query));
      })
      .slice(0, 8);
  }, [productSearch, products]);

  const cartRows = useMemo(() => {
    return cart.map((item) => {
      const product = getProduct(item.productId);
      const unitPrice = product
        ? product.finalPrice ?? product.salePrice * (1 - product.promoPercent / 100)
        : 0;

      return {
        ...item,
        product,
        unitPrice,
        total: unitPrice * item.quantity
      };
    });
  }, [cart, products]);

  function addProductToCart(productId: string) {
    const product = getProduct(productId);

    if (!product || product.stock <= 0) {
      setError("Producto sin stock disponible para vender.");
      return;
    }

    setError("");
    setCart((currentCart) => {
      const existingItem = currentCart.find((item) => item.productId === productId);

      if (!existingItem) {
        return [...currentCart, { productId, quantity: 1 }];
      }

      if (existingItem.quantity >= product.stock) {
        setError("La cantidad no puede superar el stock disponible.");
        return currentCart;
      }

      return currentCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: item.quantity + 1 }
          : item
      );
    });

    setProductSearch("");
    searchInputRef.current?.focus();
  }

  function addFirstSearchResult() {
    const firstProduct = filteredProducts[0];

    if (!firstProduct) {
      setError("No hay coincidencias con stock disponible.");
      return;
    }

    addProductToCart(firstProduct.id);
  }

  function updateCartQuantity(productId: string, quantity: number) {
    const product = getProduct(productId);

    if (!product) return;

    const nextQuantity = Math.max(1, Math.min(quantity || 1, product.stock));

    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId
          ? { ...item, quantity: nextQuantity }
          : item
      )
    );
  }

  function removeCartItem(productId: string) {
    setCart((currentCart) =>
      currentCart.filter((item) => item.productId !== productId)
    );
  }

  function handleProductSearchKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();
      addFirstSearchResult();
    }
  }

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
      setPaidAmount("");
      searchInputRef.current?.focus();

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

  useEffect(() => {
    function handleGlobalShortcuts(event: globalThis.KeyboardEvent) {
      if (event.key === "F3") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (
        event.key === "F12" &&
        canCreateSales &&
        !saleDialogIsOpen &&
        !cartIsInvalid &&
        !isSubmitting
      ) {
        event.preventDefault();
        void createSale();
      }
    }

    window.addEventListener("keydown", handleGlobalShortcuts);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
    };
  }, [canCreateSales, saleDialogIsOpen, cartIsInvalid, isSubmitting, cart, customerName, paymentMethod]);

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

  const cancelReasonIsInvalid = cancelReason.trim().length < 5;
  const returnQuantityNumber = Number(returnQuantity);
  const returnFormIsInvalid =
    !returnSaleItemId ||
    !Number.isInteger(returnQuantityNumber) ||
    returnQuantityNumber <= 0 ||
    returnQuantityNumber > selectedReturnItemAvailable ||
    returnReason.trim().length < 5;

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

    if (!canManageSales) {
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
              {canReturnSales && (
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
              )}

              {canCancelSales && (
                <Button
                  size="small"
                  color="error"
                  startIcon={<CancelIcon />}
                  disabled={isSubmitting || sale.status !== "COMPLETED"}
                  onClick={() => openCancelDialog(sale)}
                >
                  Cancelar
                </Button>
              )}
            </Stack>
          );
        }
      }
    ];
  }, [canManageSales, canReturnSales, canCancelSales, isSubmitting]);

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle={
          canManageSales
            ? "Registra ventas, revisa tickets recientes y administra cancelaciones o devoluciones."
            : "Registra ventas y consulta únicamente tus tickets recientes."
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={canManageSales ? "primary" : "success"}
          label={canManageSales ? "Vista con gestión de ventas" : "Vista vendedor: solo tus ventas"}
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

      {canCreateSales && (
        <Card sx={{ mb: 2 }}>
          <CardContent>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "minmax(0, 1fr) 360px"
              },
              gap: 2,
              alignItems: "start"
            }}
          >
            <Box sx={{ display: "grid", gap: 2 }}>
              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "minmax(0, 1fr) 220px"
                  },
                  gap: 2
                }}
              >
                <TextField
                  inputRef={searchInputRef}
                  label="F3 · Buscar por código, SKU o nombre"
                  value={productSearch}
                  autoFocus
                  placeholder="Escanea código de barras o escribe para buscar"
                  onKeyDown={handleProductSearchKeyDown}
                  onChange={(event) => setProductSearch(event.target.value)}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }}
                />

                <Button
                  startIcon={<AddShoppingCartIcon />}
                  onClick={addFirstSearchResult}
                  disabled={filteredProducts.length === 0 || isSubmitting}
                >
                  Enter · Agregar
                </Button>
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "repeat(4, minmax(0, 1fr))"
                  },
                  gap: 1
                }}
              >
                {filteredProducts.map((product) => {
                  const finalPrice = product.finalPrice ?? product.salePrice;

                  return (
                    <Button
                      key={product.id}
                      variant="outlined"
                      color="inherit"
                      onClick={() => addProductToCart(product.id)}
                      disabled={isSubmitting}
                      sx={{
                        justifyContent: "space-between",
                        minHeight: 78,
                        textAlign: "left",
                        alignItems: "stretch",
                        display: "grid",
                        gap: 0.5,
                        p: 1.25
                      }}
                    >
                      <Typography fontWeight={800} noWrap>
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" noWrap>
                        {product.sku} · stock {product.stock}
                      </Typography>
                      <Typography fontWeight={800}>{formatMoney(finalPrice)}</Typography>
                    </Button>
                  );
                })}
              </Box>

              <Box sx={{ overflowX: "auto" }}>
                <Box sx={{ minWidth: 780 }}>
                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1.1fr 0.9fr 130px 120px 130px 56px",
                      gap: 1,
                      px: 1.5,
                      py: 1,
                      bgcolor: "#f1f5f9",
                      borderRadius: 2,
                      fontWeight: 800,
                      color: "text.secondary"
                    }}
                  >
                    <Typography variant="caption">Código</Typography>
                    <Typography variant="caption">Producto</Typography>
                    <Typography variant="caption">Precio</Typography>
                    <Typography variant="caption">Cant.</Typography>
                    <Typography variant="caption">Importe</Typography>
                    <Typography variant="caption" />
                  </Box>

                  {cartRows.length === 0 ? (
                    <Box
                      sx={{
                        py: 6,
                        textAlign: "center",
                        color: "text.secondary",
                        border: "1px dashed #cbd5e1",
                        borderRadius: 2,
                        mt: 1
                      }}
                    >
                      Escanea o busca un producto para iniciar la venta.
                    </Box>
                  ) : (
                    <Box sx={{ display: "grid", gap: 1, mt: 1 }}>
                      {cartRows.map((item) => (
                        <Box
                          key={item.productId}
                          sx={{
                            display: "grid",
                            gridTemplateColumns: "1.1fr 0.9fr 130px 120px 130px 56px",
                            gap: 1,
                            alignItems: "center",
                            px: 1.5,
                            py: 1,
                            border: "1px solid #e2e8f0",
                            borderRadius: 2,
                            bgcolor: "background.paper"
                          }}
                        >
                          <Box>
                            <Typography fontWeight={800} noWrap>
                              {item.product?.sku ?? item.productId}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Stock {item.product?.stock ?? 0}
                            </Typography>
                          </Box>

                          <Typography noWrap>{item.product?.name ?? "Producto"}</Typography>
                          <Typography fontWeight={700}>{formatMoney(item.unitPrice)}</Typography>

                          <TextField
                            type="number"
                            value={item.quantity}
                            inputProps={{
                              min: 1,
                              max: item.product?.stock ?? undefined,
                              step: 1
                            }}
                            disabled={isSubmitting}
                            onChange={(event) =>
                              updateCartQuantity(item.productId, Number(event.target.value))
                            }
                          />

                          <Typography fontWeight={800}>{formatMoney(item.total)}</Typography>

                          <IconButton
                            onClick={() => removeCartItem(item.productId)}
                            disabled={isSubmitting}
                            aria-label="Quitar producto"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                </Box>
              </Box>
            </Box>

            <Box
              sx={{
                position: {
                  xs: "static",
                  lg: "sticky"
                },
                top: 96,
                display: "grid",
                gap: 2
              }}
            >
              <Card variant="outlined" sx={{ boxShadow: "none" }}>
                <CardContent sx={{ display: "grid", gap: 2 }}>
                  <Typography variant="h6" fontWeight={900}>
                    Orden de venta
                  </Typography>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total vendido
                    </Typography>
                    <Typography
                      variant="h3"
                      fontWeight={900}
                      color="primary"
                      aria-live="polite"
                      sx={{ letterSpacing: "-0.04em" }}
                    >
                      {formatMoney(total)}
                    </Typography>
                  </Box>

                  <Divider />

                  <Box
                    sx={{
                      display: "grid",
                      gridTemplateColumns: "1fr auto",
                      gap: 1
                    }}
                  >
                    <Typography color="text.secondary">Artículos</Typography>
                    <Typography fontWeight={800}>{cartItemsCount}</Typography>
                    <Typography color="text.secondary">Partidas</Typography>
                    <Typography fontWeight={800}>{cart.length}</Typography>
                    <Typography color="text.secondary">Cambio estimado</Typography>
                    <Typography fontWeight={800}>{formatMoney(change)}</Typography>
                  </Box>

                  <TextField
                    label="Cliente opcional"
                    value={customerName}
                    helperText="Déjalo vacío para público general."
                    onChange={(event) => setCustomerName(event.target.value)}
                  />

                  <TextField
                    select
                    label="Método de pago"
                    value={paymentMethod}
                    onChange={(event) => setPaymentMethod(event.target.value as PaymentMethod)}
                  >
                    <MenuItem value="CASH">Efectivo</MenuItem>
                    <MenuItem value="CARD">Tarjeta</MenuItem>
                    <MenuItem value="TRANSFER">Transferencia</MenuItem>
                    <MenuItem value="MIXED">Mixto</MenuItem>
                  </TextField>

                  <TextField
                    label="Pago con"
                    type="number"
                    value={paidAmount}
                    inputProps={{ min: 0, step: 0.01 }}
                    helperText="Solo cálculo visual de cambio; backend registra el método de pago."
                    onChange={(event) => setPaidAmount(event.target.value)}
                  />

                  <Button
                    color="success"
                    size="large"
                    onClick={createSale}
                    disabled={!canCreateSales || cartIsInvalid || isSubmitting}
                    sx={{ minHeight: 58, fontSize: "1rem" }}
                  >
                    F12 · Cobrar venta
                  </Button>
                </CardContent>
              </Card>
            </Box>
          </Box>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Box sx={{ minWidth: canManageSales ? 1380 : 900 }}>
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
          <Button onClick={() => setCancelDialogOpen(false)} disabled={isSubmitting}>Cerrar</Button>
          <Button color="error" onClick={cancelSale} disabled={isSubmitting || cancelReasonIsInvalid}>
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
          <Button onClick={() => setReturnDialogOpen(false)} disabled={isSubmitting}>Cerrar</Button>
          <Button color="warning" onClick={returnSaleItem} disabled={isSubmitting || returnFormIsInvalid}>
            Registrar devolución
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

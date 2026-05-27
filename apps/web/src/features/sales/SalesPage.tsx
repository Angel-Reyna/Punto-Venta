import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
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
import RefreshIcon from "@mui/icons-material/Refresh";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { SearchToolbar } from "../../components/SearchToolbar";
import { PageHeader } from "../../components/PageHeader";
import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import { getApiErrorMessage } from "../../utils/apiError";

import { useSalesData } from "./useSalesData";

import {
  buildCartRows,
  calculateCartTotal,
  formatMoney,
  getExactSearchProduct,
  getFilteredProducts,
  getFilteredSales,
  getProductFinalPrice,
  PAYMENT_METHOD_OPTIONS,
  getReturnableQuantity,
  isCartInvalid,
  saleItemsSummary,
  salePaymentSummary,
  SALE_STATUS_FILTER_OPTIONS,
  statusColor,
  statusLabel,
  summarizeSales,
  type CartItem,
  type PaymentMethod,
  type Sale,
  type SaleStatus
} from "./salesShared";
import {
  SALES_TICKET_MESSAGES,
  addProductToSalesTicket,
  removeSalesTicketItem,
  updateSalesTicketQuantity
} from "./salesTicket";

export function SalesPage() {
  const { can } = useAuth();

  const canCreateSales = can(PERMISSIONS.SalesCreate);
  const canCancelSales = can(PERMISSIONS.SalesCancel);
  const canReturnSales = can(PERMISSIONS.SalesReturn);
  const canManageSales = canCancelSales || canReturnSales;

  const {
    products,
    sales,
    isLoadingCatalog,
    loadSalesData,
    submitSale,
    submitSaleCancellation,
    submitSaleReturn
  } = useSalesData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [productSearch, setProductSearch] = useState("");
  const [saleSearch, setSaleSearch] = useState("");
  const [saleStatusFilter, setSaleStatusFilter] = useState<SaleStatus | "ALL">("ALL");
  const [salePaymentFilter, setSalePaymentFilter] = useState<PaymentMethod | "ALL">("ALL");
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

  const loadSalesWorkspace = useCallback(async () => {
    try {
      setError("");
      await loadSalesData();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cargar la venta ni el catálogo de productos."
        )
      );
    }
  }, [loadSalesData]);

  useEffect(() => {
    void loadSalesWorkspace();
  }, [loadSalesWorkspace]);

  const total = useMemo(() => calculateCartTotal(cart, products), [cart, products]);
  const cartIsInvalid = useMemo(() => isCartInvalid(cart, products), [cart, products]);

  const paid = Number(paidAmount || 0);
  const normalizedPaid = Number.isFinite(paid) ? paid : 0;
  const isPaymentInsufficient = cart.length > 0 && normalizedPaid < total;
  const change = Math.max(normalizedPaid - total, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const saleDialogIsOpen = cancelDialogOpen || returnDialogOpen;
  const checkoutIsDisabled =
    !canCreateSales ||
    cartIsInvalid ||
    isPaymentInsufficient ||
    isSubmitting ||
    saleDialogIsOpen;

  const checkoutDisabledReason = (() => {
    if (!canCreateSales) return "No tienes permiso para registrar ventas.";
    if (saleDialogIsOpen) return "Termina o cierra el modal abierto antes de cobrar.";
    if (isSubmitting) return "Procesando operación...";
    if (cart.length === 0) return "Agrega al menos un producto al ticket.";
    if (cartIsInvalid) return "Revisa cantidades: no deben superar el stock disponible.";
    if (isPaymentInsufficient) {
      return `Pago insuficiente. Falta ${formatMoney(total - normalizedPaid)} para completar la venta.`;
    }

    return "";
  })();

  const filteredProducts = useMemo(
    () => getFilteredProducts(products, productSearch),
    [productSearch, products]
  );
  const exactProductSearchMatch = useMemo(
    () => getExactSearchProduct(products, productSearch),
    [productSearch, products]
  );
  const canAddExactSearchMatch =
    Boolean(exactProductSearchMatch) && !isSubmitting && !saleDialogIsOpen;

  const cartRows = useMemo(() => buildCartRows(cart, products), [cart, products]);

  function addProductToCart(productId: string) {
    const result = addProductToSalesTicket(cart, products, productId);

    setError(result.error);
    setCart(result.cart);

    if (result.shouldClearSearch) {
      setProductSearch("");
      searchInputRef.current?.focus();
    }
  }

  function addExactSearchMatchToCart() {
    if (!canCreateSales || saleDialogIsOpen || isSubmitting) {
      return;
    }

    if (!productSearch.trim()) {
      return;
    }

    if (!exactProductSearchMatch) {
      setError(SALES_TICKET_MESSAGES.exactMatchRequired);
      return;
    }

    addProductToCart(exactProductSearchMatch.id);
  }

  function updateCartQuantity(productId: string, quantity: number) {
    setCart((currentCart) =>
      updateSalesTicketQuantity(currentCart, products, productId, quantity)
    );
  }

  function removeCartItem(productId: string) {
    setCart((currentCart) => removeSalesTicketItem(currentCart, productId));
  }

  function handleProductSearchKeyDown(event: KeyboardEvent) {
    if (event.key === "Enter") {
      event.preventDefault();

      if (!saleDialogIsOpen && !isSubmitting) {
        addExactSearchMatchToCart();
      }
    }
  }

  const createSale = useCallback(async () => {
    setMessage("");
    setError("");

    if (cartIsInvalid) {
      setError("Agrega al menos un producto y verifica que la cantidad no supere el stock disponible.");
      return;
    }

    if (isPaymentInsufficient) {
      setError(`Pago insuficiente. Falta ${formatMoney(total - normalizedPaid)} para completar la venta.`);
      return;
    }

    try {
      setIsSubmitting(true);

      await submitSale({
        customerName:
          typeof customerName === "string" && customerName.trim()
            ? customerName.trim()
            : undefined,
        paymentMethod,
        paidAmount: normalizedPaid,
        items: cart
      });

      setMessage("Venta registrada correctamente.");

      setCart([]);
      setCustomerName("");
      setPaymentMethod("CASH");
      setPaidAmount("");
      searchInputRef.current?.focus();

    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo registrar la venta. Verifica productos, stock y método de pago."
        )
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [cart, cartIsInvalid, customerName, isPaymentInsufficient, normalizedPaid, paymentMethod, submitSale, total]);

  useEffect(() => {
    function handleGlobalShortcuts(event: globalThis.KeyboardEvent) {
      if (event.key === "F3") {
        event.preventDefault();

        if (canCreateSales && !saleDialogIsOpen && !isSubmitting) {
          searchInputRef.current?.focus();
        }
      }

      if (event.key === "F12" && canCreateSales) {
        event.preventDefault();

        if (!checkoutIsDisabled) {
          void createSale();
        }
      }
    }

    window.addEventListener("keydown", handleGlobalShortcuts);

    return () => {
      window.removeEventListener("keydown", handleGlobalShortcuts);
    };
  }, [canCreateSales, checkoutIsDisabled, createSale, isSubmitting, saleDialogIsOpen]);

  useEffect(() => {
    function refreshCatalogWhenVisible() {
      if (document.visibilityState === "visible" && !saleDialogIsOpen && !isSubmitting) {
        void loadSalesWorkspace();
      }
    }

    window.addEventListener("focus", refreshCatalogWhenVisible);
    document.addEventListener("visibilitychange", refreshCatalogWhenVisible);

    return () => {
      window.removeEventListener("focus", refreshCatalogWhenVisible);
      document.removeEventListener("visibilitychange", refreshCatalogWhenVisible);
    };
  }, [isSubmitting, loadSalesWorkspace, saleDialogIsOpen]);

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

      await submitSaleCancellation(selectedSale.id, {
        reason: cancelReason.trim(),
        refundMethod: cancelRefundMethod
      });

      setCancelDialogOpen(false);
      setSelectedSale(null);
      setMessage("Venta cancelada correctamente. El stock fue restaurado.");
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cancelar la venta. Verifica el motivo y el método de devolución."
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

      await submitSaleReturn(selectedSale.id, {
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
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo registrar la devolución. Verifica el producto, cantidad, motivo y método."
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

  const filteredSales = useMemo(
    () => getFilteredSales(sales, saleSearch, saleStatusFilter, salePaymentFilter),
    [salePaymentFilter, saleSearch, saleStatusFilter, sales]
  );

  const salesSummary = useMemo(() => summarizeSales(sales), [sales]);

  return (
    <>
      <PageHeader
        title="Ventas"
        subtitle={
          canManageSales
            ? "Registra ventas, revisa tickets recientes y administra cancelaciones o devoluciones."
            : "Registra ventas y consulta únicamente tus tickets recientes."
        }
        action={
          <Button
            fullWidth
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadSalesWorkspace()}
            disabled={isSubmitting || isLoadingCatalog}
          >
            {isLoadingCatalog ? "Actualizando..." : "Actualizar venta"}
          </Button>
        }
      />

      <Box sx={{ mb: 2 }}>
        <Chip
          color={canManageSales ? "primary" : "success"}
          label={canManageSales ? "Vista con gestión de ventas" : "Vista vendedor: solo tus ventas"}
        />
      </Box>

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

      <Card
        data-testid="sales-visual-hero"
        sx={{
          mb: 2,
          border: "1px solid",
          borderColor: "divider",
          background:
            "linear-gradient(135deg, rgba(25, 118, 210, 0.10), rgba(46, 125, 50, 0.08))"
        }}
      >
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            justifyContent="space-between"
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <Box>
              <Typography variant="overline" color="text.secondary" fontWeight={900}>
                Flujo de venta operativo
              </Typography>
              <Typography variant="h5" fontWeight={900}>
                Ticket, catálogo y cobro en una sola vista
              </Typography>
              <Typography color="text.secondary">
                Escanea o busca productos, revisa el ticket y confirma que el pago cubra el total antes de cobrar.
              </Typography>
            </Box>

            <Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
              <Chip color={cart.length > 0 ? "primary" : "default"} label={`${cartItemsCount} artículos`} />
              <Chip
                color={cart.length === 0 ? "default" : isPaymentInsufficient ? "warning" : "success"}
                label={
                  cart.length === 0
                    ? "Sin ticket"
                    : isPaymentInsufficient
                      ? `Falta ${formatMoney(total - normalizedPaid)}`
                      : "Listo para cobrar"
                }
              />
              <Chip variant="outlined" label={`${filteredProducts.length} productos visibles`} />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      {canCreateSales && (
        <Card
          sx={{
            mb: 2,
            border: "1px solid",
            borderColor: "divider",
            overflow: "hidden"
          }}
        >
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
                  inputProps={{
                    "data-testid": "sales-product-search",
                  }}
                  helperText="Enter agrega solo SKU o código exacto; para búsquedas parciales selecciona una tarjeta."
                  onKeyDown={handleProductSearchKeyDown}
                  onChange={(event) => setProductSearch(event.target.value)}
                  disabled={isSubmitting || saleDialogIsOpen}
                  InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                  }}
                />

                <Button
                  startIcon={<AddShoppingCartIcon />}
                  onClick={addExactSearchMatchToCart}
                  disabled={!canAddExactSearchMatch}
                  data-testid="sales-add-search-match"
                  title={
                    canAddExactSearchMatch
                      ? "Agregar coincidencia exacta"
                      : "Busca por SKU o código exacto para agregar con Enter."
                  }
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
                  const finalPrice = getProductFinalPrice(product);

                  return (
                    <Button
                      key={product.id}
                      variant="outlined"
                      color="inherit"
                      onClick={() => addProductToCart(product.id)}
                      disabled={isSubmitting || saleDialogIsOpen}
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

              <Box>
                <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 1 }}>
                  Ticket actual
                </Typography>

                {cartRows.length === 0 ? (
                  <Box
                    data-testid="sales-ticket-empty"
                    sx={{
                      py: 6,
                      textAlign: "center",
                      color: "text.secondary",
                      border: "1px dashed #cbd5e1",
                      borderRadius: 2
                    }}
                  >
                    Escanea o busca un producto para iniciar la venta.
                  </Box>
                ) : (
                  <Box data-testid="sales-cart-items" sx={{ display: "grid", gap: 1 }}>
                    {cartRows.map((item) => (
                      <Card key={item.productId} variant="outlined" sx={{ boxShadow: "none" }}>
                        <CardContent
                          sx={{
                            display: "grid",
                            gridTemplateColumns: {
                              xs: "1fr",
                              md: "minmax(0, 1.5fr) 110px 120px 120px auto"
                            },
                            gap: 1.5,
                            alignItems: { xs: "stretch", md: "center" },
                            p: { xs: 1.5, sm: 2 },
                            "&:last-child": { pb: { xs: 1.5, sm: 2 } }
                          }}
                        >
                          <Box sx={{ minWidth: 0 }}>
                            <Stack
                              direction="row"
                              spacing={1}
                              alignItems="center"
                              sx={{ minWidth: 0, mb: 0.25 }}
                            >
                              <Typography fontWeight={900} noWrap>
                                {item.product?.name ?? "Producto"}
                              </Typography>
                              <Chip
                                size="small"
                                variant="outlined"
                                label={`Stock ${item.product?.stock ?? 0}`}
                              />
                            </Stack>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {item.product?.sku ?? item.productId}
                            </Typography>
                          </Box>

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Precio
                            </Typography>
                            <Typography fontWeight={800}>{formatMoney(item.unitPrice)}</Typography>
                          </Box>

                          <TextField
                            label="Cantidad"
                            type="number"
                            value={item.quantity}
                            size="small"
                            inputProps={{
                              min: 1,
                              max: item.product?.stock ?? undefined,
                              step: 1
                            }}
                            disabled={isSubmitting || saleDialogIsOpen}
                            onChange={(event) =>
                              updateCartQuantity(item.productId, Number(event.target.value))
                            }
                          />

                          <Box>
                            <Typography variant="caption" color="text.secondary">
                              Importe
                            </Typography>
                            <Typography fontWeight={900}>{formatMoney(item.total)}</Typography>
                          </Box>

                          <IconButton
                            onClick={() => removeCartItem(item.productId)}
                            disabled={isSubmitting || saleDialogIsOpen}
                            aria-label="Quitar producto"
                            sx={{ justifySelf: { xs: "flex-end", md: "center" } }}
                          >
                            <DeleteIcon />
                          </IconButton>
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                )}
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
                    {PAYMENT_METHOD_OPTIONS.map((option) => (
                      <MenuItem key={option.value} value={option.value}>
                        {option.label}
                      </MenuItem>
                    ))}
                  </TextField>


                  <TextField
                    label="Pago con"
                    type="number"
                    value={paidAmount}
                    inputProps={{
                      "data-testid": "sales-paid-amount",
                      min: 0,
                      step: 0.01,
                    }}
                    error={isPaymentInsufficient}
                    helperText={
                      isPaymentInsufficient
                        ? `Pago insuficiente. Falta ${formatMoney(total - normalizedPaid)}.`
                        : "Debe cubrir el total para poder cobrar. El cambio se calcula arriba."
                    }
                    onChange={(event) => setPaidAmount(event.target.value)}
                  />

                  <Box>
                    <Button
                      color="success"
                      size="large"
                      fullWidth
                      onClick={createSale}
                      disabled={checkoutIsDisabled}
                      title={checkoutIsDisabled ? checkoutDisabledReason : "Registrar venta"}
                      data-testid="sales-checkout-button"
                      sx={{ minHeight: 58, fontSize: "1rem" }}
                    >
                      F12 · Cobrar venta
                    </Button>
                    <ActionDisabledReason
                      message={checkoutIsDisabled ? checkoutDisabledReason : ""}
                    />
                  </Box>
                </CardContent>
              </Card>
            </Box>
          </Box>
          </CardContent>
        </Card>
      )}

      <Box sx={{ display: "grid", gap: 2 }}>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              lg: "repeat(4, minmax(0, 1fr))"
            },
            gap: 2
          }}
        >
          {[
            ["Ventas cargadas", salesSummary.totalCount.toString()],
            ["Completadas", salesSummary.completedCount.toString()],
            ["Total completado", formatMoney(salesSummary.totalSold)],
            ["Canceladas/devueltas", salesSummary.cancelledOrReturned.toString()]
          ].map(([label, value]) => (
            <Card key={label} variant="outlined" sx={{ boxShadow: "none" }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">
                  {label}
                </Typography>
                <Typography variant="h5" fontWeight={900} sx={{ mt: 0.5 }}>
                  {value}
                </Typography>
              </CardContent>
            </Card>
          ))}
        </Box>

        <SearchToolbar
          query={saleSearch}
          onQueryChange={setSaleSearch}
          resultCount={filteredSales.length}
          totalCount={sales.length}
          label="Buscar ventas"
          placeholder="Folio, cliente, vendedor, estado o método de pago"
          helperText="Filtra el historial cargado. Usa Actualizar venta para traer los datos más recientes."
        />

        <Card>
          <CardContent>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
              sx={{ mb: 2 }}
            >
              <Box>
                <Typography variant="h6" fontWeight={900}>
                  Historial operativo
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Ventas recientes sin tabla horizontal; usa filtros para revisar estados y pagos.
                </Typography>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <TextField
                  select
                  size="small"
                  label="Estado"
                  value={saleStatusFilter}
                  onChange={(event) =>
                    setSaleStatusFilter(event.target.value as SaleStatus | "ALL")
                  }
                  sx={{ minWidth: { xs: "100%", sm: 180 } }}
                >
                  {SALE_STATUS_FILTER_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>

                <TextField
                  select
                  size="small"
                  label="Pago"
                  value={salePaymentFilter}
                  onChange={(event) =>
                    setSalePaymentFilter(event.target.value as PaymentMethod | "ALL")
                  }
                  sx={{ minWidth: { xs: "100%", sm: 180 } }}
                >
                  <MenuItem value="ALL">Todos</MenuItem>
                  {PAYMENT_METHOD_OPTIONS.map((option) => (
                    <MenuItem key={option.value} value={option.value}>
                      {option.label}
                    </MenuItem>
                  ))}
                </TextField>
              </Stack>
            </Stack>

            {filteredSales.length === 0 ? (
              <Box
                sx={{
                  border: "1px dashed #cbd5e1",
                  borderRadius: 2,
                  color: "text.secondary",
                  py: 6,
                  textAlign: "center"
                }}
              >
                No hay ventas que coincidan con los filtros actuales.
              </Box>
            ) : (
              <Box sx={{ display: "grid", gap: 1.5 }}>
                {filteredSales.map((sale) => {
                  const hasReturnableItems = (sale.items ?? []).some(
                    (item) => getReturnableQuantity(sale, item) > 0
                  );

                  return (
                    <Card key={sale.id} variant="outlined" sx={{ boxShadow: "none" }}>
                      <CardContent
                        sx={{
                          display: "grid",
                          gridTemplateColumns: {
                            xs: "1fr",
                            lg: canManageSales
                              ? "minmax(0, 1.5fr) minmax(180px, 0.8fr) minmax(180px, 0.8fr) auto"
                              : "minmax(0, 1.5fr) minmax(180px, 0.8fr) auto"
                          },
                          gap: 2,
                          alignItems: "center"
                        }}
                      >
                        <Box sx={{ minWidth: 0 }}>
                          <Stack
                            direction="row"
                            spacing={1}
                            flexWrap="wrap"
                            useFlexGap
                            alignItems="center"
                            sx={{ mb: 0.75 }}
                          >
                            <Typography fontWeight={900}>{sale.folio}</Typography>
                            <Chip
                              size="small"
                              label={statusLabel(sale.status)}
                              color={statusColor(sale.status)}
                            />
                          </Stack>

                          <Typography variant="body2" color="text.secondary">
                            {new Date(sale.createdAt).toLocaleString()}
                          </Typography>
                          <Typography fontWeight={700} sx={{ mt: 0.5 }} noWrap>
                            {sale.customer?.name ?? "Sin cliente"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" noWrap>
                            {saleItemsSummary(sale)}
                          </Typography>
                        </Box>

                        {canManageSales && (
                          <Box sx={{ minWidth: 0 }}>
                            <Typography variant="caption" color="text.secondary">
                              Vendedor
                            </Typography>
                            <Typography fontWeight={800} noWrap>
                              {sale.cashier?.name ?? "Sin vendedor"}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap>
                              {sale.cashier?.email ?? ""}
                            </Typography>
                          </Box>
                        )}

                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Pago
                          </Typography>
                          <Typography fontWeight={800}>{salePaymentSummary(sale)}</Typography>
                          <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5 }}>
                            {formatMoney(sale.total)}
                          </Typography>
                        </Box>

                        {canManageSales && (
                          <Stack
                            direction={{ xs: "column", sm: "row", lg: "column" }}
                            spacing={1}
                            alignItems="stretch"
                            justifyContent="center"
                          >
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
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            )}
          </CardContent>
        </Card>
      </Box>

      <ResponsiveDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        disableClose={isSubmitting}
        maxWidth="sm"
        title={`Cancelar venta ${selectedSale?.folio ?? ""}`.trim()}
        description="Confirma la cancelación solo cuando la venta deba anularse por completo."
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => setCancelDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cerrar
            </Button>
            <Button
              color="error"
              onClick={cancelSale}
              disabled={isSubmitting || cancelReasonIsInvalid}
            >
              Confirmar cancelación
            </Button>
          </>
        }
      >
        <Box sx={{ display: "grid", gap: 2 }}>
          <Alert severity="warning">
            Esta acción restaura el stock de todos los productos vendidos y marca la venta como cancelada.
          </Alert>


          <TextField
            select
            label="Método de devolución"
            value={cancelRefundMethod}
            onChange={(event) => setCancelRefundMethod(event.target.value as PaymentMethod)}
          >
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Motivo de cancelación"
            value={cancelReason}
            multiline
            minRows={3}
            error={Boolean(cancelReason) && cancelReasonIsInvalid}
            helperText="Mínimo 5 caracteres para auditoría."
            onChange={(event) => setCancelReason(event.target.value)}
          />
        </Box>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={returnDialogOpen}
        onClose={() => setReturnDialogOpen(false)}
        disableClose={isSubmitting}
        maxWidth="sm"
        title={`Registrar devolución ${selectedSale?.folio ?? ""}`.trim()}
        description="Devuelve unidades vendidas y registra el motivo para auditoría."
        actions={
          <>
            <Button
              variant="outlined"
              onClick={() => setReturnDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cerrar
            </Button>
            <Button
              color="warning"
              onClick={returnSaleItem}
              disabled={isSubmitting || returnFormIsInvalid}
            >
              Registrar devolución
            </Button>
          </>
        }
      >
        <Box sx={{ display: "grid", gap: 2 }}>
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
            {PAYMENT_METHOD_OPTIONS.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>

          <TextField
            label="Motivo de devolución"
            value={returnReason}
            multiline
            minRows={3}
            error={Boolean(returnReason) && returnReason.trim().length < 5}
            helperText="Mínimo 5 caracteres para auditoría."
            onChange={(event) => setReturnReason(event.target.value)}
          />
        </Box>
      </ResponsiveDialog>
    </>
  );
}

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

import { PageHeader } from "../../components/PageHeader";
import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import { getApiErrorMessage } from "../../utils/apiError";

import { SalesCheckoutPanel } from "./SalesCheckoutPanel";
import { SalesHistoryPanel } from "./SalesHistoryPanel";
import { SalesProductSearchPanel } from "./SalesProductSearchPanel";
import { SalesTicketPanel } from "./SalesTicketPanel";
import { useSalesData } from "./useSalesData";

import {
  buildCartRows,
  calculateCartTotal,
  formatMoney,
  getExactSearchProduct,
  getFilteredProducts,
  PAYMENT_METHOD_OPTIONS,
  getReturnableQuantity,
  isCartInvalid,
  type CartItem,
  type PaymentMethod,
  type Sale,
} from "./salesShared";
import {
  SALES_TICKET_MESSAGES,
  addProductToSalesTicket,
  removeSalesTicketItem,
  updateSalesTicketQuantity,
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
    submitSaleReturn,
  } = useSalesData();
  const [cart, setCart] = useState<CartItem[]>([]);
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

  const loadSalesWorkspace = useCallback(async () => {
    try {
      setError("");
      await loadSalesData();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo cargar la venta ni el catálogo de productos."));
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
    !canCreateSales || cartIsInvalid || isPaymentInsufficient || isSubmitting || saleDialogIsOpen;

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
    [productSearch, products],
  );
  const exactProductSearchMatch = useMemo(
    () => getExactSearchProduct(products, productSearch),
    [productSearch, products],
  );
  const canAddExactSearchMatch = Boolean(exactProductSearchMatch) && !isSubmitting && !saleDialogIsOpen;

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
    setCart((currentCart) => updateSalesTicketQuantity(currentCart, products, productId, quantity));
  }

  function removeCartItem(productId: string) {
    setCart((currentCart) => removeSalesTicketItem(currentCart, productId));
  }

  function handleProductSearchKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
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
          typeof customerName === "string" && customerName.trim() ? customerName.trim() : undefined,
        paymentMethod,
        paidAmount: normalizedPaid,
        items: cart,
      });

      setMessage("Venta registrada correctamente.");

      setCart([]);
      setCustomerName("");
      setPaymentMethod("CASH");
      setPaidAmount("");
      searchInputRef.current?.focus();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "No se pudo registrar la venta. Verifica productos, stock y método de pago."),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cart,
    cartIsInvalid,
    customerName,
    isPaymentInsufficient,
    normalizedPaid,
    paymentMethod,
    submitSale,
    total,
  ]);

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
    const firstReturnableItem = (sale.items ?? []).find((item) => getReturnableQuantity(sale, item) > 0);

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
        refundMethod: cancelRefundMethod,
      });

      setCancelDialogOpen(false);
      setSelectedSale(null);
      setMessage("Venta cancelada correctamente. El stock fue restaurado.");
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cancelar la venta. Verifica el motivo y el método de devolución.",
        ),
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
            quantity,
          },
        ],
      });

      setReturnDialogOpen(false);
      setSelectedSale(null);
      setMessage("Devolución registrada correctamente. El stock fue restaurado.");
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo registrar la devolución. Verifica el producto, cantidad, motivo y método.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  const selectedReturnItem = selectedSale?.items?.find((item) => item.id === returnSaleItemId);
  const selectedReturnItemAvailable =
    selectedSale && selectedReturnItem ? getReturnableQuantity(selectedSale, selectedReturnItem) : 0;

  const cancelReasonIsInvalid = cancelReason.trim().length < 5;
  const returnQuantityNumber = Number(returnQuantity);
  const returnFormIsInvalid =
    !returnSaleItemId ||
    !Number.isInteger(returnQuantityNumber) ||
    returnQuantityNumber <= 0 ||
    returnQuantityNumber > selectedReturnItemAvailable ||
    returnReason.trim().length < 5;

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
          background: "linear-gradient(135deg, rgba(25, 118, 210, 0.10), rgba(46, 125, 50, 0.08))",
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
                Escanea o busca productos, revisa el ticket y confirma que el pago cubra el total antes de
                cobrar.
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
            overflow: "hidden",
          }}
        >
          <CardContent>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "minmax(0, 1fr) 360px",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              <Box sx={{ display: "grid", gap: 2 }}>
                <SalesProductSearchPanel
                  filteredProducts={filteredProducts}
                  productSearch={productSearch}
                  searchInputRef={searchInputRef}
                  canAddExactSearchMatch={canAddExactSearchMatch}
                  isDisabled={isSubmitting || saleDialogIsOpen}
                  onProductSearchChange={setProductSearch}
                  onProductSearchKeyDown={handleProductSearchKeyDown}
                  onAddExactSearchMatch={addExactSearchMatchToCart}
                  onAddProduct={addProductToCart}
                />

                <SalesTicketPanel
                  cartRows={cartRows}
                  isDisabled={isSubmitting || saleDialogIsOpen}
                  onQuantityChange={updateCartQuantity}
                  onRemoveItem={removeCartItem}
                />
              </Box>

              <Box
                sx={{
                  position: {
                    xs: "static",
                    lg: "sticky",
                  },
                  top: 96,
                  display: "grid",
                  gap: 2,
                }}
              >
                <SalesCheckoutPanel
                  cartItemsCount={cartItemsCount}
                  cartLinesCount={cart.length}
                  change={change}
                  checkoutDisabledReason={checkoutDisabledReason}
                  customerName={customerName}
                  isCheckoutDisabled={checkoutIsDisabled}
                  isPaymentInsufficient={isPaymentInsufficient}
                  normalizedPaid={normalizedPaid}
                  paidAmount={paidAmount}
                  paymentMethod={paymentMethod}
                  total={total}
                  onCheckout={createSale}
                  onCustomerNameChange={setCustomerName}
                  onPaidAmountChange={setPaidAmount}
                  onPaymentMethodChange={setPaymentMethod}
                />
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      <SalesHistoryPanel
        canCancelSales={canCancelSales}
        canManageSales={canManageSales}
        canReturnSales={canReturnSales}
        isSubmitting={isSubmitting}
        sales={sales}
        onOpenCancelDialog={openCancelDialog}
        onOpenReturnDialog={openReturnDialog}
      />

      <ResponsiveDialog
        open={cancelDialogOpen}
        onClose={() => setCancelDialogOpen(false)}
        disableClose={isSubmitting}
        maxWidth="sm"
        title={`Cancelar venta ${selectedSale?.folio ?? ""}`.trim()}
        description="Confirma la cancelación solo cuando la venta deba anularse por completo."
        actions={
          <>
            <Button variant="outlined" onClick={() => setCancelDialogOpen(false)} disabled={isSubmitting}>
              Cerrar
            </Button>
            <Button color="error" onClick={cancelSale} disabled={isSubmitting || cancelReasonIsInvalid}>
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
            <Button variant="outlined" onClick={() => setReturnDialogOpen(false)} disabled={isSubmitting}>
              Cerrar
            </Button>
            <Button color="warning" onClick={returnSaleItem} disabled={isSubmitting || returnFormIsInvalid}>
              Registrar devolución
            </Button>
          </>
        }
      >
        <Box sx={{ display: "grid", gap: 2 }}>
          <Alert severity="info">La devolución restaura stock y actualiza el estado de la venta.</Alert>

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
                  {item.product?.sku ?? item.productId} · {item.product?.name ?? "Producto"} · disponible{" "}
                  {available}
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

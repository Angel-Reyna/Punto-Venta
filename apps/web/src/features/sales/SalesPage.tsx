import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Box, Button, Card, CardContent, Chip } from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

import { PageHeader } from "../../components/PageHeader";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import { getApiErrorMessage } from "../../utils/apiError";

import { SalesCheckoutPanel } from "./SalesCheckoutPanel";
import { SalesHero } from "./SalesHero";
import { SalesHistoryPanel } from "./SalesHistoryPanel";
import { SalesOperationDialogs } from "./SalesOperationDialogs";
import { SalesProductSearchPanel } from "./SalesProductSearchPanel";
import { SalesTicketPanel } from "./SalesTicketPanel";
import { useSalesData } from "./useSalesData";
import { useSalesOperations } from "./useSalesOperations";

import {
  buildCartRows,
  calculateCartTotal,
  formatMoney,
  getExactSearchProduct,
  getFilteredProducts,
  isCartInvalid,
  type CartItem,
  type PaymentMethod,
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

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    cancelDialogOpen,
    cancelReason,
    cancelReasonIsInvalid,
    cancelRefundMethod,
    cancelSale,
    closeCancelDialog,
    closeReturnDialog,
    openCancelDialog,
    openReturnDialog,
    returnDialogOpen,
    returnFormIsInvalid,
    returnQuantity,
    returnReason,
    returnRefundMethod,
    returnSaleItem,
    returnSaleItemId,
    saleDialogIsOpen,
    selectReturnSaleItem,
    selectedReturnItemAvailable,
    selectedSale,
    setCancelReason,
    setCancelRefundMethod,
    setReturnQuantity,
    setReturnReason,
    setReturnRefundMethod,
  } = useSalesOperations({
    setError,
    setIsSubmitting,
    setMessage,
    submitSaleCancellation,
    submitSaleReturn,
  });

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

      <SalesHero
        cartItemsCount={cartItemsCount}
        cartLinesCount={cart.length}
        filteredProductsCount={filteredProducts.length}
        isPaymentInsufficient={isPaymentInsufficient}
        normalizedPaid={normalizedPaid}
        total={total}
      />

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

      <SalesOperationDialogs
        cancelDialogOpen={cancelDialogOpen}
        cancelReason={cancelReason}
        cancelReasonIsInvalid={cancelReasonIsInvalid}
        cancelRefundMethod={cancelRefundMethod}
        isSubmitting={isSubmitting}
        returnDialogOpen={returnDialogOpen}
        returnFormIsInvalid={returnFormIsInvalid}
        returnQuantity={returnQuantity}
        returnReason={returnReason}
        returnRefundMethod={returnRefundMethod}
        returnSaleItemId={returnSaleItemId}
        selectedReturnItemAvailable={selectedReturnItemAvailable}
        selectedSale={selectedSale}
        onCancelReasonChange={setCancelReason}
        onCancelRefundMethodChange={setCancelRefundMethod}
        onCloseCancelDialog={closeCancelDialog}
        onCloseReturnDialog={closeReturnDialog}
        onConfirmCancel={cancelSale}
        onConfirmReturn={returnSaleItem}
        onReturnQuantityChange={setReturnQuantity}
        onReturnReasonChange={setReturnReason}
        onReturnRefundMethodChange={setReturnRefundMethod}
        onReturnSaleItemChange={selectReturnSaleItem}
      />
    </>
  );
}

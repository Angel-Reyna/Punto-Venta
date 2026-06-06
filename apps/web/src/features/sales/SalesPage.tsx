import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Box, Button, Card, CardContent, Chip } from "@mui/material";

import RefreshIcon from "@mui/icons-material/Refresh";

import { PageHeader } from "../../components/PageHeader";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import { getApiErrorMessage } from "../../utils/apiError";

import { SalesAdjustmentRequestsPanel } from "./SalesAdjustmentRequestsPanel";
import { SalesCheckoutPanel } from "./SalesCheckoutPanel";
import { SalesHero } from "./SalesHero";
import { SalesHistoryPanel } from "./SalesHistoryPanel";
import { SalesOperationDialogs } from "./SalesOperationDialogs";
import { SalesProductSearchPanel } from "./SalesProductSearchPanel";
import { SalesSourceWarehousePanel } from "./SalesSourceWarehousePanel";
import { SalesTicketPanel } from "./SalesTicketPanel";
import { useSalesData } from "./useSalesData";
import { useSalesOperations } from "./useSalesOperations";

import {
  applyWarehouseStockToProducts,
  buildCartRows,
  buildFallbackWarehouseOption,
  calculateCartTotal,
  formatMoney,
  getExactSearchProduct,
  getFilteredProducts,
  isCartInvalid,
  type CartItem,
  type PaymentMethod,
  type SalesWarehouseOption,
} from "./salesShared";
import {
  SALES_TICKET_MESSAGES,
  addProductToSalesTicket,
  removeSalesTicketItem,
  updateSalesTicketQuantity,
} from "./salesTicket";

export function SalesPage() {
  const { can, user } = useAuth();

  const canCreateSales = can(PERMISSIONS.SalesCreate);
  const canCancelSales = can(PERMISSIONS.SalesCancel);
  const canReturnSales = can(PERMISSIONS.SalesReturn);
  const canRequestSalesAdjustments = can(PERMISSIONS.SalesAdjustmentRequestCreate);
  const canReviewAdjustmentRequests = can(PERMISSIONS.SalesAdjustmentRequestReview);
  const canShowSellerInfo = canCancelSales || canReturnSales || canReviewAdjustmentRequests;

  const {
    adjustmentRequests,
    products,
    sales,
    warehouseOptions,
    isLoadingCatalog,
    approveAdjustmentRequest,
    loadSalesData,
    rejectAdjustmentRequest,
    submitSale,
    submitSaleCancellation,
    submitSaleReturn,
    submitSalesAdjustmentRequest,
  } = useSalesData();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [customerName, setCustomerName] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("CASH");
  const [productSearch, setProductSearch] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [selectedWarehouseId, setSelectedWarehouseId] = useState("");
  const searchInputRef = useRef<HTMLInputElement | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const {
    cancelDialogOpen,
    cancelOperationMode,
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
    returnItemsDraft,
    returnOperationMode,
    returnQuantities,
    returnReason,
    returnRefundMethod,
    returnSaleItems,
    saleDialogIsOpen,
    selectedReturnItemsCount,
    selectedReturnUnits,
    selectedSale,
    setCancelReason,
    setCancelRefundMethod,
    setReturnItemQuantity,
    setReturnReason,
    setReturnRefundMethod,
  } = useSalesOperations({
    setError,
    setIsSubmitting,
    setMessage,
    submitSaleCancellation,
    submitSaleReturn,
    submitSalesAdjustmentRequest,
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

  const visibleWarehouseOptions = useMemo<SalesWarehouseOption[]>(() => {
    if (user?.role !== "CASHIER") {
      return warehouseOptions;
    }

    const sellerWarehouseOptions = warehouseOptions.filter((warehouse) => {
      return warehouse.type === "SELLER" && (!warehouse.sellerId || warehouse.sellerId === user.id);
    });

    return [buildFallbackWarehouseOption(products), ...sellerWarehouseOptions];
  }, [products, user?.id, user?.role, warehouseOptions]);

  const selectedWarehouse = useMemo(() => {
    return visibleWarehouseOptions.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null;
  }, [selectedWarehouseId, visibleWarehouseOptions]);

  const productsForSelectedWarehouse = useMemo(
    () => applyWarehouseStockToProducts(products, selectedWarehouse),
    [products, selectedWarehouse],
  );

  const total = useMemo(() => calculateCartTotal(cart, productsForSelectedWarehouse), [cart, productsForSelectedWarehouse]);
  const cartIsInvalid = useMemo(() => isCartInvalid(cart, productsForSelectedWarehouse), [cart, productsForSelectedWarehouse]);

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
    () => getFilteredProducts(productsForSelectedWarehouse, productSearch),
    [productSearch, productsForSelectedWarehouse],
  );
  const exactProductSearchMatch = useMemo(
    () => getExactSearchProduct(productsForSelectedWarehouse, productSearch),
    [productSearch, productsForSelectedWarehouse],
  );
  const canAddExactSearchMatch = Boolean(exactProductSearchMatch) && !isSubmitting && !saleDialogIsOpen;

  const cartRows = useMemo(() => buildCartRows(cart, productsForSelectedWarehouse), [cart, productsForSelectedWarehouse]);

  useEffect(() => {
    if (visibleWarehouseOptions.length === 0) {
      if (selectedWarehouseId) {
        setSelectedWarehouseId("");
      }
      return;
    }

    const preferredWarehouse = user?.role === "CASHIER"
      ? visibleWarehouseOptions.find((warehouse) => warehouse.type === "SELLER" && warehouse.totalUnits > 0)
      : visibleWarehouseOptions.find((warehouse) => warehouse.type === "STORAGE" && warehouse.totalUnits > 0);
    const currentWarehouseExists = visibleWarehouseOptions.some((warehouse) => warehouse.id === selectedWarehouseId);

    if (currentWarehouseExists && !(selectedWarehouseId === "" && preferredWarehouse?.id)) {
      return;
    }

    setSelectedWarehouseId((preferredWarehouse ?? visibleWarehouseOptions[0]).id);
  }, [selectedWarehouseId, user?.role, visibleWarehouseOptions]);

  function handleWarehouseChange(warehouseId: string) {
    if (warehouseId === selectedWarehouseId) {
      return;
    }

    setSelectedWarehouseId(warehouseId);
    setCart([]);
    setProductSearch("");
    setError("");
  }

  function addProductToCart(productId: string) {
    const result = addProductToSalesTicket(cart, productsForSelectedWarehouse, productId);

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
    setCart((currentCart) => updateSalesTicketQuantity(currentCart, productsForSelectedWarehouse, productId, quantity));
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
        warehouseId: selectedWarehouse?.id || undefined,
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
    selectedWarehouse?.id,
    submitSale,
    total,
  ]);

  const approveAdjustment = useCallback(
    async (requestId: string, reviewNote?: string) => {
      try {
        setIsSubmitting(true);
        setError("");
        setMessage("");

        await approveAdjustmentRequest(requestId, { reviewNote });

        setMessage("Solicitud aprobada correctamente. El ajuste fue aplicado.");
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "No se pudo aprobar la solicitud de ajuste."));
      } finally {
        setIsSubmitting(false);
      }
    },
    [approveAdjustmentRequest],
  );

  const rejectAdjustment = useCallback(
    async (requestId: string, reviewNote?: string) => {
      try {
        setIsSubmitting(true);
        setError("");
        setMessage("");

        await rejectAdjustmentRequest(requestId, { reviewNote });

        setMessage("Solicitud rechazada correctamente.");
      } catch (err: unknown) {
        setError(getApiErrorMessage(err, "No se pudo rechazar la solicitud de ajuste."));
      } finally {
        setIsSubmitting(false);
      }
    },
    [rejectAdjustmentRequest],
  );

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
          canShowSellerInfo
            ? "Registra ventas, revisa tickets recientes y administra cancelaciones o devoluciones."
            : canRequestSalesAdjustments
              ? "Registra ventas y solicita cancelaciones o devoluciones cuando necesites revisión del administrador."
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
          color={canShowSellerInfo ? "primary" : "success"}
          label={
            canShowSellerInfo
              ? "Vista con gestión de ventas"
              : canRequestSalesAdjustments
                ? "Vista vendedor: ajustes con aprobación"
                : "Vista vendedor: solo tus ventas"
          }
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
          <CardContent sx={{ p: { xs: 1.5, sm: 2, lg: 2.5 } }}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "minmax(0, 1.25fr) minmax(300px, 0.75fr)",
                  xl: "minmax(0, 1fr) 380px",
                },
                gap: { xs: 2, lg: 2.5 },
                alignItems: "start",
              }}
            >
              <Box sx={{ display: "grid", gap: { xs: 2, lg: 2.5 } }}>
                <SalesSourceWarehousePanel
                  cartItemsCount={cartItemsCount}
                  isDisabled={isSubmitting || saleDialogIsOpen}
                  selectedWarehouseId={selectedWarehouseId}
                  selectedWarehouse={selectedWarehouse}
                  total={total}
                  warehouseOptions={visibleWarehouseOptions}
                  onWarehouseChange={handleWarehouseChange}
                />

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
                    md: "sticky",
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
        adjustmentRequests={adjustmentRequests}
        canCancelSales={canCancelSales}
        canRequestSalesAdjustments={canRequestSalesAdjustments}
        canReturnSales={canReturnSales}
        canShowSellerInfo={canShowSellerInfo}
        isSubmitting={isSubmitting}
        sales={sales}
        onOpenCancelDialog={openCancelDialog}
        onOpenReturnDialog={openReturnDialog}
      />

      {(canReviewAdjustmentRequests || canRequestSalesAdjustments) && (
        <Box sx={{ mt: 2 }}>
          <SalesAdjustmentRequestsPanel
            adjustmentRequests={adjustmentRequests}
            canReviewAdjustmentRequests={canReviewAdjustmentRequests}
            isSubmitting={isSubmitting}
            onApproveAdjustmentRequest={approveAdjustment}
            onRejectAdjustmentRequest={rejectAdjustment}
          />
        </Box>
      )}

      <SalesOperationDialogs
        cancelDialogOpen={cancelDialogOpen}
        cancelOperationMode={cancelOperationMode}
        cancelReason={cancelReason}
        cancelReasonIsInvalid={cancelReasonIsInvalid}
        cancelRefundMethod={cancelRefundMethod}
        isSubmitting={isSubmitting}
        returnDialogOpen={returnDialogOpen}
        returnFormIsInvalid={returnFormIsInvalid}
        returnItemsDraft={returnItemsDraft}
        returnOperationMode={returnOperationMode}
        returnQuantities={returnQuantities}
        returnReason={returnReason}
        returnRefundMethod={returnRefundMethod}
        selectedReturnItemsCount={selectedReturnItemsCount}
        selectedReturnUnits={selectedReturnUnits}
        selectedSale={selectedSale}
        onCancelReasonChange={setCancelReason}
        onCancelRefundMethodChange={setCancelRefundMethod}
        onCloseCancelDialog={closeCancelDialog}
        onCloseReturnDialog={closeReturnDialog}
        onConfirmCancel={cancelSale}
        onConfirmReturn={returnSaleItems}
        onReturnItemQuantityChange={setReturnItemQuantity}
        onReturnReasonChange={setReturnReason}
        onReturnRefundMethodChange={setReturnRefundMethod}
      />
    </>
  );
}

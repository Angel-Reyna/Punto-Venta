import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { Box, Button, Card, CardContent, Chip, Tab, Tabs, Typography } from "@mui/material";
import { useSearchParams } from "react-router-dom";

import RefreshIcon from "@mui/icons-material/Refresh";

import { PageHeader } from "../../components/PageHeader";
import { StatusFeedback } from "../../components/StatusFeedback";
import { useAuth } from "../../auth/AuthContext";
import { PERMISSIONS } from "../../auth/permissions";
import { getApiErrorMessage } from "../../utils/apiError";

import { SalesAdjustmentRequestsPanel } from "./SalesAdjustmentRequestsPanel";
import { SalesCheckoutPanel } from "./SalesCheckoutPanel";
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

type SalesWorkspaceView = "sale" | "history" | "adjustments";

export function SalesPage() {
  const { can, user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  const canCreateSales = can(PERMISSIONS.SalesCreate);
  const canCancelSales = can(PERMISSIONS.SalesCancel);
  const canReturnSales = can(PERMISSIONS.SalesReturn);
  const canRequestSalesAdjustments = can(PERMISSIONS.SalesAdjustmentRequestCreate);
  const canReviewAdjustmentRequests = can(PERMISSIONS.SalesAdjustmentRequestReview);
  const canShowSellerInfo = canCancelSales || canReturnSales || canReviewAdjustmentRequests;
  const canShowAdjustmentRequestsPanel = canReviewAdjustmentRequests || canRequestSalesAdjustments;

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
  const requestedSalesView = searchParams.get("view");
  const [activeSalesView, setActiveSalesView] = useState<SalesWorkspaceView>(
    requestedSalesView === "adjustments"
      ? "adjustments"
      : requestedSalesView === "history" || !canCreateSales
        ? "history"
        : "sale",
  );
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

    return warehouseOptions.filter((warehouse) => {
      return warehouse.type === "SELLER" && warehouse.sellerId === user.id;
    });
  }, [user?.id, user?.role, warehouseOptions]);

  const selectedWarehouse = useMemo(() => {
    return visibleWarehouseOptions.find((warehouse) => warehouse.id === selectedWarehouseId) ?? null;
  }, [selectedWarehouseId, visibleWarehouseOptions]);

  const sellerSaleRequiresAssignedStock = user?.role === "CASHIER";
  const selectedWarehouseCanBeUsed =
    !sellerSaleRequiresAssignedStock ||
    Boolean(selectedWarehouse?.type === "SELLER" && selectedWarehouse.sellerId === user?.id);

  const productsForSelectedWarehouse = useMemo(
    () =>
      selectedWarehouseCanBeUsed
        ? applyWarehouseStockToProducts(products, selectedWarehouse)
        : applyWarehouseStockToProducts(products, {
            id: "",
            name: "Stock asignado no disponible",
            type: "SELLER",
            sellerId: user?.id ?? null,
            totalUnits: 0,
            stockByProductId: {},
          }),
    [products, selectedWarehouse, selectedWarehouseCanBeUsed, user?.id],
  );

  const total = useMemo(() => calculateCartTotal(cart, productsForSelectedWarehouse), [cart, productsForSelectedWarehouse]);
  const cartIsInvalid = useMemo(() => isCartInvalid(cart, productsForSelectedWarehouse), [cart, productsForSelectedWarehouse]);

  const paid = Number(paidAmount || 0);
  const normalizedPaid = Number.isFinite(paid) ? paid : 0;
  const isPaymentInsufficient = cart.length > 0 && normalizedPaid < total;
  const change = Math.max(normalizedPaid - total, 0);
  const cartItemsCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const checkoutIsDisabled =
    !canCreateSales ||
    !selectedWarehouseCanBeUsed ||
    cartIsInvalid ||
    isPaymentInsufficient ||
    isSubmitting ||
    saleDialogIsOpen;

  const checkoutDisabledReason = (() => {
    if (!canCreateSales) return "No tienes permiso para registrar ventas.";
    if (!selectedWarehouseCanBeUsed) {
      return "Selecciona tu stock asignado. Si no tienes producto disponible, solicita retiro al administrador.";
    }
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
  const sellableProductsCount = useMemo(
    () => productsForSelectedWarehouse.filter((product) => product.stock > 0).length,
    [productsForSelectedWarehouse],
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

  useEffect(() => {
    if (requestedSalesView === "adjustments" && canShowAdjustmentRequestsPanel) {
      setActiveSalesView("adjustments");
      return;
    }

    if (requestedSalesView === "history") {
      setActiveSalesView("history");
      return;
    }

    setActiveSalesView(canCreateSales ? "sale" : "history");
  }, [canCreateSales, canShowAdjustmentRequestsPanel, requestedSalesView]);

  function changeSalesView(value: SalesWorkspaceView) {
    setActiveSalesView(value);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);

      if (value === "adjustments") {
        next.set("view", "adjustments");
      } else if (value === "history") {
        next.set("view", "history");
        next.delete("status");
      } else {
        next.delete("view");
        next.delete("status");
      }

      return next;
    }, { replace: true });
  }

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

    if (!selectedWarehouseCanBeUsed) {
      setError("Selecciona tu stock asignado. Si no tienes producto disponible, solicita retiro al administrador.");
      return;
    }

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
      setActiveSalesView("sale");
      setSearchParams((current) => {
        const next = new URLSearchParams(current);
        next.delete("view");
        next.delete("status");
        return next;
      }, { replace: true });

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
    selectedWarehouseCanBeUsed,
    setSearchParams,
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

      <Card data-testid="sales-records-switcher" sx={{ mb: 2 }}>
        <CardContent sx={{ p: { xs: 1, sm: 1.25 } }}>
          <Tabs
            value={activeSalesView}
            onChange={(_, value: SalesWorkspaceView) => changeSalesView(value)}
            aria-label="Secciones de ventas"
            variant="scrollable"
            allowScrollButtonsMobile
          >
            {canCreateSales && <Tab label="Venta" value="sale" />}
            <Tab label="Historial operativo" value="history" />
            {canShowAdjustmentRequestsPanel && <Tab label="Solicitudes de ajuste" value="adjustments" />}
          </Tabs>
        </CardContent>
      </Card>

      {canCreateSales && activeSalesView === "sale" && (
        <Box sx={{ display: "grid", gap: 2, mb: 2 }}>
          <SalesSourceWarehousePanel
            isDisabled={isSubmitting || saleDialogIsOpen}
            selectedWarehouseId={selectedWarehouseId}
            selectedWarehouse={selectedWarehouse}
            warehouseOptions={visibleWarehouseOptions}
            sellerSaleRequiresAssignedStock={sellerSaleRequiresAssignedStock}
            onWarehouseChange={handleWarehouseChange}
          />

          <Card
            data-testid="sales-operation-panel"
            sx={{
              border: "1px solid",
              borderColor: "divider",
              overflow: "hidden",
              boxShadow: "none",
            }}
          >
            <CardContent sx={{ display: "grid", gap: { xs: 1.5, md: 2 }, p: { xs: 1.5, sm: 2, lg: 2.5 } }}>
              <Box
                sx={{
                  display: "flex",
                  flexDirection: { xs: "column", lg: "row" },
                  gap: 1.25,
                  justifyContent: "space-between",
                  alignItems: { xs: "flex-start", lg: "center" },
                }}
              >
                <Box>
                  <Typography variant="overline" color="primary" fontWeight={900}>
                    Operación
                  </Typography>
                  <Typography variant="h5" fontWeight={900} letterSpacing="-0.03em">
                    Venta en curso
                  </Typography>
                  <Typography color="text.secondary" sx={{ maxWidth: 720 }}>
                    Selecciona productos del almacén activo, cobra y revisa el ticket sin perder contexto.
                  </Typography>
                </Box>

                <Chip
                  color="success"
                  variant="outlined"
                  label={`${selectedWarehouse?.name ?? "Almacén"} · ${sellableProductsCount} producto(s) vendibles`}
                  sx={{ fontWeight: 800 }}
                />
              </Box>

              <Box
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    lg: "minmax(0, 1.24fr) minmax(332px, 0.76fr)",
                    xl: "minmax(0, 1.28fr) minmax(350px, 0.72fr)",
                  },
                  gap: { xs: 1.5, lg: 2 },
                  alignItems: "start",
                }}
              >
                <Box sx={{ display: "grid", gap: 1.5, minWidth: 0 }}>
                  <SalesProductSearchPanel
                    filteredProducts={filteredProducts}
                    productSearch={productSearch}
                    requiresAssignedSellerStock={sellerSaleRequiresAssignedStock}
                    selectedWarehouseCanBeUsed={selectedWarehouseCanBeUsed}
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
                    cartItemsCount={cartItemsCount}
                    isDisabled={isSubmitting || saleDialogIsOpen}
                    onQuantityChange={updateCartQuantity}
                    onRemoveItem={removeCartItem}
                  />
                </Box>

                <Box
                  sx={{
                    position: { xs: "static", lg: "sticky" },
                    top: 96,
                    display: "grid",
                    gap: 1.5,
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
        </Box>
      )}

      {activeSalesView === "history" ? (
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
      ) : activeSalesView === "adjustments" && canShowAdjustmentRequestsPanel ? (
        <SalesAdjustmentRequestsPanel
          adjustmentRequests={adjustmentRequests}
          canReviewAdjustmentRequests={canReviewAdjustmentRequests}
          isSubmitting={isSubmitting}
          onApproveAdjustmentRequest={approveAdjustment}
          onRejectAdjustmentRequest={rejectAdjustment}
        />
      ) : null}

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

import { useCallback, useMemo, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";

import type {
  CancelSalePayload,
  CreateSalesAdjustmentRequestPayload,
  ReturnSaleItemsPayload,
} from "./salesApi";
import { getReturnableQuantity, type PaymentMethod, type Sale, type SaleItem } from "./salesShared";

type SubmitSaleCancellation = (saleId: string, payload: CancelSalePayload) => Promise<void>;
type SubmitSaleReturn = (saleId: string, payload: ReturnSaleItemsPayload) => Promise<void>;
type SubmitSalesAdjustmentRequest = (
  saleId: string,
  payload: CreateSalesAdjustmentRequestPayload,
) => Promise<void>;

export type SalesOperationMode = "direct" | "request";

type UseSalesOperationsOptions = {
  setError: (message: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setMessage: (message: string) => void;
  submitSaleCancellation: SubmitSaleCancellation;
  submitSaleReturn: SubmitSaleReturn;
  submitSalesAdjustmentRequest: SubmitSalesAdjustmentRequest;
};

export type ReturnQuantityDrafts = Record<string, string>;

export type ReturnItemDraft = {
  available: number;
  isSelected: boolean;
  quantity: number;
  rawQuantity: string;
  saleItem: SaleItem;
};

function parseReturnQuantity(value: string) {
  const trimmedValue = value.trim();

  if (!trimmedValue) {
    return 0;
  }

  const quantity = Number(trimmedValue);

  return Number.isInteger(quantity) ? quantity : Number.NaN;
}

function buildInitialReturnQuantities(sale: Sale): ReturnQuantityDrafts {
  const returnableItems = (sale.items ?? []).filter((item) => getReturnableQuantity(sale, item) > 0);

  if (returnableItems.length !== 1) {
    return {};
  }

  return {
    [returnableItems[0].id]: "1",
  };
}

export function useSalesOperations({
  setError,
  setIsSubmitting,
  setMessage,
  submitSaleCancellation,
  submitSaleReturn,
  submitSalesAdjustmentRequest,
}: UseSalesOperationsOptions) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [cancelOperationMode, setCancelOperationMode] = useState<SalesOperationMode>("direct");
  const [returnOperationMode, setReturnOperationMode] = useState<SalesOperationMode>("direct");
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefundMethod, setCancelRefundMethod] = useState<PaymentMethod>("CASH");
  const [returnReason, setReturnReason] = useState("");
  const [returnRefundMethod, setReturnRefundMethod] = useState<PaymentMethod>("CASH");
  const [returnQuantities, setReturnQuantities] = useState<ReturnQuantityDrafts>({});

  const saleDialogIsOpen = cancelDialogOpen || returnDialogOpen;

  const openCancelDialog = useCallback((sale: Sale, mode: SalesOperationMode = "direct") => {
    setSelectedSale(sale);
    setCancelOperationMode(mode);
    setCancelReason("");
    setCancelRefundMethod(sale.payments?.[0]?.method ?? "CASH");
    setCancelDialogOpen(true);
  }, []);

  const openReturnDialog = useCallback((sale: Sale, mode: SalesOperationMode = "direct") => {
    setSelectedSale(sale);
    setReturnOperationMode(mode);
    setReturnReason("");
    setReturnRefundMethod(sale.payments?.[0]?.method ?? "CASH");
    setReturnQuantities(buildInitialReturnQuantities(sale));
    setReturnDialogOpen(true);
  }, []);

  const closeCancelDialog = useCallback(() => {
    setCancelDialogOpen(false);
  }, []);

  const closeReturnDialog = useCallback(() => {
    setReturnDialogOpen(false);
  }, []);

  const setReturnItemQuantity = useCallback((saleItemId: string, quantity: string) => {
    setReturnQuantities((currentQuantities) => ({
      ...currentQuantities,
      [saleItemId]: quantity,
    }));
  }, []);

  const returnItemsDraft = useMemo<ReturnItemDraft[]>(() => {
    if (!selectedSale) {
      return [];
    }

    return (selectedSale.items ?? [])
      .map((saleItem) => {
        const rawQuantity = returnQuantities[saleItem.id] ?? "";
        const quantity = parseReturnQuantity(rawQuantity);
        const available = getReturnableQuantity(selectedSale, saleItem);

        return {
          available,
          isSelected: rawQuantity.trim().length > 0,
          quantity,
          rawQuantity,
          saleItem,
        };
      })
      .filter((item) => item.isSelected || item.available > 0);
  }, [returnQuantities, selectedSale]);

  const selectedReturnItems = useMemo(
    () => returnItemsDraft.filter((item) => item.isSelected),
    [returnItemsDraft],
  );

  const selectedReturnItemsCount = selectedReturnItems.length;
  const selectedReturnUnits = selectedReturnItems.reduce((sum, item) => {
    return Number.isInteger(item.quantity) && item.quantity > 0 ? sum + item.quantity : sum;
  }, 0);

  const returnItemsHaveInvalidQuantity = selectedReturnItems.some((item) => {
    return !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > item.available;
  });

  const cancelSale = useCallback(async () => {
    if (!selectedSale) return;

    if (cancelReason.trim().length < 5) {
      setError("Escribe un motivo claro para cancelar la venta.");
      return;
    }

    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      if (cancelOperationMode === "request") {
        await submitSalesAdjustmentRequest(selectedSale.id, {
          type: "CANCEL_SALE",
          reason: cancelReason.trim(),
          refundMethod: cancelRefundMethod,
        });
      } else {
        await submitSaleCancellation(selectedSale.id, {
          reason: cancelReason.trim(),
          refundMethod: cancelRefundMethod,
        });
      }

      setCancelDialogOpen(false);
      setSelectedSale(null);
      setMessage(
        cancelOperationMode === "request"
          ? "Solicitud de cancelación enviada al administrador."
          : "Venta cancelada correctamente. El stock fue restaurado.",
      );
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          cancelOperationMode === "request"
            ? "No se pudo enviar la solicitud de cancelación. Verifica el motivo."
            : "No se pudo cancelar la venta. Verifica el motivo y el método de devolución.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    cancelOperationMode,
    cancelReason,
    cancelRefundMethod,
    selectedSale,
    setError,
    setIsSubmitting,
    setMessage,
    submitSaleCancellation,
    submitSalesAdjustmentRequest,
  ]);

  const returnSaleItems = useCallback(async () => {
    if (!selectedSale) return;

    if (selectedReturnItems.length === 0) {
      setError("Indica al menos un producto y una cantidad para devolver.");
      return;
    }

    const invalidItem = selectedReturnItems.find((item) => {
      return !Number.isInteger(item.quantity) || item.quantity <= 0 || item.quantity > item.available;
    });

    if (invalidItem) {
      setError(
        `La cantidad a devolver de ${invalidItem.saleItem.product?.name ?? invalidItem.saleItem.productName ?? "producto"} debe estar entre 1 y ${invalidItem.available}.`,
      );
      return;
    }

    if (returnReason.trim().length < 5) {
      setError("Escribe un motivo claro para registrar la devolución.");
      return;
    }

    const items = selectedReturnItems.map((item) => ({
      saleItemId: item.saleItem.id,
      quantity: item.quantity,
    }));

    try {
      setIsSubmitting(true);
      setError("");
      setMessage("");

      if (returnOperationMode === "request") {
        await submitSalesAdjustmentRequest(selectedSale.id, {
          type: "RETURN_ITEMS",
          reason: returnReason.trim(),
          refundMethod: returnRefundMethod,
          items,
        });
      } else {
        await submitSaleReturn(selectedSale.id, {
          reason: returnReason.trim(),
          refundMethod: returnRefundMethod,
          items,
        });
      }

      setReturnDialogOpen(false);
      setSelectedSale(null);
      setReturnQuantities({});
      setMessage(
        returnOperationMode === "request"
          ? "Solicitud de devolución enviada al administrador."
          : "Devolución registrada correctamente. El stock fue restaurado.",
      );
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          returnOperationMode === "request"
            ? "No se pudo enviar la solicitud de devolución. Verifica productos, cantidades y motivo."
            : "No se pudo registrar la devolución. Verifica los productos, cantidades, motivo y método.",
        ),
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    returnOperationMode,
    returnReason,
    returnRefundMethod,
    selectedReturnItems,
    selectedSale,
    setError,
    setIsSubmitting,
    setMessage,
    submitSaleReturn,
    submitSalesAdjustmentRequest,
  ]);

  const cancelReasonIsInvalid = cancelReason.trim().length < 5;
  const returnFormIsInvalid =
    selectedReturnItemsCount === 0 || returnItemsHaveInvalidQuantity || returnReason.trim().length < 5;

  return {
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
  };
}

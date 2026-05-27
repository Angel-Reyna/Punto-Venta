import { useCallback, useMemo, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";

import type { CancelSalePayload, ReturnSaleItemsPayload } from "./salesApi";
import { getReturnableQuantity, type PaymentMethod, type Sale } from "./salesShared";

type SubmitSaleCancellation = (saleId: string, payload: CancelSalePayload) => Promise<void>;
type SubmitSaleReturn = (saleId: string, payload: ReturnSaleItemsPayload) => Promise<void>;

type UseSalesOperationsOptions = {
  setError: (message: string) => void;
  setIsSubmitting: (isSubmitting: boolean) => void;
  setMessage: (message: string) => void;
  submitSaleCancellation: SubmitSaleCancellation;
  submitSaleReturn: SubmitSaleReturn;
};

export function useSalesOperations({
  setError,
  setIsSubmitting,
  setMessage,
  submitSaleCancellation,
  submitSaleReturn,
}: UseSalesOperationsOptions) {
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [returnDialogOpen, setReturnDialogOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelRefundMethod, setCancelRefundMethod] = useState<PaymentMethod>("CASH");
  const [returnReason, setReturnReason] = useState("");
  const [returnRefundMethod, setReturnRefundMethod] = useState<PaymentMethod>("CASH");
  const [returnSaleItemId, setReturnSaleItemId] = useState("");
  const [returnQuantity, setReturnQuantity] = useState("1");

  const saleDialogIsOpen = cancelDialogOpen || returnDialogOpen;

  const openCancelDialog = useCallback((sale: Sale) => {
    setSelectedSale(sale);
    setCancelReason("");
    setCancelRefundMethod(sale.payments?.[0]?.method ?? "CASH");
    setCancelDialogOpen(true);
  }, []);

  const openReturnDialog = useCallback((sale: Sale) => {
    const firstReturnableItem = (sale.items ?? []).find((item) => getReturnableQuantity(sale, item) > 0);

    setSelectedSale(sale);
    setReturnReason("");
    setReturnRefundMethod(sale.payments?.[0]?.method ?? "CASH");
    setReturnSaleItemId(firstReturnableItem?.id ?? "");
    setReturnQuantity("1");
    setReturnDialogOpen(true);
  }, []);

  const closeCancelDialog = useCallback(() => {
    setCancelDialogOpen(false);
  }, []);

  const closeReturnDialog = useCallback(() => {
    setReturnDialogOpen(false);
  }, []);

  const selectReturnSaleItem = useCallback((saleItemId: string) => {
    setReturnSaleItemId(saleItemId);
    setReturnQuantity("1");
  }, []);

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
  }, [
    cancelReason,
    cancelRefundMethod,
    selectedSale,
    setError,
    setIsSubmitting,
    setMessage,
    submitSaleCancellation,
  ]);

  const returnSaleItem = useCallback(async () => {
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
  }, [
    returnQuantity,
    returnReason,
    returnRefundMethod,
    returnSaleItemId,
    selectedSale,
    setError,
    setIsSubmitting,
    setMessage,
    submitSaleReturn,
  ]);

  const selectedReturnItem = useMemo(
    () => selectedSale?.items?.find((item) => item.id === returnSaleItemId),
    [returnSaleItemId, selectedSale],
  );
  const selectedReturnItemAvailable = useMemo(
    () => (selectedSale && selectedReturnItem ? getReturnableQuantity(selectedSale, selectedReturnItem) : 0),
    [selectedReturnItem, selectedSale],
  );

  const cancelReasonIsInvalid = cancelReason.trim().length < 5;
  const returnQuantityNumber = Number(returnQuantity);
  const returnFormIsInvalid =
    !returnSaleItemId ||
    !Number.isInteger(returnQuantityNumber) ||
    returnQuantityNumber <= 0 ||
    returnQuantityNumber > selectedReturnItemAvailable ||
    returnReason.trim().length < 5;

  return {
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
  };
}

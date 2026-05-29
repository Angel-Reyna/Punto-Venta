import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import {
  closeCashSession,
  createManualCashMovement,
  getCurrentCashSession,
  listCashSessions,
  openCashSession,
} from "./cashRegisterApi";
import type { CashRegisterSession } from "./cashRegisterShared";

export type ManualCashMovementType = "CASH_IN" | "CASH_OUT";

export function useCashRegisterData(params: {
  canManageCashRegister: boolean;
  canOperateCashRegister: boolean;
  canReadCashRegisterSessions: boolean;
}) {
  const {
    canManageCashRegister,
    canOperateCashRegister,
    canReadCashRegisterSessions,
  } = params;

  const [currentSession, setCurrentSession] =
    useState<CashRegisterSession | null>(null);
  const [sessions, setSessions] = useState<CashRegisterSession[]>([]);

  const [openingAmount, setOpeningAmount] = useState("0");
  const [openingNotes, setOpeningNotes] = useState("");
  const [closingAmount, setClosingAmount] = useState("0");
  const [closingNotes, setClosingNotes] = useState("");
  const [movementType, setMovementType] =
    useState<ManualCashMovementType>("CASH_IN");
  const [movementAmount, setMovementAmount] = useState("");
  const [movementReason, setMovementReason] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const loadCashRegister = useCallback(async () => {
    try {
      setError("");
      setIsLoading(true);

      const [loadedCurrentSession, loadedSessions] = await Promise.all([
        canOperateCashRegister ? getCurrentCashSession() : Promise.resolve(null),
        canReadCashRegisterSessions ? listCashSessions() : Promise.resolve([]),
      ]);

      setCurrentSession(loadedCurrentSession);
      setSessions(loadedSessions);

      if (loadedCurrentSession) {
        setClosingAmount(String(loadedCurrentSession.expectedCash ?? 0));
      }
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cargar la información de caja. Intenta actualizar la página.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, [canOperateCashRegister, canReadCashRegisterSessions]);

  useEffect(() => {
    void loadCashRegister();
  }, [loadCashRegister]);

  const openRegister = useCallback(async () => {
    setMessage("");
    setError("");

    const amount = Number(openingAmount);

    if (!canOperateCashRegister) {
      setError("No tienes permiso para operar caja.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setError("El monto inicial debe ser un número válido mayor o igual a cero.");
      return;
    }

    try {
      await openCashSession({
        openingAmount: amount,
        notes: openingNotes.trim() || undefined,
      });

      setMessage("Caja abierta correctamente.");
      setOpeningAmount("0");
      setOpeningNotes("");
      await loadCashRegister();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "No se pudo abrir la caja. Verifica el monto inicial."),
      );
    }
  }, [canOperateCashRegister, loadCashRegister, openingAmount, openingNotes]);

  const closeRegister = useCallback(async () => {
    setMessage("");
    setError("");

    const amount = Number(closingAmount);

    if (!canOperateCashRegister) {
      setError("No tienes permiso para operar caja.");
      return;
    }

    if (!Number.isFinite(amount) || amount < 0) {
      setError("El monto contado debe ser un número válido mayor o igual a cero.");
      return;
    }

    try {
      await closeCashSession({
        closingAmount: amount,
        notes: closingNotes.trim() || undefined,
      });

      setMessage("Caja cerrada correctamente.");
      setClosingNotes("");
      await loadCashRegister();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "No se pudo cerrar la caja. Verifica el monto contado."),
      );
    }
  }, [canOperateCashRegister, closingAmount, closingNotes, loadCashRegister]);

  const addManualMovement = useCallback(async () => {
    setMessage("");
    setError("");

    const amount = Number(movementAmount);

    if (!canManageCashRegister) {
      setError("No tienes permiso para registrar movimientos manuales de efectivo.");
      return;
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      setError("El monto del movimiento debe ser mayor a cero.");
      return;
    }

    if (movementReason.trim().length < 3) {
      setError("Describe el motivo del movimiento de efectivo.");
      return;
    }

    try {
      await createManualCashMovement({
        type: movementType,
        amount,
        reason: movementReason.trim(),
      });

      setMessage("Movimiento de efectivo registrado correctamente.");
      setMovementAmount("");
      setMovementReason("");
      await loadCashRegister();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(err, "No se pudo registrar el movimiento de efectivo."),
      );
    }
  }, [
    canManageCashRegister,
    loadCashRegister,
    movementAmount,
    movementReason,
    movementType,
  ]);

  return {
    addManualMovement,
    closeRegister,
    closingAmount,
    closingNotes,
    currentSession,
    error,
    isLoading,
    loadCashRegister,
    message,
    movementAmount,
    movementReason,
    movementType,
    openRegister,
    openingAmount,
    openingNotes,
    sessions,
    setClosingAmount,
    setClosingNotes,
    setError,
    setMessage,
    setMovementAmount,
    setMovementReason,
    setMovementType,
    setOpeningAmount,
    setOpeningNotes,
  };
}

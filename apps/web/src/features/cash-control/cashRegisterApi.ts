import { api } from "../../api/client";
import type { CashRegisterSession } from "./cashRegisterShared";

export async function getCurrentCashSession() {
  const response = await api.get<{ session: CashRegisterSession | null }>(
    "/cash-register/current",
  );

  return response.data.session;
}

export async function listCashSessions() {
  const response = await api.get<CashRegisterSession[]>(
    "/cash-register/sessions?page=1&pageSize=50",
  );

  return response.data;
}

export async function openCashSession(payload: {
  openingAmount: number;
  notes?: string;
}) {
  await api.post("/cash-register/open", payload);
}

export async function closeCashSession(payload: {
  closingAmount: number;
  notes?: string;
}) {
  await api.post("/cash-register/close", payload);
}

export async function createManualCashMovement(payload: {
  type: "CASH_IN" | "CASH_OUT";
  amount: number;
  reason: string;
}) {
  await api.post("/cash-register/movements", payload);
}

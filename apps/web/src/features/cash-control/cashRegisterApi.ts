import { DEFAULT_ADMIN_PAGE_SIZE } from "../../api/contracts";
import { getJson, postJson } from "../../api/http";
import type { CashRegisterSession } from "./cashRegisterShared";

export type OpenCashSessionPayload = {
  openingAmount: number;
  notes?: string;
};

export type CloseCashSessionPayload = {
  closingAmount: number;
  notes?: string;
};

export type ManualCashMovementPayload = {
  type: "CASH_IN" | "CASH_OUT";
  amount: number;
  reason: string;
};

export async function getCurrentCashSession() {
  const response = await getJson<{ session: CashRegisterSession | null }>(
    "/cash-register/current",
  );

  return response.session;
}

export async function listCashSessions() {
  return getJson<CashRegisterSession[]>("/cash-register/sessions", {
    params: {
      page: 1,
      pageSize: DEFAULT_ADMIN_PAGE_SIZE,
    },
  });
}

export async function openCashSession(payload: OpenCashSessionPayload) {
  await postJson("/cash-register/open", payload);
}

export async function closeCashSession(payload: CloseCashSessionPayload) {
  await postJson("/cash-register/close", payload);
}

export async function createManualCashMovement(payload: ManualCashMovementPayload) {
  await postJson("/cash-register/movements", payload);
}

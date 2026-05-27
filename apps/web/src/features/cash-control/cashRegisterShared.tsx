import { Chip } from "@mui/material";
import { GridColDef } from "@mui/x-data-grid";

import { LabelWithInfo } from "../../components/InfoTooltip";

export type CashRegisterStatus = "OPEN" | "CLOSED";
export type CashMovementType =
  | "OPENING"
  | "CASH_IN"
  | "CASH_OUT"
  | "SALE_CASH"
  | "RETURN_CASH";

export type CashMovement = {
  id: string;
  type: CashMovementType;
  amount: number;
  signedAmount?: number;
  reason: string;
  createdAt: string;
};

export type CashRegisterSession = {
  id: string;
  status: CashRegisterStatus;
  openingAmount: number;
  expectedClosingAmount: number | null;
  closingAmount: number | null;
  difference: number | null;
  expectedCash?: number;
  openedAt: string;
  closedAt: string | null;
  notes: string | null;
  cashier?: {
    id: string;
    name: string;
    email: string;
  };
  movements: CashMovement[];
};

export const CASH_INFO_TEXT = {
  expectedCash: "Efectivo calculado por el sistema: monto inicial más ventas y entradas en efectivo, menos salidas y devoluciones en efectivo.",
  countedCash: "Dinero físico contado al cerrar caja. El sistema lo compara contra el efectivo esperado.",
  cashDifference: "Diferencia entre el efectivo contado y el efectivo esperado. Ayuda a detectar sobrantes o faltantes.",
  movementType: "Entrada aumenta el efectivo de caja; salida lo disminuye. Ambas requieren motivo para auditoría."
};

export function formatMoney(value: number | null | undefined) {
  return `$${Number(value ?? 0).toFixed(2)}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";

  return new Date(value).toLocaleString();
}

export function movementLabel(type: CashMovementType) {
  switch (type) {
    case "OPENING":
      return "Apertura";
    case "CASH_IN":
      return "Entrada manual";
    case "CASH_OUT":
      return "Salida manual";
    case "SALE_CASH":
      return "Venta en efectivo";
    case "RETURN_CASH":
      return "Devolución en efectivo";
    default:
      return type;
  }
}

export function getOpenRegisterDisabledReason(params: {
  canOperateCashRegister: boolean;
  currentSession: CashRegisterSession | null;
  isLoading: boolean;
}) {
  if (!params.canOperateCashRegister) return "No tienes permiso para operar caja.";
  if (params.currentSession) return "Ya tienes una caja abierta.";
  if (params.isLoading) return "Actualizando caja...";

  return "";
}

export function getCloseRegisterDisabledReason(params: {
  canOperateCashRegister: boolean;
  currentSession: CashRegisterSession | null;
  isLoading: boolean;
}) {
  if (!params.canOperateCashRegister) return "No tienes permiso para operar caja.";
  if (!params.currentSession) return "Primero abre caja.";
  if (params.isLoading) return "Actualizando caja...";

  return "";
}

export function getManualMovementDisabledReason(params: {
  canOperateCashRegister: boolean;
  currentSession: CashRegisterSession | null;
  isLoading: boolean;
  movementAmount: string;
  movementReason: string;
}) {
  if (!params.canOperateCashRegister) return "No tienes permiso para operar caja.";
  if (!params.currentSession) return "Primero abre caja.";
  if (params.isLoading) return "Actualizando caja...";
  if (!params.movementAmount || Number(params.movementAmount) <= 0) {
    return "Captura un monto mayor a cero.";
  }
  if (params.movementReason.trim().length < 3) {
    return "Captura un motivo de al menos 3 caracteres.";
  }

  return "";
}

export function isManualMovementSubmitDisabled(params: {
  canOperateCashRegister: boolean;
  currentSession: CashRegisterSession | null;
  isLoading: boolean;
  movementAmount: string;
  movementReason: string;
}) {
  return Boolean(getManualMovementDisabledReason(params));
}

function renderHeaderWithInfo(label: string, info: string) {
  return <LabelWithInfo label={label} info={info} ariaLabel={info} />;
}

export function buildCurrentMovementsColumns(): GridColDef<CashMovement>[] {
  return [
    {
      field: "createdAt",
      headerName: "Fecha",
      width: 180,
      valueFormatter: (value) => formatDate(value as string)
    },
    {
      field: "type",
      headerName: "Tipo",
      renderHeader: () => renderHeaderWithInfo("Tipo", CASH_INFO_TEXT.movementType),
      width: 180,
      valueFormatter: (value) => movementLabel(value as CashMovementType)
    },
    {
      field: "reason",
      headerName: "Motivo",
      flex: 1,
      minWidth: 240
    },
    {
      field: "signedAmount",
      headerName: "Importe",
      width: 140,
      valueGetter: (_value, row) => row.signedAmount ?? row.amount,
      valueFormatter: (value) => formatMoney(Number(value))
    }
  ];
}

export function buildSessionColumns(): GridColDef<CashRegisterSession>[] {
  return [
    {
      field: "openedAt",
      headerName: "Apertura",
      width: 180,
      valueFormatter: (value) => formatDate(value as string)
    },
    {
      field: "closedAt",
      headerName: "Cierre",
      width: 180,
      valueFormatter: (value) => formatDate(value as string | null)
    },
    {
      field: "cashier",
      headerName: "Vendedor",
      flex: 1,
      minWidth: 220,
      valueGetter: (_value, row) =>
        row.cashier ? `${row.cashier.name} (${row.cashier.email})` : "—"
    },
    {
      field: "status",
      headerName: "Estado",
      width: 130,
      renderCell: (params) => (
        <Chip
          size="small"
          label={params.value === "OPEN" ? "Abierta" : "Cerrada"}
          color={params.value === "OPEN" ? "success" : "default"}
        />
      )
    },
    {
      field: "openingAmount",
      headerName: "Inicial",
      width: 130,
      valueFormatter: (value) => formatMoney(Number(value))
    },
    {
      field: "expectedClosingAmount",
      headerName: "Esperado",
      renderHeader: () => renderHeaderWithInfo("Esperado", CASH_INFO_TEXT.expectedCash),
      width: 135,
      valueFormatter: (value) => formatMoney(value as number | null)
    },
    {
      field: "closingAmount",
      headerName: "Contado",
      width: 130,
      valueFormatter: (value) => formatMoney(value as number | null)
    },
    {
      field: "difference",
      headerName: "Diferencia",
      renderHeader: () => renderHeaderWithInfo("Diferencia", CASH_INFO_TEXT.cashDifference),
      width: 140,
      valueFormatter: (value) => formatMoney(value as number | null)
    }
  ];
}

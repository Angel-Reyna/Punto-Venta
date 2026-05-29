import { auditLog } from "../audit/audit.service";

export async function auditCashRegisterOpened(input: {
  userId?: string;
  ipAddress?: string;
  session: {
    id: string;
    openingAmount: number;
    notes: string | null;
  };
}) {
  await auditLog({
    userId: input.userId,
    action: "CASH_REGISTER_OPENED",
    tableName: "CashRegisterSession",
    recordId: input.session.id,
    newData: {
      openingAmount: input.session.openingAmount,
      notes: input.session.notes
    },
    ipAddress: input.ipAddress
  });
}

export async function auditCashMovementCreated(input: {
  userId?: string;
  ipAddress?: string;
  movement: {
    id: string;
    type: string;
    amount: number;
    signedAmount: number;
    reason: string;
  };
}) {
  await auditLog({
    userId: input.userId,
    action: `CASH_${input.movement.type}`,
    tableName: "CashMovement",
    recordId: input.movement.id,
    newData: {
      type: input.movement.type,
      amount: input.movement.amount,
      signedAmount: input.movement.signedAmount,
      reason: input.movement.reason
    },
    ipAddress: input.ipAddress
  });
}

export async function auditCashRegisterClosed(input: {
  userId?: string;
  ipAddress?: string;
  session: {
    id: string;
    expectedClosingAmount: number | null;
    closingAmount: number | null;
    difference: number | null;
    notes: string | null;
  };
}) {
  await auditLog({
    userId: input.userId,
    action: "CASH_REGISTER_CLOSED",
    tableName: "CashRegisterSession",
    recordId: input.session.id,
    newData: {
      expectedClosingAmount: input.session.expectedClosingAmount,
      closingAmount: input.session.closingAmount,
      difference: input.session.difference,
      notes: input.session.notes
    },
    ipAddress: input.ipAddress
  });
}

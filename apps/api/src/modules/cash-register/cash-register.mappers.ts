import { CashMovementType, Prisma } from "@prisma/client";

import { roundMoney } from "./cash-register.shared";

export const cashSessionInclude = {
  cashier: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true
    }
  },
  movements: {
    orderBy: {
      createdAt: "asc"
    }
  }
} satisfies Prisma.CashRegisterSessionInclude;

export type CashRegisterSessionWithMovements =
  Prisma.CashRegisterSessionGetPayload<{
    include: typeof cashSessionInclude;
  }>;

export function signedCashMovementAmount(
  type: CashMovementType,
  amount: number
) {
  switch (type) {
    case CashMovementType.OPENING:
    case CashMovementType.CASH_IN:
    case CashMovementType.SALE_CASH:
      return amount;
    case CashMovementType.CASH_OUT:
    case CashMovementType.RETURN_CASH:
      return -amount;
    default:
      return 0;
  }
}

export function calculateExpectedCash(
  movements: Array<{
    type: CashMovementType;
    amount: Prisma.Decimal | number;
  }>
) {
  return roundMoney(
    movements.reduce(
      (sum, movement) =>
        sum + signedCashMovementAmount(movement.type, Number(movement.amount)),
      0
    )
  );
}

export function mapCashMovement<TMovement extends {
  type: CashMovementType;
  amount: Prisma.Decimal | number;
}>(movement: TMovement) {
  return {
    ...movement,
    amount: Number(movement.amount),
    signedAmount: signedCashMovementAmount(movement.type, Number(movement.amount))
  };
}

export function mapCashRegisterSession(
  session: CashRegisterSessionWithMovements
) {
  const expectedCash = calculateExpectedCash(session.movements);

  return {
    ...session,
    openingAmount: Number(session.openingAmount),
    expectedClosingAmount:
      session.expectedClosingAmount === null
        ? null
        : Number(session.expectedClosingAmount),
    closingAmount:
      session.closingAmount === null ? null : Number(session.closingAmount),
    difference: session.difference === null ? null : Number(session.difference),
    expectedCash,
    movements: session.movements.map(mapCashMovement)
  };
}

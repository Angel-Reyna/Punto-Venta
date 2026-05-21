import {
  CashMovementType,
  CashRegisterStatus,
  Prisma,
  Role
} from "@prisma/client";
import { z } from "zod";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import {
  buildPaginationMeta,
  getDateRange,
  getOptionalString,
  getPagination
} from "../../utils/pagination";

const moneySchema = z.coerce
  .number()
  .finite()
  .min(0)
  .max(99_999_999)
  .transform((value) => roundMoney(value));

export const openCashRegisterSchema = z.object({
  body: z.object({
    openingAmount: moneySchema,
    notes: z.string().trim().max(500).optional().nullable()
  })
});

export const closeCashRegisterSchema = z.object({
  body: z.object({
    closingAmount: moneySchema,
    notes: z.string().trim().max(500).optional().nullable()
  })
});

export const manualCashMovementSchema = z.object({
  body: z.object({
    type: z.enum([CashMovementType.CASH_IN, CashMovementType.CASH_OUT]),
    amount: moneySchema.refine((value) => value > 0, {
      message: "El monto debe ser mayor a cero"
    }),
    reason: z.string().trim().min(3).max(255)
  })
});

export type OpenCashRegisterInput = z.infer<
  typeof openCashRegisterSchema
>["body"];
export type CloseCashRegisterInput = z.infer<
  typeof closeCashRegisterSchema
>["body"];
export type ManualCashMovementInput = z.infer<
  typeof manualCashMovementSchema
>["body"];

export type CurrentUser = {
  id: string;
  email: string;
  role: Role;
};

const cashSessionInclude = {
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

type CashRegisterSessionWithMovements = Prisma.CashRegisterSessionGetPayload<{
  include: typeof cashSessionInclude;
}>;

function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function signedCashMovementAmount(type: CashMovementType, amount: number) {
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

function calculateExpectedCash(
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

function mapCashRegisterSession(session: CashRegisterSessionWithMovements) {
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
    movements: session.movements.map((movement) => ({
      ...movement,
      amount: Number(movement.amount),
      signedAmount: signedCashMovementAmount(movement.type, Number(movement.amount))
    }))
  };
}

async function findOpenSession(
  tx: Prisma.TransactionClient,
  cashierId: string
) {
  return tx.cashRegisterSession.findFirst({
    where: {
      cashierId,
      status: CashRegisterStatus.OPEN
    },
    include: cashSessionInclude,
    orderBy: {
      openedAt: "desc"
    }
  });
}

export async function getCurrentCashRegister(user: CurrentUser) {
  const session = await prisma.cashRegisterSession.findFirst({
    where: {
      cashierId: user.id,
      status: CashRegisterStatus.OPEN
    },
    include: cashSessionInclude,
    orderBy: {
      openedAt: "desc"
    }
  });

  return session ? mapCashRegisterSession(session) : null;
}

export async function openCashRegister(
  user: CurrentUser,
  input: OpenCashRegisterInput
) {
  return prisma.$transaction(
    async (tx) => {
      const existingSession = await findOpenSession(tx, user.id);

      if (existingSession) {
        throw new AppError(409, "Ya tienes una caja abierta");
      }

      const session = await tx.cashRegisterSession.create({
        data: {
          cashierId: user.id,
          openingAmount: input.openingAmount,
          notes: input.notes ?? null,
          movements: {
            create: {
              cashierId: user.id,
              type: CashMovementType.OPENING,
              amount: input.openingAmount,
              reason: "Apertura de caja"
            }
          }
        },
        include: cashSessionInclude
      });

      return mapCashRegisterSession(session);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 10_000
    }
  );
}

export async function addManualCashMovement(
  user: CurrentUser,
  input: ManualCashMovementInput
) {
  return prisma.$transaction(
    async (tx) => {
      const session = await findOpenSession(tx, user.id);

      if (!session) {
        throw new AppError(409, "Debes abrir caja antes de registrar efectivo");
      }

      const movement = await tx.cashMovement.create({
        data: {
          sessionId: session.id,
          cashierId: user.id,
          type: input.type,
          amount: input.amount,
          reason: input.reason
        }
      });

      return {
        ...movement,
        amount: Number(movement.amount),
        signedAmount: signedCashMovementAmount(movement.type, Number(movement.amount))
      };
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 10_000
    }
  );
}

export async function closeCashRegister(
  user: CurrentUser,
  input: CloseCashRegisterInput
) {
  return prisma.$transaction(
    async (tx) => {
      const session = await findOpenSession(tx, user.id);

      if (!session) {
        throw new AppError(409, "No tienes una caja abierta");
      }

      const expectedClosingAmount = calculateExpectedCash(session.movements);
      const difference = roundMoney(input.closingAmount - expectedClosingAmount);

      const closedSession = await tx.cashRegisterSession.update({
        where: {
          id: session.id
        },
        data: {
          status: CashRegisterStatus.CLOSED,
          expectedClosingAmount,
          closingAmount: input.closingAmount,
          difference,
          closedAt: new Date(),
          notes: input.notes ?? session.notes
        },
        include: cashSessionInclude
      });

      return mapCashRegisterSession(closedSession);
    },
    {
      isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      maxWait: 5_000,
      timeout: 10_000
    }
  );
}

export async function recordSaleCashMovement(
  tx: Prisma.TransactionClient,
  input: {
    cashierId: string;
    saleId: string;
    amount: number;
    reason: string;
  }
) {
  const session = await findOpenSession(tx, input.cashierId);

  if (!session) {
    throw new AppError(409, "Debes abrir caja antes de registrar ventas en efectivo");
  }

  return tx.cashMovement.create({
    data: {
      sessionId: session.id,
      cashierId: input.cashierId,
      saleId: input.saleId,
      type: CashMovementType.SALE_CASH,
      amount: input.amount,
      reason: input.reason
    }
  });
}

export async function tryRecordSaleCashMovement(
  tx: Prisma.TransactionClient,
  input: {
    cashierId: string;
    saleId: string;
    amount: number;
    reason: string;
  }
) {
  const session = await findOpenSession(tx, input.cashierId);

  if (!session) {
    return null;
  }

  return tx.cashMovement.create({
    data: {
      sessionId: session.id,
      cashierId: input.cashierId,
      saleId: input.saleId,
      type: CashMovementType.SALE_CASH,
      amount: input.amount,
      reason: input.reason
    }
  });
}

export async function recordReturnCashMovement(
  tx: Prisma.TransactionClient,
  input: {
    cashierId: string;
    saleReturnId?: string;
    amount: number;
    reason: string;
  }
) {
  const session = await findOpenSession(tx, input.cashierId);

  if (!session) {
    throw new AppError(409, "Debes abrir caja antes de devolver efectivo");
  }

  return tx.cashMovement.create({
    data: {
      sessionId: session.id,
      cashierId: input.cashierId,
      saleReturnId: input.saleReturnId,
      type: CashMovementType.RETURN_CASH,
      amount: input.amount,
      reason: input.reason
    }
  });
}

export async function tryRecordReturnCashMovement(
  tx: Prisma.TransactionClient,
  input: {
    cashierId: string;
    saleReturnId?: string;
    amount: number;
    reason: string;
  }
) {
  const session = await findOpenSession(tx, input.cashierId);

  if (!session) {
    return null;
  }

  return tx.cashMovement.create({
    data: {
      sessionId: session.id,
      cashierId: input.cashierId,
      saleReturnId: input.saleReturnId,
      type: CashMovementType.RETURN_CASH,
      amount: input.amount,
      reason: input.reason
    }
  });
}

export async function getCashRegisterSessionById(id: string) {
  const session = await prisma.cashRegisterSession.findUnique({
    where: {
      id
    },
    include: cashSessionInclude
  });

  if (!session) {
    throw new AppError(404, "Corte de caja no encontrado");
  }

  return mapCashRegisterSession(session);
}

export async function listCashRegisterSessions(
  query: Record<string, unknown>
) {
  const pagination = getPagination(query, {
    defaultPageSize: 50,
    maxPageSize: 100
  });
  const cashierId = getOptionalString(query.cashierId, 80);
  const status = getOptionalString(query.status, 20);
  const { dateFrom, dateTo } = getDateRange(query);

  if (
    status &&
    !Object.values(CashRegisterStatus).includes(status as CashRegisterStatus)
  ) {
    throw new AppError(400, "status inválido");
  }

  const where: Prisma.CashRegisterSessionWhereInput = {
    ...(cashierId ? { cashierId } : {}),
    ...(status ? { status: status as CashRegisterStatus } : {}),
    ...(dateFrom || dateTo
      ? {
          openedAt: {
            ...(dateFrom ? { gte: dateFrom } : {}),
            ...(dateTo ? { lte: dateTo } : {})
          }
        }
      : {})
  };

  const [total, sessions] = await Promise.all([
    prisma.cashRegisterSession.count({ where }),
    prisma.cashRegisterSession.findMany({
      where,
      include: cashSessionInclude,
      orderBy: {
        openedAt: "desc"
      },
      skip: pagination.skip,
      take: pagination.take
    })
  ]);

  return {
    data: sessions.map(mapCashRegisterSession),
    meta: buildPaginationMeta(pagination, total)
  };
}

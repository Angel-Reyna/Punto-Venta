const prismaMock = {
  cashRegisterSession: {
    findFirst: jest.fn(),
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  $transaction: jest.fn()
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

import { CashMovementType, CashRegisterStatus, Role } from "@prisma/client";

import {
  closeCashRegister,
  getCurrentCashRegister,
  openCashRegister,
  recordSaleCashMovement
} from "../src/modules/cash-register/cash-register.service";

const cashier = {
  id: "cashier-1",
  email: "cashier@pos.local",
  role: Role.CASHIER
};

function createSession(overrides: Record<string, unknown> = {}) {
  return {
    id: "session-1",
    cashierId: "cashier-1",
    status: CashRegisterStatus.OPEN,
    openingAmount: 100,
    expectedClosingAmount: null,
    closingAmount: null,
    difference: null,
    openedAt: new Date("2026-05-18T10:00:00.000Z"),
    closedAt: null,
    notes: null,
    createdAt: new Date("2026-05-18T10:00:00.000Z"),
    updatedAt: new Date("2026-05-18T10:00:00.000Z"),
    cashier: {
      id: "cashier-1",
      name: "Caja 1",
      email: "cashier@pos.local",
      role: Role.CASHIER
    },
    movements: [
      {
        id: "movement-1",
        sessionId: "session-1",
        cashierId: "cashier-1",
        saleId: null,
        saleReturnId: null,
        type: CashMovementType.OPENING,
        amount: 100,
        reason: "Apertura de caja",
        createdAt: new Date("2026-05-18T10:00:00.000Z")
      }
    ],
    ...overrides
  };
}

describe("cash-register.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("maps the current open cash register and computes expected cash", async () => {
    prismaMock.cashRegisterSession.findFirst.mockResolvedValue(
      createSession({
        movements: [
          {
            type: CashMovementType.OPENING,
            amount: 100
          },
          {
            type: CashMovementType.SALE_CASH,
            amount: 50
          },
          {
            type: CashMovementType.CASH_OUT,
            amount: 20
          }
        ]
      })
    );

    const session = await getCurrentCashRegister(cashier);

    expect(session?.expectedCash).toBe(130);
  });

  it("rejects opening another active cash register", async () => {
    const tx = {
      cashRegisterSession: {
        findFirst: jest.fn().mockResolvedValue(createSession())
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    await expect(
      openCashRegister(cashier, {
        openingAmount: 100,
        notes: null
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Ya tienes una caja abierta"
    });
  });

  it("requires an open cash register before recording a cash sale", async () => {
    const tx = {
      cashRegisterSession: {
        findFirst: jest.fn().mockResolvedValue(null)
      },
      cashMovement: {
        create: jest.fn()
      }
    };

    await expect(
      recordSaleCashMovement(tx as never, {
        cashierId: "cashier-1",
        saleId: "sale-1",
        amount: 250,
        reason: "Venta en efectivo"
      })
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Debes abrir caja antes de registrar ventas en efectivo"
    });

    expect(tx.cashMovement.create).not.toHaveBeenCalled();
  });

  it("closes a cash register with expected cash and difference", async () => {
    const openSession = createSession({
      movements: [
        {
          type: CashMovementType.OPENING,
          amount: 100
        },
        {
          type: CashMovementType.SALE_CASH,
          amount: 80
        },
        {
          type: CashMovementType.RETURN_CASH,
          amount: 30
        }
      ]
    });
    const tx = {
      cashRegisterSession: {
        findFirst: jest.fn().mockResolvedValue(openSession),
        update: jest.fn().mockResolvedValue({
          ...openSession,
          status: CashRegisterStatus.CLOSED,
          expectedClosingAmount: 150,
          closingAmount: 145,
          difference: -5,
          closedAt: new Date("2026-05-18T18:00:00.000Z")
        })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    const result = await closeCashRegister(cashier, {
      closingAmount: 145,
      notes: "Cierre normal"
    });

    expect(tx.cashRegisterSession.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          expectedClosingAmount: 150,
          closingAmount: 145,
          difference: -5
        })
      })
    );
    expect(result.difference).toBe(-5);
  });
});

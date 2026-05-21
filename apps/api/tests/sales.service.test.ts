const prismaMock = {
  sale: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  $transaction: jest.fn()
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

const inventoryServiceMock = {
  getOrCreateDefaultWarehouse: jest.fn(),
  decreaseStock: jest.fn(),
  increaseStock: jest.fn()
};

jest.mock("../src/modules/inventory/inventory.service", () => inventoryServiceMock);

const cashRegisterServiceMock = {
  recordSaleCashMovement: jest.fn(),
  recordReturnCashMovement: jest.fn()
};

jest.mock("../src/modules/cash-register/cash-register.service", () => cashRegisterServiceMock);

import { Role } from "@prisma/client";

import {
  cancelSale,
  createSale,
  listSales,
  returnSaleItems
} from "../src/modules/sales/sales.service";

describe("sales.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("lists only cashier-owned sales for non-admin users", async () => {
    prismaMock.sale.count.mockResolvedValue(0);
    prismaMock.sale.findMany.mockResolvedValue([]);

    const result = await listSales(
      {
        id: "cashier-1",
        email: "cashier@pos.local",
        role: Role.CASHIER
      },
      {
        page: "2",
        pageSize: "20",
        q: "SALE-"
      }
    );

    expect(prismaMock.sale.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          cashierId: "cashier-1",
          OR: expect.any(Array)
        }),
        skip: 20,
        take: 20
      })
    );
    expect(result).toEqual({
      data: [],
      meta: {
        page: 2,
        pageSize: 20,
        total: 0,
        totalPages: 1
      }
    });
  });

  it("aggregates duplicated product lines before creating sale and decrementing stock", async () => {
    const tx = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: "product-1",
          name: "Café",
          salePrice: 100,
          promoPercent: 10,
          isActive: true
        })
      },
      sale: {
        create: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          customerId: null,
          status: "COMPLETED",
          subtotal: 300,
          discount: 30,
          tax: 0,
          total: 270,
          createdAt: new Date("2026-05-18T00:00:00.000Z"),
          updatedAt: new Date("2026-05-18T00:00:00.000Z"),
          items: [
            {
              id: "item-1",
              saleId: "sale-1",
              productId: "product-1",
              quantity: 3,
              unitPrice: 100,
              discount: 30,
              total: 270
            }
          ],
          payments: [
            {
              id: "payment-1",
              saleId: "sale-1",
              method: "CASH",
              amount: 270,
              createdAt: new Date("2026-05-18T00:00:00.000Z")
            }
          ]
        })
      },
      sellerActivityLog: {
        create: jest.fn()
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));
    inventoryServiceMock.getOrCreateDefaultWarehouse.mockResolvedValue({
      id: "warehouse-1"
    });

    const sale = await createSale(
      {
        id: "cashier-1",
        email: "cashier@pos.local",
        role: Role.CASHIER
      },
      {
        paymentMethod: "CASH",
        customerId: null,
        customerName: null,
        items: [
          {
            productId: "product-1",
            quantity: 1
          },
          {
            productId: "product-1",
            quantity: 2
          }
        ]
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "jest"
      }
    );

    expect(tx.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          subtotal: 300,
          discount: 30,
          total: 270,
          items: {
            create: [
              expect.objectContaining({
                productId: "product-1",
                quantity: 3,
                unitPrice: 100,
                discount: 30,
                total: 270
              })
            ]
          }
        })
      })
    );
    expect(inventoryServiceMock.decreaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-1",
        warehouseId: "warehouse-1",
        quantity: 3,
        type: "SALE"
      })
    );
    expect(cashRegisterServiceMock.recordSaleCashMovement).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        cashierId: "cashier-1",
        saleId: "sale-1",
        amount: 270
      })
    );
    expect(tx.sellerActivityLog.create).toHaveBeenCalled();
    expect(sale.total).toBe(270);
  });

  it("rejects cash sale when the cashier has no open cash register", async () => {
    const tx = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: "product-1",
          name: "Café",
          salePrice: 100,
          promoPercent: 0,
          isActive: true
        })
      },
      sale: {
        create: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          customerId: null,
          status: "COMPLETED",
          subtotal: 100,
          discount: 0,
          tax: 0,
          total: 100,
          createdAt: new Date("2026-05-18T00:00:00.000Z"),
          updatedAt: new Date("2026-05-18T00:00:00.000Z"),
          items: [],
          payments: []
        })
      },
      sellerActivityLog: {
        create: jest.fn()
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));
    inventoryServiceMock.getOrCreateDefaultWarehouse.mockResolvedValue({
      id: "warehouse-1"
    });
    cashRegisterServiceMock.recordSaleCashMovement.mockRejectedValueOnce({
      statusCode: 409,
      message: "Debes abrir caja antes de registrar ventas en efectivo"
    });

    await expect(
      createSale(
        {
          id: "cashier-1",
          email: "cashier@pos.local",
          role: Role.CASHIER
        },
        {
          paymentMethod: "CASH",
          customerId: null,
          customerName: null,
          items: [
            {
              productId: "product-1",
              quantity: 1
            }
          ]
        },
        {
          ipAddress: "127.0.0.1",
          userAgent: "jest"
        }
      )
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Debes abrir caja antes de registrar ventas en efectivo"
    });

    expect(tx.sellerActivityLog.create).not.toHaveBeenCalled();
  });

  it("requires admin role to cancel sales", async () => {
    await expect(
      cancelSale(
        {
          id: "cashier-1",
          email: "cashier@pos.local",
          role: Role.CASHIER
        },
        "sale-1",
        {
          reason: "Cliente solicitó cancelación"
        }
      )
    ).rejects.toMatchObject({
      statusCode: 403
    });
  });

  it("rejects returning more items than available", async () => {
    const tx = {
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          status: "COMPLETED",
          total: 100,
          items: [
            {
              id: "item-1",
              saleId: "sale-1",
              productId: "product-1",
              quantity: 2,
              unitPrice: 50,
              discount: 0,
              total: 100
            }
          ],
          payments: [
            {
              method: "CARD",
              amount: 100
            }
          ],
          returns: [
            {
              items: [
                {
                  saleItemId: "item-1",
                  quantity: 1
                }
              ]
            }
          ]
        })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    await expect(
      returnSaleItems(
        {
          id: "admin-1",
          email: "admin@pos.local",
          role: Role.ADMIN
        },
        "sale-1",
        {
          reason: "Producto devuelto por cliente",
          items: [
            {
              saleItemId: "item-1",
              quantity: 2
            }
          ]
        }
      )
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Cantidad a devolver inválida. Disponible para devolver: 1."
    });
  });
});

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
  tryRecordSaleCashMovement: jest.fn(),
  tryRecordReturnCashMovement: jest.fn()
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
          costPrice: 40,
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
              unitCost: 40,
              promoPercent: 10,
              discount: 30,
              total: 270,
              grossProfit: 150
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
                unitCost: 40,
                promoPercent: 10,
                discount: 30,
                total: 270,
                grossProfit: 150
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
    expect(cashRegisterServiceMock.tryRecordSaleCashMovement).toHaveBeenCalledWith(
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

  it("allows cash sales without requiring an open cash register", async () => {
    const tx = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: "product-1",
          name: "Café",
          costPrice: 40,
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
    cashRegisterServiceMock.tryRecordSaleCashMovement.mockResolvedValueOnce(null);

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
          }
        ]
      },
      {
        ipAddress: "127.0.0.1",
        userAgent: "jest"
      }
    );

    expect(cashRegisterServiceMock.tryRecordSaleCashMovement).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        cashierId: "cashier-1",
        saleId: "sale-1",
        amount: 100
      })
    );
    expect(tx.sellerActivityLog.create).toHaveBeenCalled();
    expect(sale.total).toBe(100);
  });


  it("rejects sales when the paid amount is lower than the total", async () => {
    const tx = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: "product-1",
          name: "Café",
          costPrice: 40,
          salePrice: 100,
          promoPercent: 0,
          isActive: true
        })
      },
      sale: {
        create: jest.fn()
      },
      sellerActivityLog: {
        create: jest.fn()
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));
    inventoryServiceMock.getOrCreateDefaultWarehouse.mockResolvedValue({
      id: "warehouse-1"
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
          paidAmount: 50,
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
      statusCode: 400,
      message: "Pago insuficiente. Total: $100.00, recibido: $50.00."
    });

    expect(tx.sale.create).not.toHaveBeenCalled();
    expect(inventoryServiceMock.decreaseStock).not.toHaveBeenCalled();
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

  it("cancels sales with physically deleted products without restocking and preserves snapshots", async () => {
    const deletedSaleItem = {
      id: "item-1",
      saleId: "sale-1",
      productId: null,
      productSku: "DEL-001",
      productName: "Producto eliminado",
      product: null,
      quantity: 2,
      unitPrice: 60,
      discount: 0,
      total: 120
    };
    const tx = {
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          status: "COMPLETED",
          total: 120,
          items: [deletedSaleItem],
          payments: [
            {
              method: "CARD",
              amount: 120
            }
          ],
          returns: []
        }),
        update: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          customerId: null,
          status: "CANCELLED",
          subtotal: 120,
          discount: 0,
          tax: 0,
          total: 120,
          createdAt: new Date("2026-05-18T00:00:00.000Z"),
          updatedAt: new Date("2026-05-18T00:00:00.000Z"),
          cashier: {
            id: "cashier-1",
            name: "Vendedor",
            email: "cashier@pos.local"
          },
          customer: null,
          items: [deletedSaleItem],
          payments: [
            {
              id: "payment-1",
              saleId: "sale-1",
              method: "CARD",
              amount: 120,
              createdAt: new Date("2026-05-18T00:00:00.000Z")
            }
          ],
          returns: [
            {
              id: "return-1",
              saleId: "sale-1",
              cashierId: "cashier-1",
              reason: "Cliente pidió cancelación",
              refundMethod: "CARD",
              refundTotal: 120,
              createdAt: new Date("2026-05-18T01:00:00.000Z"),
              updatedAt: new Date("2026-05-18T01:00:00.000Z"),
              cashier: {
                id: "cashier-1",
                name: "Vendedor",
                email: "cashier@pos.local"
              },
              items: [
                {
                  id: "return-item-1",
                  saleReturnId: "return-1",
                  saleItemId: "item-1",
                  productId: null,
                  productSku: "DEL-001",
                  productName: "Producto eliminado",
                  product: null,
                  quantity: 2,
                  unitPrice: 60,
                  discount: 0,
                  total: 120
                }
              ]
            }
          ]
        })
      },
      saleReturn: {
        create: jest.fn().mockResolvedValue({
          id: "return-1"
        })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    const sale = await cancelSale(
      {
        id: "admin-1",
        email: "admin@pos.local",
        role: Role.ADMIN
      },
      "sale-1",
      {
        reason: "Cliente pidió cancelación"
      }
    );

    expect(inventoryServiceMock.getOrCreateDefaultWarehouse).not.toHaveBeenCalled();
    expect(inventoryServiceMock.increaseStock).not.toHaveBeenCalled();
    expect(tx.saleReturn.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cashierId: "cashier-1",
          items: {
            create: [
              expect.objectContaining({
                productId: null,
                productSku: "DEL-001",
                productName: "Producto eliminado"
              })
            ]
          }
        })
      })
    );
    expect(sale.items[0].product).toEqual({
      id: null,
      sku: "DEL-001",
      name: "Producto eliminado (eliminado)",
      deleted: true
    });
  });

  it("returns sale items with physically deleted products without restocking and preserves snapshots", async () => {
    const deletedSaleItem = {
      id: "item-1",
      saleId: "sale-1",
      productId: null,
      productSku: "DEL-001",
      productName: "Producto eliminado",
      product: null,
      quantity: 2,
      unitPrice: 60,
      discount: 0,
      total: 120
    };
    const tx = {
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          status: "COMPLETED",
          total: 120,
          items: [deletedSaleItem],
          payments: [
            {
              method: "CASH",
              amount: 120
            }
          ],
          returns: []
        }),
        update: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          customerId: null,
          status: "PARTIALLY_REFUNDED",
          subtotal: 120,
          discount: 0,
          tax: 0,
          total: 120,
          createdAt: new Date("2026-05-18T00:00:00.000Z"),
          updatedAt: new Date("2026-05-18T00:00:00.000Z"),
          cashier: {
            id: "cashier-1",
            name: "Vendedor",
            email: "cashier@pos.local"
          },
          customer: null,
          items: [deletedSaleItem],
          payments: [
            {
              id: "payment-1",
              saleId: "sale-1",
              method: "CASH",
              amount: 120,
              createdAt: new Date("2026-05-18T00:00:00.000Z")
            }
          ],
          returns: [
            {
              id: "return-1",
              saleId: "sale-1",
              cashierId: "cashier-1",
              reason: "Cliente devolvió una pieza",
              refundMethod: "CASH",
              refundTotal: 60,
              createdAt: new Date("2026-05-18T01:00:00.000Z"),
              updatedAt: new Date("2026-05-18T01:00:00.000Z"),
              cashier: {
                id: "cashier-1",
                name: "Vendedor",
                email: "cashier@pos.local"
              },
              items: [
                {
                  id: "return-item-1",
                  saleReturnId: "return-1",
                  saleItemId: "item-1",
                  productId: null,
                  productSku: "DEL-001",
                  productName: "Producto eliminado",
                  product: null,
                  quantity: 1,
                  unitPrice: 60,
                  discount: 0,
                  total: 60
                }
              ]
            }
          ]
        })
      },
      saleReturn: {
        create: jest.fn().mockResolvedValue({
          id: "return-1"
        })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    const sale = await returnSaleItems(
      {
        id: "admin-1",
        email: "admin@pos.local",
        role: Role.ADMIN
      },
      "sale-1",
      {
        reason: "Cliente devolvió una pieza",
        items: [
          {
            saleItemId: "item-1",
            quantity: 1
          }
        ]
      }
    );

    expect(inventoryServiceMock.getOrCreateDefaultWarehouse).not.toHaveBeenCalled();
    expect(inventoryServiceMock.increaseStock).not.toHaveBeenCalled();
    expect(tx.saleReturn.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cashierId: "cashier-1",
          refundMethod: "CASH",
          refundTotal: 60,
          items: {
            create: [
              expect.objectContaining({
                productId: null,
                productSku: "DEL-001",
                productName: "Producto eliminado",
                quantity: 1,
                total: 60
              })
            ]
          }
        })
      })
    );
    expect(cashRegisterServiceMock.tryRecordReturnCashMovement).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        cashierId: "cashier-1",
        saleReturnId: "return-1",
        amount: 60
      })
    );
    expect(sale.returns[0].items[0].product).toEqual({
      id: null,
      sku: "DEL-001",
      name: "Producto eliminado (eliminado)",
      deleted: true
    });
  });

});

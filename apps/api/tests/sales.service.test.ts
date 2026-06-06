const prismaMock = {
  sale: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn()
  },
  saleAdjustmentRequest: {
    count: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn()
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

import { Role, SaleAdjustmentRequestStatus, SaleAdjustmentRequestType, WarehouseType } from "@prisma/client";

import {
  approveSalesAdjustmentRequest,
  cancelSale,
  createSale,
  createSalesAdjustmentRequest,
  listSales,
  rejectSalesAdjustmentRequest,
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
    expect(tx.sellerActivityLog.create).toHaveBeenCalled();
    expect(sale.total).toBe(270);
  });



  it("uses the selected seller warehouse when creating a sale", async () => {
    const tx = {
      customer: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      warehouse: {
        findUnique: jest.fn().mockResolvedValue({
          id: "seller-warehouse-1",
          name: "Stock vendedor",
          type: WarehouseType.SELLER,
          sellerId: "cashier-1",
          isActive: true
        })
      },
      product: {
        findUnique: jest.fn().mockResolvedValue({
          id: "product-1",
          sku: "CAF-001",
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
          folio: "SALE-20260606-ABC123",
          cashierId: "cashier-1",
          customerId: null,
          warehouseId: "seller-warehouse-1",
          status: "COMPLETED",
          subtotal: 100,
          discount: 0,
          tax: 0,
          total: 100,
          createdAt: new Date("2026-06-06T00:00:00.000Z"),
          updatedAt: new Date("2026-06-06T00:00:00.000Z"),
          warehouse: {
            id: "seller-warehouse-1",
            name: "Stock vendedor",
            type: WarehouseType.SELLER,
            sellerId: "cashier-1"
          },
          items: [],
          payments: []
        })
      },
      sellerActivityLog: {
        create: jest.fn()
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    await createSale(
      {
        id: "cashier-1",
        email: "cashier@pos.local",
        role: Role.CASHIER
      },
      {
        paymentMethod: "CASH",
        warehouseId: "seller-warehouse-1",
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

    expect(tx.sale.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          warehouseId: "seller-warehouse-1"
        })
      })
    );
    expect(inventoryServiceMock.decreaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        warehouseId: "seller-warehouse-1",
        type: "SALE"
      })
    );
  });

  it("prevents sellers from creating sales from storage warehouses by direct API call", async () => {
    const tx = {
      warehouse: {
        findUnique: jest.fn().mockResolvedValue({
          id: "warehouse-1",
          name: "Principal",
          type: WarehouseType.STORAGE,
          sellerId: null,
          isActive: true
        })
      },
      customer: {
        findUnique: jest.fn(),
        create: jest.fn()
      },
      product: {
        findUnique: jest.fn()
      },
      sale: {
        create: jest.fn()
      },
      sellerActivityLog: {
        create: jest.fn()
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    await expect(
      createSale(
        {
          id: "cashier-1",
          email: "cashier@pos.local",
          role: Role.CASHIER
        },
        {
          paymentMethod: "CASH",
          warehouseId: "warehouse-1",
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
      statusCode: 403
    });

    expect(tx.product.findUnique).not.toHaveBeenCalled();
    expect(tx.sale.create).not.toHaveBeenCalled();
    expect(inventoryServiceMock.decreaseStock).not.toHaveBeenCalled();
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
    expect(sale.returns[0].items[0].product).toEqual({
      id: null,
      sku: "DEL-001",
      name: "Producto eliminado (eliminado)",
      deleted: true
    });
  });


  it("returns multiple products from the same sale in one operation", async () => {
    const saleItems = [
      {
        id: "item-1",
        saleId: "sale-1",
        productId: "product-1",
        productSku: "COCA-600",
        productName: "Coca-Cola 600 ml",
        product: null,
        quantity: 2,
        unitPrice: 18,
        unitCost: 12,
        promoPercent: 0,
        discount: 0,
        total: 36,
        grossProfit: 12
      },
      {
        id: "item-2",
        saleId: "sale-1",
        productId: "product-2",
        productSku: "BOTANA-50G",
        productName: "Botana Salada 50g",
        product: null,
        quantity: 3,
        unitPrice: 15,
        unitCost: 8,
        promoPercent: 0,
        discount: 0,
        total: 45,
        grossProfit: 21
      }
    ];
    const updatedSale = {
      id: "sale-1",
      folio: "SALE-20260518-ABC123",
      cashierId: "cashier-1",
      customerId: null,
      status: "REFUNDED",
      subtotal: 81,
      discount: 0,
      tax: 0,
      total: 81,
      createdAt: new Date("2026-05-18T00:00:00.000Z"),
      updatedAt: new Date("2026-05-18T01:00:00.000Z"),
      cashier: {
        id: "cashier-1",
        name: "Vendedor",
        email: "cashier@pos.local"
      },
      customer: null,
      items: saleItems,
      payments: [
        {
          id: "payment-1",
          saleId: "sale-1",
          method: "CASH",
          amount: 81,
          createdAt: new Date("2026-05-18T00:00:00.000Z")
        }
      ],
      returns: [
        {
          id: "return-1",
          saleId: "sale-1",
          cashierId: "cashier-1",
          reason: "Cliente devolvió productos",
          refundMethod: "CASH",
          refundTotal: 81,
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
              productId: "product-1",
              productSku: "COCA-600",
              productName: "Coca-Cola 600 ml",
              product: null,
              quantity: 2,
              unitPrice: 18,
              unitCost: 12,
              promoPercent: 0,
              discount: 0,
              total: 36,
              grossProfit: 12
            },
            {
              id: "return-item-2",
              saleReturnId: "return-1",
              saleItemId: "item-2",
              productId: "product-2",
              productSku: "BOTANA-50G",
              productName: "Botana Salada 50g",
              product: null,
              quantity: 3,
              unitPrice: 15,
              unitCost: 8,
              promoPercent: 0,
              discount: 0,
              total: 45,
              grossProfit: 21
            }
          ]
        }
      ]
    };
    const tx = {
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          status: "COMPLETED",
          total: 81,
          items: saleItems,
          payments: [
            {
              method: "CASH",
              amount: 81
            }
          ],
          returns: []
        }),
        update: jest.fn().mockResolvedValue(updatedSale)
      },
      saleReturn: {
        create: jest.fn().mockResolvedValue({
          id: "return-1"
        })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));
    inventoryServiceMock.getOrCreateDefaultWarehouse.mockResolvedValue({
      id: "warehouse-1"
    });

    const sale = await returnSaleItems(
      {
        id: "admin-1",
        email: "admin@pos.local",
        role: Role.ADMIN
      },
      "sale-1",
      {
        reason: "Cliente devolvió productos",
        refundMethod: "CASH",
        items: [
          {
            saleItemId: "item-1",
            quantity: 2
          },
          {
            saleItemId: "item-2",
            quantity: 3
          }
        ]
      }
    );

    expect(tx.saleReturn.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          cashierId: "cashier-1",
          refundTotal: 81,
          items: {
            create: [
              expect.objectContaining({
                saleItemId: "item-1",
                productId: "product-1",
                quantity: 2,
                total: 36
              }),
              expect.objectContaining({
                saleItemId: "item-2",
                productId: "product-2",
                quantity: 3,
                total: 45
              })
            ]
          }
        })
      })
    );
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledTimes(2);
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-1",
        quantity: 2,
        type: "RETURN"
      })
    );
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-2",
        quantity: 3,
        type: "RETURN"
      })
    );
    expect(tx.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "REFUNDED"
        }
      })
    );
    expect(sale.status).toBe("REFUNDED");
    expect(sale.returns[0].items).toHaveLength(2);
  });

  it("creates pending adjustment requests for seller-owned sale returns", async () => {
    const saleItem = {
      id: "item-1",
      saleId: "sale-1",
      productId: "product-1",
      productSku: "COCA-600",
      productName: "Coca-Cola 600 ml",
      quantity: 2
    };
    const tx = {
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          status: "COMPLETED",
          items: [saleItem],
          returns: [],
          adjustmentRequests: []
        })
      },
      saleAdjustmentRequest: {
        create: jest.fn().mockResolvedValue({
          id: "request-1",
          type: SaleAdjustmentRequestType.RETURN_ITEMS,
          status: SaleAdjustmentRequestStatus.PENDING,
          saleId: "sale-1",
          requestedById: "cashier-1",
          reviewedById: null,
          reason: "Cliente pidió devolución",
          reviewNote: null,
          refundMethod: "CASH",
          createdAt: new Date("2026-05-18T02:00:00.000Z"),
          updatedAt: new Date("2026-05-18T02:00:00.000Z"),
          reviewedAt: null,
          sale: {
            id: "sale-1",
            folio: "SALE-20260518-ABC123",
            status: "COMPLETED",
            total: 36,
            createdAt: new Date("2026-05-18T00:00:00.000Z"),
            cashier: {
              id: "cashier-1",
              name: "Vendedor",
              email: "cashier@pos.local"
            }
          },
          requestedBy: {
            id: "cashier-1",
            name: "Vendedor",
            email: "cashier@pos.local",
            role: Role.CASHIER
          },
          reviewedBy: null,
          items: [
            {
              id: "request-item-1",
              requestId: "request-1",
              saleItemId: "item-1",
              productId: "product-1",
              productSku: "COCA-600",
              productName: "Coca-Cola 600 ml",
              quantity: 1,
              saleItem,
              product: {
                id: "product-1",
                sku: "COCA-600",
                name: "Coca-Cola 600 ml"
              }
            }
          ]
        })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    const request = await createSalesAdjustmentRequest(
      {
        id: "cashier-1",
        email: "cashier@pos.local",
        role: Role.CASHIER
      },
      "sale-1",
      {
        type: SaleAdjustmentRequestType.RETURN_ITEMS,
        reason: "Cliente pidió devolución",
        refundMethod: "CASH",
        items: [
          {
            saleItemId: "item-1",
            quantity: 1
          }
        ]
      }
    );

    expect(tx.saleAdjustmentRequest.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          type: SaleAdjustmentRequestType.RETURN_ITEMS,
          status: SaleAdjustmentRequestStatus.PENDING,
          requestedById: "cashier-1",
          items: {
            create: [
              expect.objectContaining({
                saleItemId: "item-1",
                quantity: 1
              })
            ]
          }
        })
      })
    );
    expect(request.status).toBe(SaleAdjustmentRequestStatus.PENDING);
  });



  it("rejects seller adjustment requests for sales owned by another seller", async () => {
    const tx = {
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "other-cashier",
          status: "COMPLETED",
          items: [],
          returns: [],
          adjustmentRequests: []
        })
      },
      saleAdjustmentRequest: {
        create: jest.fn()
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));

    await expect(
      createSalesAdjustmentRequest(
        {
          id: "cashier-1",
          email: "cashier@pos.local",
          role: Role.CASHIER
        },
        "sale-1",
        {
          type: SaleAdjustmentRequestType.CANCEL_SALE,
          reason: "Cliente pidió cancelar venta",
          refundMethod: "CASH"
        }
      )
    ).rejects.toMatchObject({
      statusCode: 403,
      message: "No autorizado"
    });

    expect(tx.saleAdjustmentRequest.create).not.toHaveBeenCalled();
  });

  it("rejects seller approval of adjustment requests before opening a transaction", async () => {
    const attempt = approveSalesAdjustmentRequest(
      {
        id: "cashier-1",
        email: "cashier@pos.local",
        role: Role.CASHIER
      },
      "request-1",
      {
        reviewNote: "Intento no permitido"
      }
    );

    await expect(attempt).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(attempt).rejects.toThrow("Solo un administrador puede realizar esta operación");

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects seller rejection of adjustment requests before reading the database", async () => {
    const attempt = rejectSalesAdjustmentRequest(
      {
        id: "cashier-1",
        email: "cashier@pos.local",
        role: Role.CASHIER
      },
      "request-1",
      {
        reviewNote: "Intento no permitido"
      }
    );

    await expect(attempt).rejects.toMatchObject({
      statusCode: 403
    });
    await expect(attempt).rejects.toThrow("Solo un administrador puede realizar esta operación");

    expect(prismaMock.saleAdjustmentRequest.findUnique).not.toHaveBeenCalled();
    expect(prismaMock.saleAdjustmentRequest.update).not.toHaveBeenCalled();
  });

  it("approves return adjustment requests and executes the stock restoration", async () => {
    const saleItem = {
      id: "item-1",
      saleId: "sale-1",
      productId: "product-1",
      productSku: "COCA-600",
      productName: "Coca-Cola 600 ml",
      product: null,
      quantity: 2,
      unitPrice: 18,
      unitCost: 12,
      promoPercent: 0,
      discount: 0,
      total: 36,
      grossProfit: 12
    };
    const tx = {
      saleAdjustmentRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: "request-1",
          type: SaleAdjustmentRequestType.RETURN_ITEMS,
          status: SaleAdjustmentRequestStatus.PENDING,
          saleId: "sale-1",
          requestedById: "cashier-1",
          reason: "Cliente pidió devolución",
          refundMethod: "CASH",
          items: [
            {
              saleItemId: "item-1",
              quantity: 1
            }
          ]
        }),
        update: jest.fn().mockResolvedValue({
          id: "request-1",
          type: SaleAdjustmentRequestType.RETURN_ITEMS,
          status: SaleAdjustmentRequestStatus.APPROVED,
          saleId: "sale-1",
          requestedById: "cashier-1",
          reviewedById: "admin-1",
          reason: "Cliente pidió devolución",
          reviewNote: "Procede",
          refundMethod: "CASH",
          createdAt: new Date("2026-05-18T02:00:00.000Z"),
          updatedAt: new Date("2026-05-18T03:00:00.000Z"),
          reviewedAt: new Date("2026-05-18T03:00:00.000Z"),
          sale: {
            id: "sale-1",
            folio: "SALE-20260518-ABC123",
            status: "PARTIALLY_REFUNDED",
            total: 36,
            createdAt: new Date("2026-05-18T00:00:00.000Z"),
            cashier: {
              id: "cashier-1",
              name: "Vendedor",
              email: "cashier@pos.local"
            }
          },
          requestedBy: {
            id: "cashier-1",
            name: "Vendedor",
            email: "cashier@pos.local",
            role: Role.CASHIER
          },
          reviewedBy: {
            id: "admin-1",
            name: "Admin",
            email: "admin@pos.local",
            role: Role.ADMIN
          },
          items: [
            {
              id: "request-item-1",
              requestId: "request-1",
              saleItemId: "item-1",
              productId: "product-1",
              productSku: "COCA-600",
              productName: "Coca-Cola 600 ml",
              quantity: 1,
              saleItem,
              product: {
                id: "product-1",
                sku: "COCA-600",
                name: "Coca-Cola 600 ml"
              }
            }
          ]
        })
      },
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          status: "COMPLETED",
          total: 36,
          items: [saleItem],
          payments: [
            {
              method: "CASH",
              amount: 36
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
          subtotal: 36,
          discount: 0,
          tax: 0,
          total: 36,
          createdAt: new Date("2026-05-18T00:00:00.000Z"),
          updatedAt: new Date("2026-05-18T03:00:00.000Z"),
          cashier: {
            id: "cashier-1",
            name: "Vendedor",
            email: "cashier@pos.local"
          },
          customer: null,
          items: [saleItem],
          payments: [],
          returns: []
        })
      },
      saleReturn: {
        create: jest.fn().mockResolvedValue({
          id: "return-1"
        })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));
    inventoryServiceMock.getOrCreateDefaultWarehouse.mockResolvedValue({
      id: "warehouse-1"
    });

    const request = await approveSalesAdjustmentRequest(
      {
        id: "admin-1",
        email: "admin@pos.local",
        role: Role.ADMIN
      },
      "request-1",
      {
        reviewNote: "Procede"
      }
    );

    expect(tx.saleReturn.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          saleId: "sale-1",
          cashierId: "cashier-1",
          reason: "Cliente pidió devolución",
          refundTotal: 18,
          items: {
            create: [
              expect.objectContaining({
                saleItemId: "item-1",
                quantity: 1,
                total: 18
              })
            ]
          }
        })
      })
    );
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-1",
        quantity: 1,
        type: "RETURN"
      })
    );
    expect(tx.saleAdjustmentRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SaleAdjustmentRequestStatus.APPROVED,
          reviewedById: "admin-1",
          reviewNote: "Procede"
        })
      })
    );
    expect(request.status).toBe(SaleAdjustmentRequestStatus.APPROVED);
  });

  it("approves cancellation adjustment requests and cancels the sale", async () => {
    const saleItem = {
      id: "item-1",
      saleId: "sale-1",
      productId: "product-1",
      productSku: "COCA-600",
      productName: "Coca-Cola 600 ml",
      product: null,
      quantity: 2,
      unitPrice: 18,
      unitCost: 12,
      promoPercent: 0,
      discount: 0,
      total: 36,
      grossProfit: 12
    };
    const tx = {
      saleAdjustmentRequest: {
        findUnique: jest.fn().mockResolvedValue({
          id: "request-1",
          type: SaleAdjustmentRequestType.CANCEL_SALE,
          status: SaleAdjustmentRequestStatus.PENDING,
          saleId: "sale-1",
          requestedById: "cashier-1",
          reason: "Cliente pidió cancelar venta",
          refundMethod: "CASH",
          items: []
        }),
        update: jest.fn().mockResolvedValue({
          id: "request-1",
          type: SaleAdjustmentRequestType.CANCEL_SALE,
          status: SaleAdjustmentRequestStatus.APPROVED,
          saleId: "sale-1",
          requestedById: "cashier-1",
          reviewedById: "admin-1",
          reason: "Cliente pidió cancelar venta",
          reviewNote: null,
          refundMethod: "CASH",
          createdAt: new Date("2026-05-18T02:00:00.000Z"),
          updatedAt: new Date("2026-05-18T03:00:00.000Z"),
          reviewedAt: new Date("2026-05-18T03:00:00.000Z"),
          sale: {
            id: "sale-1",
            folio: "SALE-20260518-ABC123",
            status: "CANCELLED",
            total: 36,
            createdAt: new Date("2026-05-18T00:00:00.000Z"),
            cashier: {
              id: "cashier-1",
              name: "Vendedor",
              email: "cashier@pos.local"
            }
          },
          requestedBy: {
            id: "cashier-1",
            name: "Vendedor",
            email: "cashier@pos.local",
            role: Role.CASHIER
          },
          reviewedBy: {
            id: "admin-1",
            name: "Admin",
            email: "admin@pos.local",
            role: Role.ADMIN
          },
          items: []
        })
      },
      sale: {
        findUnique: jest.fn().mockResolvedValue({
          id: "sale-1",
          folio: "SALE-20260518-ABC123",
          cashierId: "cashier-1",
          status: "COMPLETED",
          total: 36,
          items: [saleItem],
          payments: [
            {
              method: "CASH",
              amount: 36
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
          subtotal: 36,
          discount: 0,
          tax: 0,
          total: 36,
          createdAt: new Date("2026-05-18T00:00:00.000Z"),
          updatedAt: new Date("2026-05-18T03:00:00.000Z"),
          cashier: {
            id: "cashier-1",
            name: "Vendedor",
            email: "cashier@pos.local"
          },
          customer: null,
          items: [saleItem],
          payments: [],
          returns: []
        })
      },
      saleReturn: {
        create: jest.fn().mockResolvedValue({
          id: "return-1"
        })
      }
    };

    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback(tx));
    inventoryServiceMock.getOrCreateDefaultWarehouse.mockResolvedValue({
      id: "warehouse-1"
    });

    const request = await approveSalesAdjustmentRequest(
      {
        id: "admin-1",
        email: "admin@pos.local",
        role: Role.ADMIN
      },
      "request-1",
      {}
    );

    expect(tx.sale.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: {
          status: "CANCELLED"
        }
      })
    );
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-1",
        quantity: 2,
        type: "RETURN"
      })
    );
    expect(request.status).toBe(SaleAdjustmentRequestStatus.APPROVED);
  });

  it("rejects adjustment requests as admin without executing stock movements", async () => {
    prismaMock.saleAdjustmentRequest.findUnique.mockResolvedValue({
      id: "request-1",
      status: SaleAdjustmentRequestStatus.PENDING
    });
    prismaMock.saleAdjustmentRequest.update.mockResolvedValue({
      id: "request-1",
      type: SaleAdjustmentRequestType.RETURN_ITEMS,
      status: SaleAdjustmentRequestStatus.REJECTED,
      saleId: "sale-1",
      requestedById: "cashier-1",
      reviewedById: "admin-1",
      reason: "Cliente pidió devolución",
      reviewNote: "No procede",
      refundMethod: "CASH",
      createdAt: new Date("2026-05-18T02:00:00.000Z"),
      updatedAt: new Date("2026-05-18T03:00:00.000Z"),
      reviewedAt: new Date("2026-05-18T03:00:00.000Z"),
      sale: {
        id: "sale-1",
        folio: "SALE-20260518-ABC123",
        status: "COMPLETED",
        total: 36,
        createdAt: new Date("2026-05-18T00:00:00.000Z"),
        cashier: {
          id: "cashier-1",
          name: "Vendedor",
          email: "cashier@pos.local"
        }
      },
      requestedBy: {
        id: "cashier-1",
        name: "Vendedor",
        email: "cashier@pos.local",
        role: Role.CASHIER
      },
      reviewedBy: {
        id: "admin-1",
        name: "Admin",
        email: "admin@pos.local",
        role: Role.ADMIN
      },
      items: []
    });

    const request = await rejectSalesAdjustmentRequest(
      {
        id: "admin-1",
        email: "admin@pos.local",
        role: Role.ADMIN
      },
      "request-1",
      {
        reviewNote: "No procede"
      }
    );

    expect(prismaMock.saleAdjustmentRequest.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SaleAdjustmentRequestStatus.REJECTED,
          reviewedById: "admin-1",
          reviewNote: "No procede"
        })
      })
    );
    expect(inventoryServiceMock.increaseStock).not.toHaveBeenCalled();
    expect(request.status).toBe(SaleAdjustmentRequestStatus.REJECTED);
  });


});

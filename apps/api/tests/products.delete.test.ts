const txMock = {
  product: {
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn()
  },
  saleItem: {
    count: jest.fn()
  },
  saleReturnItem: {
    count: jest.fn()
  },
  inventoryMovement: {
    count: jest.fn()
  },
  inventoryBalance: {
    deleteMany: jest.fn()
  }
};

const prismaMock = {
  $transaction: jest.fn()
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

jest.mock("../src/modules/inventory/inventory.service", () => ({
  getOrCreateDefaultWarehouse: jest.fn(),
  increaseStock: jest.fn()
}));

import { deleteAllProductsSafely, deleteProductSafely } from "../src/modules/products/products.service";

describe("deleteProductSafely", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prismaMock.$transaction.mockImplementation(async (callback: (tx: typeof txMock) => unknown) =>
      callback(txMock)
    );
    txMock.product.count.mockResolvedValue(2);
    txMock.product.findUnique.mockResolvedValue({
      id: "product-1",
      sku: "SKU-1",
      name: "Producto prueba",
      isActive: true
    });
    txMock.saleItem.count.mockResolvedValue(0);
    txMock.saleReturnItem.count.mockResolvedValue(0);
    txMock.inventoryMovement.count.mockResolvedValue(0);
    txMock.inventoryBalance.deleteMany.mockResolvedValue({ count: 1 });
    txMock.product.deleteMany.mockResolvedValue({ count: 2 });
    txMock.product.delete.mockResolvedValue({
      id: "product-1",
      sku: "SKU-1",
      name: "Producto prueba",
      isActive: true
    });
    txMock.product.update.mockResolvedValue({
      id: "product-1",
      sku: "SKU-1",
      name: "Producto prueba",
      isActive: false
    });
  });

  it("physically deletes products without operational history", async () => {
    const result = await deleteProductSafely("product-1");

    expect(result.mode).toBe("deleted");
    expect(txMock.inventoryBalance.deleteMany).toHaveBeenCalledWith({
      where: {
        productId: "product-1"
      }
    });
    expect(txMock.product.delete).toHaveBeenCalledWith({
      where: {
        id: "product-1"
      }
    });
    expect(txMock.product.update).not.toHaveBeenCalled();
  });

  it("physically deletes products with operational history and relies on snapshots", async () => {
    txMock.saleItem.count.mockResolvedValue(2);
    txMock.saleReturnItem.count.mockResolvedValue(1);
    txMock.inventoryMovement.count.mockResolvedValue(3);

    const result = await deleteProductSafely("product-1");

    expect(result.mode).toBe("deleted");
    expect(result.preservedReferences).toEqual({
      saleItems: 2,
      saleReturnItems: 1,
      inventoryMovements: 3
    });
    expect(txMock.inventoryBalance.deleteMany).toHaveBeenCalledWith({
      where: {
        productId: "product-1"
      }
    });
    expect(txMock.product.delete).toHaveBeenCalledWith({
      where: {
        id: "product-1"
      }
    });
    expect(txMock.product.update).not.toHaveBeenCalled();
  });

  it("physically deletes every product and preserves operational snapshots", async () => {
    txMock.saleItem.count.mockResolvedValue(4);
    txMock.saleReturnItem.count.mockResolvedValue(2);
    txMock.inventoryMovement.count.mockResolvedValue(6);
    txMock.inventoryBalance.deleteMany.mockResolvedValue({ count: 3 });

    const result = await deleteAllProductsSafely();

    expect(result).toEqual({
      mode: "deleted_all",
      deletedProducts: 2,
      deletedInventoryBalances: 3,
      preservedReferences: {
        saleItems: 4,
        saleReturnItems: 2,
        inventoryMovements: 6
      }
    });
    expect(txMock.inventoryBalance.deleteMany).toHaveBeenCalledWith({});
    expect(txMock.product.deleteMany).toHaveBeenCalledWith({});
  });

  it("throws a 404 when product does not exist", async () => {
    txMock.product.findUnique.mockResolvedValue(null);

    await expect(deleteProductSafely("missing-product")).rejects.toMatchObject({
      statusCode: 404,
      message: "Producto no encontrado"
    });
  });
});

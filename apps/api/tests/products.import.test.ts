import XLSX from "xlsx";

import { AppError } from "../src/utils/AppError";

const prismaMock = {
  $transaction: jest.fn()
};

jest.mock("../src/config/prisma", () => ({
  prisma: prismaMock
}));

const inventoryServiceMock = {
  getOrCreateDefaultWarehouse: jest.fn(),
  increaseStock: jest.fn()
};

jest.mock("../src/modules/inventory/inventory.service", () => inventoryServiceMock);

import { importProducts } from "../src/modules/products/products.service";

function workbookBuffer(rows: Record<string, unknown>[]) {
  const workbook = XLSX.utils.book_new();
  const sheet = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(workbook, sheet, "productos");

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx"
  });
}

function createTxMock() {
  return {
    productCategory: {
      upsert: jest.fn().mockResolvedValue({
        id: "category-1"
      })
    },
    product: {
      findFirst: jest.fn(),
      upsert: jest.fn()
    }
  };
}

describe("products import", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    inventoryServiceMock.getOrCreateDefaultWarehouse.mockResolvedValue({
      id: "warehouse-1"
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(createTxMock())
    );
  });


  it("rejects unsupported Excel columns before committing", async () => {
    await expect(
      importProducts(
        workbookBuffer([
          {
            sku: "SKU-1",
            name: "Producto 1",
            unexpectedColumn: "no permitido"
          }
        ]),
        "admin-1"
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "El archivo contiene una columna no permitida: unexpectedColumn"
    } satisfies Partial<AppError>);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects imports over the maximum row limit before committing", async () => {
    const rows = Array.from({ length: 1001 }, (_, index) => ({
      sku: `SKU-${index + 1}`,
      name: `Producto ${index + 1}`
    }));

    await expect(
      importProducts(workbookBuffer(rows), "admin-1")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "El archivo excede el límite de 1000 productos por importación"
    } satisfies Partial<AppError>);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects duplicated SKUs in the same Excel file before committing", async () => {
    await expect(
      importProducts(
        workbookBuffer([
          {
            sku: "SKU-1",
            name: "Producto 1"
          },
          {
            sku: "SKU-1",
            name: "Producto 2"
          }
        ]),
        "admin-1"
      )
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "Fila 3: sku duplicado en el archivo (SKU-1)"
    } satisfies Partial<AppError>);
  });

  it("rejects barcodes assigned to a different SKU", async () => {
    const tx = createTxMock();
    tx.product.findFirst.mockResolvedValue({
      sku: "OTHER-SKU"
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(tx)
    );

    await expect(
      importProducts(
        workbookBuffer([
          {
            sku: "SKU-1",
            barcode: "750000000001",
            name: "Producto 1"
          }
        ]),
        "admin-1"
      )
    ).rejects.toMatchObject({
      statusCode: 409,
      message: "Fila 2: barcode ya está asignado al SKU OTHER-SKU"
    } satisfies Partial<AppError>);
  });

  it("imports valid products and creates initial stock movement", async () => {
    const tx = createTxMock();
    tx.product.findFirst.mockResolvedValue(null);
    tx.product.upsert.mockResolvedValue({
      id: "product-1",
      sku: "SKU-1"
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(tx)
    );

    const result = await importProducts(
      workbookBuffer([
        {
          categoryName: "General",
          sku: "SKU-1",
          barcode: "750000000001",
          name: "Producto 1",
          costPrice: 10,
          salePrice: 20,
          promoPercent: 0,
          minStock: 2,
          initialStock: 5
        }
      ]),
      "admin-1"
    );

    expect(tx.product.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sku: "SKU-1"
        },
        create: expect.objectContaining({
          barcode: "750000000001",
          name: "Producto 1",
          minStock: 2
        })
      })
    );
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-1",
        warehouseId: "warehouse-1",
        quantity: 5,
        type: "IN"
      })
    );
    expect(result).toEqual([
      {
        id: "product-1",
        sku: "SKU-1"
      }
    ]);
  });
});

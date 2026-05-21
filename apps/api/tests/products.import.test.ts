import ExcelJS from "exceljs";
import JSZip from "jszip";

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

import {
  createProduct,
  importProducts,
  productTemplateBuffer
} from "../src/modules/products/products.service";


const SPREADSHEETML_MAIN_NAMESPACE =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

function prefixSpreadsheetNamespaceXml(xml: string) {
  if (!xml.includes(`xmlns="${SPREADSHEETML_MAIN_NAMESPACE}"`)) {
    return xml;
  }

  return xml
    .replaceAll(
      `xmlns="${SPREADSHEETML_MAIN_NAMESPACE}"`,
      `xmlns:x="${SPREADSHEETML_MAIN_NAMESPACE}"`
    )
    .replace(/<(\/?)([A-Za-z][\w.-]*)(?=[\s>/])/g, "<$1x:$2");
}

async function prefixSpreadsheetNamespaceBuffer(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);

  for (const [path, file] of Object.entries(zip.files)) {
    if (file.dir || !path.endsWith(".xml")) {
      continue;
    }

    const xml = await file.async("string");
    zip.file(path, prefixSpreadsheetNamespaceXml(xml));
  }

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE"
  });
}

async function workbookBuffer(rows: Record<string, unknown>[]) {
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("productos");

  const headers = Array.from(
    rows.reduce<Set<string>>((accumulator, row) => {
      Object.keys(row).forEach((key) => accumulator.add(key));

      return accumulator;
    }, new Set<string>())
  );

  worksheet.columns = headers.map((header) => ({
    header,
    key: header
  }));

  rows.forEach((row) => worksheet.addRow(row));

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}

function createTxMock() {
  return {
    productCategory: {
      findUnique: jest.fn().mockResolvedValue({
        id: "category-1",
        name: "General",
        isActive: true
      }),
      upsert: jest.fn().mockResolvedValue({
        id: "category-1"
      })
    },
    product: {
      create: jest.fn(),
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
        await workbookBuffer([
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
      importProducts(await workbookBuffer(rows), "admin-1")
    ).rejects.toMatchObject({
      statusCode: 400,
      message: "El archivo excede el límite de 1000 productos por importación"
    } satisfies Partial<AppError>);

    expect(prismaMock.$transaction).not.toHaveBeenCalled();
  });

  it("rejects duplicated SKUs in the same Excel file before committing", async () => {
    await expect(
      importProducts(
        await workbookBuffer([
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
        await workbookBuffer([
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


  it("creates a manual product with real initial stock", async () => {
    const tx = createTxMock();

    tx.product.create.mockResolvedValue({
      id: "product-2",
      sku: "SKU-2"
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(tx)
    );

    const result = await createProduct(
      {
        categoryId: "category-1",
        sku: "SKU-2",
        barcode: "750000000002",
        name: "Producto manual",
        description: null,
        costPrice: 10,
        salePrice: 20,
        promoPercent: 0,
        minStock: 2,
        initialStock: 7
      },
      "admin-1"
    );

    expect(tx.productCategory.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          id: "category-1"
        }
      })
    );
    expect(tx.product.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          categoryId: "category-1",
          sku: "SKU-2",
          barcode: "750000000002",
          name: "Producto manual"
        })
      })
    );
    expect(inventoryServiceMock.getOrCreateDefaultWarehouse).toHaveBeenCalledWith(tx);
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-2",
        warehouseId: "warehouse-1",
        quantity: 7,
        type: "IN",
        createdBy: "admin-1"
      })
    );
    expect(result).toEqual({
      id: "product-2",
      sku: "SKU-2"
    });
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
      await workbookBuffer([
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

  it("imports .xlsx files that use prefixed spreadsheet namespace XML", async () => {
    const tx = createTxMock();
    tx.product.findFirst.mockResolvedValue(null);
    tx.product.upsert.mockResolvedValue({
      id: "product-prefixed",
      sku: "SKU-PREFIXED"
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(tx)
    );

    const buffer = await prefixSpreadsheetNamespaceBuffer(
      await workbookBuffer([
        {
          categoryName: "General",
          sku: "SKU-PREFIXED",
          barcode: "7500000000999",
          name: "Producto namespace",
          costPrice: 11,
          salePrice: 22,
          promoPercent: 0,
          minStock: 3,
          initialStock: 8
        }
      ])
    );

    const result = await importProducts(buffer, "admin-1");

    expect(tx.product.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sku: "SKU-PREFIXED"
        },
        create: expect.objectContaining({
          barcode: "7500000000999",
          name: "Producto namespace"
        })
      })
    );
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-prefixed",
        quantity: 8,
        type: "IN"
      })
    );
    expect(result).toEqual([
      {
        id: "product-prefixed",
        sku: "SKU-PREFIXED"
      }
    ]);
  });

  it("generates a product template that the importer can read", async () => {
    const tx = createTxMock();
    tx.product.findFirst.mockResolvedValue(null);
    tx.product.upsert.mockResolvedValue({
      id: "product-template",
      sku: "SKU-001"
    });
    prismaMock.$transaction.mockImplementation(async (callback: (tx: unknown) => unknown) =>
      callback(tx)
    );

    const result = await importProducts(await productTemplateBuffer(), "admin-1");

    expect(tx.product.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          sku: "SKU-001"
        },
        create: expect.objectContaining({
          name: "Producto ejemplo",
          minStock: 2
        })
      })
    );
    expect(inventoryServiceMock.increaseStock).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        productId: "product-template",
        quantity: 10,
        type: "IN"
      })
    );
    expect(result).toEqual([
      {
        id: "product-template",
        sku: "SKU-001"
      }
    ]);
  });

});

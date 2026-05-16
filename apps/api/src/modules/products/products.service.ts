import { Prisma } from "@prisma/client";
import XLSX from "xlsx";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";

import {
  getOrCreateDefaultWarehouse,
  increaseStock
} from "../inventory/inventory.service";

const MAX_IMPORT_ROWS = 1_000;

export function calculateMargin(
  costPrice: number,
  salePrice: number
) {
  if (salePrice <= 0) return 0;

  return Number(
    (((salePrice - costPrice) / salePrice) * 100).toFixed(2)
  );
}

export function calculateFinalPrice(
  salePrice: number,
  promoPercent: number
) {
  return Number(
    (salePrice * (1 - promoPercent / 100)).toFixed(2)
  );
}

export function productTemplateBuffer() {
  const rows = [
    {
      categoryName: "General",
      sku: "SKU-001",
      barcode: "750000000001",
      name: "Producto ejemplo",
      description: "Descripción opcional",
      costPrice: 50,
      salePrice: 100,
      promoPercent: 0,
      initialStock: 10,
      minStock: 2
    }
  ];

  const workbook = XLSX.utils.book_new();

  const sheet = XLSX.utils.json_to_sheet(rows);

  XLSX.utils.book_append_sheet(
    workbook,
    sheet,
    "productos"
  );

  return XLSX.write(workbook, {
    type: "buffer",
    bookType: "xlsx"
  });
}

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();

  return text || null;
}

function readRequiredString(
  row: Record<string, unknown>,
  field: string,
  rowNumber: number
) {
  const value = cleanString(row[field]);

  if (!value) {
    throw new AppError(
      400,
      `Fila ${rowNumber}: ${field} es requerido`
    );
  }

  return value;
}

function readNonNegativeNumber(
  row: Record<string, unknown>,
  field: string,
  rowNumber: number,
  defaultValue = 0
) {
  const rawValue = row[field];

  if (
    rawValue === undefined ||
    rawValue === null ||
    rawValue === ""
  ) {
    return defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isFinite(value) || value < 0) {
    throw new AppError(
      400,
      `Fila ${rowNumber}: ${field} debe ser un número mayor o igual a 0`
    );
  }

  return value;
}

function readNonNegativeInteger(
  row: Record<string, unknown>,
  field: string,
  rowNumber: number,
  defaultValue = 0
) {
  const value = readNonNegativeNumber(
    row,
    field,
    rowNumber,
    defaultValue
  );

  if (!Number.isInteger(value)) {
    throw new AppError(
      400,
      `Fila ${rowNumber}: ${field} debe ser un número entero`
    );
  }

  return value;
}

function readPromoPercent(
  row: Record<string, unknown>,
  rowNumber: number
) {
  const value = readNonNegativeNumber(
    row,
    "promoPercent",
    rowNumber,
    0
  );

  if (value > 100) {
    throw new AppError(
      400,
      `Fila ${rowNumber}: promoPercent no puede ser mayor a 100`
    );
  }

  return value;
}

async function getOrCreateCategory(
  tx: Prisma.TransactionClient,
  categoryName?: string | null
) {
  const name = categoryName?.trim() || "General";

  return tx.productCategory.upsert({
    where: {
      name
    },
    update: {},
    create: {
      name,
      description: `Categoría ${name}`,
      isActive: true
    }
  });
}

export async function importProducts(
  buffer: Buffer,
  userId: string
) {
  const workbook = XLSX.read(buffer, {
    type: "buffer"
  });

  const sheetName = workbook.SheetNames[0];

  if (!sheetName) {
    throw new AppError(
      400,
      "El archivo no contiene hojas válidas"
    );
  }

  const sheet = workbook.Sheets[sheetName];

  const rows =
    XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  if (rows.length === 0) {
    throw new AppError(
      400,
      "El archivo no contiene productos para importar"
    );
  }

  if (rows.length > MAX_IMPORT_ROWS) {
    throw new AppError(
      400,
      `El archivo excede el límite de ${MAX_IMPORT_ROWS} productos por importación`
    );
  }

  return prisma.$transaction(
    async (tx) => {
      const warehouse = await getOrCreateDefaultWarehouse(tx);

      const imported = [];

      for (const [index, row] of rows.entries()) {
        const rowNumber = index + 2;

        const sku = readRequiredString(
          row,
          "sku",
          rowNumber
        );

        const name = readRequiredString(
          row,
          "name",
          rowNumber
        );

        const category = await getOrCreateCategory(
          tx,
          cleanString(row.categoryName)
        );

        const costPrice = readNonNegativeNumber(
          row,
          "costPrice",
          rowNumber,
          0
        );

        const salePrice = readNonNegativeNumber(
          row,
          "salePrice",
          rowNumber,
          0
        );

        const promoPercent = readPromoPercent(
          row,
          rowNumber
        );

        const minStock = readNonNegativeInteger(
          row,
          "minStock",
          rowNumber,
          0
        );

        const initialStock = readNonNegativeInteger(
          row,
          "initialStock",
          rowNumber,
          0
        );

        const product = await tx.product.upsert({
          where: {
            sku
          },

          update: {
            categoryId: category.id,
            barcode: cleanString(row.barcode),
            name,
            description: cleanString(row.description),
            costPrice,
            salePrice,
            promoPercent,
            minStock,
            isActive: true
          },

          create: {
            categoryId: category.id,
            sku,
            barcode: cleanString(row.barcode),
            name,
            description: cleanString(row.description),
            costPrice,
            salePrice,
            promoPercent,
            minStock,
            isActive: true
          }
        });

        if (initialStock > 0) {
          await increaseStock(tx, {
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: initialStock,
            reason: "Stock inicial desde importación Excel",
            createdBy: userId,
            type: "IN"
          });
        }

        imported.push(product);
      }

      return imported;
    },
    {
      maxWait: 5_000,
      timeout: 30_000
    }
  );
}

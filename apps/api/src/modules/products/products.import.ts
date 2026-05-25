import { Prisma } from "@prisma/client";
import ExcelJS from "exceljs";
import JSZip from "jszip";

import { AppError } from "../../utils/AppError";

const MAX_IMPORT_ROWS = 1_000;
const PRODUCT_IMPORT_HEADERS = [
  "categoryName",
  "sku",
  "barcode",
  "name",
  "description",
  "costPrice",
  "salePrice",
  "promoPercent",
  "initialStock",
  "minStock"
] as const;
const PRODUCT_IMPORT_HEADER_SET = new Set<string>(PRODUCT_IMPORT_HEADERS);
const MAX_IMPORT_COLUMNS = PRODUCT_IMPORT_HEADERS.length;
const REQUIRED_PRODUCT_IMPORT_HEADERS = ["sku", "name"];
const PRODUCTS_IMPORT_SHEET_NAME = "productos";
const SPREADSHEETML_MAIN_NAMESPACE =
  "http://schemas.openxmlformats.org/spreadsheetml/2006/main";

type ProductImportHeader = (typeof PRODUCT_IMPORT_HEADERS)[number];
export type ProductImportRow = Partial<Record<ProductImportHeader, unknown>>;

export async function productTemplateBuffer() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Punta Venta";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(PRODUCTS_IMPORT_SHEET_NAME);

  worksheet.columns = PRODUCT_IMPORT_HEADERS.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 4, 16)
  }));
  worksheet.views = [
    {
      state: "frozen",
      ySplit: 1
    }
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }
  };

  worksheet.addRow({
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
  });

  const instructions = workbook.addWorksheet("instrucciones");
  instructions.columns = [
    { header: "Columna", key: "column", width: 22 },
    { header: "Descripción", key: "description", width: 78 }
  ];
  instructions.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  instructions.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }
  };
  instructions.addRows([
    {
      column: "categoryName",
      description: "Nombre de la categoría. Si no existe, se crea automáticamente. Si está vacío, se usa General."
    },
    {
      column: "sku",
      description: "Requerido. Clave interna única para identificar y controlar existencias."
    },
    {
      column: "barcode",
      description: "Opcional. Código del producto, código de barras o código del proveedor."
    },
    {
      column: "name",
      description: "Requerido. Nombre comercial del producto."
    },
    {
      column: "description",
      description: "Opcional. Descripción corta del producto."
    },
    {
      column: "costPrice",
      description: "Costo unitario. Número mayor o igual a 0."
    },
    {
      column: "salePrice",
      description: "Precio de venta. Número mayor o igual a 0."
    },
    {
      column: "promoPercent",
      description: "Porcentaje de promoción entre 0 y 100."
    },
    {
      column: "initialStock",
      description: "Stock inicial entero mayor o igual a 0. Crea inventario real al importar."
    },
    {
      column: "minStock",
      description: "Stock mínimo entero mayor o igual a 0 para alertas de bajo inventario."
    }
  ]);
  instructions.getColumn(2).alignment = { wrapText: true, vertical: "top" };

  const buffer = await workbook.xlsx.writeBuffer();

  return Buffer.from(buffer);
}

function cleanString(value: unknown) {
  const text = String(value ?? "").trim();

  return text || null;
}

function readOptionalString(
  row: Record<string, unknown>,
  field: string,
  rowNumber: number,
  maxLength: number
) {
  const value = cleanString(row[field]);

  if (!value) {
    return null;
  }

  if (value.length > maxLength) {
    throw new AppError(
      400,
      `Fila ${rowNumber}: ${field} no debe superar ${maxLength} caracteres`
    );
  }

  return value;
}

function readRequiredString(
  row: Record<string, unknown>,
  field: string,
  rowNumber: number,
  maxLength: number
) {
  const value = readOptionalString(row, field, rowNumber, maxLength);

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

export async function getOrCreateCategory(
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

function normalizeCellValue(value: ExcelJS.CellValue | undefined) {
  if (value === undefined || value === null) {
    return "";
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean" ||
    value instanceof Date
  ) {
    return value;
  }

  if (typeof value === "object") {
    if ("text" in value && typeof value.text === "string") {
      return value.text;
    }

    if ("richText" in value && Array.isArray(value.richText)) {
      return value.richText
        .map((part) => part.text ?? "")
        .join("");
    }

    if ("result" in value) {
      return normalizeCellValue(value.result as ExcelJS.CellValue | undefined);
    }
  }

  return String(value);
}

function hasCellContent(value: unknown) {
  if (value === undefined || value === null) {
    return false;
  }

  if (typeof value === "string") {
    return value.trim().length > 0;
  }

  return true;
}

async function loadWorkbookFromBuffer(buffer: Buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(
    buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]
  );

  return workbook;
}

function normalizeSpreadsheetNamespaceXml(xml: string) {
  if (!xml.includes(`xmlns:x="${SPREADSHEETML_MAIN_NAMESPACE}"`)) {
    return xml;
  }

  return xml
    .replaceAll(
      `xmlns:x="${SPREADSHEETML_MAIN_NAMESPACE}"`,
      `xmlns="${SPREADSHEETML_MAIN_NAMESPACE}"`
    )
    .replace(/(<\/?)(x):/g, "$1");
}

async function normalizeSpreadsheetNamespaces(buffer: Buffer) {
  const zip = await JSZip.loadAsync(buffer);
  let normalizedAnyEntry = false;

  const files = Object.entries(zip.files);

  for (const [path, file] of files) {
    if (file.dir || !path.endsWith(".xml")) {
      continue;
    }

    const xml = await file.async("string");
    const normalizedXml = normalizeSpreadsheetNamespaceXml(xml);

    if (normalizedXml === xml) {
      continue;
    }

    zip.file(path, normalizedXml);
    normalizedAnyEntry = true;
  }

  if (!normalizedAnyEntry) {
    return null;
  }

  return zip.generateAsync({
    type: "nodebuffer",
    compression: "DEFLATE"
  });
}

async function readWorkbook(buffer: Buffer) {
  try {
    return await loadWorkbookFromBuffer(buffer);
  } catch {
    try {
      const normalizedBuffer = await normalizeSpreadsheetNamespaces(buffer);

      if (normalizedBuffer) {
        return await loadWorkbookFromBuffer(normalizedBuffer);
      }
    } catch {
      // The final user-facing error below intentionally avoids leaking parser internals.
    }

    throw new AppError(
      400,
      "No se pudo leer el archivo Excel. Usa un archivo .xlsx válido descargado desde Punta Venta o guardado desde Excel/Google Sheets."
    );
  }
}

function getImportWorksheet(workbook: ExcelJS.Workbook) {
  const worksheet =
    workbook.getWorksheet(PRODUCTS_IMPORT_SHEET_NAME) ?? workbook.worksheets[0];

  if (!worksheet) {
    throw new AppError(
      400,
      "El archivo no contiene hojas válidas"
    );
  }

  if (worksheet.actualRowCount === 0) {
    throw new AppError(
      400,
      "La hoja productos del archivo está vacía"
    );
  }

  return worksheet;
}

function readHeaderMap(worksheet: ExcelJS.Worksheet) {
  const headerRow = worksheet.getRow(1);

  if (headerRow.cellCount > MAX_IMPORT_COLUMNS) {
    throw new AppError(
      400,
      `El archivo excede el límite de ${MAX_IMPORT_COLUMNS} columnas permitidas para importación de productos`
    );
  }

  const headers: string[] = [];
  const headerByColumn = new Map<number, ProductImportHeader>();

  headerRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
    const header = cleanString(normalizeCellValue(cell.value));

    if (!header) {
      return;
    }

    if (headers.includes(header)) {
      throw new AppError(
        400,
        `El archivo contiene una columna duplicada: ${header}`
      );
    }

    if (!PRODUCT_IMPORT_HEADER_SET.has(header)) {
      throw new AppError(
        400,
        `El archivo contiene una columna no permitida: ${header}`
      );
    }

    headers.push(header);
    headerByColumn.set(columnNumber, header as ProductImportHeader);
  });

  if (headers.length === 0) {
    throw new AppError(
      400,
      "El archivo debe incluir encabezados en la primera fila"
    );
  }

  for (const requiredHeader of REQUIRED_PRODUCT_IMPORT_HEADERS) {
    if (!headers.includes(requiredHeader)) {
      throw new AppError(
        400,
        `El archivo debe incluir la columna requerida ${requiredHeader}`
      );
    }
  }

  return headerByColumn;
}

export async function readProductRows(buffer: Buffer) {
  const workbook = await readWorkbook(buffer);
  const worksheet = getImportWorksheet(workbook);
  const headerByColumn = readHeaderMap(worksheet);
  const rows: ProductImportRow[] = [];

  for (let rowNumber = 2; rowNumber <= worksheet.rowCount; rowNumber += 1) {
    const worksheetRow = worksheet.getRow(rowNumber);
    const row: ProductImportRow = {};
    let hasData = false;

    worksheetRow.eachCell({ includeEmpty: false }, (cell, columnNumber) => {
      const value = normalizeCellValue(cell.value);

      if (!hasCellContent(value)) {
        return;
      }

      const header = headerByColumn.get(columnNumber);

      if (!header) {
        throw new AppError(
          400,
          `Fila ${rowNumber}: contiene datos en una columna sin encabezado permitido`
        );
      }

      row[header] = value;
      hasData = true;
    });

    if (!hasData) {
      continue;
    }

    rows.push(row);

    if (rows.length > MAX_IMPORT_ROWS) {
      throw new AppError(
        400,
        `El archivo excede el límite de ${MAX_IMPORT_ROWS} productos por importación`
      );
    }
  }

  if (rows.length === 0) {
    throw new AppError(
      400,
      "El archivo no contiene productos para importar"
    );
  }

  return rows;
}


export type ParsedProductImportRow = {
  categoryName: string | null;
  sku: string;
  barcode: string | null;
  name: string;
  description: string | null;
  costPrice: number;
  salePrice: number;
  promoPercent: number;
  minStock: number;
  initialStock: number;
};

export function parseProductImportRow(
  row: ProductImportRow,
  rowNumber: number
): ParsedProductImportRow {
  return {
    categoryName: cleanString(row.categoryName),
    sku: readRequiredString(row, "sku", rowNumber, 80),
    barcode: readOptionalString(row, "barcode", rowNumber, 80),
    name: readRequiredString(row, "name", rowNumber, 160),
    description: readOptionalString(row, "description", rowNumber, 500),
    costPrice: readNonNegativeNumber(row, "costPrice", rowNumber, 0),
    salePrice: readNonNegativeNumber(row, "salePrice", rowNumber, 0),
    promoPercent: readPromoPercent(row, rowNumber),
    minStock: readNonNegativeInteger(row, "minStock", rowNumber, 0),
    initialStock: readNonNegativeInteger(row, "initialStock", rowNumber, 0)
  };
}

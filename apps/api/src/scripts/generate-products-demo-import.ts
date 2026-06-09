import fs from "node:fs";
import path from "node:path";

import ExcelJS from "exceljs";

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

const PRODUCTS_IMPORT_SHEET_NAME = "productos";

const DEMO_PRODUCTS = [
  {
    categoryName: "Bebidas",
    sku: "CAFE-AMERICANO-12OZ",
    barcode: "PV-DEMO-CAFE-12OZ",
    name: "Café americano 12 oz",
    description: "Producto demo para validar venta, inventario y reportes.",
    costPrice: 18,
    salePrice: 35,
    promoPercent: 0,
    initialStock: 24,
    minStock: 5
  },
  {
    categoryName: "Bebidas",
    sku: "AGUA-MINERAL-1L",
    barcode: "PV-DEMO-AGUA-1L",
    name: "Agua mineral 1L",
    description: "Producto demo para validar importación Excel con categoría existente.",
    costPrice: 8,
    salePrice: 16,
    promoPercent: 0,
    initialStock: 36,
    minStock: 8
  },
  {
    categoryName: "Panadería",
    sku: "PAN-DULCE-001",
    barcode: "PV-DEMO-PAN-001",
    name: "Pan dulce surtido",
    description: "Producto demo con promoción para validar margen y precio final.",
    costPrice: 7,
    salePrice: 14,
    promoPercent: 10,
    initialStock: 18,
    minStock: 6
  },
  {
    categoryName: "Limpieza",
    sku: "JABON-LIQ-500ML",
    barcode: "PV-DEMO-JABON-500",
    name: "Jabón líquido 500 ml",
    description: "Producto demo para validar una categoría nueva por nombre.",
    costPrice: 22,
    salePrice: 45,
    promoPercent: 5,
    initialStock: 12,
    minStock: 3
  }
];

function findRepoRoot(startDirectory: string) {
  let currentDirectory = startDirectory;

  while (currentDirectory !== path.dirname(currentDirectory)) {
    const packageJsonPath = path.join(currentDirectory, "package.json");

    if (fs.existsSync(packageJsonPath)) {
      const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

      if (packageJson.name === "punta-venta") {
        return currentDirectory;
      }
    }

    currentDirectory = path.dirname(currentDirectory);
  }

  return startDirectory;
}

async function main() {
  const repoRoot = findRepoRoot(process.cwd());
  const outputDirectory = path.join(repoRoot, ".puntaventa_diagnostics");
  const outputPath = path.join(outputDirectory, "productos-demo-import.xlsx");

  fs.mkdirSync(outputDirectory, { recursive: true });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Punta Venta";
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet(PRODUCTS_IMPORT_SHEET_NAME);
  worksheet.columns = PRODUCT_IMPORT_HEADERS.map((header) => ({
    header,
    key: header,
    width: Math.max(header.length + 6, 18)
  }));
  worksheet.views = [{ state: "frozen", ySplit: 1 }];

  const headerRow = worksheet.getRow(1);
  headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
  headerRow.fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }
  };

  for (const product of DEMO_PRODUCTS) {
    worksheet.addRow(product);
  }

  const instructions = workbook.addWorksheet("instrucciones");
  instructions.columns = [
    { header: "Uso", key: "usage", width: 38 },
    { header: "Detalle", key: "detail", width: 96 }
  ];
  instructions.getRow(1).font = { bold: true, color: { argb: "FFFFFFFF" } };
  instructions.getRow(1).fill = {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF1E3A8A" }
  };
  instructions.addRows([
    {
      usage: "Archivo demo",
      detail: "Importa este archivo desde Productos para probar altas, categorías, precios, promoción, stock inicial y stock mínimo."
    },
    {
      usage: "Stock inicial",
      detail: "El stock importado entra al almacén principal. Un vendedor solo podrá venderlo después de una solicitud de retiro aprobada por el administrador."
    },
    {
      usage: "No versionar",
      detail: "El archivo se genera en .puntaventa_diagnostics/ y no debe commitearse."
    }
  ]);

  await workbook.xlsx.writeFile(outputPath);

  console.log(`Archivo demo generado: ${outputPath}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import * as XLSX from "xlsx";
import { prisma } from "../../config/prisma";

export function calculateFinalPrice(
  salePrice: number,
  promoPercent: number
): number {
  return salePrice * (1 - promoPercent / 100);
}

export function calculateMargin(
  costPrice: number,
  salePrice: number
): number {
  if (costPrice === 0) return 0;
  return ((salePrice - costPrice) / costPrice) * 100;
}

export async function importProducts(buffer: Buffer) {
  const workbook = XLSX.read(buffer, { type: "buffer" });
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(worksheet);

  const products = [];

  for (const row of data as any[]) {
    const product = await prisma.product.create({
      data: {
        sku: String(row.sku || ""),
        name: String(row.name || ""),
        description: String(row.description || null),
        costPrice: Number(row.costPrice ?? 0),
        salePrice: Number(row.salePrice ?? 0),
        promoPercent: Number(row.promoPercent ?? 0),
        stock: Number(row.stock ?? 0),
        minStock: Number(row.minStock ?? 0),
        isActive: true
      }
    });

    products.push(product);
  }

  return products;
}

export function productTemplateBuffer(): Buffer {
  const data = [
    {
      sku: "EJEMPLO-001",
      name: "Producto de Ejemplo",
      description: "Descripción del producto",
      costPrice: 10.5,
      salePrice: 15.0,
      promoPercent: 0,
      stock: 100,
      minStock: 10
    }
  ];

  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Productos");

  return XLSX.write(workbook, { type: "buffer", bookType: "xlsx" });
}
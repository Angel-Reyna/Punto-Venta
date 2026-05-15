import XLSX from "xlsx";

import { prisma } from "../../config/prisma";

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

async function getOrCreateDefaultWarehouse() {
  return prisma.warehouse.upsert({
    where: {
      name: "Almacén principal"
    },
    update: {},
    create: {
      name: "Almacén principal",
      description: "Almacén principal del negocio",
      isActive: true
    }
  });
}

async function getOrCreateCategory(
  categoryName?: string
) {
  const name =
    categoryName?.trim() || "General";

  return prisma.productCategory.upsert({
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
  const workbook = XLSX.read(buffer);

  const sheetName = workbook.SheetNames[0];

  const sheet = workbook.Sheets[sheetName];

  const rows =
    XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

  const warehouse =
    await getOrCreateDefaultWarehouse();

  const imported = [];

  for (const row of rows) {
    const sku = String(row.sku ?? "").trim();

    const name = String(row.name ?? "").trim();

    if (!sku || !name) {
      continue;
    }

    const category = await getOrCreateCategory(
      row.categoryName
        ? String(row.categoryName)
        : "General"
    );

    const initialStock = Number(
      row.initialStock ?? 0
    );

    const product =
      await prisma.product.upsert({
        where: {
          sku
        },

        update: {
          categoryId: category.id,

          barcode: row.barcode
            ? String(row.barcode)
            : undefined,

          name,

          description: row.description
            ? String(row.description)
            : undefined,

          costPrice: Number(
            row.costPrice ?? 0
          ),

          salePrice: Number(
            row.salePrice ?? 0
          ),

          promoPercent: Number(
            row.promoPercent ?? 0
          ),

          minStock: Number(
            row.minStock ?? 0
          ),

          isActive: true
        },

        create: {
          categoryId: category.id,

          sku,

          barcode: row.barcode
            ? String(row.barcode)
            : undefined,

          name,

          description: row.description
            ? String(row.description)
            : undefined,

          costPrice: Number(
            row.costPrice ?? 0
          ),

          salePrice: Number(
            row.salePrice ?? 0
          ),

          promoPercent: Number(
            row.promoPercent ?? 0
          ),

          minStock: Number(
            row.minStock ?? 0
          ),

          isActive: true
        }
      });

    if (initialStock > 0) {
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,

          warehouseId: warehouse.id,

          type: "IN",

          quantity: initialStock,

          reason: "Stock inicial desde importación Excel",

          createdBy: userId
        }
      });
    }

    imported.push(product);
  }

  return imported;
}
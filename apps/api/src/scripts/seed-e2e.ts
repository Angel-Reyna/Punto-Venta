import bcrypt from "bcrypt";

import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { logger } from "../utils/logger";
import { DEFAULT_WAREHOUSE_NAME } from "../modules/inventory/inventory.service";

const E2E_ADMIN_EMAIL = env.SEED_ADMIN_EMAIL;
const E2E_ADMIN_NAME = env.SEED_ADMIN_NAME;
const E2E_ADMIN_PASSWORD = env.SEED_ADMIN_PASSWORD ?? "Admin12345DevOnly";
const E2E_SELLER_EMAIL = process.env.E2E_SELLER_EMAIL ?? "vendedor.e2e@puntaventa.test";
const E2E_SELLER_NAME = process.env.E2E_SELLER_NAME ?? "Vendedor E2E";
const E2E_SELLER_PASSWORD = process.env.E2E_SELLER_PASSWORD ?? "Vendedor12345DevOnly";
const E2E_PRODUCT_SKU = "E2E-COCA-600";
const E2E_PRODUCT_BARCODE = "999000000001";
const E2E_INITIAL_STOCK = 24;

async function upsertUser(input: {
  email: string;
  name: string;
  password: string;
  role: "ADMIN" | "CASHIER";
}) {
  const passwordHash = await bcrypt.hash(input.password, env.BCRYPT_ROUNDS);

  return prisma.user.upsert({
    where: {
      email: input.email,
    },
    update: {
      name: input.name,
      passwordHash,
      role: input.role,
      isActive: true,
    },
    create: {
      name: input.name,
      email: input.email,
      passwordHash,
      role: input.role,
      isActive: true,
    },
    select: {
      id: true,
      email: true,
      role: true,
    },
  });
}

async function main() {
  const admin = await upsertUser({
    email: E2E_ADMIN_EMAIL,
    name: E2E_ADMIN_NAME,
    password: E2E_ADMIN_PASSWORD,
    role: "ADMIN",
  });

  const seller = await upsertUser({
    email: E2E_SELLER_EMAIL,
    name: E2E_SELLER_NAME,
    password: E2E_SELLER_PASSWORD,
    role: "CASHIER",
  });

  const category = await prisma.productCategory.upsert({
    where: {
      name: "Bebidas E2E",
    },
    update: {
      description: "Categoría usada por pruebas integradas E2E",
      isActive: true,
    },
    create: {
      name: "Bebidas E2E",
      description: "Categoría usada por pruebas integradas E2E",
      isActive: true,
    },
  });

  const warehouse = await prisma.warehouse.upsert({
    where: {
      name: DEFAULT_WAREHOUSE_NAME,
    },
    update: {
      description: "Almacén principal del negocio",
      isActive: true,
    },
    create: {
      name: DEFAULT_WAREHOUSE_NAME,
      description: "Almacén principal del negocio",
      isActive: true,
    },
  });

  const product = await prisma.product.upsert({
    where: {
      sku: E2E_PRODUCT_SKU,
    },
    update: {
      categoryId: category.id,
      barcode: E2E_PRODUCT_BARCODE,
      name: "Producto integrado E2E",
      description: "Producto físico usado por la prueba integrada de ventas",
      costPrice: 10,
      salePrice: 18,
      promoPercent: 0,
      minStock: 5,
      isActive: true,
    },
    create: {
      categoryId: category.id,
      sku: E2E_PRODUCT_SKU,
      barcode: E2E_PRODUCT_BARCODE,
      name: "Producto integrado E2E",
      description: "Producto físico usado por la prueba integrada de ventas",
      costPrice: 10,
      salePrice: 18,
      promoPercent: 0,
      minStock: 5,
      isActive: true,
    },
  });

  await prisma.inventoryBalance.upsert({
    where: {
      productId_warehouseId: {
        productId: product.id,
        warehouseId: warehouse.id,
      },
    },
    update: {
      quantity: E2E_INITIAL_STOCK,
    },
    create: {
      productId: product.id,
      warehouseId: warehouse.id,
      quantity: E2E_INITIAL_STOCK,
    },
  });

  await prisma.inventoryMovement.create({
    data: {
      productId: product.id,
      warehouseId: warehouse.id,
      productSku: product.sku,
      productName: product.name,
      type: "IN",
      quantity: E2E_INITIAL_STOCK,
      reason: "Stock inicial de prueba integrada E2E",
      createdBy: admin.id,
    },
  });

  logger.info("E2E seed completed", {
    adminEmail: admin.email,
    sellerEmail: seller.email,
    productSku: product.sku,
    initialStock: E2E_INITIAL_STOCK,
  });
}

main()
  .catch((error) => {
    logger.error("E2E seed failed", { error });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

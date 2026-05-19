import bcrypt from "bcrypt";

import { prisma } from "../config/prisma";
import { env } from "../config/env";
import { logger } from "../utils/logger";

const DEVELOPMENT_ADMIN_PASSWORD = "Admin12345";

function resolveAdminPassword() {
  if (env.SEED_ADMIN_PASSWORD) {
    return env.SEED_ADMIN_PASSWORD;
  }

  if (env.NODE_ENV === "production") {
    throw new Error(
      "SEED_ADMIN_PASSWORD is required when running the seed in production"
    );
  }

  return DEVELOPMENT_ADMIN_PASSWORD;
}

async function seedAdmin() {
  const password = resolveAdminPassword();
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_ROUNDS);

  return prisma.user.upsert({
    where: {
      email: env.SEED_ADMIN_EMAIL
    },
    update: {
      name: env.SEED_ADMIN_NAME,
      passwordHash,
      role: "ADMIN",
      isActive: true
    },
    create: {
      name: env.SEED_ADMIN_NAME,
      email: env.SEED_ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      isActive: true
    },
    select: {
      id: true,
      email: true,
      role: true,
      isActive: true
    }
  });
}

async function seedDemoData(adminId: string) {
  const category = await prisma.productCategory.upsert({
    where: {
      name: "General"
    },
    update: {},
    create: {
      name: "General",
      description: "Categoría general",
      isActive: true
    }
  });

  const warehouse = await prisma.warehouse.upsert({
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

  const product = await prisma.product.upsert({
    where: {
      sku: "SKU-CAFE-001"
    },
    update: {},
    create: {
      categoryId: category.id,
      sku: "SKU-CAFE-001",
      barcode: "750000000001",
      name: "Café americano",
      description: "Producto de ejemplo",
      costPrice: 18,
      salePrice: 35,
      promoPercent: 0,
      minStock: 5,
      isActive: true
    }
  });

  const existingBalance = await prisma.inventoryBalance.findUnique({
    where: {
      productId_warehouseId: {
        productId: product.id,
        warehouseId: warehouse.id
      }
    }
  });

  if (existingBalance) {
    return;
  }

  await prisma.$transaction(async (tx) => {
    await tx.inventoryBalance.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        quantity: 30
      }
    });

    await tx.inventoryMovement.create({
      data: {
        productId: product.id,
        warehouseId: warehouse.id,
        type: "IN",
        quantity: 30,
        reason: "Stock inicial de datos demo",
        createdBy: adminId
      }
    });
  });
}

async function main() {
  const admin = await seedAdmin();

  if (env.SEED_DEMO_DATA) {
    await seedDemoData(admin.id);
  }

  logger.info("Seed completed", {
    adminEmail: admin.email,
    adminRole: admin.role,
    seededDemoData: env.SEED_DEMO_DATA
  });
}

main()
  .catch((error) => {
    logger.error("Seed failed", { error });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

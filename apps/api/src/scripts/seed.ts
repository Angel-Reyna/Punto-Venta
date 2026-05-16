import bcrypt from "bcrypt";

import { prisma } from "../config/prisma";
import { env } from "../config/env";

async function main() {
  const passwordHash = await bcrypt.hash(
    "Admin12345",
    env.BCRYPT_ROUNDS
  );

const admin = await prisma.user.upsert({
  where: {
    email: "admin@pos.local"
  },
  update: {
    name: "Administrador",
    passwordHash,
    role: "ADMIN",
    isActive: true
  },
  create: {
    name: "Administrador",
    email: "admin@pos.local",
    passwordHash,
    role: "ADMIN",
    isActive: true
  }
});

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

  if (!existingBalance) {
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
          reason: "Stock inicial",
          createdBy: admin.id
        }
      });
    });
  }

  console.log("Seed completado");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

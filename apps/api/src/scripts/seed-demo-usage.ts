import bcrypt from "bcrypt";
import {
  InventoryReasonType,
  InventoryTransferRequestStatus,
  InventoryType,
  PaymentMethod,
  Prisma,
  PrismaClient,
  Role,
  SaleAdjustmentRequestStatus,
  SaleAdjustmentRequestType,
  SaleStatus,
  SellerAction,
  WarehouseType
} from "@prisma/client";

import { env } from "../config/env";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

const DEMO_PREFIX = "DEMO";
const DEMO_EMAIL_DOMAIN = "demo.puntaventa.local";
const DEFAULT_DAYS = 60;
const DEFAULT_SEED = "punta-venta-demo-usage";
const DEMO_PASSWORD = "Demo12345DevOnly";

type CliOptions = {
  days: number;
  seed: string;
  resetDemo: boolean;
  onlyClean: boolean;
  forceProduction: boolean;
};

type DemoSeller = {
  id: string;
  name: string;
  email: string;
  warehouseId: string;
};

type DemoProduct = {
  id: string;
  sku: string;
  name: string;
  costPrice: number;
  salePrice: number;
  promoPercent: number;
  minStock: number;
};

type DemoWarehouse = {
  id: string;
  name: string;
};

type DemoCustomer = {
  id: string;
  name: string;
};

type CreatedSaleForReturn = {
  id: string;
  folio: string;
  cashierId: string;
  warehouseId: string;
  createdAt: Date;
  total: number;
  items: Array<{
    id: string;
    productId: string;
    productSku: string;
    productName: string;
    quantity: number;
    unitPrice: number;
    unitCost: number;
    promoPercent: number;
    discount: number;
    total: number;
    grossProfit: number;
  }>;
};

const productCatalog = [
  { sku: "DEMO-COCA-600", barcode: "779000100001", name: "Coca-Cola 600 ml", costPrice: 11.5, salePrice: 20, minStock: 30 },
  { sku: "DEMO-BOTANA-050", barcode: "779000100002", name: "Botana salada 50 g", costPrice: 7, salePrice: 14, minStock: 40 },
  { sku: "DEMO-GALLETA-120", barcode: "779000100003", name: "Galletas surtidas 120 g", costPrice: 9.25, salePrice: 18, minStock: 24 },
  { sku: "DEMO-AGUA-1L", barcode: "779000100004", name: "Agua natural 1 L", costPrice: 6.75, salePrice: 13, minStock: 36 },
  { sku: "DEMO-JUGO-500", barcode: "779000100005", name: "Jugo de naranja 500 ml", costPrice: 10, salePrice: 19, minStock: 22 },
  { sku: "DEMO-CAFE-100", barcode: "779000100006", name: "Café soluble 100 g", costPrice: 42, salePrice: 69, minStock: 12 },
  { sku: "DEMO-LECHE-1L", barcode: "779000100007", name: "Leche entera 1 L", costPrice: 18, salePrice: 27, minStock: 24 },
  { sku: "DEMO-PAN-DULCE", barcode: "779000100008", name: "Pan dulce individual", costPrice: 5.5, salePrice: 12, minStock: 30 },
  { sku: "DEMO-CHOCOLATE", barcode: "779000100009", name: "Chocolate de mesa", costPrice: 16, salePrice: 29, minStock: 18 },
  { sku: "DEMO-CEREAL-350", barcode: "779000100010", name: "Cereal familiar 350 g", costPrice: 37, salePrice: 58, minStock: 10 },
  { sku: "DEMO-YOGURT-1L", barcode: "779000100011", name: "Yogurt bebible 1 L", costPrice: 21, salePrice: 35, minStock: 16 },
  { sku: "DEMO-ATUN-140", barcode: "779000100012", name: "Atún en lata 140 g", costPrice: 15.5, salePrice: 27, minStock: 20 }
] as const;

const sellerCatalog = [
  { name: "Demo Vendedor Norte", email: `demo.vendedor.norte@${DEMO_EMAIL_DOMAIN}` },
  { name: "Demo Vendedor Centro", email: `demo.vendedor.centro@${DEMO_EMAIL_DOMAIN}` },
  { name: "Demo Vendedor Ruta", email: `demo.vendedor.ruta@${DEMO_EMAIL_DOMAIN}` }
] as const;

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    days: DEFAULT_DAYS,
    seed: DEFAULT_SEED,
    resetDemo: false,
    onlyClean: false,
    forceProduction: false
  };

  for (const arg of argv) {
    if (arg === "--reset-demo") {
      options.resetDemo = true;
      continue;
    }

    if (arg === "--only-clean") {
      options.onlyClean = true;
      options.resetDemo = true;
      continue;
    }

    if (arg === "--force-production") {
      options.forceProduction = true;
      continue;
    }

    if (arg.startsWith("--days=")) {
      const value = Number(arg.slice("--days=".length));
      if (!Number.isInteger(value) || value < 7 || value > 180) {
        throw new Error("--days debe ser un entero entre 7 y 180");
      }
      options.days = value;
      continue;
    }

    if (arg.startsWith("--seed=")) {
      const value = arg.slice("--seed=".length).trim();
      if (!value) {
        throw new Error("--seed no puede estar vacío");
      }
      options.seed = value;
      continue;
    }

    throw new Error(`Argumento no soportado: ${arg}`);
  }

  return options;
}

function hashSeed(input: string) {
  let hash = 2166136261;

  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  return hash >>> 0;
}

function createRandom(seed: string) {
  let state = hashSeed(seed) || 1;

  return () => {
    state += 0x6d2b79f5;
    let value = state;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);

    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function money(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function intBetween(random: () => number, min: number, max: number) {
  return Math.floor(random() * (max - min + 1)) + min;
}

function pick<T>(random: () => number, items: readonly T[]): T {
  return items[Math.floor(random() * items.length)] ?? items[0];
}

function weightedPick<T>(random: () => number, items: Array<{ item: T; weight: number }>): T {
  const total = items.reduce((sum, item) => sum + item.weight, 0);
  let cursor = random() * total;

  for (const entry of items) {
    cursor -= entry.weight;
    if (cursor <= 0) return entry.item;
  }

  return items[items.length - 1].item;
}

function startOfLocalDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function dateAt(day: Date, hour: number, minute: number) {
  const next = new Date(day);
  next.setHours(hour, minute, intBetween(createRandom(`${day.toISOString()}:${hour}:${minute}`), 0, 50), 0);
  return next;
}

function randomDateAt(random: () => number, day: Date, startHour = 8, endHour = 21) {
  const next = new Date(day);
  next.setHours(intBetween(random, startHour, endHour), intBetween(random, 0, 59), intBetween(random, 0, 50), 0);
  return next;
}

function isWeekend(day: Date) {
  const weekDay = day.getDay();

  return weekDay === 0 || weekDay === 6;
}

function stockKey(productId: string, warehouseId: string) {
  return `${productId}:${warehouseId}`;
}

async function cleanDemoData() {
  const demoUsers = await prisma.user.findMany({
    where: {
      OR: [
        { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
        { name: { startsWith: `${DEMO_PREFIX} ` } }
      ]
    },
    select: { id: true }
  });
  const demoUserIds = demoUsers.map((user) => user.id);

  const demoProducts = await prisma.product.findMany({
    where: { sku: { startsWith: `${DEMO_PREFIX}-` } },
    select: { id: true }
  });
  const demoProductIds = demoProducts.map((product) => product.id);

  const demoWarehouses = await prisma.warehouse.findMany({
    where: { name: { startsWith: `${DEMO_PREFIX} ` } },
    select: { id: true }
  });
  const demoWarehouseIds = demoWarehouses.map((warehouse) => warehouse.id);

  const demoSales = await prisma.sale.findMany({
    where: { folio: { startsWith: `${DEMO_PREFIX}-` } },
    select: { id: true }
  });
  const demoSaleIds = demoSales.map((sale) => sale.id);

  const demoReturns = await prisma.saleReturn.findMany({
    where: {
      OR: [
        { saleId: { in: demoSaleIds } },
        { reason: { startsWith: `${DEMO_PREFIX}:` } }
      ]
    },
    select: { id: true }
  });
  const demoReturnIds = demoReturns.map((saleReturn) => saleReturn.id);

  const demoTransfers = await prisma.inventoryTransferRequest.findMany({
    where: {
      OR: [
        { reason: { startsWith: `${DEMO_PREFIX}:` } },
        { fromWarehouseId: { in: demoWarehouseIds } },
        { toWarehouseId: { in: demoWarehouseIds } },
        { requestedById: { in: demoUserIds } }
      ]
    },
    select: { id: true }
  });
  const demoTransferIds = demoTransfers.map((request) => request.id);

  await prisma.$transaction([
    prisma.saleAdjustmentRequestItem.deleteMany({
      where: {
        request: {
          OR: [
            { saleId: { in: demoSaleIds } },
            { reason: { startsWith: `${DEMO_PREFIX}:` } },
            { requestedById: { in: demoUserIds } }
          ]
        }
      }
    }),
    prisma.saleAdjustmentRequest.deleteMany({
      where: {
        OR: [
          { saleId: { in: demoSaleIds } },
          { reason: { startsWith: `${DEMO_PREFIX}:` } },
          { requestedById: { in: demoUserIds } }
        ]
      }
    }),
    prisma.saleReturnItem.deleteMany({ where: { returnId: { in: demoReturnIds } } }),
    prisma.saleReturn.deleteMany({ where: { id: { in: demoReturnIds } } }),
    prisma.payment.deleteMany({ where: { saleId: { in: demoSaleIds } } }),
    prisma.saleItem.deleteMany({ where: { saleId: { in: demoSaleIds } } }),
    prisma.sale.deleteMany({ where: { id: { in: demoSaleIds } } }),
    prisma.inventoryTransferRequestItem.deleteMany({ where: { requestId: { in: demoTransferIds } } }),
    prisma.inventoryTransferRequest.deleteMany({ where: { id: { in: demoTransferIds } } }),
    prisma.sellerActivityLog.deleteMany({
      where: {
        OR: [
          { sellerId: { in: demoUserIds } },
          { description: { startsWith: `${DEMO_PREFIX}:` } }
        ]
      }
    }),
    prisma.auditLog.deleteMany({
      where: {
        OR: [
          { userId: { in: demoUserIds } },
          { action: { startsWith: `${DEMO_PREFIX}_` } },
          { recordId: { startsWith: `${DEMO_PREFIX}-` } }
        ]
      }
    }),
    prisma.inventoryMovement.deleteMany({
      where: {
        OR: [
          { productSku: { startsWith: `${DEMO_PREFIX}-` } },
          { productId: { in: demoProductIds } },
          { warehouseId: { in: demoWarehouseIds } },
          { reason: { startsWith: `${DEMO_PREFIX}:` } },
          { createdBy: { in: demoUserIds } }
        ]
      }
    }),
    prisma.inventoryBalance.deleteMany({
      where: {
        OR: [
          { productId: { in: demoProductIds } },
          { warehouseId: { in: demoWarehouseIds } }
        ]
      }
    }),
    prisma.product.deleteMany({ where: { id: { in: demoProductIds } } }),
    prisma.productCategory.deleteMany({ where: { name: { startsWith: `${DEMO_PREFIX} ` } } }),
    prisma.customer.deleteMany({
      where: {
        OR: [
          { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } },
          { name: { startsWith: `${DEMO_PREFIX} ` } }
        ]
      }
    }),
    prisma.warehouse.deleteMany({ where: { id: { in: demoWarehouseIds } } }),
    prisma.refreshSession.deleteMany({ where: { userId: { in: demoUserIds } } }),
    prisma.user.deleteMany({ where: { id: { in: demoUserIds } } })
  ]);
}

async function upsertUsers() {
  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.BCRYPT_ROUNDS);

  const admin = await prisma.user.upsert({
    where: { email: `demo.admin@${DEMO_EMAIL_DOMAIN}` },
    update: {
      name: "DEMO Admin",
      passwordHash,
      role: Role.ADMIN,
      isActive: true
    },
    create: {
      name: "DEMO Admin",
      email: `demo.admin@${DEMO_EMAIL_DOMAIN}`,
      passwordHash,
      role: Role.ADMIN,
      isActive: true
    },
    select: { id: true, name: true, email: true }
  });

  const sellers = [];

  for (const seller of sellerCatalog) {
    const user = await prisma.user.upsert({
      where: { email: seller.email },
      update: {
        name: seller.name,
        passwordHash,
        role: Role.CASHIER,
        isActive: true
      },
      create: {
        name: seller.name,
        email: seller.email,
        passwordHash,
        role: Role.CASHIER,
        isActive: true
      },
      select: { id: true, name: true, email: true }
    });

    sellers.push(user);
  }

  return { admin, sellers };
}

async function upsertProducts(): Promise<DemoProduct[]> {
  const category = await prisma.productCategory.upsert({
    where: { name: "DEMO Abarrotes" },
    update: {
      description: "Categoría demo para simulación de uso realista",
      isActive: true
    },
    create: {
      name: "DEMO Abarrotes",
      description: "Categoría demo para simulación de uso realista",
      isActive: true
    }
  });

  const products: DemoProduct[] = [];

  for (const item of productCatalog) {
    const product = await prisma.product.upsert({
      where: { sku: item.sku },
      update: {
        categoryId: category.id,
        barcode: item.barcode,
        name: item.name,
        description: "Producto demo para reportes y pruebas de operación",
        costPrice: item.costPrice,
        salePrice: item.salePrice,
        promoPercent: 0,
        minStock: item.minStock,
        isActive: true
      },
      create: {
        categoryId: category.id,
        sku: item.sku,
        barcode: item.barcode,
        name: item.name,
        description: "Producto demo para reportes y pruebas de operación",
        costPrice: item.costPrice,
        salePrice: item.salePrice,
        promoPercent: 0,
        minStock: item.minStock,
        isActive: true
      },
      select: {
        id: true,
        sku: true,
        name: true,
        costPrice: true,
        salePrice: true,
        promoPercent: true,
        minStock: true
      }
    });

    products.push({
      id: product.id,
      sku: product.sku,
      name: product.name,
      costPrice: Number(product.costPrice),
      salePrice: Number(product.salePrice),
      promoPercent: Number(product.promoPercent),
      minStock: product.minStock
    });
  }

  return products;
}

async function upsertWarehouses(sellers: Array<{ id: string; name: string; email: string }>) {
  const mainWarehouse = await prisma.warehouse.upsert({
    where: { name: "DEMO Almacén Principal" },
    update: {
      description: "Almacén demo principal para simulación",
      type: WarehouseType.STORAGE,
      sellerId: null,
      isActive: true
    },
    create: {
      name: "DEMO Almacén Principal",
      description: "Almacén demo principal para simulación",
      type: WarehouseType.STORAGE,
      isActive: true
    },
    select: { id: true, name: true }
  });

  const secondaryWarehouse = await prisma.warehouse.upsert({
    where: { name: "DEMO Almacén Norte" },
    update: {
      description: "Almacén demo secundario para variación operativa",
      type: WarehouseType.STORAGE,
      sellerId: null,
      isActive: true
    },
    create: {
      name: "DEMO Almacén Norte",
      description: "Almacén demo secundario para variación operativa",
      type: WarehouseType.STORAGE,
      isActive: true
    },
    select: { id: true, name: true }
  });

  const sellerWarehouses: DemoSeller[] = [];

  for (const seller of sellers) {
    const warehouseName = `DEMO Stock ${seller.name}`;
    const warehouse = await prisma.warehouse.upsert({
      where: { name: warehouseName },
      update: {
        description: `Stock físico asignado a ${seller.name}`,
        type: WarehouseType.SELLER,
        sellerId: seller.id,
        isActive: true
      },
      create: {
        name: warehouseName,
        description: `Stock físico asignado a ${seller.name}`,
        type: WarehouseType.SELLER,
        sellerId: seller.id,
        isActive: true
      },
      select: { id: true }
    });

    sellerWarehouses.push({
      id: seller.id,
      name: seller.name,
      email: seller.email,
      warehouseId: warehouse.id
    });
  }

  return {
    storageWarehouses: [mainWarehouse, secondaryWarehouse],
    sellerWarehouses
  };
}

async function upsertCustomers(): Promise<DemoCustomer[]> {
  const customers: DemoCustomer[] = [];

  for (let index = 1; index <= 24; index += 1) {
    const padded = index.toString().padStart(2, "0");
    const email = `cliente.${padded}@${DEMO_EMAIL_DOMAIN}`;
    const existingCustomer = await prisma.customer.findFirst({
      where: { email },
      select: { id: true }
    });

    const customer = existingCustomer
      ? await prisma.customer.update({
          where: { id: existingCustomer.id },
          data: {
            name: `DEMO Cliente ${padded}`,
            phone: `555010${padded}`,
            isActive: true
          },
          select: { id: true, name: true }
        })
      : await prisma.customer.create({
          data: {
            name: `DEMO Cliente ${padded}`,
            phone: `555010${padded}`,
            email,
            isActive: true
          },
          select: { id: true, name: true }
        });

    customers.push(customer);
  }

  return customers;
}

async function setBalance(args: {
  productId: string;
  warehouseId: string;
  quantity: number;
}) {
  await prisma.inventoryBalance.upsert({
    where: {
      productId_warehouseId: {
        productId: args.productId,
        warehouseId: args.warehouseId
      }
    },
    update: { quantity: args.quantity },
    create: {
      productId: args.productId,
      warehouseId: args.warehouseId,
      quantity: args.quantity
    }
  });
}

async function adjustBalance(tx: Prisma.TransactionClient, args: {
  productId: string;
  warehouseId: string;
  delta: number;
}) {
  const current = await tx.inventoryBalance.findUnique({
    where: {
      productId_warehouseId: {
        productId: args.productId,
        warehouseId: args.warehouseId
      }
    },
    select: { quantity: true }
  });

  const nextQuantity = (current?.quantity ?? 0) + args.delta;

  if (nextQuantity < 0) {
    throw new Error(`Stock demo insuficiente para ${args.productId} en ${args.warehouseId}`);
  }

  await tx.inventoryBalance.upsert({
    where: {
      productId_warehouseId: {
        productId: args.productId,
        warehouseId: args.warehouseId
      }
    },
    update: { quantity: nextQuantity },
    create: {
      productId: args.productId,
      warehouseId: args.warehouseId,
      quantity: nextQuantity
    }
  });
}


async function ensureDemoStockForSale(tx: Prisma.TransactionClient, args: {
  product: DemoProduct;
  warehouseId: string;
  quantity: number;
  createdBy: string;
  createdAt: Date;
}) {
  const current = await tx.inventoryBalance.findUnique({
    where: {
      productId_warehouseId: {
        productId: args.product.id,
        warehouseId: args.warehouseId
      }
    },
    select: { quantity: true }
  });

  const available = current?.quantity ?? 0;

  if (available >= args.quantity) {
    return;
  }

  const replenishQuantity = Math.max(args.quantity - available + 24, 24);

  await adjustBalance(tx, {
    productId: args.product.id,
    warehouseId: args.warehouseId,
    delta: replenishQuantity
  });

  await tx.inventoryMovement.create({
    data: {
      productId: args.product.id,
      productSku: args.product.sku,
      productName: args.product.name,
      warehouseId: args.warehouseId,
      type: InventoryType.IN,
      quantity: replenishQuantity,
      reason: `${DEMO_PREFIX}: reabastecimiento automático para venta simulada`,
      reasonType: InventoryReasonType.OTHER,
      unitCostAtMovement: args.product.costPrice,
      costAmount: money(args.product.costPrice * replenishQuantity),
      createdBy: args.createdBy,
      createdAt: new Date(args.createdAt.getTime() - 3 * 60 * 1000)
    }
  });
}

async function seedInitialStock(args: {
  adminId: string;
  products: DemoProduct[];
  storageWarehouses: DemoWarehouse[];
  sellerWarehouses: DemoSeller[];
  startDate: Date;
}) {
  const createdAt = addDays(args.startDate, -3);

  for (const [productIndex, product] of args.products.entries()) {
    for (const [warehouseIndex, warehouse] of args.storageWarehouses.entries()) {
      const quantity = warehouseIndex === 0 ? 950 - productIndex * 12 : 320 - productIndex * 5;
      await setBalance({ productId: product.id, warehouseId: warehouse.id, quantity });
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          warehouseId: warehouse.id,
          type: InventoryType.IN,
          quantity,
          reason: `${DEMO_PREFIX}: stock inicial para simulación`,
          reasonType: InventoryReasonType.OTHER,
          unitCostAtMovement: product.costPrice,
          costAmount: money(product.costPrice * quantity),
          createdBy: args.adminId,
          createdAt
        }
      });
    }

    for (const [sellerIndex, seller] of args.sellerWarehouses.entries()) {
      const quantity = 220 + sellerIndex * 28 + (productIndex % 4) * 18;
      await setBalance({ productId: product.id, warehouseId: seller.warehouseId, quantity });
      await prisma.inventoryMovement.create({
        data: {
          productId: product.id,
          productSku: product.sku,
          productName: product.name,
          warehouseId: seller.warehouseId,
          type: InventoryType.IN,
          quantity,
          reason: `${DEMO_PREFIX}: stock inicial asignado a vendedor`,
          reasonType: InventoryReasonType.OTHER,
          unitCostAtMovement: product.costPrice,
          costAmount: money(product.costPrice * quantity),
          createdBy: args.adminId,
          createdAt: addDays(createdAt, 1)
        }
      });
    }
  }
}

async function createApprovedTransfer(args: {
  adminId: string;
  seller: DemoSeller;
  fromWarehouse: DemoWarehouse;
  items: Array<{ product: DemoProduct; quantity: number }>;
  createdAt: Date;
}) {
  await prisma.$transaction(async (tx) => {
    const request = await tx.inventoryTransferRequest.create({
      data: {
        status: InventoryTransferRequestStatus.APPROVED,
        fromWarehouseId: args.fromWarehouse.id,
        toWarehouseId: args.seller.warehouseId,
        requestedById: args.seller.id,
        reviewedById: args.adminId,
        reason: `${DEMO_PREFIX}: reabastecimiento para ruta de venta`,
        reviewNote: "Aprobado por simulación de uso realista",
        createdAt: args.createdAt,
        updatedAt: args.createdAt,
        reviewedAt: new Date(args.createdAt.getTime() + 45 * 60 * 1000),
        items: {
          create: args.items.map(({ product, quantity }) => ({
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            quantity
          }))
        }
      }
    });

    for (const { product, quantity } of args.items) {
      await adjustBalance(tx, {
        productId: product.id,
        warehouseId: args.fromWarehouse.id,
        delta: -quantity
      });
      await adjustBalance(tx, {
        productId: product.id,
        warehouseId: args.seller.warehouseId,
        delta: quantity
      });

      await tx.inventoryMovement.createMany({
        data: [
          {
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            warehouseId: args.fromWarehouse.id,
            type: InventoryType.OUT,
            quantity,
            reason: `${DEMO_PREFIX}: transferencia aprobada ${request.id}`,
            reasonType: InventoryReasonType.OTHER,
            unitCostAtMovement: product.costPrice,
            costAmount: money(product.costPrice * quantity),
            createdBy: args.adminId,
            createdAt: args.createdAt
          },
          {
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            warehouseId: args.seller.warehouseId,
            type: InventoryType.IN,
            quantity,
            reason: `${DEMO_PREFIX}: transferencia aprobada ${request.id}`,
            reasonType: InventoryReasonType.OTHER,
            unitCostAtMovement: product.costPrice,
            costAmount: money(product.costPrice * quantity),
            createdBy: args.adminId,
            createdAt: new Date(args.createdAt.getTime() + 5 * 60 * 1000)
          }
        ]
      });
    }

    await tx.auditLog.create({
      data: {
        userId: args.adminId,
        action: `${DEMO_PREFIX}_INVENTORY_TRANSFER_APPROVED`,
        tableName: "InventoryTransferRequest",
        recordId: request.id,
        newData: {
          fromWarehouse: args.fromWarehouse.name,
          toSeller: args.seller.name,
          items: args.items.map((item) => ({ sku: item.product.sku, quantity: item.quantity }))
        },
        createdAt: args.createdAt
      }
    });
  });
}

async function createPendingAndRejectedTransfers(args: {
  adminId: string;
  sellers: DemoSeller[];
  products: DemoProduct[];
  fromWarehouse: DemoWarehouse;
  endDate: Date;
  random: () => number;
}) {
  for (let index = 0; index < args.sellers.length; index += 1) {
    const seller = args.sellers[index];
    const product = pick(args.random, args.products);
    const createdAt = addDays(args.endDate, -index - 2);
    const status = index === 0
      ? InventoryTransferRequestStatus.PENDING
      : InventoryTransferRequestStatus.REJECTED;

    await prisma.inventoryTransferRequest.create({
      data: {
        status,
        fromWarehouseId: args.fromWarehouse.id,
        toWarehouseId: seller.warehouseId,
        requestedById: seller.id,
        reviewedById: status === InventoryTransferRequestStatus.REJECTED ? args.adminId : null,
        reason: `${DEMO_PREFIX}: solicitud ${status === InventoryTransferRequestStatus.PENDING ? "pendiente" : "rechazada"} para probar bandeja`,
        reviewNote: status === InventoryTransferRequestStatus.REJECTED ? "Rechazada por stock reservado" : null,
        createdAt,
        updatedAt: createdAt,
        reviewedAt: status === InventoryTransferRequestStatus.REJECTED ? new Date(createdAt.getTime() + 60 * 60 * 1000) : null,
        items: {
          create: {
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            quantity: intBetween(args.random, 8, 18)
          }
        }
      }
    });
  }
}

async function seedTransfers(args: {
  adminId: string;
  sellers: DemoSeller[];
  products: DemoProduct[];
  storageWarehouses: DemoWarehouse[];
  startDate: Date;
  endDate: Date;
  random: () => number;
}) {
  for (let offset = 0; offset <= Math.max(0, Math.floor((args.endDate.getTime() - args.startDate.getTime()) / 86400000)); offset += 9) {
    const day = addDays(args.startDate, offset);
    for (const seller of args.sellers) {
      const products = [...args.products]
        .sort(() => args.random() - 0.5)
        .slice(0, intBetween(args.random, 3, 5));

      await createApprovedTransfer({
        adminId: args.adminId,
        seller,
        fromWarehouse: pick(args.random, args.storageWarehouses),
        createdAt: dateAt(day, 7, intBetween(args.random, 0, 45)),
        items: products.map((product) => ({
          product,
          quantity: intBetween(args.random, 34, 72)
        }))
      });
    }
  }

  await createPendingAndRejectedTransfers({
    adminId: args.adminId,
    sellers: args.sellers,
    products: args.products,
    fromWarehouse: args.storageWarehouses[0],
    endDate: args.endDate,
    random: args.random
  });
}

async function createSale(args: {
  folio: string;
  seller: DemoSeller;
  customer: DemoCustomer | null;
  products: DemoProduct[];
  createdAt: Date;
  random: () => number;
}): Promise<CreatedSaleForReturn> {
  const items = args.products.map((product) => {
    const quantity = intBetween(args.random, 1, product.salePrice > 45 ? 2 : 4);
    const promoPercent = args.random() < 0.18 ? pick(args.random, [5, 10, 15]) : 0;
    const gross = product.salePrice * quantity;
    const discount = money(gross * (promoPercent / 100));
    const total = money(gross - discount);
    const grossProfit = money((product.salePrice - product.costPrice) * quantity - discount);

    return {
      product,
      quantity,
      unitPrice: product.salePrice,
      unitCost: product.costPrice,
      promoPercent,
      discount,
      total,
      grossProfit
    };
  });

  const subtotal = money(items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0));
  const discount = money(items.reduce((sum, item) => sum + item.discount, 0));
  const total = money(items.reduce((sum, item) => sum + item.total, 0));
  const paymentMethod = weightedPick(args.random, [
    { item: PaymentMethod.CASH, weight: 72 },
    { item: PaymentMethod.CARD, weight: 16 },
    { item: PaymentMethod.TRANSFER, weight: 9 },
    { item: PaymentMethod.MIXED, weight: 3 }
  ]);

  return prisma.$transaction(async (tx) => {
    const sale = await tx.sale.create({
      data: {
        folio: args.folio,
        cashierId: args.seller.id,
        customerId: args.customer?.id ?? null,
        warehouseId: args.seller.warehouseId,
        status: SaleStatus.COMPLETED,
        subtotal,
        discount,
        tax: 0,
        total,
        createdAt: args.createdAt,
        updatedAt: args.createdAt,
        items: {
          create: items.map((item) => ({
            productId: item.product.id,
            productSku: item.product.sku,
            productName: item.product.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            promoPercent: item.promoPercent,
            discount: item.discount,
            total: item.total,
            grossProfit: item.grossProfit
          }))
        },
        payments: {
          create: {
            method: paymentMethod,
            amount: total,
            createdAt: args.createdAt
          }
        }
      },
      include: { items: true }
    });

    for (const item of items) {
      await ensureDemoStockForSale(tx, {
        product: item.product,
        warehouseId: args.seller.warehouseId,
        quantity: item.quantity,
        createdBy: args.seller.id,
        createdAt: args.createdAt
      });

      await adjustBalance(tx, {
        productId: item.product.id,
        warehouseId: args.seller.warehouseId,
        delta: -item.quantity
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.product.id,
          productSku: item.product.sku,
          productName: item.product.name,
          warehouseId: args.seller.warehouseId,
          type: InventoryType.SALE,
          quantity: item.quantity,
          reason: `${DEMO_PREFIX}: venta ${args.folio}`,
          reasonType: InventoryReasonType.OTHER,
          unitCostAtMovement: item.product.costPrice,
          costAmount: money(item.product.costPrice * item.quantity),
          createdBy: args.seller.id,
          createdAt: args.createdAt
        }
      });
    }

    await tx.sellerActivityLog.create({
      data: {
        sellerId: args.seller.id,
        action: SellerAction.SALE_CREATED,
        entityType: "Sale",
        entityId: sale.id,
        description: `${DEMO_PREFIX}: venta registrada ${args.folio}`,
        metadata: {
          folio: args.folio,
          total,
          warehouseId: args.seller.warehouseId
        },
        createdAt: args.createdAt
      }
    });

    await tx.auditLog.create({
      data: {
        userId: args.seller.id,
        action: `${DEMO_PREFIX}_SALE_CREATED`,
        tableName: "Sale",
        recordId: args.folio,
        newData: {
          saleId: sale.id,
          total,
          items: items.map((item) => ({ sku: item.product.sku, quantity: item.quantity }))
        },
        createdAt: args.createdAt
      }
    });

    return {
      id: sale.id,
      folio: sale.folio,
      cashierId: sale.cashierId,
      warehouseId: sale.warehouseId ?? args.seller.warehouseId,
      createdAt: sale.createdAt,
      total,
      items: sale.items.map((saleItem) => ({
        id: saleItem.id,
        productId: saleItem.productId ?? "",
        productSku: saleItem.productSku,
        productName: saleItem.productName,
        quantity: saleItem.quantity,
        unitPrice: Number(saleItem.unitPrice),
        unitCost: Number(saleItem.unitCost),
        promoPercent: Number(saleItem.promoPercent),
        discount: Number(saleItem.discount),
        total: Number(saleItem.total),
        grossProfit: Number(saleItem.grossProfit)
      }))
    };
  });
}

async function createReturnForSale(args: {
  adminId: string;
  sale: CreatedSaleForReturn;
  createdAt: Date;
  random: () => number;
}) {
  const item = pick(args.random, args.sale.items.filter((saleItem) => saleItem.quantity > 0));
  const quantity = intBetween(args.random, 1, Math.max(1, Math.min(item.quantity, 2)));
  const total = money((item.total / item.quantity) * quantity);
  const grossProfit = money((item.grossProfit / item.quantity) * quantity);
  const refundMethod = weightedPick(args.random, [
    { item: PaymentMethod.CASH, weight: 80 },
    { item: PaymentMethod.CARD, weight: 12 },
    { item: PaymentMethod.TRANSFER, weight: 8 }
  ]);

  await prisma.$transaction(async (tx) => {
    const request = await tx.saleAdjustmentRequest.create({
      data: {
        type: SaleAdjustmentRequestType.RETURN_ITEMS,
        status: SaleAdjustmentRequestStatus.APPROVED,
        saleId: args.sale.id,
        requestedById: args.sale.cashierId,
        reviewedById: args.adminId,
        reason: `${DEMO_PREFIX}: devolución solicitada por cliente`,
        reviewNote: "Aprobada por simulación demo",
        refundMethod,
        createdAt: new Date(args.createdAt.getTime() - 90 * 60 * 1000),
        updatedAt: args.createdAt,
        reviewedAt: new Date(args.createdAt.getTime() - 30 * 60 * 1000),
        items: {
          create: {
            saleItemId: item.id,
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            quantity
          }
        }
      }
    });

    const saleReturn = await tx.saleReturn.create({
      data: {
        saleId: args.sale.id,
        cashierId: args.adminId,
        reason: `${DEMO_PREFIX}: devolución aprobada ${request.id}`,
        refundMethod,
        refundTotal: total,
        createdAt: args.createdAt,
        updatedAt: args.createdAt,
        items: {
          create: {
            saleItemId: item.id,
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            quantity,
            unitPrice: item.unitPrice,
            unitCost: item.unitCost,
            promoPercent: item.promoPercent,
            discount: money((item.discount / item.quantity) * quantity),
            total,
            grossProfit
          }
        }
      }
    });

    const returnedAllItems = args.sale.items.every((saleItem) => (
      saleItem.id === item.id ? quantity >= saleItem.quantity : false
    ));

    await tx.sale.update({
      where: { id: args.sale.id },
      data: {
        status: returnedAllItems ? SaleStatus.REFUNDED : SaleStatus.PARTIALLY_REFUNDED,
        updatedAt: args.createdAt
      }
    });

    await adjustBalance(tx, {
      productId: item.productId,
      warehouseId: args.sale.warehouseId,
      delta: quantity
    });

    await tx.inventoryMovement.create({
      data: {
        productId: item.productId,
        productSku: item.productSku,
        productName: item.productName,
        warehouseId: args.sale.warehouseId,
        type: InventoryType.RETURN,
        quantity,
        reason: `${DEMO_PREFIX}: devolución ${saleReturn.id}`,
        reasonType: InventoryReasonType.OTHER,
        unitCostAtMovement: item.unitCost,
        costAmount: money(item.unitCost * quantity),
        createdBy: args.adminId,
        createdAt: args.createdAt
      }
    });

    await tx.auditLog.create({
      data: {
        userId: args.adminId,
        action: `${DEMO_PREFIX}_SALE_RETURN_APPROVED`,
        tableName: "SaleReturn",
        recordId: saleReturn.id,
        newData: {
          folio: args.sale.folio,
          refundTotal: total,
          productSku: item.productSku,
          quantity
        },
        createdAt: args.createdAt
      }
    });
  });
}

async function createCancelledSaleRequest(args: {
  adminId: string;
  sale: CreatedSaleForReturn;
  createdAt: Date;
}) {
  await prisma.$transaction(async (tx) => {
    await tx.saleAdjustmentRequest.create({
      data: {
        type: SaleAdjustmentRequestType.CANCEL_SALE,
        status: SaleAdjustmentRequestStatus.APPROVED,
        saleId: args.sale.id,
        requestedById: args.sale.cashierId,
        reviewedById: args.adminId,
        reason: `${DEMO_PREFIX}: cancelación por captura duplicada`,
        reviewNote: "Cancelada por simulación demo",
        createdAt: new Date(args.createdAt.getTime() - 120 * 60 * 1000),
        updatedAt: args.createdAt,
        reviewedAt: new Date(args.createdAt.getTime() - 30 * 60 * 1000)
      }
    });

    await tx.sale.update({
      where: { id: args.sale.id },
      data: {
        status: SaleStatus.CANCELLED,
        updatedAt: args.createdAt
      }
    });

    for (const item of args.sale.items) {
      await adjustBalance(tx, {
        productId: item.productId,
        warehouseId: args.sale.warehouseId,
        delta: item.quantity
      });

      await tx.inventoryMovement.create({
        data: {
          productId: item.productId,
          productSku: item.productSku,
          productName: item.productName,
          warehouseId: args.sale.warehouseId,
          type: InventoryType.RETURN,
          quantity: item.quantity,
          reason: `${DEMO_PREFIX}: cancelación de venta ${args.sale.folio}`,
          reasonType: InventoryReasonType.OTHER,
          unitCostAtMovement: item.unitCost,
          costAmount: money(item.unitCost * item.quantity),
          createdBy: args.adminId,
          createdAt: args.createdAt
        }
      });
    }
  });
}

async function createPendingAndRejectedAdjustments(args: {
  adminId: string;
  sales: CreatedSaleForReturn[];
  endDate: Date;
}) {
  const candidates = args.sales.slice(-8).filter((sale) => sale.items.length > 0);

  for (const [index, sale] of candidates.entries()) {
    const item = sale.items[0];
    const status = index % 2 === 0
      ? SaleAdjustmentRequestStatus.PENDING
      : SaleAdjustmentRequestStatus.REJECTED;
    const createdAt = addDays(args.endDate, -index - 1);

    await prisma.saleAdjustmentRequest.create({
      data: {
        type: SaleAdjustmentRequestType.RETURN_ITEMS,
        status,
        saleId: sale.id,
        requestedById: sale.cashierId,
        reviewedById: status === SaleAdjustmentRequestStatus.REJECTED ? args.adminId : null,
        reason: `${DEMO_PREFIX}: solicitud ${status === SaleAdjustmentRequestStatus.PENDING ? "pendiente" : "rechazada"} para pruebas`,
        reviewNote: status === SaleAdjustmentRequestStatus.REJECTED ? "Rechazada por validación demo" : null,
        refundMethod: PaymentMethod.CASH,
        createdAt,
        updatedAt: createdAt,
        reviewedAt: status === SaleAdjustmentRequestStatus.REJECTED ? new Date(createdAt.getTime() + 40 * 60 * 1000) : null,
        items: {
          create: {
            saleItemId: item.id,
            productId: item.productId,
            productSku: item.productSku,
            productName: item.productName,
            quantity: 1
          }
        }
      }
    });
  }
}

async function seedSales(args: {
  adminId: string;
  sellers: DemoSeller[];
  products: DemoProduct[];
  customers: DemoCustomer[];
  startDate: Date;
  days: number;
  random: () => number;
}) {
  const createdSales: CreatedSaleForReturn[] = [];

  for (let dayOffset = 0; dayOffset < args.days; dayOffset += 1) {
    const day = addDays(args.startDate, dayOffset);
    const daySales = isWeekend(day)
      ? intBetween(args.random, 11, 22)
      : intBetween(args.random, 5, 14);
    const dayNoise = args.random() < 0.08 ? -intBetween(args.random, 3, 6) : 0;
    const totalSales = Math.max(1, daySales + dayNoise);

    for (let saleIndex = 0; saleIndex < totalSales; saleIndex += 1) {
      const seller = weightedPick(args.random, [
        { item: args.sellers[0], weight: 38 },
        { item: args.sellers[1], weight: 34 },
        { item: args.sellers[2], weight: 28 }
      ]);
      const itemCount = intBetween(args.random, 1, 4);
      const products = [...args.products]
        .sort(() => args.random() - 0.5)
        .slice(0, itemCount);
      const folio = `${DEMO_PREFIX}-${day.toISOString().slice(0, 10).replace(/-/gu, "")}-${(saleIndex + 1).toString().padStart(3, "0")}-${seller.name.split(" ").at(-1)?.slice(0, 2).toUpperCase() ?? "VN"}`;

      const sale = await createSale({
        folio,
        seller,
        customer: args.random() < 0.45 ? pick(args.random, args.customers) : null,
        products,
        createdAt: randomDateAt(args.random, day),
        random: args.random
      });

      createdSales.push(sale);
    }
  }

  for (const sale of createdSales) {
    const ageInDays = Math.floor((Date.now() - sale.createdAt.getTime()) / 86400000);
    if (ageInDays <= 0) continue;

    if (args.random() < 0.055) {
      await createReturnForSale({
        adminId: args.adminId,
        sale,
        createdAt: addDays(sale.createdAt, intBetween(args.random, 1, Math.min(5, ageInDays))),
        random: args.random
      });
    } else if (args.random() < 0.012) {
      await createCancelledSaleRequest({
        adminId: args.adminId,
        sale,
        createdAt: addDays(sale.createdAt, intBetween(args.random, 0, Math.min(2, ageInDays)))
      });
    }
  }

  await createPendingAndRejectedAdjustments({
    adminId: args.adminId,
    sales: createdSales,
    endDate: addDays(args.startDate, args.days - 1)
  });

  return createdSales.length;
}

async function seedShrinkage(args: {
  adminId: string;
  products: DemoProduct[];
  storageWarehouses: DemoWarehouse[];
  sellerWarehouses: DemoSeller[];
  startDate: Date;
  days: number;
  random: () => number;
}) {
  let count = 0;

  for (let dayOffset = 2; dayOffset < args.days; dayOffset += intBetween(args.random, 3, 6)) {
    const day = addDays(args.startDate, dayOffset);
    const movementsForDay = intBetween(args.random, 1, 3);

    for (let index = 0; index < movementsForDay; index += 1) {
      const product = weightedPick(args.random, args.products.map((item, productIndex) => ({
        item,
        weight: productIndex <= 3 ? 3 : 1
      })));
      const sellerWarehouse = pick(args.random, args.sellerWarehouses);
      const warehouse = args.random() < 0.72
        ? pick(args.random, args.storageWarehouses)
        : { id: sellerWarehouse.warehouseId, name: sellerWarehouse.name };
      const quantity = intBetween(args.random, 1, product.salePrice > 40 ? 3 : 8);
      const createdAt = randomDateAt(args.random, day, 10, 18);

      await prisma.$transaction(async (tx) => {
        await adjustBalance(tx, {
          productId: product.id,
          warehouseId: warehouse.id,
          delta: -quantity
        });

        await tx.inventoryMovement.create({
          data: {
            productId: product.id,
            productSku: product.sku,
            productName: product.name,
            warehouseId: warehouse.id,
            type: InventoryType.OUT,
            quantity,
            reason: "Caducidad",
            reasonType: InventoryReasonType.EXPIRATION,
            unitCostAtMovement: product.costPrice,
            costAmount: money(product.costPrice * quantity),
            createdBy: args.adminId,
            createdAt
          }
        });

        await tx.auditLog.create({
          data: {
            userId: args.adminId,
            action: `${DEMO_PREFIX}_INVENTORY_EXPIRATION_OUT`,
            tableName: "InventoryMovement",
            recordId: `${DEMO_PREFIX}-EXP-${count.toString().padStart(4, "0")}`,
            newData: {
              sku: product.sku,
              quantity,
              warehouse: warehouse.name,
              costAmount: money(product.costPrice * quantity)
            },
            createdAt
          }
        });
      });

      count += 1;
    }
  }

  return count;
}

async function seedActivityNoise(args: {
  sellers: DemoSeller[];
  products: DemoProduct[];
  startDate: Date;
  days: number;
  random: () => number;
}) {
  for (let dayOffset = 0; dayOffset < args.days; dayOffset += 2) {
    const day = addDays(args.startDate, dayOffset);

    for (const seller of args.sellers) {
      await prisma.sellerActivityLog.createMany({
        data: [
          {
            sellerId: seller.id,
            action: SellerAction.SELLER_LOGIN,
            entityType: "Session",
            description: `${DEMO_PREFIX}: inicio de jornada`,
            metadata: { source: "demo-usage" },
            createdAt: randomDateAt(args.random, day, 7, 10)
          },
          {
            sellerId: seller.id,
            action: SellerAction.PRODUCT_VIEWED,
            entityType: "Product",
            entityId: pick(args.random, args.products).id,
            description: `${DEMO_PREFIX}: consulta de catálogo`,
            metadata: { source: "demo-usage" },
            createdAt: randomDateAt(args.random, day, 11, 19)
          }
        ]
      });
    }
  }
}

async function runSeed(options: CliOptions) {
  if (env.NODE_ENV === "production" && !options.forceProduction) {
    throw new Error("Este seed demo está bloqueado en producción. Usa --force-production solo en una base de QA controlada.");
  }

  if (options.resetDemo) {
    logger.info("Cleaning previous demo usage data");
    await cleanDemoData();
  } else {
    const existingDemoSales = await prisma.sale.count({
      where: { folio: { startsWith: `${DEMO_PREFIX}-` } }
    });

    if (existingDemoSales > 0) {
      throw new Error("Ya existen ventas demo. Vuelve a correr con --reset-demo para regenerar la simulación sin duplicados.");
    }
  }

  if (options.onlyClean) {
    logger.info("Demo usage data cleaned");
    return;
  }

  const random = createRandom(`${options.seed}:${options.days}`);
  const endDate = startOfLocalDay(new Date());
  const startDate = addDays(endDate, -(options.days - 1));

  const { admin, sellers } = await upsertUsers();
  const products = await upsertProducts();
  const { storageWarehouses, sellerWarehouses } = await upsertWarehouses(sellers);
  const customers = await upsertCustomers();

  await seedInitialStock({
    adminId: admin.id,
    products,
    storageWarehouses,
    sellerWarehouses,
    startDate
  });
  await seedTransfers({
    adminId: admin.id,
    sellers: sellerWarehouses,
    products,
    storageWarehouses,
    startDate,
    endDate,
    random
  });
  const salesCount = await seedSales({
    adminId: admin.id,
    sellers: sellerWarehouses,
    products,
    customers,
    startDate,
    days: options.days,
    random
  });
  const shrinkageCount = await seedShrinkage({
    adminId: admin.id,
    products,
    storageWarehouses,
    sellerWarehouses,
    startDate,
    days: options.days,
    random
  });
  await seedActivityNoise({
    sellers: sellerWarehouses,
    products,
    startDate,
    days: options.days,
    random
  });

  logger.info("Demo usage seed completed", {
    days: options.days,
    seed: options.seed,
    salesCount,
    shrinkageCount,
    adminEmail: admin.email,
    sellerEmails: sellers.map((seller) => seller.email),
    demoPassword: DEMO_PASSWORD
  });
}

const options = parseArgs(process.argv.slice(2));

runSeed(options)
  .catch((error) => {
    logger.error("Demo usage seed failed", { error });
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

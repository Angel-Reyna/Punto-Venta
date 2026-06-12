import {
  InventoryReasonType,
  InventoryTransferRequestStatus,
  PrismaClient,
  SaleAdjustmentRequestStatus,
  SaleStatus,
  WarehouseType
} from "@prisma/client";

import { env } from "../config/env";
import { logger } from "../utils/logger";

const prisma = new PrismaClient();

const DEMO_PREFIX = "DEMO";
const DEMO_EMAIL_DOMAIN = "demo.puntaventa.local";
const DEFAULT_DAYS = 60;

type CliOptions = {
  days: number;
  minSales: number;
  json: boolean;
  forceProduction: boolean;
};

type CheckStatus = "pass" | "fail";

type CheckResult = {
  name: string;
  status: CheckStatus;
  message: string;
  observed?: number | string;
  expected?: number | string;
};

type GroupCount<TStatus extends string> = {
  status: TStatus;
  _count: {
    _all: number;
  };
};

type DemoValidationSummary = {
  period: {
    days: number;
    from: string;
    to: string;
  };
  totals: Record<string, number>;
  saleStatuses: Partial<Record<SaleStatus, number>>;
  transferRequestStatuses: Partial<Record<InventoryTransferRequestStatus, number>>;
  adjustmentRequestStatuses: Partial<Record<SaleAdjustmentRequestStatus, number>>;
  checks: CheckResult[];
};

function readFlagValue(args: string[], index: number, flag: string) {
  const current = args[index];

  if (current.includes("=")) {
    return current.split("=").slice(1).join("=");
  }

  const next = args[index + 1];
  if (!next || next.startsWith("--")) {
    throw new Error(`El argumento ${flag} requiere un valor`);
  }

  return next;
}

function parsePositiveInteger(value: string, flag: string) {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`El argumento ${flag} debe ser un entero positivo`);
  }

  return parsed;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  let days = DEFAULT_DAYS;
  let minSales: number | null = null;
  let json = false;
  let forceProduction = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === "--json") {
      json = true;
      continue;
    }

    if (arg === "--force-production") {
      forceProduction = true;
      continue;
    }

    if (arg === "--days" || arg.startsWith("--days=")) {
      days = parsePositiveInteger(readFlagValue(args, index, "--days"), "--days");
      if (arg === "--days") index += 1;
      continue;
    }

    if (arg === "--min-sales" || arg.startsWith("--min-sales=")) {
      minSales = parsePositiveInteger(readFlagValue(args, index, "--min-sales"), "--min-sales");
      if (arg === "--min-sales") index += 1;
      continue;
    }

    throw new Error(`Argumento no soportado: ${arg}`);
  }

  return {
    days,
    minSales: minSales ?? Math.max(30, days * 2),
    json,
    forceProduction
  };
}

function startOfDay(date: Date) {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function formatDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function countByStatus<TStatus extends string>(items: Array<GroupCount<TStatus>>) {
  return items.reduce<Partial<Record<TStatus, number>>>((acc, item) => {
    acc[item.status] = item._count._all;
    return acc;
  }, {});
}

function countFor<TStatus extends string>(counts: Partial<Record<TStatus, number>>, status: TStatus) {
  return counts[status] ?? 0;
}

function createCheck(args: {
  name: string;
  ok: boolean;
  message: string;
  observed?: number | string;
  expected?: number | string;
}): CheckResult {
  return {
    name: args.name,
    status: args.ok ? "pass" : "fail",
    message: args.message,
    observed: args.observed,
    expected: args.expected
  };
}

function printSummary(summary: DemoValidationSummary) {
  console.log("Punta Venta — validación de datos demo");
  console.log(`Periodo: ${summary.period.from} a ${summary.period.to} (${summary.period.days} días)`);
  console.log("");

  console.log("Totales:");
  for (const [label, value] of Object.entries(summary.totals)) {
    console.log(`- ${label}: ${value}`);
  }

  console.log("");
  console.log("Validaciones:");
  for (const check of summary.checks) {
    const marker = check.status === "pass" ? "OK" : "FALLA";
    const details = [
      check.observed !== undefined ? `observado=${check.observed}` : null,
      check.expected !== undefined ? `esperado=${check.expected}` : null
    ]
      .filter(Boolean)
      .join(", ");
    console.log(`- [${marker}] ${check.name}: ${check.message}${details ? ` (${details})` : ""}`);
  }
}

async function buildSummary(options: CliOptions): Promise<DemoValidationSummary> {
  const to = new Date();
  const from = addDays(startOfDay(to), -(options.days - 1));

  const demoUserWhere = {
    email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` }
  };
  const demoProductWhere = {
    sku: { startsWith: `${DEMO_PREFIX}-` }
  };
  const demoSaleWhere = {
    folio: { startsWith: `${DEMO_PREFIX}-` },
    createdAt: { gte: from, lte: to }
  };
  const demoInventoryMovementWhere = {
    productSku: { startsWith: `${DEMO_PREFIX}-` },
    createdAt: { gte: from, lte: to }
  };
  const demoReasonWhere = {
    reason: { startsWith: `${DEMO_PREFIX}:` }
  };

  const [
    demoUsers,
    demoSellers,
    demoProducts,
    demoCustomers,
    storageWarehouses,
    sellerWarehouses,
    sales,
    saleItems,
    payments,
    returns,
    expirationMovements,
    damageMovements,
    inventoryMovements,
    transferRequests,
    adjustmentRequests,
    auditLogs,
    sellerActivityLogs,
    saleStatusesRaw,
    transferStatusesRaw,
    adjustmentStatusesRaw,
    negativeBalances,
    salesWithoutItems,
    salesWithoutPayments,
    salesWithoutWarehouse,
    shrinkageSum
  ] = await Promise.all([
    prisma.user.count({ where: demoUserWhere }),
    prisma.user.count({ where: { ...demoUserWhere, role: "CASHIER" } }),
    prisma.product.count({ where: demoProductWhere }),
    prisma.customer.count({ where: { email: { endsWith: `@${DEMO_EMAIL_DOMAIN}` } } }),
    prisma.warehouse.count({ where: { name: { in: ["Almacén Principal", "Almacén Norte"] }, type: WarehouseType.STORAGE } }),
    prisma.warehouse.count({ where: { name: { startsWith: "Stock de " }, seller: demoUserWhere, type: WarehouseType.SELLER } }),
    prisma.sale.count({ where: demoSaleWhere }),
    prisma.saleItem.count({ where: { sale: demoSaleWhere } }),
    prisma.payment.count({ where: { sale: demoSaleWhere } }),
    prisma.saleReturn.count({ where: { sale: demoSaleWhere } }),
    prisma.inventoryMovement.count({
      where: {
        ...demoInventoryMovementWhere,
        reasonType: InventoryReasonType.EXPIRATION
      }
    }),
    prisma.inventoryMovement.count({
      where: {
        ...demoInventoryMovementWhere,
        reasonType: InventoryReasonType.DAMAGE
      }
    }),
    prisma.inventoryMovement.count({ where: demoInventoryMovementWhere }),
    prisma.inventoryTransferRequest.count({ where: { ...demoReasonWhere, createdAt: { gte: from, lte: to } } }),
    prisma.saleAdjustmentRequest.count({ where: { ...demoReasonWhere, createdAt: { gte: from, lte: to } } }),
    prisma.auditLog.count({ where: { action: { startsWith: `${DEMO_PREFIX}_` }, createdAt: { gte: from, lte: to } } }),
    prisma.sellerActivityLog.count({ where: { description: { startsWith: `${DEMO_PREFIX}:` }, createdAt: { gte: from, lte: to } } }),
    prisma.sale.groupBy({
      by: ["status"],
      where: demoSaleWhere,
      _count: { _all: true }
    }),
    prisma.inventoryTransferRequest.groupBy({
      by: ["status"],
      where: { ...demoReasonWhere, createdAt: { gte: from, lte: to } },
      _count: { _all: true }
    }),
    prisma.saleAdjustmentRequest.groupBy({
      by: ["status"],
      where: { ...demoReasonWhere, createdAt: { gte: from, lte: to } },
      _count: { _all: true }
    }),
    prisma.inventoryBalance.count({
      where: {
        quantity: { lt: 0 },
        product: demoProductWhere,
        warehouse: {
          OR: [
            { name: { in: ["Almacén Principal", "Almacén Norte"] } },
            { seller: demoUserWhere }
          ]
        }
      }
    }),
    prisma.sale.count({ where: { ...demoSaleWhere, items: { none: {} } } }),
    prisma.sale.count({ where: { ...demoSaleWhere, payments: { none: {} } } }),
    prisma.sale.count({ where: { ...demoSaleWhere, warehouseId: null } }),
    prisma.inventoryMovement.aggregate({
      where: {
        ...demoInventoryMovementWhere,
        reasonType: { in: [InventoryReasonType.EXPIRATION, InventoryReasonType.DAMAGE] }
      },
      _sum: { costAmount: true }
    })
  ]);

  const saleStatuses = countByStatus(saleStatusesRaw);
  const transferRequestStatuses = countByStatus(transferStatusesRaw);
  const adjustmentRequestStatuses = countByStatus(adjustmentStatusesRaw);
  const shrinkageAmount = Number(shrinkageSum._sum.costAmount ?? 0);

  const totals = {
    demoUsers,
    demoSellers,
    demoProducts,
    demoCustomers,
    storageWarehouses,
    sellerWarehouses,
    sales,
    saleItems,
    payments,
    returns,
    expirationMovements,
    damageMovements,
    inventoryMovements,
    transferRequests,
    adjustmentRequests,
    auditLogs,
    sellerActivityLogs,
    shrinkageAmount,
    negativeBalances,
    salesWithoutItems,
    salesWithoutPayments,
    salesWithoutWarehouse
  };

  const checks = [
    createCheck({
      name: "usuarios demo",
      ok: demoUsers >= 4 && demoSellers >= 3,
      message: "Debe existir un admin demo y tres vendedores demo.",
      observed: `${demoUsers} usuarios, ${demoSellers} vendedores`,
      expected: "mínimo 4 usuarios y 3 vendedores"
    }),
    createCheck({
      name: "catálogo demo",
      ok: demoProducts >= 10,
      message: "Debe existir catálogo suficiente para tickets mixtos y Pareto de merma.",
      observed: demoProducts,
      expected: ">= 10"
    }),
    createCheck({
      name: "almacenes demo",
      ok: storageWarehouses >= 2 && sellerWarehouses >= 3,
      message: "Debe haber almacenes centrales y stock asignado a vendedores.",
      observed: `${storageWarehouses} centrales, ${sellerWarehouses} de vendedor`,
      expected: ">= 2 centrales y >= 3 vendedor"
    }),
    createCheck({
      name: "volumen de ventas",
      ok: sales >= options.minSales,
      message: "Debe haber ventas suficientes para reportes y gráficas.",
      observed: sales,
      expected: `>= ${options.minSales}`
    }),
    createCheck({
      name: "ventas completadas",
      ok: countFor(saleStatuses, SaleStatus.COMPLETED) > 0,
      message: "Debe haber ventas completadas para venta neta y actividad.",
      observed: countFor(saleStatuses, SaleStatus.COMPLETED),
      expected: "> 0"
    }),
    createCheck({
      name: "ventas con devolución o cancelación",
      ok:
        countFor(saleStatuses, SaleStatus.PARTIALLY_REFUNDED) +
          countFor(saleStatuses, SaleStatus.REFUNDED) +
          countFor(saleStatuses, SaleStatus.CANCELLED) >
        0,
      message: "Debe haber ajustes aprobados para probar utilidad neta y reposición de stock.",
      observed:
        countFor(saleStatuses, SaleStatus.PARTIALLY_REFUNDED) +
        countFor(saleStatuses, SaleStatus.REFUNDED) +
        countFor(saleStatuses, SaleStatus.CANCELLED),
      expected: "> 0"
    }),
    createCheck({
      name: "tickets completos",
      ok: saleItems >= sales && payments >= sales && salesWithoutItems === 0 && salesWithoutPayments === 0,
      message: "Toda venta demo debe tener partidas y pago.",
      observed: `${saleItems} partidas, ${payments} pagos, ${salesWithoutItems} sin partidas, ${salesWithoutPayments} sin pagos`,
      expected: "sin ventas incompletas"
    }),
    createCheck({
      name: "almacén de salida en ventas",
      ok: salesWithoutWarehouse === 0,
      message: "Toda venta demo debe conservar el almacén de salida para devoluciones y reportes.",
      observed: salesWithoutWarehouse,
      expected: "0"
    }),
    createCheck({
      name: "retiros de inventario",
      ok:
        transferRequests > 0 &&
        countFor(transferRequestStatuses, InventoryTransferRequestStatus.APPROVED) > 0 &&
        countFor(transferRequestStatuses, InventoryTransferRequestStatus.PENDING) > 0,
      message: "Debe haber transferencias aprobadas y bandeja pendiente para probar inventario.",
      observed: `${transferRequests} solicitudes`,
      expected: "aprobadas y pendientes"
    }),
    createCheck({
      name: "ajustes de ventas",
      ok:
        adjustmentRequests > 0 &&
        countFor(adjustmentRequestStatuses, SaleAdjustmentRequestStatus.APPROVED) > 0 &&
        countFor(adjustmentRequestStatuses, SaleAdjustmentRequestStatus.PENDING) > 0,
      message: "Debe haber solicitudes aprobadas y pendientes para probar devoluciones/cancelaciones.",
      observed: `${adjustmentRequests} solicitudes`,
      expected: "aprobadas y pendientes"
    }),
    createCheck({
      name: "merma por caducidad y daños",
      ok: expirationMovements > 0 && damageMovements > 0 && shrinkageAmount > 0,
      message: "Debe existir merma por caducidad y daños para reportes de utilidad operativa y Pareto.",
      observed: `${expirationMovements} caducidad, ${damageMovements} daños, ${shrinkageAmount.toFixed(2)} costo`,
      expected: "> 0 en ambos motivos"
    }),
    createCheck({
      name: "auditoría demo",
      ok: auditLogs > 0,
      message: "Debe existir auditoría operativa para filtros y trazabilidad.",
      observed: auditLogs,
      expected: "> 0"
    }),
    createCheck({
      name: "actividad de vendedores",
      ok: sellerActivityLogs > 0,
      message: "Debe existir actividad para señales operativas por vendedor.",
      observed: sellerActivityLogs,
      expected: "> 0"
    }),
    createCheck({
      name: "inventario no negativo",
      ok: negativeBalances === 0,
      message: "La simulación no debe producir saldos negativos.",
      observed: negativeBalances,
      expected: "0"
    })
  ];

  return {
    period: {
      days: options.days,
      from: formatDate(from),
      to: formatDate(to)
    },
    totals,
    saleStatuses,
    transferRequestStatuses,
    adjustmentRequestStatuses,
    checks
  };
}

async function main() {
  const options = parseArgs();

  if (env.NODE_ENV === "production" && !options.forceProduction) {
    throw new Error("La validación demo está bloqueada en production. Usa --force-production solo si sabes exactamente lo que haces.");
  }

  const summary = await buildSummary(options);
  const failures = summary.checks.filter((check) => check.status === "fail");

  if (options.json) {
    console.log(JSON.stringify(summary, null, 2));
  } else {
    printSummary(summary);
  }

  if (failures.length > 0) {
    process.exitCode = 1;
    logger.error("Demo usage validation failed", {
      failedChecks: failures.map((check) => check.name)
    });
    return;
  }

  logger.info("Demo usage validation passed", {
    sales: summary.totals.sales,
    inventoryMovements: summary.totals.inventoryMovements,
    auditLogs: summary.totals.auditLogs
  });
}

main()
  .catch((error: unknown) => {
    logger.error("Demo usage validation crashed", { error });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

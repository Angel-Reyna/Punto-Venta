import { SaleStatus } from "@prisma/client";

import { prisma } from "../../config/prisma";
import { AppError } from "../../utils/AppError";
import { buildProfitSummary, roundMoney, toMoney } from "./reports.shared";
import type { ReportDateRange, SalesReport } from "./reports.shared";

export { getOperationsReport } from "./reports.operations";
export type {
  OperationsReport,
  ReportDateRange,
  ReportPerson,
  SalesReport,
  SerializedPayment
} from "./reports.shared";

const DATE_ONLY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const MAX_REPORT_RANGE_DAYS = 366;

function parseDateOnly(value: unknown, fieldName: string) {
  if (typeof value !== "string" || !DATE_ONLY_PATTERN.test(value)) {
    throw new AppError(
      400,
      `${fieldName} debe tener formato YYYY-MM-DD`
    );
  }

  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  if (
    date.getUTCFullYear() !== year ||
    date.getUTCMonth() !== month - 1 ||
    date.getUTCDate() !== day
  ) {
    throw new AppError(400, `${fieldName} no es una fecha válida`);
  }

  return {
    year,
    month,
    day,
    label: value
  };
}

export function parseReportDateRange(from?: unknown, to?: unknown): ReportDateRange {
  if (!from || !to) {
    throw new AppError(400, "Debes enviar fecha inicial y fecha final");
  }

  const fromDate = parseDateOnly(from, "La fecha inicial");
  const toDate = parseDateOnly(to, "La fecha final");

  const start = new Date(
    Date.UTC(fromDate.year, fromDate.month - 1, fromDate.day, 0, 0, 0, 0)
  );
  const end = new Date(
    Date.UTC(toDate.year, toDate.month - 1, toDate.day, 23, 59, 59, 999)
  );

  if (start > end) {
    throw new AppError(
      400,
      "La fecha inicial no puede ser mayor que la fecha final"
    );
  }

  const rangeDays = Math.ceil(
    (end.getTime() - start.getTime() + 1) / (24 * 60 * 60 * 1000)
  );

  if (rangeDays > MAX_REPORT_RANGE_DAYS) {
    throw new AppError(
      400,
      `El rango máximo permitido para reportes es de ${MAX_REPORT_RANGE_DAYS} días`
    );
  }

  return {
    start,
    end,
    fromLabel: fromDate.label,
    toLabel: toDate.label
  };
}

export async function getSalesReport(range: ReportDateRange): Promise<SalesReport> {
  const sales = await prisma.sale.findMany({
    where: {
      status: {
        not: SaleStatus.CANCELLED
      },
      createdAt: {
        gte: range.start,
        lte: range.end
      }
    },
    include: {
      cashier: {
        select: {
          id: true,
          name: true,
          email: true
        }
      },
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
          email: true
        }
      },
      items: {
        include: {
          product: {
            select: {
              id: true,
              sku: true,
              name: true
            }
          }
        }
      },
      returns: {
        include: {
          items: true
        }
      },
      payments: true
    },
    orderBy: {
      createdAt: "desc"
    }
  });

  const returnedItems = sales.flatMap((sale) =>
    sale.returns.flatMap((saleReturn) => saleReturn.items)
  );
  const refundedTotal = roundMoney(
    sales
      .flatMap((sale) => sale.returns)
      .reduce((sum, saleReturn) => sum + Number(saleReturn.refundTotal), 0)
  );

  const subtotal = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.subtotal), 0)
  );
  const discount = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.discount), 0)
  );
  const tax = roundMoney(sales.reduce((sum, sale) => sum + Number(sale.tax), 0));
  const total = roundMoney(
    sales.reduce((sum, sale) => sum + Number(sale.total), 0)
  );
  const netTotal = roundMoney(total - refundedTotal);

  const paymentSummary = sales
    .flatMap((sale) => sale.payments)
    .reduce<Record<string, number>>((summary, payment) => {
      summary[payment.method] = roundMoney(
        (summary[payment.method] ?? 0) + Number(payment.amount)
      );

      return summary;
    }, {});

  const soldCost = roundMoney(
    sales
      .flatMap((sale) => sale.items)
      .reduce((sum, item) => sum + Number(item.unitCost ?? 0) * item.quantity, 0)
  );
  const soldProfit = roundMoney(
    sales
      .flatMap((sale) => sale.items)
      .reduce((sum, item) => sum + Number(item.grossProfit ?? 0), 0)
  );
  const refundSummary = sales
    .flatMap((sale) => sale.returns)
    .reduce<Record<string, number>>((summary, saleReturn) => {
      summary[saleReturn.refundMethod] = roundMoney(
        (summary[saleReturn.refundMethod] ?? 0) + Number(saleReturn.refundTotal)
      );

      return summary;
    }, {});

  const netPaymentSummary = { ...paymentSummary };

  for (const [method, amount] of Object.entries(refundSummary)) {
    netPaymentSummary[method] = roundMoney((netPaymentSummary[method] ?? 0) - amount);
  }

  const returnedCost = roundMoney(
    returnedItems.reduce(
      (sum, item) => sum + Number(item.unitCost ?? 0) * item.quantity,
      0
    )
  );
  const returnedProfit = roundMoney(
    returnedItems.reduce((sum, item) => sum + Number(item.grossProfit ?? 0), 0)
  );

  return {
    from: range.start,
    to: range.end,
    fromLabel: range.fromLabel,
    toLabel: range.toLabel,
    count: sales.length,
    subtotal,
    discount,
    tax,
    total,
    grossTotal: total,
    refundedTotal,
    netTotal,
    paymentSummary,
    refundSummary,
    netPaymentSummary,
    profit: buildProfitSummary({
      grossCost: soldCost,
      returnedCost,
      grossProfit: soldProfit,
      returnedProfit,
      netSales: netTotal
    }),
    sales: sales.map((sale) => ({
      ...sale,
      subtotal: toMoney(sale.subtotal),
      discount: toMoney(sale.discount),
      tax: toMoney(sale.tax),
      total: toMoney(sale.total),
      items: sale.items.map((item) => ({
        ...item,
        unitPrice: toMoney(item.unitPrice),
        unitCost: toMoney(item.unitCost),
        promoPercent: toMoney(item.promoPercent),
        discount: toMoney(item.discount),
        total: toMoney(item.total),
        grossProfit: toMoney(item.grossProfit)
      })),
      payments: sale.payments.map((payment) => ({
        ...payment,
        amount: toMoney(payment.amount)
      }))
    }))
  };
}

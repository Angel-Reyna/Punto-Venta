export type ReportDateRange = {
  start: Date;
  end: Date;
  fromLabel: string;
  toLabel: string;
};

export type ReportPerson = {
  id: string;
  name: string;
  email: string;
};

export type SerializedPayment = {
  id: string;
  method: string;
  amount: number;
  createdAt?: Date;
};

export type SalesReport = {
  from: Date;
  to: Date;
  fromLabel: string;
  toLabel: string;
  count: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  grossTotal: number;
  refundedTotal: number;
  netTotal: number;
  paymentSummary: Record<string, number>;
  refundSummary: Record<string, number>;
  netPaymentSummary: Record<string, number>;
  profit: ProfitSummary;
  sales: Array<Record<string, unknown>>;
};

export type ProfitSummary = {
  grossCost: number;
  returnedCost: number;
  netCost: number;
  grossProfit: number;
  returnedProfit: number;
  netProfit: number;
  shrinkageCost: number;
  operatingProfit: number;
  marginPercent: number;
  operatingMarginPercent: number;
};

export type InventoryReportMovement = {
  id: string;
  type: string;
  reasonType: string;
  reason: string | null;
  quantity: number;
  unitCostAtMovement: number | null;
  costAmount: number | null;
  product: {
    id: string | null;
    sku: string;
    name: string;
  };
  warehouse: {
    id: string;
    name: string;
  } | null;
  createdAt: Date;
};

export type OperationsReport = {
  from: Date;
  to: Date;
  fromLabel: string;
  toLabel: string;
  sales: {
    count: number;
    activeCount: number;
    unitsSold: number;
    unitsReturned: number;
    unitsNet: number;
    unitsPerTransaction: number;
    byStatus: Record<string, number>;
    daily: Array<{
      date: string;
      count: number;
      gross: number;
      refunded: number;
      net: number;
      units: number;
    }>;
    gross: number;
    refunded: number;
    net: number;
    paymentSummary: Record<string, number>;
    profit: ProfitSummary;
    bySeller: Array<{
      seller: ReportPerson;
      count: number;
      gross: number;
      refunded: number;
      net: number;
    }>;
    recent: Array<{
      id: string;
      folio: string;
      status: string;
      total: number;
      createdAt: Date;
      cashier: ReportPerson;
      payments: Array<{
        id: string;
        method: string;
        amount: number;
      }>;
    }>;
  };
  returns: {
    count: number;
    total: number;
    byMethod: Record<string, number>;
    latest: Array<{
      id: string;
      saleId: string;
      cashierId: string;
      reason: string;
      refundMethod: string;
      refundTotal: number;
      createdAt: Date;
      updatedAt: Date;
      cashier: ReportPerson;
    }>;
  };
  inventory: {
    movements: {
      count: number;
      unitsIn: number;
      unitsOut: number;
      byType: Record<string, number>;
      byReasonType: Record<string, number>;
      latest: InventoryReportMovement[];
    };
    shrinkage: {
      totalUnits: number;
      totalCost: number;
      byProduct: Array<{
        product: {
          id: string;
          sku: string | null;
          name: string;
        };
        quantity: number;
        cost: number;
      }>;
      byWarehouse: Array<{
        warehouse: {
          id: string | null;
          name: string;
        };
        quantity: number;
        cost: number;
      }>;
      latest: InventoryReportMovement[];
    };
  };
  topProducts: Array<{
    product: {
      id: string;
      sku: string | null;
      name: string;
    };
    quantity: number;
    total: number;
    cost: number;
    grossProfit: number;
  }>;
};


export function buildProfitSummary(input: {
  grossCost: number;
  returnedCost: number;
  grossProfit: number;
  returnedProfit: number;
  netSales: number;
  shrinkageCost?: number;
}): ProfitSummary {
  const grossCost = roundMoney(input.grossCost);
  const returnedCost = roundMoney(input.returnedCost);
  const grossProfit = roundMoney(input.grossProfit);
  const returnedProfit = roundMoney(input.returnedProfit);
  const shrinkageCost = roundMoney(input.shrinkageCost ?? 0);
  const netCost = roundMoney(grossCost - returnedCost);
  const netProfit = roundMoney(grossProfit - returnedProfit);
  const operatingProfit = roundMoney(netProfit - shrinkageCost);
  const marginPercent =
    input.netSales <= 0 ? 0 : roundMoney((netProfit / input.netSales) * 100);
  const operatingMarginPercent =
    input.netSales <= 0 ? 0 : roundMoney((operatingProfit / input.netSales) * 100);

  return {
    grossCost,
    returnedCost,
    netCost,
    grossProfit,
    returnedProfit,
    netProfit,
    shrinkageCost,
    operatingProfit,
    marginPercent,
    operatingMarginPercent
  };
}

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toMoney(value: unknown) {
  return roundMoney(Number(value ?? 0));
}

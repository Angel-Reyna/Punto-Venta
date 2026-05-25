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
  paymentSummary: Record<string, number>;
  sales: Array<Record<string, unknown>>;
};

export type OperationsReport = {
  from: Date;
  to: Date;
  fromLabel: string;
  toLabel: string;
  sales: {
    count: number;
    byStatus: Record<string, number>;
    gross: number;
    refunded: number;
    net: number;
    paymentSummary: Record<string, number>;
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
  cashRegister: {
    sessions: Array<{
      id: string;
      status: string;
      openingAmount: number;
      expectedClosingAmount: number | null;
      closingAmount: number | null;
      difference: number | null;
      openedAt: Date;
      closedAt: Date | null;
      cashier: ReportPerson;
    }>;
    movements: {
      count: number;
      summary: Record<string, number>;
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
  }>;
};

export function roundMoney(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function toMoney(value: unknown) {
  return roundMoney(Number(value ?? 0));
}

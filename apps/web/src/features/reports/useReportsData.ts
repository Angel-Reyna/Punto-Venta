import { useMemo, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import {
  includesQuery,
  paymentMethodLabel,
  statusLabel,
  type OperationsReport
} from "./reportShared";
import { downloadOperationsReportPdf, fetchOperationsReport } from "./reportsApi";

export type ReportDatePreset = "today" | "last7" | "month" | "previousMonth";

function toDateInputValue(date: Date) {
  return date.toISOString().slice(0, 10);
}

function startOfCurrentMonth(referenceDate: Date) {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 1);
}

function endOfPreviousMonth(referenceDate: Date) {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth(), 0);
}

function startOfPreviousMonth(referenceDate: Date) {
  return new Date(referenceDate.getFullYear(), referenceDate.getMonth() - 1, 1);
}

function resolvePresetRange(preset: ReportDatePreset) {
  const today = new Date();

  if (preset === "last7") {
    const from = new Date(today);
    from.setDate(today.getDate() - 6);

    return {
      from: toDateInputValue(from),
      to: toDateInputValue(today)
    };
  }

  if (preset === "month") {
    return {
      from: toDateInputValue(startOfCurrentMonth(today)),
      to: toDateInputValue(today)
    };
  }

  if (preset === "previousMonth") {
    return {
      from: toDateInputValue(startOfPreviousMonth(today)),
      to: toDateInputValue(endOfPreviousMonth(today))
    };
  }

  const todayValue = toDateInputValue(today);

  return {
    from: todayValue,
    to: todayValue
  };
}

export function useReportsData() {
  const initialRange = resolvePresetRange("today");

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [data, setData] = useState<OperationsReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");

  const dateRangeIsInvalid = !from || !to || from > to;

  const periodLabel = data
    ? `${data.fromLabel ?? from} al ${data.toLabel ?? to}`
    : `${from || "—"} al ${to || "—"}`;

  const hasReportActivity = Boolean(
    data &&
      (data.sales.count > 0 ||
        data.returns.count > 0 ||
        data.cashRegister.movements.count > 0 ||
        data.cashRegister.sessions.length > 0)
  );

  const hasCashActivity = Boolean(
    data && (data.cashRegister.movements.count > 0 || data.cashRegister.sessions.length > 0)
  );

  const filteredSellers = useMemo(
    () =>
      data?.sales.bySeller.filter((item) =>
        includesQuery(
          [item.seller.name, item.seller.email, item.count, item.gross, item.refunded, item.net],
          search
        )
      ) ?? [],
    [data, search]
  );

  const filteredTopProducts = useMemo(
    () =>
      data?.topProducts.filter((item) =>
        includesQuery([item.product.sku, item.product.name, item.quantity, item.total], search)
      ) ?? [],
    [data, search]
  );

  const filteredRecentSales = useMemo(
    () =>
      data?.sales.recent.filter((sale) =>
        includesQuery(
          [
            sale.folio,
            sale.cashier.name,
            sale.cashier.email,
            statusLabel(sale.status),
            sale.total,
            sale.payments.map((payment) => paymentMethodLabel(payment.method)).join(" ")
          ],
          search
        )
      ) ?? [],
    [data, search]
  );

  const filteredReturns = useMemo(
    () =>
      data?.returns.latest.filter((saleReturn) =>
        includesQuery(
          [
            saleReturn.reason,
            saleReturn.cashier?.name,
            saleReturn.cashier?.email,
            paymentMethodLabel(saleReturn.refundMethod),
            saleReturn.refundTotal
          ],
          search
        )
      ) ?? [],
    [data, search]
  );

  const visibleResultsLabel = data
    ? `${filteredSellers.length} vendedores · ${filteredTopProducts.length} productos · ${filteredRecentSales.length} ventas · ${filteredReturns.length} devoluciones`
    : "Consulta un periodo para ver indicadores operativos";

  function applyPreset(preset: ReportDatePreset) {
    const nextRange = resolvePresetRange(preset);
    setFrom(nextRange.from);
    setTo(nextRange.to);
  }

  async function consult() {
    setError("");

    if (dateRangeIsInvalid) {
      setError("El rango de fechas no es válido.");
      return;
    }

    try {
      setIsLoading(true);
      setData(await fetchOperationsReport(from, to));
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo consultar el reporte operativo."));
    } finally {
      setIsLoading(false);
    }
  }

  async function downloadPdf() {
    setError("");

    if (dateRangeIsInvalid) {
      setError("El rango de fechas no es válido.");
      return;
    }

    try {
      setIsDownloadingPdf(true);
      await downloadOperationsReportPdf(from, to);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo descargar el PDF."));
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return {
    applyPreset,
    consult,
    data,
    dateRangeIsInvalid,
    downloadPdf,
    error,
    filteredRecentSales,
    filteredReturns,
    filteredSellers,
    filteredTopProducts,
    from,
    hasCashActivity,
    hasReportActivity,
    isDownloadingPdf,
    isLoading,
    periodLabel,
    search,
    setError,
    setFrom,
    setSearch,
    setTo,
    to,
    visibleResultsLabel
  };
}

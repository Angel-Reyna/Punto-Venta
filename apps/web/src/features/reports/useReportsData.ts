import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { getApiErrorMessage } from "../../utils/apiError";
import type { ReportDetailSection } from "./ReportsDetailSections";
import {
  includesQuery,
  paymentMethodLabel,
  statusLabel,
  type OperationsReport
} from "./reportShared";
import { downloadOperationsReportPdf, fetchOperationsReport } from "./reportsApi";

export type ReportDatePreset = "today" | "last7" | "month" | "previousMonth";

type SuccessfulReportQuery = {
  from: string;
  to: string;
};

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

function normalizePreset(value: string | null): ReportDatePreset {
  return value === "last7" || value === "month" || value === "previousMonth" || value === "today"
    ? value
    : "today";
}

function normalizeDetailSection(value: string | null): ReportDetailSection {
  return value === "productos" || value === "historial" || value === "devoluciones" || value === "vendedores"
    ? value
    : "vendedores";
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
  const [searchParams] = useSearchParams();
  const initialPreset = normalizePreset(searchParams.get("preset"));
  const initialDetailSection = normalizeDetailSection(searchParams.get("detail"));
  const initialRange = resolvePresetRange(initialPreset);
  const shouldAutoConsult = searchParams.has("preset");
  const didAutoConsultRef = useRef(false);

  const [from, setFrom] = useState(initialRange.from);
  const [to, setTo] = useState(initialRange.to);
  const [data, setData] = useState<OperationsReport | null>(null);
  const [lastSuccessfulReportQuery, setLastSuccessfulReportQuery] = useState<SuccessfulReportQuery | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState(searchParams.get("search") ?? "");

  const dateRangeIsInvalid = !from || !to || from > to;
  const reportQueryIsStale = Boolean(
    lastSuccessfulReportQuery &&
      (lastSuccessfulReportQuery.from !== from || lastSuccessfulReportQuery.to !== to)
  );
  const hasReportActivity = Boolean(
    data &&
      (data.sales.count > 0 ||
        data.returns.count > 0 ||
        (data.inventory?.movements.count ?? 0) > 0 ||
        (data.inventory?.shrinkage.totalUnits ?? 0) > 0)
  );
  const reportHasDownloadableData = Boolean(data && hasReportActivity);
  const canDownloadPdf =
    Boolean(lastSuccessfulReportQuery) &&
    reportHasDownloadableData &&
    !reportQueryIsStale &&
    !dateRangeIsInvalid;
  const pdfDownloadBlockedReason = dateRangeIsInvalid
    ? "Corrige el rango de fechas antes de descargar el PDF."
    : !lastSuccessfulReportQuery
      ? "Consulta un reporte con datos para habilitar la descarga del PDF."
      : reportQueryIsStale
        ? "Los filtros cambiaron. Consulta de nuevo para descargar el PDF actualizado."
        : !reportHasDownloadableData
          ? "Primero consulta un reporte con datos para descargar el PDF."
          : "";

  const periodLabel = data
    ? `${data.fromLabel ?? from} al ${data.toLabel ?? to}`
    : `${from || "—"} al ${to || "—"}`;


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
        includesQuery(
          [
            item.product.sku,
            item.product.name,
            item.quantity,
            item.total,
            item.cost,
            item.grossProfit
          ],
          search
        )
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

  const consult = useCallback(async (options: { preserveSearch?: boolean } = {}) => {
    setError("");

    if (dateRangeIsInvalid) {
      setError("El rango de fechas no es válido.");
      return;
    }

    try {
      setIsLoading(true);
      const nextData = await fetchOperationsReport(from, to);

      setData(nextData);
      setLastSuccessfulReportQuery({ from, to });
      if (!options.preserveSearch) {
        setSearch("");
      }
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo consultar el reporte operativo."));
    } finally {
      setIsLoading(false);
    }
  }, [dateRangeIsInvalid, from, to]);


  useEffect(() => {
    if (didAutoConsultRef.current || !shouldAutoConsult || dateRangeIsInvalid) {
      return;
    }

    didAutoConsultRef.current = true;
    void consult({ preserveSearch: true });
  }, [consult, dateRangeIsInvalid, shouldAutoConsult]);

  async function downloadPdf() {
    setError("");

    if (dateRangeIsInvalid) {
      setError("El rango de fechas no es válido.");
      return;
    }

    if (!lastSuccessfulReportQuery) {
      setError("Consulta un reporte con datos antes de descargar el PDF.");
      return;
    }

    if (!reportHasDownloadableData) {
      setError("Primero consulta un reporte con datos para descargar el PDF.");
      return;
    }

    if (reportQueryIsStale) {
      setError("Los filtros cambiaron. Consulta de nuevo antes de descargar el PDF.");
      return;
    }

    try {
      setIsDownloadingPdf(true);
      await downloadOperationsReportPdf(lastSuccessfulReportQuery.from, lastSuccessfulReportQuery.to);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo descargar el PDF."));
    } finally {
      setIsDownloadingPdf(false);
    }
  }

  return {
    applyPreset,
    canDownloadPdf,
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
    hasReportActivity,
    initialDetailSection,
    isDownloadingPdf,
    isLoading,
    pdfDownloadBlockedReason,
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

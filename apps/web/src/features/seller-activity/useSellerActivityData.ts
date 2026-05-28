import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import { fetchSellerActivity, fetchSellerUsers } from "./sellerActivityApi";
import {
  DEFAULT_SELLER_ACTIVITY_LIMIT,
  SELLER_ACTIVITY_AUTO_REFRESH_INTERVAL_MS,
  filtersAreInvalid,
  formatRelativeLastUpdated,
  getActionLabel,
  getDateRangeLabel,
  matchesSearch,
  type Seller,
  type SellerActivityFilters,
  type SellerActivityLog,
  type SummaryItem,
  summarizeActivity,
  toDateInputValue,
} from "./sellerActivityShared";

export function useSellerActivityData() {
  const today = useMemo(() => toDateInputValue(new Date()), []);
  const hasLoadedInitialActivity = useRef(false);

  const [rows, setRows] = useState<SellerActivityLog[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [summary, setSummary] = useState<SummaryItem[]>([]);

  const [sellerId, setSellerId] = useState("");
  const [action, setAction] = useState("");
  const [from, setFrom] = useState(today);
  const [to, setTo] = useState(today);
  const [limit, setLimit] = useState(DEFAULT_SELLER_ACTIVITY_LIMIT);
  const [search, setSearch] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [isAutoRefreshPaused, setIsAutoRefreshPaused] = useState(false);
  const [lastLoadedAt, setLastLoadedAt] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());
  const [error, setError] = useState("");

  const currentFilters = useMemo<SellerActivityFilters>(
    () => ({ sellerId, action, from, to, limit }),
    [action, from, limit, sellerId, to],
  );

  const loadSellers = useCallback(async () => {
    try {
      setSellers(await fetchSellerUsers());
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar la lista de vendedores."));
    }
  }, []);

  const loadActivity = useCallback(
    async (filters: SellerActivityFilters = currentFilters) => {
      setError("");

      if (filtersAreInvalid(filters)) {
        setError("Revisa el rango de fechas y usa un límite entre 1 y 500.");
        return;
      }

      try {
        setIsLoading(true);
        const data = await fetchSellerActivity(filters);

        setRows(data.rows);
        setSummary(data.summary);
        setLastLoadedAt(new Date());
        setNow(new Date());
      } catch (err) {
        setError(getApiErrorMessage(err, "No se pudo cargar el historial de vendedores."));
      } finally {
        setIsLoading(false);
      }
    },
    [currentFilters],
  );

  useEffect(() => {
    void loadSellers();
  }, [loadSellers]);

  useEffect(() => {
    if (hasLoadedInitialActivity.current) return;
    hasLoadedInitialActivity.current = true;
    void loadActivity(currentFilters);
  }, [currentFilters, loadActivity]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 5_000);

    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (isAutoRefreshPaused || filtersAreInvalid(currentFilters)) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      void loadActivity(currentFilters);
    }, SELLER_ACTIVITY_AUTO_REFRESH_INTERVAL_MS);

    return () => window.clearInterval(timer);
  }, [currentFilters, isAutoRefreshPaused, loadActivity]);

  const visibleRows = useMemo(() => rows.filter((row) => matchesSearch(row, search)), [rows, search]);
  const activitySummary = useMemo(() => summarizeActivity(rows), [rows]);
  const relativeLastUpdated = formatRelativeLastUpdated(lastLoadedAt, now);
  const autoRefreshIntervalSeconds = Math.round(SELLER_ACTIVITY_AUTO_REFRESH_INTERVAL_MS / 1000);
  const selectedSeller = sellers.find((seller) => seller.id === sellerId);
  const activeFilterLabels = [
    `Periodo: ${getDateRangeLabel(from, to)}`,
    `Vendedor: ${selectedSeller ? selectedSeller.name : "Todos"}`,
    `Acción: ${getActionLabel(action)}`,
    search.trim() ? `Texto: ${search.trim()}` : "Texto: sin búsqueda local",
    `Límite: ${limit}`,
  ];
  const invalidFilters = filtersAreInvalid(currentFilters);

  const resetFilters = useCallback(() => {
    setSellerId("");
    setAction("");
    setFrom(today);
    setTo(today);
    setLimit(DEFAULT_SELLER_ACTIVITY_LIMIT);
    setSearch("");
  }, [today]);

  return {
    action,
    activeFilterLabels,
    activitySummary,
    autoRefreshIntervalSeconds,
    error,
    from,
    invalidFilters,
    isAutoRefreshPaused,
    isLoading,
    limit,
    loadActivity,
    relativeLastUpdated,
    resetFilters,
    rows,
    search,
    sellerId,
    sellers,
    setAction,
    setFrom,
    setIsAutoRefreshPaused,
    setLimit,
    setSearch,
    setSellerId,
    setTo,
    summary,
    to,
    today,
    visibleRows,
  };
}

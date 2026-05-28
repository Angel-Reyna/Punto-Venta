import { useCallback, useEffect, useMemo, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import { fetchAuditLogs } from "./auditApi";
import {
  filterAuditLogsBySeverity,
  formatDate,
  getAuditSeverity,
  initialFilters,
  type AuditFilters,
  type AuditLog,
} from "./auditShared";

const SEVERITY_LABELS: Record<Exclude<AuditFilters["severity"], "">, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Media",
  low: "Baja",
};

export function useAuditData() {
  const [rows, setRows] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState<AuditFilters>(initialFilters);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const loadAuditLogs = useCallback(async (currentFilters: AuditFilters) => {
    try {
      setError("");
      setIsLoading(true);
      setRows(await fetchAuditLogs(currentFilters));
    } catch (err) {
      setError(getApiErrorMessage(err, "No se pudo cargar la auditoría."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuditLogs(initialFilters);
  }, [loadAuditLogs]);

  const updateFilter = useCallback(<K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) => {
    setFilters((current) => ({
      ...current,
      [key]: value,
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters(initialFilters);
    void loadAuditLogs(initialFilters);
  }, [loadAuditLogs]);

  const consult = useCallback(() => {
    void loadAuditLogs(filters);
  }, [filters, loadAuditLogs]);

  const actionOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.action))).sort(), [rows]);

  const tableOptions = useMemo(() => Array.from(new Set(rows.map((row) => row.tableName))).sort(), [rows]);

  const visibleRows = useMemo(() => filterAuditLogsBySeverity(rows, filters.severity), [rows, filters.severity]);

  const uniqueUsers = useMemo(
    () => new Set(visibleRows.map((row) => row.user?.id ?? "system")).size,
    [visibleRows],
  );

  const criticalEvents = useMemo(
    () => visibleRows.filter((row) => getAuditSeverity(row).level === "critical").length,
    [visibleRows],
  );

  const latestEvent = visibleRows[0]?.createdAt ? formatDate(visibleRows[0].createdAt) : "Sin actividad";

  const activeFilterLabels = [
    filters.severity ? `Severidad: ${SEVERITY_LABELS[filters.severity]}` : "Severidad: Todas",
    filters.action ? `Acción: ${filters.action}` : "Acción: Todas",
    filters.tableName ? `Entidad: ${filters.tableName}` : "Entidad: Todas",
    filters.dateFrom || filters.dateTo
      ? `Periodo: ${filters.dateFrom || "inicio"} → ${filters.dateTo || "hoy"}`
      : "Periodo: últimos registros",
    filters.q.trim() ? `Búsqueda: ${filters.q.trim()}` : "Búsqueda: sin texto",
  ];

  return {
    actionOptions,
    activeFilterLabels,
    clearFilters,
    consult,
    criticalEvents,
    error,
    filters,
    isLoading,
    latestEvent,
    tableOptions,
    uniqueUsers,
    updateFilter,
    visibleRows,
  };
}

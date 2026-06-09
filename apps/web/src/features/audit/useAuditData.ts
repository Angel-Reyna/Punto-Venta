import { useCallback, useEffect, useMemo, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import { fetchAuditLogs } from "./auditApi";
import {
  filterAuditLogsByModule,
  filterAuditLogsBySeverity,
  filterAuditLogsByUser,
  formatActionLabel,
  formatAuditModuleLabel,
  formatDate,
  formatEntityLabel,
  getAuditSeverity,
  getAuditUserFilterLabel,
  initialFilters,
  type AuditFilters,
  type AuditLog,
} from "./auditShared";

const SEVERITY_LABELS: Record<Exclude<AuditFilters["severity"], "">, string> = {
  critical: "Crítica",
  high: "Alta",
  medium: "Media",
  low: "Informativa",
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

  const moduleRows = useMemo(() => filterAuditLogsByModule(rows, filters.module), [rows, filters.module]);

  const actionOptions = useMemo(
    () => Array.from(new Set(moduleRows.map((row) => row.action))).sort(),
    [moduleRows],
  );

  const tableOptions = useMemo(
    () => Array.from(new Set(moduleRows.map((row) => row.tableName))).sort(),
    [moduleRows],
  );

  const severityRows = useMemo(
    () => filterAuditLogsBySeverity(moduleRows, filters.severity),
    [moduleRows, filters.severity],
  );

  const visibleRows = useMemo(
    () => filterAuditLogsByUser(severityRows, filters.userId),
    [severityRows, filters.userId],
  );

  const userOptions = useMemo(() => {
    const options = new Map<string, string>();

    for (const row of rows) {
      const id = row.user?.id ?? "system";
      if (!options.has(id)) options.set(id, getAuditUserFilterLabel(row));
    }

    return Array.from(options, ([id, label]) => ({ id, label })).sort((a, b) =>
      a.label.localeCompare(b.label, "es"),
    );
  }, [rows]);

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
    filters.module ? `Módulo: ${formatAuditModuleLabel(filters.module)}` : "Módulo: Todos",
    filters.severity ? `Importancia: ${SEVERITY_LABELS[filters.severity]}` : "Importancia: Todas",
    filters.userId
      ? `Responsable: ${userOptions.find((option) => option.id === filters.userId)?.label ?? "Seleccionado"}`
      : "Responsable: Todos",
    filters.action ? `Qué ocurrió: ${formatActionLabel(filters.action)}` : "Qué ocurrió: Todo",
    filters.tableName ? `Detalle: ${formatEntityLabel(filters.tableName)}` : "Detalle: Todos",
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
    userOptions,
    visibleRows,
  };
}

import { useCallback, useEffect, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import { fetchDashboardMetrics } from "./dashboardApi";
import type { DashboardMetrics } from "./dashboard.types";

export function useDashboardData() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");

      setMetrics(await fetchDashboardMetrics());
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo cargar el resumen. Intenta actualizar la página.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  return {
    error,
    isLoading,
    load,
    metrics,
  };
}

import { api } from "../../api/client";
import type { DashboardMetrics } from "./dashboard.types";

export async function fetchDashboardMetrics() {
  const response = await api.get<DashboardMetrics>("/dashboard");

  return response.data;
}

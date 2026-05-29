import { getJson } from "../../api/http";
import type { DashboardMetrics } from "./dashboard.types";

export async function fetchDashboardMetrics() {
  return getJson<DashboardMetrics>("/dashboard");
}

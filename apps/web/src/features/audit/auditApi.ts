import { api } from "../../api/client";
import { buildAuditQuery, type AuditFilters, type AuditLog } from "./auditShared";

export async function fetchAuditLogs(filters: AuditFilters) {
  const query = buildAuditQuery(filters);
  const response = await api.get<AuditLog[]>(`/audit?${query}`);

  return response.data;
}

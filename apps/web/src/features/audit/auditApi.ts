import { getJson } from "../../api/http";
import { buildAuditQuery, type AuditFilters, type AuditLog } from "./auditShared";

export async function fetchAuditLogs(filters: AuditFilters) {
  return getJson<AuditLog[]>(`/audit?${buildAuditQuery(filters)}`);
}

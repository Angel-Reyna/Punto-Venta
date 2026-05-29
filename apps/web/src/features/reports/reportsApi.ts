import { getBlob, getJson } from "../../api/http";
import { downloadBlob } from "../../utils/downloadBlob";
import { buildQuery, type OperationsReport } from "./reportShared";

export async function fetchOperationsReport(from: string, to: string) {
  return getJson<OperationsReport>(`/reports/operations?${buildQuery(from, to)}`);
}

export async function downloadOperationsReportPdf(from: string, to: string) {
  const blob = await getBlob(`/reports/operations/pdf?${buildQuery(from, to)}`);

  downloadBlob(blob, `reporte-operativo-${from}-${to}.pdf`);
}

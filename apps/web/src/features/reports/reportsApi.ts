import { api } from "../../api/client";
import { downloadBlob } from "../../utils/downloadBlob";
import { buildQuery, type OperationsReport } from "./reportShared";

export async function fetchOperationsReport(from: string, to: string) {
  const response = await api.get<OperationsReport>(`/reports/operations?${buildQuery(from, to)}`);

  return response.data;
}

export async function downloadOperationsReportPdf(from: string, to: string) {
  const response = await api.get(`/reports/operations/pdf?${buildQuery(from, to)}`, {
    responseType: "blob"
  });

  downloadBlob(response.data, `reporte-operativo-${from}-${to}.pdf`);
}

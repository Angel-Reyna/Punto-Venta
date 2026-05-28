import { Alert } from "@mui/material";

import { StatusFeedback } from "../../components/StatusFeedback";
import { ReportsPeriodControls, ReportsSearchPanel } from "./ReportsControls";
import { ReportsDetailSections } from "./ReportsDetailSections";
import { ReportsHero } from "./ReportsHero";
import { ReportsSummaryGrid } from "./ReportsSummary";
import { useReportsData } from "./useReportsData";

export function ReportsPage() {
  const report = useReportsData();

  return (
    <>
      <ReportsHero data={report.data} periodLabel={report.periodLabel} />

      <StatusFeedback error={report.error} onErrorClose={() => report.setError("")} />

      <ReportsPeriodControls
        dateRangeIsInvalid={report.dateRangeIsInvalid}
        from={report.from}
        isDownloadingPdf={report.isDownloadingPdf}
        isLoading={report.isLoading}
        onApplyPreset={report.applyPreset}
        onConsult={report.consult}
        onDownloadPdf={report.downloadPdf}
        onFromChange={report.setFrom}
        onToChange={report.setTo}
        to={report.to}
      />

      {report.data && (
        <ReportsSearchPanel
          onSearchChange={report.setSearch}
          search={report.search}
          visibleResultsLabel={report.visibleResultsLabel}
        />
      )}

      {report.data && !report.hasReportActivity && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No hay ventas, devoluciones ni movimientos registrados en el periodo {report.periodLabel}.
        </Alert>
      )}

      {report.data && (
        <>
          <ReportsSummaryGrid data={report.data} />
          <ReportsDetailSections
            data={report.data}
            filteredRecentSales={report.filteredRecentSales}
            filteredReturns={report.filteredReturns}
            filteredSellers={report.filteredSellers}
            filteredTopProducts={report.filteredTopProducts}
            hasCashActivity={report.hasCashActivity}
          />
        </>
      )}
    </>
  );
}

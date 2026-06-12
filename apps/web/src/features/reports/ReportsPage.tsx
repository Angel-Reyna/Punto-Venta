import { Alert, Box, Stack } from "@mui/material";

import { StatusFeedback } from "../../components/StatusFeedback";
import { ReportsChartsGrid } from "./ReportsCharts";
import { ReportsPeriodControls, ReportsSearchPanel } from "./ReportsControls";
import { ReportsDetailSections } from "./ReportsDetailSections";
import { ReportsHero } from "./ReportsHero";
import { ReportsSummaryGrid } from "./ReportsSummary";
import { useReportsData } from "./useReportsData";

export function ReportsPage() {
  const report = useReportsData();

  return (
    <Box sx={{ pb: { xs: 2, md: 4 } }}>
      <Stack spacing={2} sx={{ minWidth: 0 }}>
        <ReportsHero data={report.data} periodLabel={report.periodLabel} />

        <StatusFeedback error={report.error} onErrorClose={() => report.setError("")} />

        <ReportsPeriodControls
          canDownloadPdf={report.canDownloadPdf}
          dateRangeIsInvalid={report.dateRangeIsInvalid}
          from={report.from}
          isDownloadingPdf={report.isDownloadingPdf}
          isLoading={report.isLoading}
          onApplyPreset={report.applyPreset}
          onConsult={report.consult}
          onDownloadPdf={report.downloadPdf}
          onFromChange={report.setFrom}
          onToChange={report.setTo}
          pdfDownloadBlockedReason={report.pdfDownloadBlockedReason}
          periodLabel={report.periodLabel}
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
          <Alert severity="info">
            No hay ventas, devoluciones ni movimientos registrados en el periodo {report.periodLabel}.
          </Alert>
        )}

        {report.data && (
          <>
            <ReportsSummaryGrid data={report.data} />
            <ReportsChartsGrid data={report.data} />
            <ReportsDetailSections
              filteredRecentSales={report.filteredRecentSales}
              filteredReturns={report.filteredReturns}
              filteredSellers={report.filteredSellers}
              filteredTopProducts={report.filteredTopProducts}
              initialSection={report.initialDetailSection}
            />
          </>
        )}
      </Stack>
    </Box>
  );
}

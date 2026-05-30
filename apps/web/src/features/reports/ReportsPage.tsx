import { Alert, Box, Card, CardContent, Stack, Typography } from "@mui/material";

import { StatusFeedback } from "../../components/StatusFeedback";
import { ReportsPeriodControls, ReportsSearchPanel } from "./ReportsControls";
import { ReportsDetailSections } from "./ReportsDetailSections";
import { ReportsHero } from "./ReportsHero";
import { ReportsSummaryGrid } from "./ReportsSummary";
import { useReportsData } from "./useReportsData";

export function ReportsPage() {
  const report = useReportsData();

  return (
    <Box sx={{ pb: { xs: 2, md: 4 } }}>
      <ReportsHero data={report.data} periodLabel={report.periodLabel} />

      <StatusFeedback error={report.error} onErrorClose={() => report.setError("")} />

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            lg: report.data ? "minmax(0, 1fr) 360px" : "1fr"
          },
          gap: 2,
          alignItems: "start"
        }}
      >
        <Stack spacing={2} sx={{ minWidth: 0 }}>
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
            <Alert severity="info">
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
        </Stack>

        {report.data && (
          <Card
            sx={{
              position: { lg: "sticky" },
              top: { lg: 96 },
              border: "1px solid",
              borderColor: "divider",
              display: { xs: "none", lg: "block" }
            }}
          >
            <CardContent>
              <Typography variant="overline" color="text.secondary" fontWeight={800}>
                Lectura rápida
              </Typography>
              <Typography variant="h6" fontWeight={900} sx={{ mt: 0.5 }}>
                Qué revisar primero
              </Typography>
              <Stack spacing={1.5} sx={{ mt: 2 }}>
                <QuickReadLine label="Resultado real" value="Venta neta, costo neto y utilidad bruta." />
                <QuickReadLine label="Equipo" value="Ventas por vendedor y devoluciones asociadas." />
                <QuickReadLine label="Catálogo" value="Productos con mayor movimiento y utilidad." />
                <QuickReadLine label="Operación" value="Ventas recientes, reembolsos y efectivo histórico." />
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    </Box>
  );
}

function QuickReadLine({ label, value }: { label: string; value: string }) {
  return (
    <Box>
      <Typography variant="body2" fontWeight={800}>
        {label}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {value}
      </Typography>
    </Box>
  );
}

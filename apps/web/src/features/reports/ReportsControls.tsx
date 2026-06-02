import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Alert, Box, Button, Card, CardContent, Chip, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { ReportDatePreset } from "./useReportsData";

const DATE_PRESETS: Array<{ label: string; value: ReportDatePreset }> = [
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "last7" },
  { label: "Mes actual", value: "month" },
  { label: "Mes anterior", value: "previousMonth" }
];

export function ReportsPeriodControls({
  canDownloadPdf,
  dateRangeIsInvalid,
  from,
  isDownloadingPdf,
  isLoading,
  onApplyPreset,
  onConsult,
  onDownloadPdf,
  onFromChange,
  onToChange,
  pdfDownloadBlockedReason,
  to
}: {
  canDownloadPdf: boolean;
  dateRangeIsInvalid: boolean;
  from: string;
  isDownloadingPdf: boolean;
  isLoading: boolean;
  onApplyPreset: (preset: ReportDatePreset) => void;
  onConsult: () => void;
  onDownloadPdf: () => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  pdfDownloadBlockedReason: string;
  to: string;
}) {
  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)"
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: "column", md: "row" }} justifyContent="space-between" gap={2} sx={{ mb: 2 }}>
          <Stack direction="row" alignItems="center" gap={1.25}>
            <FilterAltOutlinedIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={800}>
                Elige qué periodo revisar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Primero consulta el rango; después puedes filtrar dentro del reporte y descargar PDF.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            {DATE_PRESETS.map((preset) => (
              <Chip
                key={preset.value}
                clickable
                label={preset.label}
                onClick={() => onApplyPreset(preset.value)}
                variant="outlined"
              />
            ))}
          </Stack>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "minmax(160px, 0.9fr) minmax(160px, 0.9fr) minmax(180px, 1fr) minmax(170px, 0.9fr)"
            },
            gap: 1.5,
            alignItems: "start"
          }}
        >
          <TextField
            fullWidth
            label="Desde"
            type="date"
            value={from}
            inputProps={{ "data-testid": "reports-date-from" }}
            onChange={(event) => onFromChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            error={dateRangeIsInvalid}
          />

          <TextField
            fullWidth
            label="Hasta"
            type="date"
            value={to}
            inputProps={{ "data-testid": "reports-date-to" }}
            onChange={(event) => onToChange(event.target.value)}
            InputLabelProps={{ shrink: true }}
            error={dateRangeIsInvalid}
            helperText={dateRangeIsInvalid ? "Revisa el rango." : undefined}
          />

          <Button
            fullWidth
            variant="contained"
            data-testid="reports-consult-button"
            startIcon={<CalendarMonthOutlinedIcon />}
            onClick={onConsult}
            disabled={dateRangeIsInvalid || isLoading || isDownloadingPdf}
            sx={{ minHeight: 54 }}
          >
            {isLoading ? "Consultando..." : "Consultar reporte"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            data-testid="reports-download-pdf-button"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={onDownloadPdf}
            disabled={!canDownloadPdf || isLoading || isDownloadingPdf}
            sx={{ minHeight: 54 }}
          >
            {isDownloadingPdf ? "Descargando..." : "Descargar PDF"}
          </Button>
        </Box>

        {pdfDownloadBlockedReason && (
          <Alert severity="info" sx={{ mt: 1.5 }} data-testid="reports-pdf-gate-message">
            {pdfDownloadBlockedReason}
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}

export function ReportsSearchPanel({
  onSearchChange,
  search,
  visibleResultsLabel
}: {
  onSearchChange: (value: string) => void;
  search: string;
  visibleResultsLabel: string;
}) {
  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.92)
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack direction={{ xs: "column", md: "row" }} spacing={1.5} alignItems={{ md: "center" }}>
          <TextField
            fullWidth
            label="Buscar dentro del reporte"
            placeholder="Folio, vendedor, producto, método de pago, estado..."
            value={search}
            inputProps={{ "data-testid": "reports-search" }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchOutlinedIcon fontSize="small" />
                </InputAdornment>
              )
            }}
            onChange={(event) => onSearchChange(event.target.value)}
          />
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ minWidth: { md: 280 } }}>
            <Chip size="small" variant="outlined" label={`Vista actual: ${visibleResultsLabel}`} />
            {search && <Chip size="small" color="primary" label={`Filtro local: ${search}`} />}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  InputAdornment,
  Stack,
  TextField,
  Typography
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { ReportDatePreset } from "./useReportsData";

const DATE_PRESETS: Array<{ label: string; value: ReportDatePreset }> = [
  { label: "Hoy", value: "today" },
  { label: "7 días", value: "last7" },
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
  periodLabel,
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
  periodLabel: string;
  to: string;
}) {
  return (
    <Card
      sx={{
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 14px 38px rgba(15, 23, 42, 0.06)",
        overflow: "hidden"
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
        <Stack spacing={1.75}>
          <Stack
            alignItems={{ xs: "stretch", md: "center" }}
            direction={{ xs: "column", md: "row" }}
            justifyContent="space-between"
            gap={1.5}
          >
            <Stack direction="row" spacing={1.25} sx={{ minWidth: 0 }}>
              <Box
                aria-hidden="true"
                sx={{
                  alignItems: "center",
                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                  borderRadius: 2.25,
                  color: "primary.main",
                  display: "inline-flex",
                  height: 42,
                  justifyContent: "center",
                  width: 42,
                  flexShrink: 0
                }}
              >
                <FilterAltOutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h6" fontWeight={900}>
                  Periodo y salida del reporte
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
                  Consulta un rango real antes de descargar PDF. Periodo actual: {periodLabel}.
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
                lg: "minmax(142px, 0.8fr) minmax(142px, 0.8fr) minmax(184px, 1fr) minmax(150px, 0.8fr)"
              },
              gap: 1.25,
              alignItems: "start"
            }}
          >
            <TextField
              fullWidth
              label="Desde"
              type="date"
              size="small"
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
              size="small"
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
              sx={{ minHeight: 40 }}
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
              sx={{ minHeight: 40 }}
            >
              {isDownloadingPdf ? "Descargando..." : "Descargar PDF"}
            </Button>
          </Box>

          {pdfDownloadBlockedReason && (
            <Alert severity="info" data-testid="reports-pdf-gate-message">
              {pdfDownloadBlockedReason}
            </Alert>
          )}
        </Stack>
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
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.94)
      }}
    >
      <CardContent sx={{ p: { xs: 2, md: 2.25 } }}>
        <Box
          sx={{
            display: "grid",
            gap: 1.25,
            gridTemplateColumns: {
              xs: "1fr",
              md: "minmax(260px, 1fr) auto"
            },
            alignItems: "center"
          }}
        >
          <TextField
            fullWidth
            label="Buscar en resultados"
            placeholder="Folio, vendedor, producto..."
            value={search}
            size="small"
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
          <Stack direction="row" flexWrap="wrap" gap={1} sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}>
            <Chip size="small" color="success" label="Datos consultados" />
            <Chip size="small" variant="outlined" label={visibleResultsLabel} />
            {search && <Chip size="small" color="primary" label={`Filtro: ${search}`} />}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

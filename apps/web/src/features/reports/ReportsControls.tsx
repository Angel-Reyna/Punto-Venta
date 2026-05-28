import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import SearchOutlinedIcon from "@mui/icons-material/SearchOutlined";
import { Box, Button, Card, CardContent, Chip, InputAdornment, Stack, TextField, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import type { ReportDatePreset } from "./useReportsData";

const DATE_PRESETS: Array<{ label: string; value: ReportDatePreset }> = [
  { label: "Hoy", value: "today" },
  { label: "Últimos 7 días", value: "last7" },
  { label: "Mes actual", value: "month" },
  { label: "Mes anterior", value: "previousMonth" }
];

export function ReportsPeriodControls({
  dateRangeIsInvalid,
  from,
  isDownloadingPdf,
  isLoading,
  onApplyPreset,
  onConsult,
  onDownloadPdf,
  onFromChange,
  onToChange,
  to
}: {
  dateRangeIsInvalid: boolean;
  from: string;
  isDownloadingPdf: boolean;
  isLoading: boolean;
  onApplyPreset: (preset: ReportDatePreset) => void;
  onConsult: () => void;
  onDownloadPdf: () => void;
  onFromChange: (value: string) => void;
  onToChange: (value: string) => void;
  to: string;
}) {
  return (
    <Card
      sx={{
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        boxShadow: "0 12px 36px rgba(15, 23, 42, 0.06)"
      }}
    >
      <CardContent>
        <Stack direction="row" alignItems="center" gap={1.25} sx={{ mb: 2 }}>
          <FilterAltOutlinedIcon color="primary" />
          <Box>
            <Typography variant="h6" fontWeight={800}>
              Consulta del periodo
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Define el rango, consulta y descarga el PDF sin cambiar de pantalla.
            </Typography>
          </Box>
        </Stack>

        <Stack direction="row" flexWrap="wrap" gap={1} sx={{ mb: 2 }}>
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

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "1fr 1fr",
              lg: "repeat(4, minmax(0, 1fr))"
            },
            gap: 2
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
          >
            {isLoading ? "Consultando..." : "Consultar reporte"}
          </Button>

          <Button
            fullWidth
            variant="outlined"
            data-testid="reports-download-pdf-button"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={onDownloadPdf}
            disabled={dateRangeIsInvalid || isLoading || isDownloadingPdf}
          >
            {isDownloadingPdf ? "Descargando..." : "Descargar PDF"}
          </Button>
        </Box>
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
        mb: 2,
        border: "1px solid",
        borderColor: "divider",
        bgcolor: (theme) => alpha(theme.palette.background.paper, 0.92)
      }}
    >
      <CardContent>
        <Stack spacing={1.5}>
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
          <Stack direction="row" flexWrap="wrap" gap={1}>
            <Chip size="small" variant="outlined" label={`Vista actual: ${visibleResultsLabel}`} />
            {search && <Chip size="small" color="primary" label={`Filtro local: ${search}`} />}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

import { Box, Button, Card, CardContent, Chip, Divider, Grid, MenuItem, Stack, TextField, Typography } from "@mui/material";

import ManageSearchIcon from "@mui/icons-material/ManageSearch";

import { formatActionLabel, formatEntityLabel, type AuditFilters } from "./auditShared";

export function AuditFiltersPanel({
  actionOptions,
  activeFilterLabels,
  clearFilters,
  consult,
  filters,
  isLoading,
  tableOptions,
  updateFilter,
}: {
  actionOptions: string[];
  activeFilterLabels: string[];
  clearFilters: () => void;
  consult: () => void;
  filters: AuditFilters;
  isLoading: boolean;
  tableOptions: string[];
  updateFilter: <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) => void;
}) {
  return (
    <Card sx={{ position: { lg: "sticky" }, top: { lg: 88 } }}>
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1} alignItems="center">
            <ManageSearchIcon color="primary" />
            <Box>
              <Typography variant="h6" fontWeight={900}>
                Panel de investigación
              </Typography>
              <Typography variant="body2" color="text.secondary">
Encuentra cambios por tipo de acción, área afectada, importancia, fecha o texto.
              </Typography>
            </Box>
          </Stack>

          <Divider />

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Buscar"
                placeholder="Producto, usuario, acción o registro"
                value={filters.q}
                inputProps={{ "data-testid": "audit-search" }}
                onChange={(event) => updateFilter("q", event.target.value)}
              />
            </Grid>

            <Grid item xs={12} sm={6} lg={12}>
              <TextField
                select
                fullWidth
                label="Qué ocurrió"
                value={filters.action}
                inputProps={{ "data-testid": "audit-action" }}
                onChange={(event) => updateFilter("action", event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {actionOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatActionLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} lg={12}>
              <TextField
                select
                fullWidth
                label="Área afectada"
                value={filters.tableName}
                inputProps={{ "data-testid": "audit-entity" }}
                onChange={(event) => updateFilter("tableName", event.target.value)}
              >
                <MenuItem value="">Todas</MenuItem>
                {tableOptions.map((option) => (
                  <MenuItem key={option} value={option}>
                    {formatEntityLabel(option)}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6} lg={12}>
              <TextField
                select
                fullWidth
                label="Importancia"
                value={filters.severity}
                inputProps={{ "data-testid": "audit-severity" }}
                onChange={(event) => updateFilter("severity", event.target.value as AuditFilters["severity"])}
              >
                <MenuItem value="">Todas</MenuItem>
                <MenuItem value="critical">Crítica</MenuItem>
                <MenuItem value="high">Alta</MenuItem>
                <MenuItem value="medium">Media</MenuItem>
                <MenuItem value="low">Baja</MenuItem>
              </TextField>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Desde"
                type="date"
                value={filters.dateFrom}
                inputProps={{ "data-testid": "audit-date-from" }}
                onChange={(event) => updateFilter("dateFrom", event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Hasta"
                type="date"
                value={filters.dateTo}
                inputProps={{ "data-testid": "audit-date-to" }}
                onChange={(event) => updateFilter("dateTo", event.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
          </Grid>

          <Stack spacing={1} data-testid="audit-active-filters">
            <Typography variant="subtitle2" fontWeight={900}>
              Vista actual
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {activeFilterLabels.map((label) => (
                <Chip key={label} size="small" label={label} variant="outlined" />
              ))}
            </Stack>
          </Stack>

          <Stack direction={{ xs: "column", sm: "row", lg: "column" }} spacing={1}>
            <Button data-testid="audit-clear-button" onClick={clearFilters} disabled={isLoading} fullWidth>
              Limpiar
            </Button>
            <Button data-testid="audit-consult-button" variant="contained" onClick={consult} disabled={isLoading} fullWidth>
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

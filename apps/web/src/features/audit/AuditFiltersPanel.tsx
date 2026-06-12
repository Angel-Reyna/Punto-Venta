import { useEffect, useState } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Grid,
  InputAdornment,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";
import SearchIcon from "@mui/icons-material/Search";

import {
  AUDIT_MODULE_OPTIONS,
  formatActionLabel,
  formatEntityLabel,
  type AuditFilters,
  type AuditLayoutVariant,
} from "./auditShared";

type AuditFiltersPanelProps = {
  actionOptions: string[];
  activeFilterLabels: string[];
  clearFilters: () => void;
  consult: () => void;
  filters: AuditFilters;
  isLoading: boolean;
  layout?: AuditLayoutVariant;
  tableOptions: string[];
  userOptions: Array<{ id: string; label: string }>;
  updateFilter: <K extends keyof AuditFilters>(key: K, value: AuditFilters[K]) => void;
};

function getFilterCopy(layout: AuditLayoutVariant) {
  if (layout === "mobile") {
    return {
      title: "Buscar actividad",
      helper: "Consulta cambios por responsable, módulo o periodo.",
      searchPlaceholder: "Producto, usuario o venta",
    };
  }

  if (layout === "tablet") {
    return {
      title: "Buscar actividad",
      helper: "Filtra sin perder de vista el mapa de cambios.",
      searchPlaceholder: "Producto, usuario o acción",
    };
  }

  return {
    title: "Buscar actividad",
    helper: "Ubica cambios por módulo, responsable, importancia o fecha.",
    searchPlaceholder: "Producto, usuario o módulo",
  };
}

function formatDateInput(date: Date) {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return localDate.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number) {
  const nextDate = new Date(date);
  nextDate.setDate(nextDate.getDate() + days);
  return nextDate;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function endOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0);
}

function getAuditDatePresets(today = new Date()) {
  const currentMonthStart = startOfMonth(today);
  const previousMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);

  return [
    {
      key: "today",
      label: "Hoy",
      helper: "Solo actividad de hoy",
      dateFrom: formatDateInput(today),
      dateTo: formatDateInput(today),
    },
    {
      key: "last-7-days",
      label: "Últimos 7 días",
      helper: "Última semana operativa",
      dateFrom: formatDateInput(addDays(today, -6)),
      dateTo: formatDateInput(today),
    },
    {
      key: "this-month",
      label: "Este mes",
      helper: "Actividad del mes actual",
      dateFrom: formatDateInput(currentMonthStart),
      dateTo: formatDateInput(today),
    },
    {
      key: "previous-month",
      label: "Mes pasado",
      helper: "Cierre del mes anterior",
      dateFrom: formatDateInput(previousMonth),
      dateTo: formatDateInput(endOfMonth(previousMonth)),
    },
  ] as const;
}

function AuditFilterFields({
  actionOptions,
  filters,
  isMobile,
  isDesktop,
  tableOptions,
  userOptions,
  updateFilter,
}: Pick<AuditFiltersPanelProps, "actionOptions" | "filters" | "tableOptions" | "userOptions" | "updateFilter"> & {
  isDesktop: boolean;
  isMobile: boolean;
}) {
  return (
    <Grid container spacing={isMobile ? 1.1 : 1.35}>
      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 4 : 6}>
        <TextField
          select
          fullWidth
          label="Módulo"
          size="small"
          value={filters.module}
          inputProps={{ "data-testid": "audit-module" }}
          onChange={(event) => updateFilter("module", event.target.value as AuditFilters["module"])}
        >
          <MenuItem value="">Todos</MenuItem>
          {AUDIT_MODULE_OPTIONS.map((option) => (
            <MenuItem key={option.value} value={option.value} title={option.helper}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 4 : 6}>
        <TextField
          select
          fullWidth
          label="Qué ocurrió"
          size="small"
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

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 4 : 6}>
        <TextField
          select
          fullWidth
          label="Detalle"
          size="small"
          value={filters.tableName}
          inputProps={{ "data-testid": "audit-entity" }}
          onChange={(event) => updateFilter("tableName", event.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          {tableOptions.map((option) => (
            <MenuItem key={option} value={option}>
              {formatEntityLabel(option)}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 4 : 6}>
        <TextField
          select
          fullWidth
          label="Importancia"
          size="small"
          value={filters.severity}
          inputProps={{ "data-testid": "audit-severity" }}
          onChange={(event) => updateFilter("severity", event.target.value as AuditFilters["severity"])}
        >
          <MenuItem value="">Todas</MenuItem>
          <MenuItem value="critical">Crítica</MenuItem>
          <MenuItem value="high">Alta</MenuItem>
          <MenuItem value="medium">Media</MenuItem>
          <MenuItem value="low">Informativa</MenuItem>
        </TextField>
      </Grid>

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 4 : 6}>
        <TextField
          select
          fullWidth
          label="Responsable"
          size="small"
          value={filters.userId}
          inputProps={{ "data-testid": "audit-user" }}
          onChange={(event) => updateFilter("userId", event.target.value)}
        >
          <MenuItem value="">Todos</MenuItem>
          {userOptions.map((option) => (
            <MenuItem key={option.id} value={option.id}>
              {option.label}
            </MenuItem>
          ))}
        </TextField>
      </Grid>

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 2 : 6}>
        <TextField
          fullWidth
          label="Desde"
          type="date"
          size="small"
          value={filters.dateFrom}
          inputProps={{ "data-testid": "audit-date-from" }}
          onChange={(event) => updateFilter("dateFrom", event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 2 : 6}>
        <TextField
          fullWidth
          label="Hasta"
          type="date"
          size="small"
          value={filters.dateTo}
          inputProps={{ "data-testid": "audit-date-to" }}
          onChange={(event) => updateFilter("dateTo", event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>
    </Grid>
  );
}

export function AuditFiltersPanel({
  actionOptions,
  activeFilterLabels,
  clearFilters,
  consult,
  filters,
  isLoading,
  layout = "desktop",
  tableOptions,
  userOptions,
  updateFilter,
}: AuditFiltersPanelProps) {
  const copy = getFilterCopy(layout);
  const isMobile = layout === "mobile";
  const isDesktop = layout === "desktop";
  const datePresets = getAuditDatePresets();
  const [showFilters, setShowFilters] = useState(!isMobile);

  useEffect(() => {
    if (!isMobile) setShowFilters(true);
  }, [isMobile]);

  const applyDatePreset = (dateFrom: string, dateTo: string) => {
    updateFilter("dateFrom", dateFrom);
    updateFilter("dateTo", dateTo);
  };

  return (
    <Card
      sx={{
        border: 1,
        borderColor: "divider",
        borderRadius: 3,
        boxShadow: isMobile ? "none" : undefined,
        overflow: "hidden",
      }}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box
          sx={(theme) => ({
            px: { xs: 1.5, sm: 2.25 },
            py: { xs: 1.5, sm: 1.85 },
            borderBottom: 1,
            borderColor: alpha(theme.palette.primary.main, 0.16),
            background: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.035 : 0.02),
          })}
        >
          <Stack spacing={1.45}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.25}
              alignItems={{ xs: "stretch", md: "center" }}
              justifyContent="space-between"
            >
              <Stack direction="row" spacing={1.2} alignItems="center" sx={{ minWidth: 0 }}>
                <Box
                  sx={(theme) => ({
                    alignItems: "center",
                    bgcolor: alpha(theme.palette.primary.main, 0.13),
                    borderRadius: 2.35,
                    color: "primary.main",
                    display: "inline-flex",
                    flex: "0 0 auto",
                    height: 44,
                    justifyContent: "center",
                    width: 44,
                  })}
                >
                  <ManageSearchIcon />
                </Box>
                <Box sx={{ minWidth: 0 }}>
                  <Typography variant="h5" fontWeight={950} sx={{ letterSpacing: -0.35 }}>
                    {copy.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {copy.helper}
                  </Typography>
                </Box>
              </Stack>
            </Stack>

            <Box
              sx={{
                alignItems: "center",
                display: "grid",
                gap: 1,
                gridTemplateColumns: {
                  xs: "1fr",
                  lg: "minmax(280px, 1fr) auto auto auto",
                },
              }}
            >
              <TextField
                fullWidth
                label="Buscar"
                placeholder={copy.searchPlaceholder}
                size="small"
                value={filters.q}
                inputProps={{ "data-testid": "audit-search" }}
                onChange={(event) => updateFilter("q", event.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon fontSize="small" />
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                variant={showFilters ? "contained" : "outlined"}
                startIcon={<FilterAltIcon />}
                onClick={() => setShowFilters((current) => !current)}
                aria-expanded={showFilters}
                aria-controls="audit-inline-filters"
                sx={{ borderRadius: 2.5, whiteSpace: "nowrap" }}
              >
                Filtros
              </Button>

              <Button data-testid="audit-clear-button" onClick={clearFilters} disabled={isLoading} sx={{ borderRadius: 2.5 }}>
                Limpiar
              </Button>

              <Button
                data-testid="audit-consult-button"
                variant="contained"
                onClick={consult}
                disabled={isLoading}
                sx={{ borderRadius: 2.5, whiteSpace: "nowrap" }}
              >
                {isLoading ? "Consultando..." : "Consultar"}
              </Button>
            </Box>
          </Stack>
        </Box>

        <Collapse in={showFilters} timeout="auto" unmountOnExit>
          <Box
            id="audit-inline-filters"
            sx={(theme) => ({
              px: { xs: 2, sm: 2.5 },
              py: 1.5,
              borderBottom: 1,
              borderColor: alpha(theme.palette.primary.main, 0.12),
              bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.045 : 0.026),
            })}
          >
            <Stack spacing={1.35}>
              <Box data-testid="audit-date-presets">
                <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center">
                  <Typography variant="body2" color="text.secondary" fontWeight={900} sx={{ mr: 0.25 }}>
                    Periodo:
                  </Typography>
                  {datePresets.map((preset) => {
                    const isSelected = filters.dateFrom === preset.dateFrom && filters.dateTo === preset.dateTo;

                    return (
                      <Chip
                        key={preset.key}
                        data-testid={`audit-date-preset-${preset.key}`}
                        clickable
                        color={isSelected ? "primary" : "default"}
                        label={preset.label}
                        title={preset.helper}
                        variant={isSelected ? "filled" : "outlined"}
                        onClick={() => applyDatePreset(preset.dateFrom, preset.dateTo)}
                        sx={{ fontWeight: 900 }}
                      />
                    );
                  })}
                </Stack>
              </Box>

              <AuditFilterFields
                actionOptions={actionOptions}
                filters={filters}
                isDesktop={isDesktop}
                isMobile={isMobile}
                tableOptions={tableOptions}
                userOptions={userOptions}
                updateFilter={updateFilter}
              />
            </Stack>
          </Box>
        </Collapse>

        <Box
          data-testid="audit-active-filters"
          sx={(theme) => ({
            px: { xs: 2, sm: 2.5 },
            py: 1.25,
            bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.035 : 0.018),
          })}
        >
          <Stack direction="row" spacing={0.8} flexWrap="wrap" useFlexGap alignItems="center">
            <Typography variant="body2" color="text.secondary" fontWeight={900} sx={{ mr: 0.25 }}>
              Activos:
            </Typography>
            {activeFilterLabels.length === 0 ? (
              <Chip size="small" label="Sin filtros activos" variant="outlined" />
            ) : (
              activeFilterLabels.map((label) => <Chip key={label} size="small" label={label} variant="outlined" />)
            )}
          </Stack>
        </Box>
      </CardContent>
    </Card>
  );
}

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import FilterAltIcon from "@mui/icons-material/FilterAlt";
import ManageSearchIcon from "@mui/icons-material/ManageSearch";

import {
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
      title: "Buscar en la bitácora",
      helper: "Busca por producto, usuario o venta. Usa filtros si necesitas afinar.",
      searchPlaceholder: "Producto, usuario o venta",
    };
  }

  if (layout === "tablet") {
    return {
      title: "Filtros",
      helper: "Filtra sin perder de vista los cambios.",
      searchPlaceholder: "Producto, usuario o acción",
    };
  }

  return {
    title: "Filtros",
    helper: "Encuentra cambios por acción, área o fecha.",
    searchPlaceholder: "Producto, usuario o área",
  };
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
    <Grid container spacing={isMobile ? 1.1 : 1.5}>
      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 12 : 6}>
        <TextField
          select
          fullWidth
          label="Qué ocurrió"
          size={isMobile ? "small" : "medium"}
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

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 12 : 6}>
        <TextField
          select
          fullWidth
          label="Área afectada"
          size={isMobile ? "small" : "medium"}
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

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 12 : 6}>
        <TextField
          select
          fullWidth
          label="Importancia"
          size={isMobile ? "small" : "medium"}
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

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 12 : 6}>
        <TextField
          select
          fullWidth
          label="Responsable"
          size={isMobile ? "small" : "medium"}
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

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 12 : 6}>
        <TextField
          fullWidth
          label="Desde"
          type="date"
          size={isMobile ? "small" : "medium"}
          value={filters.dateFrom}
          inputProps={{ "data-testid": "audit-date-from" }}
          onChange={(event) => updateFilter("dateFrom", event.target.value)}
          InputLabelProps={{ shrink: true }}
        />
      </Grid>

      <Grid item xs={12} sm={isMobile ? 12 : 6} lg={isDesktop ? 12 : 6}>
        <TextField
          fullWidth
          label="Hasta"
          type="date"
          size={isMobile ? "small" : "medium"}
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

  return (
    <Card
      sx={{
        position: isDesktop ? { lg: "sticky" } : "static",
        top: isDesktop ? { lg: 84 } : "auto",
        border: 1,
        borderColor: "divider",
        borderRadius: isMobile ? 3 : 3,
        boxShadow: isMobile ? "none" : undefined,
      }}
    >
      <CardContent sx={{ p: isMobile ? 1.5 : 2 }}>
        <Stack spacing={isMobile ? 1.25 : 1.75}>
          <Stack direction="row" spacing={1} alignItems="flex-start">
            <Box
              sx={{
                display: "grid",
                placeItems: "center",
                width: 38,
                height: 38,
                borderRadius: 2,
                bgcolor: "primary.main",
                color: "primary.contrastText",
                flexShrink: 0,
              }}
            >
              <ManageSearchIcon fontSize="small" />
            </Box>
            <Box>
              <Typography variant={isMobile ? "subtitle1" : "h6"} fontWeight={950}>
                {copy.title}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {copy.helper}
              </Typography>
            </Box>
          </Stack>

          <TextField
            fullWidth
            label="Buscar"
            placeholder={copy.searchPlaceholder}
            size={isMobile ? "small" : "medium"}
            value={filters.q}
            inputProps={{ "data-testid": "audit-search" }}
            onChange={(event) => updateFilter("q", event.target.value)}
          />

          {isMobile ? (
            <Box
              component="details"
              sx={{
                border: 1,
                borderColor: "divider",
                borderRadius: 2,
                overflow: "hidden",
                "& > summary": {
                  cursor: "pointer",
                  listStyle: "none",
                  px: 1.25,
                  py: 1,
                },
                "& > summary::-webkit-details-marker": { display: "none" },
              }}
            >
              <Box component="summary">
                <Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
                  <Stack direction="row" spacing={1} alignItems="center">
                    <FilterAltIcon fontSize="small" color="primary" />
                    <Typography fontWeight={900}>Afinar búsqueda</Typography>
                  </Stack>
                  <Typography aria-hidden color="text.secondary">
                    ⌄
                  </Typography>
                </Stack>
              </Box>
              <Box sx={{ px: 1.25, pb: 1.25 }}>
                <AuditFilterFields
                  actionOptions={actionOptions}
                  filters={filters}
                  isDesktop={isDesktop}
                  isMobile={isMobile}
                  tableOptions={tableOptions}
                  userOptions={userOptions}
                  updateFilter={updateFilter}
                />
              </Box>
            </Box>
          ) : (
            <>
              <Divider />
              <AuditFilterFields
                actionOptions={actionOptions}
                filters={filters}
                isDesktop={isDesktop}
                isMobile={isMobile}
                tableOptions={tableOptions}
                userOptions={userOptions}
                updateFilter={updateFilter}
              />
            </>
          )}

          <Box data-testid="audit-active-filters">
            <Typography variant="subtitle2" fontWeight={900} sx={{ mb: 0.75 }}>
              Vista actual
            </Typography>
            <Stack direction="row" spacing={0.75} flexWrap="wrap" useFlexGap>
              {activeFilterLabels.map((label) => (
                <Chip key={label} size="small" label={label} variant="outlined" />
              ))}
            </Stack>
          </Box>

          <Stack direction={isMobile || isDesktop ? "column" : "row"} spacing={1}>
            <Button data-testid="audit-clear-button" onClick={clearFilters} disabled={isLoading} fullWidth>
              Limpiar
            </Button>
            <Button
              data-testid="audit-consult-button"
              variant="contained"
              onClick={consult}
              disabled={isLoading}
              fullWidth
            >
              {isLoading ? "Consultando..." : "Consultar"}
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

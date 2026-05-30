import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { SearchToolbar } from "../../components/SearchToolbar";
import type { RoleFilter, StatusFilter } from "./userShared";

type UsersFiltersPanelProps = {
  anyFilterActive: boolean;
  filteredCount: number;
  onClearFilters: () => void;
  onQueryChange: (value: string) => void;
  onRoleFilterChange: (value: RoleFilter) => void;
  onStatusFilterChange: (value: StatusFilter) => void;
  query: string;
  roleFilter: RoleFilter;
  roleFilterLabel: string;
  statusFilter: StatusFilter;
  statusFilterLabel: string;
  totalCount: number;
};

export function UsersFiltersPanel({
  anyFilterActive,
  filteredCount,
  onClearFilters,
  onQueryChange,
  onRoleFilterChange,
  onStatusFilterChange,
  query,
  roleFilter,
  roleFilterLabel,
  statusFilter,
  statusFilterLabel,
  totalCount,
}: UsersFiltersPanelProps) {
  return (
    <Card variant="outlined">
      <CardContent>
        <Stack spacing={1.75}>
          <Stack spacing={0.25}>
            <Typography variant="subtitle1" fontWeight={800}>
              Buscar y filtrar accesos
            </Typography>
            <Typography variant="body2" color="text.secondary">
              En celular usa este panel antes de revisar la lista; en PC queda a la
              derecha para no saturar el directorio.
            </Typography>
          </Stack>

          <SearchToolbar
            query={query}
            onQueryChange={onQueryChange}
            resultCount={filteredCount}
            totalCount={totalCount}
            label="Buscar usuarios"
            placeholder="Nombre, correo, rol o estado"
            helperText="Filtra vendedores y administradores sin depender de una tabla horizontal."
          />

          <Box
            sx={{
              display: "grid",
              gap: 1.5,
              gridTemplateColumns: "minmax(0, 1fr)",
              minWidth: 0,
            }}
          >
            <TextField
              select
              label="Rol"
              value={roleFilter}
              onChange={(event) =>
                onRoleFilterChange(event.target.value as RoleFilter)
              }
            >
              <MenuItem value="ALL">Todos los roles</MenuItem>
              <MenuItem value="CASHIER">Vendedores</MenuItem>
              <MenuItem value="ADMIN">Administradores</MenuItem>
            </TextField>

            <TextField
              select
              label="Estado"
              value={statusFilter}
              onChange={(event) =>
                onStatusFilterChange(event.target.value as StatusFilter)
              }
            >
              <MenuItem value="ALL">Todos los estados</MenuItem>
              <MenuItem value="ACTIVE">Activos</MenuItem>
              <MenuItem value="INACTIVE">Inactivos</MenuItem>
            </TextField>
          </Box>

          <Button
            fullWidth
            variant="outlined"
            disabled={!anyFilterActive}
            onClick={onClearFilters}
          >
            Limpiar filtros
          </Button>

          <Stack
            direction="row"
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            data-testid="users-active-filters"
          >
            <Chip size="small" label={`Rol: ${roleFilterLabel}`} />
            <Chip size="small" label={`Estado: ${statusFilterLabel}`} />
            {query.trim() && (
              <Chip
                size="small"
                variant="outlined"
                label={`Búsqueda: ${query.trim()}`}
              />
            )}
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

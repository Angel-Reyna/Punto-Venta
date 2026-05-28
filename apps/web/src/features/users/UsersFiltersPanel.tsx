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
    <>
      <SearchToolbar
        query={query}
        onQueryChange={onQueryChange}
        resultCount={filteredCount}
        totalCount={totalCount}
        label="Buscar usuarios"
        placeholder="Nombre, correo, rol o estado"
        helperText="Filtra vendedores y administradores sin depender de una tabla horizontal."
      />

      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={1.5}>
            <Stack spacing={0.25}>
              <Typography variant="subtitle1" fontWeight={800}>
                Panel de búsqueda y filtros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enfoca el directorio por rol, estado o texto antes de cambiar
                permisos sensibles.
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
            >
              <TextField
                select
                label="Rol"
                value={roleFilter}
                onChange={(event) =>
                  onRoleFilterChange(event.target.value as RoleFilter)
                }
                sx={{ minWidth: { md: 220 } }}
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
                sx={{ minWidth: { md: 220 } }}
              >
                <MenuItem value="ALL">Todos los estados</MenuItem>
                <MenuItem value="ACTIVE">Activos</MenuItem>
                <MenuItem value="INACTIVE">Inactivos</MenuItem>
              </TextField>

              <Box sx={{ flex: 1 }} />

              <Button
                variant="outlined"
                disabled={!anyFilterActive}
                onClick={onClearFilters}
              >
                Limpiar filtros
              </Button>
            </Stack>

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
    </>
  );
}

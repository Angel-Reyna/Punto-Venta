import { useState, type ReactElement, type ReactNode } from "react";

import { Box, Button, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import FilterListIcon from "@mui/icons-material/FilterList";
import ManageSearchOutlinedIcon from "@mui/icons-material/ManageSearchOutlined";

import { SearchToolbar } from "../../components/SearchToolbar";
import type { RoleFilter, StatusFilter, UserSummary } from "./userShared";

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
  userSummary: UserSummary;
};

const roleOptions: Array<{
  color: "default" | "primary" | "success";
  helper: string;
  icon: ReactElement;
  label: string;
  value: RoleFilter;
}> = [
  {
    color: "default",
    helper: "Todos los accesos",
    icon: <ManageSearchOutlinedIcon />,
    label: "Todos",
    value: "ALL",
  },
  {
    color: "success",
    helper: "Registran ventas",
    icon: <BadgeOutlinedIcon />,
    label: "Vendedores",
    value: "CASHIER",
  },
  {
    color: "primary",
    helper: "Administran la app",
    icon: <AdminPanelSettingsOutlinedIcon />,
    label: "Administradores",
    value: "ADMIN",
  },
];

const statusOptions: Array<{
  color: "default" | "success" | "warning";
  icon: ReactElement;
  label: string;
  value: StatusFilter;
}> = [
  {
    color: "default",
    icon: <ManageSearchOutlinedIcon />,
    label: "Todos",
    value: "ALL",
  },
  {
    color: "success",
    icon: <CheckCircleOutlineIcon />,
    label: "Activos",
    value: "ACTIVE",
  },
  {
    color: "warning",
    icon: <BlockOutlinedIcon />,
    label: "Bloqueados",
    value: "INACTIVE",
  },
];

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
  userSummary,
}: UsersFiltersPanelProps) {
  const [showFilters, setShowFilters] = useState(anyFilterActive);
  const activeFilterLabels = [
    roleFilter !== "ALL" ? `Rol: ${roleFilterLabel}` : null,
    statusFilter !== "ALL" ? `Estado: ${statusFilterLabel}` : null,
    query.trim() ? `Búsqueda: ${query.trim()}` : null,
  ].filter(Boolean) as string[];

  return (
    <Box data-testid="users-control-panel" sx={{ minWidth: 0 }}>
      <Box
        sx={(theme) => ({
          bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.045 : 0.022),
          borderBottom: 1,
          borderColor: alpha(theme.palette.primary.main, 0.12),
          p: { xs: 1.1, sm: 1.25 },
        })}
      >
        <Stack
          direction={{ xs: "column", md: "row" }}
          spacing={1}
          alignItems={{ xs: "stretch", md: "center" }}
          justifyContent="space-between"
          sx={{ mb: 1 }}
        >
          <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0 }}>
            <Box
              sx={(theme) => ({
                alignItems: "center",
                bgcolor: alpha(theme.palette.primary.main, 0.12),
                borderRadius: 2,
                color: "primary.main",
                display: "inline-flex",
                flex: "0 0 auto",
                height: 34,
                justifyContent: "center",
                width: 34,
              })}
            >
              <ManageSearchOutlinedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="subtitle2" fontWeight={950} noWrap>
                Encontrar accesos
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                Busca por nombre, correo, rol o estado.
              </Typography>
            </Box>
          </Stack>

          <Stack
            direction="row"
            spacing={0.75}
            useFlexGap
            flexWrap="wrap"
            justifyContent={{ xs: "flex-start", md: "flex-end" }}
            sx={{ flex: "0 0 auto" }}
          >
            <Button
              size="small"
              variant={showFilters ? "contained" : "outlined"}
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters((current) => !current)}
              aria-expanded={showFilters}
              aria-controls="users-inline-filters"
              sx={{ borderRadius: 2.25, fontWeight: 900, whiteSpace: "nowrap" }}
            >
              Filtros
            </Button>
            <Chip
              color="primary"
              size="small"
              variant="outlined"
              label={`${filteredCount}/${totalCount}`}
              sx={{ fontWeight: 900, height: 32 }}
            />
            <Button size="small" variant="text" disabled={!anyFilterActive} onClick={onClearFilters}>
              Limpiar
            </Button>
          </Stack>
        </Stack>

        <Box
          sx={(theme) => ({
            maxWidth: { xs: "100%", xl: 760 },
            minWidth: 0,
            "& .MuiCard-root": {
              bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.5 : 0.86),
              border: 1,
              borderColor: alpha(theme.palette.primary.main, 0.14),
              boxShadow: "none",
              mb: 0,
            },
            "& .MuiCardContent-root": {
              p: { xs: 1, sm: 1.15 },
              "&:last-child": { pb: { xs: 1, sm: 1.15 } },
            },
            "& .MuiTextField-root .MuiInputBase-root": {
              borderRadius: 2.4,
            },
            "& .MuiTypography-body2": {
              fontSize: "0.78rem",
              lineHeight: 1.35,
              mt: 0.75,
            },
          })}
        >
          <SearchToolbar
            query={query}
            onQueryChange={onQueryChange}
            resultCount={filteredCount}
            totalCount={totalCount}
            label="Buscar usuarios"
            placeholder="Nombre, correo, vendedor o administrador"
            helperText="También entiende activo, bloqueado, vendedor y administrador."
          />
        </Box>
      </Box>

      {showFilters && (
        <Box
          id="users-inline-filters"
          sx={(theme) => ({
            borderBottom: 1,
            borderColor: alpha(theme.palette.primary.main, 0.12),
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.04 : 0.022),
            p: { xs: 1.1, sm: 1.25 },
          })}
        >
          <Box
            sx={{
              display: "grid",
              gap: 1,
              gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            }}
          >
            <QuickFilterGroup label="Rol operativo">
              {roleOptions.map((option) => (
                <Chip
                  key={option.value}
                  clickable
                  size="small"
                  color={option.color}
                  icon={option.icon}
                  label={
                    option.value === "CASHIER"
                      ? `${option.label} · ${userSummary.sellerUsers}`
                      : option.value === "ADMIN"
                        ? `${option.label} · ${userSummary.adminUsers}`
                        : option.label
                  }
                  onClick={() => onRoleFilterChange(option.value)}
                  variant={roleFilter === option.value ? "filled" : "outlined"}
                  sx={{ fontWeight: 900 }}
                  title={option.helper}
                />
              ))}
            </QuickFilterGroup>

            <QuickFilterGroup label="Estado de acceso">
              {statusOptions.map((option) => (
                <Chip
                  key={option.value}
                  clickable
                  size="small"
                  color={option.color}
                  icon={option.icon}
                  label={
                    option.value === "ACTIVE"
                      ? `${option.label} · ${userSummary.activeUsers}`
                      : option.value === "INACTIVE"
                        ? `${option.label} · ${userSummary.inactiveUsers}`
                        : option.label
                  }
                  onClick={() => onStatusFilterChange(option.value)}
                  variant={statusFilter === option.value ? "filled" : "outlined"}
                  sx={{ fontWeight: 900 }}
                />
              ))}
            </QuickFilterGroup>
          </Box>
        </Box>
      )}

      <Box sx={{ px: { xs: 1.1, sm: 1.25 }, py: 0.9 }}>
        <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" data-testid="users-active-filters">
          {activeFilterLabels.length === 0 ? (
            <Chip size="small" label="Sin filtros activos" />
          ) : (
            activeFilterLabels.map((label) => (
              <Chip key={label} size="small" variant="outlined" label={label} />
            ))
          )}
        </Stack>
      </Box>
    </Box>
  );
}

function QuickFilterGroup({ children, label }: { children: ReactNode; label: string }) {
  return (
    <Stack spacing={0.65}>
      <Typography
        variant="caption"
        color="text.secondary"
        fontWeight={900}
        letterSpacing="0.06em"
        textTransform="uppercase"
      >
        {label}
      </Typography>
      <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap">
        {children}
      </Stack>
    </Stack>
  );
}

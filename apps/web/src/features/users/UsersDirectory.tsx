import { useEffect, useMemo, useState, type ReactNode } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Pagination,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import type { SelectChangeEvent } from "@mui/material/Select";
import { alpha } from "@mui/material/styles";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";

import { UserCard } from "./UserCard";
import type { User, UserRole } from "./userShared";
import { getRoleLabel } from "./userShared";

type UsersDirectoryProps = {
  actionsAreBusy: boolean;
  controls?: ReactNode;
  anyFilterActive: boolean;
  currentUserId?: string;
  filteredRows: User[];
  isLoading: boolean;
  onClearFilters: () => void;
  onOpenResetPasswordDialog: (targetUser: User) => void;
  onOpenRoleDialog: (targetUser: User) => void;
  onToggleUser: (targetUser: User) => void;
  togglingUserId: string | null;
  totalCount: number;
};

type RoleSection = {
  emptyText: string;
  icon: ReactNode;
  role: UserRole;
  title: string;
  users: User[];
};

const USER_PAGE_SIZE_OPTIONS = [6, 12, 24] as const;
type UserPageSize = (typeof USER_PAGE_SIZE_OPTIONS)[number];

function getRoleSections(rows: User[]): RoleSection[] {
  const admins = rows.filter((item) => item.role === "ADMIN");
  const sellers = rows.filter((item) => item.role === "CASHIER");

  return [
    {
      emptyText: "Sin administradores visibles con estos filtros.",
      icon: <AdminPanelSettingsIcon />,
      role: "ADMIN",
      title: "Administradores",
      users: admins,
    },
    {
      emptyText: "Sin vendedores visibles con estos filtros.",
      icon: <BadgeOutlinedIcon />,
      role: "CASHIER",
      title: "Vendedores",
      users: sellers,
    },
  ];
}

export function UsersDirectory({
  actionsAreBusy,
  controls,
  anyFilterActive,
  currentUserId,
  filteredRows,
  isLoading,
  onClearFilters,
  onOpenResetPasswordDialog,
  onOpenRoleDialog,
  onToggleUser,
  togglingUserId,
  totalCount,
}: UsersDirectoryProps) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<UserPageSize>(6);
  const pageCount = Math.max(1, Math.ceil(filteredRows.length / pageSize));
  const visibleRows = useMemo(() => {
    const start = (page - 1) * pageSize;

    return filteredRows.slice(start, start + pageSize);
  }, [filteredRows, page, pageSize]);
  const roleSections = getRoleSections(visibleRows);
  const firstVisible = filteredRows.length === 0 ? 0 : (page - 1) * pageSize + 1;
  const lastVisible = Math.min(page * pageSize, filteredRows.length);

  useEffect(() => {
    setPage(1);
  }, [filteredRows, pageSize]);

  function handlePageSizeChange(event: SelectChangeEvent) {
    setPageSize(Number(event.target.value) as UserPageSize);
    setPage(1);
  }

  return (
    <Card
      variant="outlined"
      data-testid="users-directory-panel"
      sx={(theme) => ({
        borderColor: alpha(theme.palette.primary.main, 0.16),
        overflow: "hidden",
      })}
    >
      <CardContent sx={{ p: 0, "&:last-child": { pb: 0 } }}>
        <Box
          sx={(theme) => ({
            alignItems: "center",
            bgcolor: alpha(theme.palette.primary.main, theme.palette.mode === "dark" ? 0.052 : 0.028),
            borderBottom: 1,
            borderColor: alpha(theme.palette.primary.main, 0.14),
            display: "grid",
            gap: 1,
            gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1fr) auto" },
            p: { xs: 1.25, sm: 1.5 },
          })}
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
                height: 36,
                justifyContent: "center",
                width: 36,
              })}
            >
              <GroupsOutlinedIcon />
            </Box>
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="h6" fontWeight={950} sx={{ letterSpacing: -0.25 }}>
                Directorio de accesos
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Encontrar accesos, filtrar y actuar en la misma lista.
              </Typography>
            </Box>
          </Stack>

          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" justifyContent={{ xs: "flex-start", md: "flex-end" }}>
            <Chip
              color="primary"
              data-testid="users-results-heading"
              label={`${filteredRows.length} de ${totalCount} usuarios visibles`}
              size="small"
              variant="outlined"
              sx={{ fontWeight: 900 }}
            />
            {filteredRows.length > 0 && (
              <Chip
                label={`${firstVisible}-${lastVisible} en pantalla`}
                size="small"
                sx={{ fontWeight: 900 }}
                variant="outlined"
              />
            )}
          </Stack>
        </Box>

        {controls && (
          <Box
            sx={(theme) => ({
              borderBottom: 1,
              borderColor: alpha(theme.palette.primary.main, 0.12),
              bgcolor: alpha(theme.palette.background.default, theme.palette.mode === "dark" ? 0.14 : 0.48),
            })}
          >
            {controls}
          </Box>
        )}

        {isLoading ? (
          <Box sx={{ p: { xs: 1.35, sm: 1.5 } }}>
            <Typography color="text.secondary">Cargando usuarios...</Typography>
          </Box>
        ) : filteredRows.length === 0 ? (
          <Box sx={{ p: { xs: 1.35, sm: 1.5 } }}>
            <Stack spacing={0.75} alignItems="flex-start">
              <Typography variant="subtitle1" fontWeight={850}>
                No se encontraron usuarios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ajusta la búsqueda o los filtros para ver otros registros.
              </Typography>
              {anyFilterActive && (
                <Button size="small" variant="outlined" onClick={onClearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </Stack>
          </Box>
        ) : (
          <>
            <Stack spacing={1.25} sx={{ p: { xs: 1.1, sm: 1.35 } }} data-testid="users-role-sections">
              {roleSections.map((section) => (
                <Box key={section.role} data-testid={`users-role-section-${section.role}`}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    justifyContent="space-between"
                    sx={{ mb: 0.85 }}
                  >
                    <Stack direction="row" spacing={0.75} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box
                        sx={(theme) => ({
                          alignItems: "center",
                          bgcolor:
                            section.role === "ADMIN"
                              ? alpha(theme.palette.primary.main, 0.1)
                              : alpha(theme.palette.success.main, 0.1),
                          borderRadius: 1.8,
                          color: section.role === "ADMIN" ? "primary.main" : "success.main",
                          display: "inline-flex",
                          flex: "0 0 auto",
                          height: 30,
                          justifyContent: "center",
                          width: 30,
                        })}
                      >
                        {section.icon}
                      </Box>
                      <Typography component="h3" variant="subtitle2" fontWeight={950}>
                        {section.title}
                      </Typography>
                    </Stack>

                    <Chip
                      size="small"
                      color={section.role === "ADMIN" ? "primary" : "success"}
                      label={`${section.users.length} ${getRoleLabel(section.role).toLowerCase()}${section.users.length === 1 ? "" : "s"}`}
                      variant="outlined"
                      sx={{ fontWeight: 900 }}
                    />
                  </Stack>

                  {section.users.length === 0 ? (
                    <Box
                      sx={(theme) => ({
                        border: `1px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        p: 1.1,
                      })}
                    >
                      <Typography variant="body2" color="text.secondary">
                        {section.emptyText}
                      </Typography>
                    </Box>
                  ) : (
                    <Box
                      sx={{
                        display: "grid",
                        gap: { xs: 1, lg: 1.15 },
                        gridTemplateColumns: {
                          xs: "1fr",
                          lg: "repeat(2, minmax(0, 1fr))",
                          xl: "repeat(3, minmax(0, 1fr))",
                        },
                      }}
                    >
                      {section.users.map((targetUser) => (
                        <UserCard
                          key={targetUser.id}
                          currentUserId={currentUserId}
                          isBusy={actionsAreBusy}
                          onOpenResetPasswordDialog={onOpenResetPasswordDialog}
                          onOpenRoleDialog={onOpenRoleDialog}
                          onToggleUser={onToggleUser}
                          targetUser={targetUser}
                          togglingUserId={togglingUserId}
                        />
                      ))}
                    </Box>
                  )}
                </Box>
              ))}
            </Stack>

            <Box
              sx={{
                alignItems: "center",
                borderTop: 1,
                borderColor: "divider",
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 1,
                justifyContent: "space-between",
                px: { xs: 1.25, sm: 1.5 },
                py: 1.2,
              }}
            >
              <FormControl size="small" sx={{ minWidth: 140 }}>
                <InputLabel id="users-page-size-label">Por página</InputLabel>
                <Select
                  labelId="users-page-size-label"
                  label="Por página"
                  value={String(pageSize)}
                  onChange={handlePageSizeChange}
                >
                  {USER_PAGE_SIZE_OPTIONS.map((option) => (
                    <MenuItem key={option} value={String(option)}>
                      {option} usuarios
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Pagination color="primary" count={pageCount} page={page} onChange={(_, value) => setPage(value)} />
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
}

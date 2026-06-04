import type { ReactNode } from "react";

import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";
import { alpha } from "@mui/material/styles";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";

import { UserCard } from "./UserCard";
import type { User, UserRole } from "./userShared";
import { getRoleLabel } from "./userShared";

type UsersDirectoryProps = {
  actionsAreBusy: boolean;
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
  description: string;
  emptyText: string;
  icon: ReactNode;
  role: UserRole;
  title: string;
  users: User[];
};

function getRoleSections(rows: User[]): RoleSection[] {
  const admins = rows.filter((item) => item.role === "ADMIN");
  const sellers = rows.filter((item) => item.role === "CASHIER");

  return [
    {
      description: "Personas con permisos para gestionar catálogo, inventario, reportes y usuarios.",
      emptyText: "No hay administradores visibles con los filtros actuales.",
      icon: <AdminPanelSettingsIcon />,
      role: "ADMIN",
      title: "Administradores",
      users: admins,
    },
    {
      description: "Personas enfocadas en registrar ventas y consultar información operativa permitida.",
      emptyText: "No hay vendedores visibles con los filtros actuales.",
      icon: <BadgeOutlinedIcon />,
      role: "CASHIER",
      title: "Vendedores",
      users: sellers,
    },
  ];
}

export function UsersDirectory({
  actionsAreBusy,
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
  const roleSections = getRoleSections(filteredRows);

  return (
    <>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1.5}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6">Directorio de personas</Typography>
              <Typography variant="body2" color="text.secondary">
                Usuarios agrupados por responsabilidad para decidir cambios de rol,
                contraseñas y accesos sin depender de una tabla horizontal.
              </Typography>
            </Box>
            <Chip
              color="primary"
              data-testid="users-results-heading"
              label={`${filteredRows.length} de ${totalCount} usuarios visibles`}
              variant="outlined"
            />
          </Stack>
        </CardContent>
      </Card>

      {isLoading ? (
        <Card variant="outlined">
          <CardContent>
            <Typography color="text.secondary">Cargando usuarios...</Typography>
          </CardContent>
        </Card>
      ) : filteredRows.length === 0 ? (
        <Card variant="outlined">
          <CardContent>
            <Stack spacing={1} alignItems="flex-start">
              <Typography variant="subtitle1" fontWeight={700}>
                No se encontraron usuarios
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Ajusta la búsqueda o los filtros para ver otros registros.
              </Typography>
              {anyFilterActive && (
                <Button variant="outlined" onClick={onClearFilters}>
                  Limpiar filtros
                </Button>
              )}
            </Stack>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2} data-testid="users-role-sections">
          {roleSections.map((section) => (
            <Card
              key={section.role}
              variant="outlined"
              data-testid={`users-role-section-${section.role}`}
              sx={(theme) => ({
                borderColor:
                  section.role === "ADMIN"
                    ? alpha(theme.palette.primary.main, 0.28)
                    : alpha(theme.palette.success.main, 0.28),
                overflow: "hidden",
              })}
            >
              <CardContent>
                <Stack spacing={1.5}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.25}
                    alignItems={{ xs: "flex-start", sm: "center" }}
                    justifyContent="space-between"
                  >
                    <Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
                      <Box
                        sx={(theme) => ({
                          alignItems: "center",
                          bgcolor:
                            section.role === "ADMIN"
                              ? alpha(theme.palette.primary.main, 0.12)
                              : alpha(theme.palette.success.main, 0.12),
                          borderRadius: 2,
                          color: section.role === "ADMIN" ? "primary.main" : "success.main",
                          display: "inline-flex",
                          flex: "0 0 auto",
                          height: 40,
                          justifyContent: "center",
                          width: 40,
                        })}
                      >
                        {section.icon}
                      </Box>
                      <Box sx={{ minWidth: 0 }}>
                        <Typography component="h3" variant="subtitle1" fontWeight={900}>
                          {section.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {section.description}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      size="small"
                      color={section.role === "ADMIN" ? "primary" : "success"}
                      label={`${section.users.length} ${getRoleLabel(section.role).toLowerCase()}${section.users.length === 1 ? "" : "s"} visibles`}
                      variant="outlined"
                    />
                  </Stack>

                  {section.users.length === 0 ? (
                    <Box
                      sx={(theme) => ({
                        border: `1px dashed ${theme.palette.divider}`,
                        borderRadius: 2,
                        p: 2,
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
                        gap: { xs: 1.5, md: 2 },
                        gridTemplateColumns: {
                          xs: "1fr",
                          md: "repeat(2, minmax(0, 1fr))",
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
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Stack>
      )}
    </>
  );
}

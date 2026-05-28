import { Box, Button, Card, CardContent, Chip, Stack, Typography } from "@mui/material";

import { UserCard } from "./UserCard";
import type { User } from "./userShared";

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
  return (
    <>
      <Card variant="outlined" sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            alignItems={{ xs: "flex-start", sm: "center" }}
            justifyContent="space-between"
          >
            <Box>
              <Typography variant="h6">Usuarios registrados</Typography>
              <Typography variant="body2" color="text.secondary">
                Desactiva accesos que ya no se usen. Al desactivar un usuario,
                sus sesiones activas quedan revocadas.
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
        <Box
          sx={{
            display: "grid",
            gap: 2,
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
          }}
        >
          {filteredRows.map((targetUser) => (
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
    </>
  );
}

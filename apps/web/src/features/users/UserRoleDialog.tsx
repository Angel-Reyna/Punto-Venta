import { Alert, Button, MenuItem, Stack, TextField } from "@mui/material";

import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import type { User, UserRole } from "./userShared";

type UserRoleDialogProps = {
  isUpdatingRole: boolean;
  onClose: () => void;
  onSave: () => void;
  onSelectedRoleChange: (role: UserRole) => void;
  selectedRole: UserRole;
  user: User | null;
};

export function UserRoleDialog({
  isUpdatingRole,
  onClose,
  onSave,
  onSelectedRoleChange,
  selectedRole,
  user,
}: UserRoleDialogProps) {
  return (
    <ResponsiveDialog
      open={Boolean(user)}
      onClose={onClose}
      disableClose={isUpdatingRole}
      title="Cambiar rol"
      description="Actualiza el acceso operativo de este usuario."
      actions={
        <>
          <Button variant="outlined" onClick={onClose} disabled={isUpdatingRole}>
            Cancelar
          </Button>
          <Button
            data-testid="users-role-save"
            disabled={isUpdatingRole || !user || selectedRole === user.role}
            onClick={onSave}
          >
            {isUpdatingRole ? "Guardando..." : "Guardar rol"}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Alert severity="warning">
          Cambiar el rol afecta los permisos disponibles para este usuario.
        </Alert>

        <TextField
          select
          label="Rol"
          value={selectedRole}
          inputProps={{ "data-testid": "users-role-select" }}
          onChange={(event) =>
            onSelectedRoleChange(event.target.value as UserRole)
          }
        >
          <MenuItem value="CASHIER">Vendedor</MenuItem>
          <MenuItem value="ADMIN">Administrador</MenuItem>
        </TextField>
      </Stack>
    </ResponsiveDialog>
  );
}

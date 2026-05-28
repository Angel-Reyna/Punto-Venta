import {
  Alert,
  Button,
  FormHelperText,
  Stack,
  TextField,
} from "@mui/material";

import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import type { ResetPasswordForm, User } from "./userShared";

type UserResetPasswordDialogProps = {
  form: ResetPasswordForm;
  isResettingPassword: boolean;
  onClose: () => void;
  onFormChange: (form: ResetPasswordForm) => void;
  onSave: () => void;
  passwordIsValid: boolean;
  passwordMatches: boolean;
  resetPasswordIsInvalid: boolean;
  user: User | null;
};

export function UserResetPasswordDialog({
  form,
  isResettingPassword,
  onClose,
  onFormChange,
  onSave,
  passwordIsValid,
  passwordMatches,
  resetPasswordIsInvalid,
  user,
}: UserResetPasswordDialogProps) {
  return (
    <ResponsiveDialog
      open={Boolean(user)}
      onClose={onClose}
      disableClose={isResettingPassword}
      title="Asignar nueva contraseña"
      description="Genera una contraseña temporal y compártela por un canal seguro."
      actions={
        <>
          <Button
            variant="outlined"
            onClick={onClose}
            disabled={isResettingPassword}
          >
            Cancelar
          </Button>
          <Button
            data-testid="users-reset-password-save"
            disabled={resetPasswordIsInvalid}
            onClick={onSave}
          >
            {isResettingPassword ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </>
      }
    >
      <Stack spacing={2}>
        <Alert severity="info">
          Usa una contraseña temporal y compártela por un canal seguro. El usuario
          debe cambiarla después si habilitamos ese flujo.
        </Alert>

        <TextField
          label="Nueva contraseña"
          type="password"
          autoComplete="new-password"
          value={form.password}
          inputProps={{ "data-testid": "users-reset-password" }}
          error={Boolean(form.password) && !passwordIsValid}
          helperText="8 a 72 caracteres, con mayúscula, minúscula y número."
          onChange={(event) =>
            onFormChange({
              ...form,
              password: event.target.value,
            })
          }
        />

        <TextField
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          inputProps={{ "data-testid": "users-reset-password-confirm" }}
          error={Boolean(form.confirmPassword) && !passwordMatches}
          onChange={(event) =>
            onFormChange({
              ...form,
              confirmPassword: event.target.value,
            })
          }
        />

        {!passwordMatches && form.confirmPassword && (
          <FormHelperText error>Las contraseñas no coinciden.</FormHelperText>
        )}
      </Stack>
    </ResponsiveDialog>
  );
}

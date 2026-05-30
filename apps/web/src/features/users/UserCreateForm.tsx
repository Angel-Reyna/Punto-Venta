import { FormEvent } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  Divider,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";

import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { isPasswordValid } from "./userShared";
import type { UserForm, UserRole } from "./userShared";

type UserCreateFormProps = {
  createUserDisabledReason: string;
  form: UserForm;
  formIsInvalid: boolean;
  isCreating: boolean;
  onFormChange: (form: UserForm) => void;
  onSubmit: () => void;
};

export function UserCreateForm({
  createUserDisabledReason,
  form,
  formIsInvalid,
  isCreating,
  onFormChange,
  onSubmit,
}: UserCreateFormProps) {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    onSubmit();
  }

  return (
    <Card
      sx={(theme) => ({
        border: `1px solid ${theme.palette.divider}`,
        boxShadow: theme.shadows[1],
        mb: 2,
      })}
    >
      <CardContent>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1.5}
          alignItems={{ xs: "flex-start", sm: "center" }}
          sx={{ mb: 2 }}
        >
          <Box
            sx={{
              alignItems: "center",
              bgcolor: "primary.main",
              borderRadius: 2,
              color: "primary.contrastText",
              display: "flex",
              height: 44,
              justifyContent: "center",
              width: 44,
            }}
          >
            <PersonAddAlt1OutlinedIcon />
          </Box>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="h6">Crear usuario</Typography>
            <Typography variant="body2" color="text.secondary">
              Alta controlada para vendedores o administradores. No se permite
              el registro público desde la pantalla de inicio de sesión.
            </Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 2 }} />

        <Box component="form" onSubmit={handleSubmit} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "minmax(0, 1fr)",
              gap: 2,
              alignItems: "stretch",
              minWidth: 0,
            }}
          >
            <TextField
              fullWidth
              label="Nombre completo"
              placeholder="Ej. Ana López"
              value={form.name}
              inputProps={{ "data-testid": "users-form-name" }}
              error={Boolean(form.name) && form.name.trim().length < 2}
              helperText="Mínimo 2 caracteres."
              onChange={(event) =>
                onFormChange({
                  ...form,
                  name: event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              label="Correo electrónico"
              placeholder="usuario@empresa.com"
              type="email"
              autoComplete="email"
              value={form.email}
              inputProps={{ "data-testid": "users-form-email" }}
              helperText="Será usado para iniciar sesión."
              onChange={(event) =>
                onFormChange({
                  ...form,
                  email: event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              label="Contraseña temporal"
              type="password"
              autoComplete="new-password"
              value={form.password}
              inputProps={{ "data-testid": "users-form-password" }}
              error={Boolean(form.password) && !isPasswordValid(form.password)}
              helperText="8 a 72 caracteres, con mayúscula, minúscula y número."
              onChange={(event) =>
                onFormChange({
                  ...form,
                  password: event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              select
              label="Rol"
              value={form.role}
              helperText="Vendedor no administra usuarios."
              inputProps={{ "data-testid": "users-form-role" }}
              onChange={(event) =>
                onFormChange({
                  ...form,
                  role: event.target.value as UserRole,
                })
              }
            >
              <MenuItem value="CASHIER">Vendedor</MenuItem>
              <MenuItem value="ADMIN">Administrador</MenuItem>
            </TextField>

            <Box sx={{ minWidth: 0 }}>
              <Button
                fullWidth
                type="submit"
                data-testid="users-form-submit"
                disabled={formIsInvalid}
                startIcon={<PersonAddAlt1OutlinedIcon />}
                sx={{ mt: 0.25 }}
              >
                {isCreating ? "Creando..." : "Crear usuario"}
              </Button>
              <ActionDisabledReason
                message={formIsInvalid ? createUserDisabledReason : ""}
              />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

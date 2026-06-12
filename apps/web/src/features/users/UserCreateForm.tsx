import { FormEvent } from "react";

import {
  Box,
  Button,
  Card,
  CardContent,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

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
      data-testid="users-create-card"
      variant="outlined"
      sx={(theme) => ({
        borderColor: alpha(theme.palette.success.main, 0.18),
        overflow: "hidden",
      })}
    >
      <CardContent sx={{ p: { xs: 1.35, md: 1.5 }, "&:last-child": { pb: { xs: 1.35, md: 1.5 } } }}>
        <Box component="form" onSubmit={handleSubmit} sx={{ minWidth: 0 }}>
          <Box
            sx={{
              alignItems: "start",
              display: "grid",
              gap: 1,
              gridTemplateColumns: {
                xs: "minmax(0, 1fr)",
                sm: "repeat(2, minmax(0, 1fr))",
                xl: "1.2fr 1.35fr 1.15fr 0.9fr auto",
              },
              minWidth: 0,
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ minWidth: 0, gridColumn: { xs: "auto", sm: "1 / -1", xl: "auto" } }}>
              <Box
                sx={(theme) => ({
                  alignItems: "center",
                  bgcolor: alpha(theme.palette.success.main, 0.13),
                  borderRadius: 2,
                  color: "success.main",
                  display: "inline-flex",
                  flex: "0 0 auto",
                  height: 36,
                  justifyContent: "center",
                  width: 36,
                })}
              >
                <PersonAddAlt1OutlinedIcon />
              </Box>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={950} noWrap>
                  Alta rápida
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Vendedor por defecto, contraseña temporal.
                </Typography>
              </Box>
            </Stack>

            <TextField
              fullWidth
              size="small"
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
              size="small"
              label="Correo electrónico"
              placeholder="usuario@empresa.com"
              type="email"
              autoComplete="email"
              value={form.email}
              inputProps={{ "data-testid": "users-form-email" }}
              helperText="Para iniciar sesión."
              onChange={(event) =>
                onFormChange({
                  ...form,
                  email: event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              size="small"
              label="Contraseña temporal"
              type="password"
              autoComplete="new-password"
              value={form.password}
              inputProps={{ "data-testid": "users-form-password" }}
              error={Boolean(form.password) && !isPasswordValid(form.password)}
              helperText="8+ caracteres, mayúscula, minúscula y número."
              onChange={(event) =>
                onFormChange({
                  ...form,
                  password: event.target.value,
                })
              }
            />

            <TextField
              fullWidth
              size="small"
              select
              label="Rol"
              value={form.role}
              helperText="Vendedor no administra."
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
                variant="contained"
                type="submit"
                data-testid="users-form-submit"
                disabled={formIsInvalid}
                startIcon={<PersonAddAlt1OutlinedIcon />}
                sx={{ borderRadius: 2.25, minHeight: 40, whiteSpace: "nowrap" }}
              >
                {isCreating ? "Creando..." : "Crear"}
              </Button>
              <ActionDisabledReason message={formIsInvalid ? createUserDisabledReason : ""} />
            </Box>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
}

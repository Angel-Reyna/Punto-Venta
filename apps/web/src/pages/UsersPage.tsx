import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormHelperText,
  MenuItem,
  Stack,
  TextField,
  Typography
} from "@mui/material";

import { DataGrid, GridColDef } from "@mui/x-data-grid";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { PageHeader } from "../components/PageHeader";
import { getApiErrorMessage } from "../utils/apiError";

type UserRole = "ADMIN" | "CASHIER";

type User = {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
};

const initialForm: {
  name: string;
  email: string;
  password: string;
  role: UserRole;
} = {
  name: "",
  email: "",
  password: "",
  role: "CASHIER"
};

const initialResetPasswordForm = {
  password: "",
  confirmPassword: ""
};

function isPasswordValid(password: string) {
  return (
    password.length >= 8 &&
    password.length <= 72 &&
    /[A-Z]/.test(password) &&
    /[a-z]/.test(password) &&
    /[0-9]/.test(password)
  );
}

function getRoleLabel(role: UserRole) {
  return role === "ADMIN" ? "Administrador" : "Vendedor";
}

export function UsersPage() {
  const { user: currentUser } = useAuth();

  const [rows, setRows] = useState<User[]>([]);
  const [form, setForm] = useState(initialForm);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("CASHIER");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState(
    initialResetPasswordForm
  );
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  async function load() {
    try {
      setIsLoading(true);
      setError("");

      const response = await api.get<User[]>("/users");

      setRows(response.data);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudieron cargar los usuarios."));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault();

    setMessage("");
    setError("");

    try {
      setIsCreating(true);

      await api.post("/users", {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        password: form.password,
        role: form.role
      });

      setMessage(
        form.role === "CASHIER"
          ? "Vendedor creado correctamente. Ya puede iniciar sesión."
          : "Administrador creado correctamente."
      );

      setForm(initialForm);

      await load();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo crear el usuario. Revisa nombre, correo, contraseña y rol."
        )
      );
    } finally {
      setIsCreating(false);
    }
  }

  async function toggleUser(targetUser: User) {
    setMessage("");
    setError("");

    if (targetUser.id === currentUser?.id) {
      setError("No puedes desactivar tu propio usuario.");
      return;
    }

    try {
      setTogglingUserId(targetUser.id);

      await api.patch(`/users/${targetUser.id}/toggle`);

      setMessage(
        targetUser.isActive
          ? `El acceso de ${targetUser.name} fue desactivado.`
          : `El acceso de ${targetUser.name} fue activado.`
      );

      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo actualizar el usuario."));
    } finally {
      setTogglingUserId(null);
    }
  }

  function openRoleDialog(targetUser: User) {
    setMessage("");
    setError("");
    setRoleDialogUser(targetUser);
    setSelectedRole(targetUser.role);
  }

  function closeRoleDialog() {
    if (isUpdatingRole) return;
    setRoleDialogUser(null);
  }

  async function updateUserRole() {
    if (!roleDialogUser) return;

    setMessage("");
    setError("");

    try {
      setIsUpdatingRole(true);

      await api.patch(`/users/${roleDialogUser.id}/role`, {
        role: selectedRole
      });

      setMessage(`Rol actualizado para ${roleDialogUser.name}.`);
      setRoleDialogUser(null);

      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo cambiar el rol."));
    } finally {
      setIsUpdatingRole(false);
    }
  }

  function openResetPasswordDialog(targetUser: User) {
    setMessage("");
    setError("");
    setResetPasswordUser(targetUser);
    setResetPasswordForm(initialResetPasswordForm);
  }

  function closeResetPasswordDialog() {
    if (isResettingPassword) return;
    setResetPasswordUser(null);
    setResetPasswordForm(initialResetPasswordForm);
  }

  async function resetPassword() {
    if (!resetPasswordUser) return;

    setMessage("");
    setError("");

    try {
      setIsResettingPassword(true);

      await api.patch(`/users/${resetPasswordUser.id}/password`, {
        password: resetPasswordForm.password
      });

      setMessage(`Contraseña actualizada para ${resetPasswordUser.name}.`);
      closeResetPasswordDialog();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo actualizar la contraseña."));
    } finally {
      setIsResettingPassword(false);
    }
  }

  const passwordIsValid = isPasswordValid(form.password);

  const formIsInvalid =
    !form.name.trim() ||
    !form.email.trim() ||
    !passwordIsValid ||
    !form.role ||
    isCreating;

  const resetPasswordIsValid = isPasswordValid(resetPasswordForm.password);
  const resetPasswordMatches =
    resetPasswordForm.password === resetPasswordForm.confirmPassword;
  const resetPasswordIsInvalid =
    !resetPasswordIsValid || !resetPasswordMatches || isResettingPassword;

  const activeUsers = useMemo(
    () => rows.filter((item) => item.isActive).length,
    [rows]
  );

  const cashierUsers = useMemo(
    () => rows.filter((item) => item.role === "CASHIER").length,
    [rows]
  );

  const adminUsers = useMemo(
    () => rows.filter((item) => item.role === "ADMIN").length,
    [rows]
  );

  const columns: GridColDef<User>[] = [
    {
      field: "name",
      headerName: "Nombre",
      flex: 1,
      minWidth: 180
    },
    {
      field: "email",
      headerName: "Correo",
      flex: 1,
      minWidth: 240
    },
    {
      field: "role",
      headerName: "Rol",
      width: 160,
      renderCell: (params) => (
        <Chip
          label={getRoleLabel(params.row.role)}
          size="small"
          color={params.row.role === "ADMIN" ? "primary" : "success"}
        />
      )
    },
    {
      field: "isActive",
      headerName: "Estado",
      width: 140,
      renderCell: (params) => (
        <Chip
          label={params.row.isActive ? "Activo" : "Inactivo"}
          size="small"
          color={params.row.isActive ? "success" : "default"}
          variant="outlined"
        />
      )
    },
    {
      field: "createdAt",
      headerName: "Creado",
      width: 190,
      valueFormatter: (value) => new Date(value).toLocaleString()
    },
    {
      field: "actions",
      headerName: "Acciones",
      width: 360,
      sortable: false,
      filterable: false,
      renderCell: (params) => {
        const targetUser = params.row;
        const isSelf = targetUser.id === currentUser?.id;

        return (
          <Stack direction="row" spacing={1}>
            <Button
              size="small"
              variant="outlined"
              disabled={isSelf || Boolean(togglingUserId) || isUpdatingRole || isResettingPassword}
              onClick={() => toggleUser(targetUser)}
            >
              {togglingUserId === targetUser.id ? "Guardando..." : targetUser.isActive ? "Desactivar" : "Activar"}
            </Button>

            <Button
              size="small"
              variant="outlined"
              disabled={Boolean(togglingUserId) || isUpdatingRole || isResettingPassword}
              onClick={() => openRoleDialog(targetUser)}
            >
              Cambiar rol
            </Button>

            <Button
              size="small"
              variant="outlined"
              disabled={Boolean(togglingUserId) || isUpdatingRole || isResettingPassword}
              onClick={() => openResetPasswordDialog(targetUser)}
            >
              Nueva contraseña
            </Button>
          </Stack>
        );
      }
    }
  ];

  return (
    <>
      <PageHeader
        title="Usuarios"
        subtitle="Administra accesos internos. Crea vendedores, asigna roles y bloquea usuarios cuando sea necesario."
      />

      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Chip color="primary" label="Acceso exclusivo ADMIN" />
        <Chip variant="outlined" label={`${activeUsers} activos`} />
        <Chip variant="outlined" label={`${cashierUsers} vendedores`} />
        <Chip variant="outlined" label={`${adminUsers} administradores`} />
      </Stack>

      {message && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {message}
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="h6">Crear usuario</Typography>
            <Typography variant="body2" color="text.secondary">
              Usa este formulario para crear vendedores o administradores. No se
              permite el registro público desde la pantalla de inicio de sesión.
            </Typography>
          </Stack>

          <Divider sx={{ mb: 2 }} />

          <Box component="form" onSubmit={submit}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1.2fr 1.4fr 1.2fr 1fr auto"
                },
                gap: 2,
                alignItems: "start"
              }}
            >
              <TextField
                label="Nombre completo"
                placeholder="Ej. Ana López"
                value={form.name}
                error={Boolean(form.name) && form.name.trim().length < 2}
                helperText="Mínimo 2 caracteres."
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value
                  })
                }
              />

              <TextField
                label="Correo electrónico"
                placeholder="usuario@empresa.com"
                type="email"
                value={form.email}
                helperText="Será usado para iniciar sesión."
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value
                  })
                }
              />

              <TextField
                label="Contraseña temporal"
                type="password"
                value={form.password}
                error={Boolean(form.password) && !passwordIsValid}
                helperText="8 a 72 caracteres, con mayúscula, minúscula y número."
                onChange={(event) =>
                  setForm({
                    ...form,
                    password: event.target.value
                  })
                }
              />

              <TextField
                select
                label="Rol"
                value={form.role}
                helperText="Vendedor no administra usuarios."
                onChange={(event) =>
                  setForm({
                    ...form,
                    role: event.target.value as UserRole
                  })
                }
              >
                <MenuItem value="CASHIER">Vendedor</MenuItem>
                <MenuItem value="ADMIN">Administrador</MenuItem>
              </TextField>

              <Button type="submit" disabled={formIsInvalid} sx={{ mt: 0.25 }}>
                {isCreating ? "Creando..." : "Crear usuario"}
              </Button>
            </Box>
          </Box>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ overflowX: "auto" }}>
          <Stack spacing={0.5} sx={{ mb: 2 }}>
            <Typography variant="h6">Usuarios registrados</Typography>
            <Typography variant="body2" color="text.secondary">
              Desactiva accesos que ya no se usen. Al desactivar un usuario, sus
              sesiones activas quedan revocadas.
            </Typography>
          </Stack>

          <Box sx={{ minWidth: 1100 }}>
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              loading={isLoading}
              disableRowSelectionOnClick
              initialState={{
                pagination: {
                  paginationModel: {
                    pageSize: 10
                  }
                }
              }}
              pageSizeOptions={[10, 25, 50]}
            />
          </Box>
        </CardContent>
      </Card>

      <Dialog open={Boolean(roleDialogUser)} onClose={closeRoleDialog} fullWidth>
        <DialogTitle>Cambiar rol</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="warning">
              Cambiar el rol afecta los permisos disponibles para este usuario.
            </Alert>

            <TextField
              select
              label="Rol"
              value={selectedRole}
              onChange={(event) => setSelectedRole(event.target.value as UserRole)}
            >
              <MenuItem value="CASHIER">Vendedor</MenuItem>
              <MenuItem value="ADMIN">Administrador</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeRoleDialog}>
            Cancelar
          </Button>
          <Button
            disabled={
              isUpdatingRole ||
              !roleDialogUser ||
              selectedRole === roleDialogUser.role
            }
            onClick={updateUserRole}
          >
            {isUpdatingRole ? "Guardando..." : "Guardar rol"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(resetPasswordUser)}
        onClose={closeResetPasswordDialog}
        fullWidth
      >
        <DialogTitle>Asignar nueva contraseña</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Alert severity="info">
              Usa una contraseña temporal y compártela por un canal seguro. El
              usuario debe cambiarla después si habilitamos ese flujo.
            </Alert>

            <TextField
              label="Nueva contraseña"
              type="password"
              value={resetPasswordForm.password}
              error={Boolean(resetPasswordForm.password) && !resetPasswordIsValid}
              helperText="8 a 72 caracteres, con mayúscula, minúscula y número."
              onChange={(event) =>
                setResetPasswordForm({
                  ...resetPasswordForm,
                  password: event.target.value
                })
              }
            />

            <TextField
              label="Confirmar contraseña"
              type="password"
              value={resetPasswordForm.confirmPassword}
              error={
                Boolean(resetPasswordForm.confirmPassword) && !resetPasswordMatches
              }
              onChange={(event) =>
                setResetPasswordForm({
                  ...resetPasswordForm,
                  confirmPassword: event.target.value
                })
              }
            />

            {!resetPasswordMatches && resetPasswordForm.confirmPassword && (
              <FormHelperText error>
                Las contraseñas no coinciden.
              </FormHelperText>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button variant="outlined" onClick={closeResetPasswordDialog}>
            Cancelar
          </Button>
          <Button disabled={resetPasswordIsInvalid} onClick={resetPassword}>
            {isResettingPassword ? "Guardando..." : "Guardar contraseña"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

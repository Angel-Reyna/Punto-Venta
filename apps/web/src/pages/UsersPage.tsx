import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Avatar,
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

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import KeyOutlinedIcon from "@mui/icons-material/KeyOutlined";
import MailOutlineIcon from "@mui/icons-material/MailOutline";
import ManageAccountsOutlinedIcon from "@mui/icons-material/ManageAccountsOutlined";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";

import { api } from "../api/client";
import { useAuth } from "../auth/AuthContext";
import { ActionDisabledReason } from "../components/ActionDisabledReason";
import { PageHeader } from "../components/PageHeader";
import { SearchToolbar } from "../components/SearchToolbar";
import { StatusFeedback } from "../components/StatusFeedback";
import { getApiErrorMessage } from "../utils/apiError";

type UserRole = "ADMIN" | "CASHIER";
type RoleFilter = "ALL" | UserRole;
type StatusFilter = "ALL" | "ACTIVE" | "INACTIVE";

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

function getRoleDescription(role: UserRole) {
  return role === "ADMIN"
    ? "Gestiona catálogo, inventario, vendedores y reportes."
    : "Registra ventas y consulta información operativa permitida.";
}

function normalizeSearch(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function formatCreatedAt(value: string) {
  return new Date(value).toLocaleString("es-MX", {
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    year: "numeric"
  });
}

function getInitials(name: string, email: string) {
  const source = name.trim() || email.trim();
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return source.slice(0, 2).toUpperCase() || "US";
}

function getUserSearchText(user: User) {
  return normalizeSearch(
    [
      user.name,
      user.email,
      getRoleLabel(user.role),
      user.role,
      user.isActive ? "activo" : "inactivo"
    ].join(" ")
  );
}

type SummaryCardProps = {
  icon: React.ReactNode;
  label: string;
  value: number;
  helper: string;
};

function SummaryCard({ icon, label, value, helper }: SummaryCardProps) {
  return (
    <Card variant="outlined" sx={{ height: "100%" }}>
      <CardContent>
        <Stack direction="row" spacing={1.5} alignItems="flex-start">
          <Avatar
            variant="rounded"
            sx={{
              bgcolor: "action.hover",
              color: "text.primary",
              height: 40,
              width: 40
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ minWidth: 0 }}>
            <Typography variant="body2" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="h5" fontWeight={800}>
              {value}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {helper}
            </Typography>
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

type UserCardProps = {
  currentUserId?: string;
  isBusy: boolean;
  onOpenResetPasswordDialog: (targetUser: User) => void;
  onOpenRoleDialog: (targetUser: User) => void;
  onToggleUser: (targetUser: User) => void;
  targetUser: User;
  togglingUserId: string | null;
};

function UserCard({
  currentUserId,
  isBusy,
  onOpenResetPasswordDialog,
  onOpenRoleDialog,
  onToggleUser,
  targetUser,
  togglingUserId
}: UserCardProps) {
  const isSelf = targetUser.id === currentUserId;
  const roleLabel = getRoleLabel(targetUser.role);
  const statusLabel = targetUser.isActive ? "Activo" : "Inactivo";
  const toggleLabel = targetUser.isActive ? "Desactivar" : "Activar";

  return (
    <Card
      variant="outlined"
      sx={{
        borderColor: targetUser.isActive ? "divider" : "action.disabledBackground",
        height: "100%",
        opacity: targetUser.isActive ? 1 : 0.82
      }}
    >
      <CardContent>
        <Stack spacing={2}>
          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar
              sx={{
                bgcolor: targetUser.role === "ADMIN" ? "primary.main" : "success.main",
                color: "primary.contrastText",
                flex: "0 0 auto"
              }}
            >
              {getInitials(targetUser.name, targetUser.email)}
            </Avatar>

            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                sx={{ minWidth: 0 }}
              >
                <Typography variant="subtitle1" fontWeight={800} noWrap>
                  {targetUser.name}
                </Typography>
                {isSelf && <Chip size="small" label="Tú" variant="outlined" />}
              </Stack>

              <Stack
                direction="row"
                spacing={0.75}
                alignItems="center"
                sx={{ color: "text.secondary", minWidth: 0 }}
              >
                <MailOutlineIcon sx={{ fontSize: 16, flex: "0 0 auto" }} />
                <Typography variant="body2" noWrap title={targetUser.email}>
                  {targetUser.email}
                </Typography>
              </Stack>
            </Box>
          </Stack>

          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            <Chip
              size="small"
              icon={
                targetUser.role === "ADMIN" ? (
                  <AdminPanelSettingsIcon />
                ) : (
                  <BadgeOutlinedIcon />
                )
              }
              label={roleLabel}
              color={targetUser.role === "ADMIN" ? "primary" : "success"}
              variant="outlined"
            />
            <Chip
              size="small"
              icon={
                targetUser.isActive ? (
                  <CheckCircleOutlineIcon />
                ) : (
                  <BlockOutlinedIcon />
                )
              }
              label={statusLabel}
              color={targetUser.isActive ? "success" : "default"}
              variant={targetUser.isActive ? "outlined" : "filled"}
            />
          </Stack>

          <Box>
            <Typography variant="body2" color="text.secondary">
              {getRoleDescription(targetUser.role)}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Creado: {formatCreatedAt(targetUser.createdAt)}
            </Typography>
          </Box>

          {isSelf && (
            <Alert severity="info" variant="outlined">
              Este es tu usuario actual. No puedes desactivar tu propio acceso.
            </Alert>
          )}

          <Divider />

          <Stack
            direction={{ xs: "column", sm: "row" }}
            spacing={1}
            useFlexGap
            flexWrap="wrap"
            sx={{
              "& .MuiButton-root": {
                justifyContent: "center"
              }
            }}
          >
            <Button
              size="small"
              variant="outlined"
              disabled={isSelf || isBusy}
              onClick={() => onToggleUser(targetUser)}
            >
              {togglingUserId === targetUser.id ? "Guardando..." : toggleLabel}
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<ManageAccountsOutlinedIcon />}
              disabled={isBusy}
              onClick={() => onOpenRoleDialog(targetUser)}
            >
              Cambiar rol
            </Button>

            <Button
              size="small"
              variant="outlined"
              startIcon={<KeyOutlinedIcon />}
              disabled={isBusy}
              onClick={() => onOpenResetPasswordDialog(targetUser)}
            >
              Nueva contraseña
            </Button>
          </Stack>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function UsersPage() {
  const { user: currentUser } = useAuth();

  const [rows, setRows] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
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

  const createUserDisabledReason = (() => {
    if (!form.name.trim()) return "Captura el nombre completo.";
    if (!form.email.trim()) return "Captura el correo electrónico.";
    if (!passwordIsValid) return "La contraseña debe tener mayúscula, minúscula, número y 8 a 72 caracteres.";
    if (!form.role) return "Selecciona un rol.";
    if (isCreating) return "Creando usuario...";

    return "";
  })();

  const activeUsers = useMemo(
    () => rows.filter((item) => item.isActive).length,
    [rows]
  );

  const inactiveUsers = useMemo(
    () => rows.filter((item) => !item.isActive).length,
    [rows]
  );

  const sellerUsers = useMemo(
    () => rows.filter((item) => item.role === "CASHIER").length,
    [rows]
  );

  const adminUsers = useMemo(
    () => rows.filter((item) => item.role === "ADMIN").length,
    [rows]
  );

  const filteredRows = useMemo(() => {
    const normalizedQuery = normalizeSearch(query);

    return rows.filter((item) => {
      const matchesQuery = normalizedQuery
        ? getUserSearchText(item).includes(normalizedQuery)
        : true;
      const matchesRole = roleFilter === "ALL" || item.role === roleFilter;
      const matchesStatus =
        statusFilter === "ALL" ||
        (statusFilter === "ACTIVE" ? item.isActive : !item.isActive);

      return matchesQuery && matchesRole && matchesStatus;
    });
  }, [query, roleFilter, rows, statusFilter]);

  const anyFilterActive =
    Boolean(query.trim()) || roleFilter !== "ALL" || statusFilter !== "ALL";

  const actionsAreBusy =
    Boolean(togglingUserId) || isUpdatingRole || isResettingPassword;

  return (
    <>
      <PageHeader
        title="Usuarios y vendedores"
        subtitle="Administra accesos internos. Crea vendedores, asigna permisos por rol y bloquea usuarios cuando sea necesario."
      />

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))"
          },
          mb: 2
        }}
      >
        <SummaryCard
          icon={<CheckCircleOutlineIcon />}
          label="Usuarios activos"
          value={activeUsers}
          helper="Pueden iniciar sesión."
        />
        <SummaryCard
          icon={<BadgeOutlinedIcon />}
          label="Vendedores"
          value={sellerUsers}
          helper="Registran ventas."
        />
        <SummaryCard
          icon={<AdminPanelSettingsIcon />}
          label="Administradores"
          value={adminUsers}
          helper="Gestionan la operación."
        />
        <SummaryCard
          icon={<BlockOutlinedIcon />}
          label="Inactivos"
          value={inactiveUsers}
          helper="Acceso bloqueado."
        />
      </Box>

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

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
                  md: "1.2fr 1.4fr",
                  lg: "1.2fr 1.4fr 1.2fr 1fr auto"
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
                autoComplete="email"
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
                autoComplete="new-password"
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

              <Box>
                <Button
                  fullWidth
                  type="submit"
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

      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        resultCount={filteredRows.length}
        totalCount={rows.length}
        label="Buscar usuarios"
        placeholder="Nombre, correo, rol o estado"
        helperText="Filtra vendedores y administradores sin depender de una tabla horizontal."
      />

      <Card sx={{ mb: 2 }}>
        <CardContent>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={1.5}
            alignItems={{ xs: "stretch", md: "center" }}
          >
            <TextField
              select
              label="Rol"
              value={roleFilter}
              onChange={(event) => setRoleFilter(event.target.value as RoleFilter)}
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
                setStatusFilter(event.target.value as StatusFilter)
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
              onClick={() => {
                setQuery("");
                setRoleFilter("ALL");
                setStatusFilter("ALL");
              }}
            >
              Limpiar filtros
            </Button>
          </Stack>
        </CardContent>
      </Card>

      <Stack spacing={1} sx={{ mb: 2 }}>
        <Typography variant="h6">Usuarios registrados</Typography>
        <Typography variant="body2" color="text.secondary">
          Desactiva accesos que ya no se usen. Al desactivar un usuario,
          sus sesiones activas quedan revocadas.
        </Typography>
      </Stack>

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
                <Button
                  variant="outlined"
                  onClick={() => {
                    setQuery("");
                    setRoleFilter("ALL");
                    setStatusFilter("ALL");
                  }}
                >
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
              xl: "repeat(3, minmax(0, 1fr))"
            }
          }}
        >
          {filteredRows.map((targetUser) => (
            <UserCard
              key={targetUser.id}
              currentUserId={currentUser?.id}
              isBusy={actionsAreBusy}
              onOpenResetPasswordDialog={openResetPasswordDialog}
              onOpenRoleDialog={openRoleDialog}
              onToggleUser={toggleUser}
              targetUser={targetUser}
              togglingUserId={togglingUserId}
            />
          ))}
        </Box>
      )}

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
              autoComplete="new-password"
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
              autoComplete="new-password"
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

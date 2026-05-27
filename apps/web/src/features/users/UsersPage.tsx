import { FormEvent, useEffect, useMemo, useState } from "react";

import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormHelperText,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AdminPanelSettingsIcon from "@mui/icons-material/AdminPanelSettings";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import BlockOutlinedIcon from "@mui/icons-material/BlockOutlined";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import PersonAddAlt1OutlinedIcon from "@mui/icons-material/PersonAddAlt1Outlined";

import { api } from "../../api/client";
import { useAuth } from "../../auth/AuthContext";
import { ActionDisabledReason } from "../../components/ActionDisabledReason";
import { PageHeader } from "../../components/PageHeader";
import { ResponsiveDialog } from "../../components/ResponsiveDialog";
import { SearchToolbar } from "../../components/SearchToolbar";
import { StatusFeedback } from "../../components/StatusFeedback";
import { getApiErrorMessage } from "../../utils/apiError";
import {
  filterUsers,
  getRoleLabel,
  initialForm,
  initialResetPasswordForm,
  isPasswordValid,
  SummaryCard,
  summarizeUsers,
  UserCard,
} from "./userShared";
import type {
  RoleFilter,
  StatusFilter,
  User,
  UserRole,
} from "./userShared";

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
    initialResetPasswordForm,
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
        role: form.role,
      });

      setMessage(
        form.role === "CASHIER"
          ? "Vendedor creado correctamente. Ya puede iniciar sesión."
          : "Administrador creado correctamente.",
      );

      setForm(initialForm);

      await load();
    } catch (err: unknown) {
      setError(
        getApiErrorMessage(
          err,
          "No se pudo crear el usuario. Revisa nombre, correo, contraseña y rol.",
        ),
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
          : `El acceso de ${targetUser.name} fue activado.`,
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
        role: selectedRole,
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
        password: resetPasswordForm.password,
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
    if (!passwordIsValid)
      return "La contraseña debe tener mayúscula, minúscula, número y 8 a 72 caracteres.";
    if (!form.role) return "Selecciona un rol.";
    if (isCreating) return "Creando usuario...";

    return "";
  })();

  const userSummary = useMemo(() => summarizeUsers(rows), [rows]);

  const filteredRows = useMemo(
    () => filterUsers(rows, query, roleFilter, statusFilter),
    [query, roleFilter, rows, statusFilter],
  );

  const anyFilterActive =
    Boolean(query.trim()) || roleFilter !== "ALL" || statusFilter !== "ALL";

  const roleFilterLabel =
    roleFilter === "ALL" ? "Todos los roles" : getRoleLabel(roleFilter);
  const statusFilterLabel =
    statusFilter === "ALL"
      ? "Todos los estados"
      : statusFilter === "ACTIVE"
        ? "Activos"
        : "Inactivos";
  const inactiveAccessRatio = rows.length
    ? Math.round((userSummary.inactiveUsers / rows.length) * 100)
    : 0;

  const actionsAreBusy =
    Boolean(togglingUserId) || isUpdatingRole || isResettingPassword;

  return (
    <>
      <PageHeader
        title="Usuarios y vendedores"
        subtitle="Administra accesos internos. Crea vendedores, asigna permisos por rol y bloquea usuarios cuando sea necesario."
      />

      <Card
        sx={(theme) => ({
          background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 54%, ${theme.palette.info.dark} 100%)`,
          color: "primary.contrastText",
          mb: 2,
          overflow: "hidden",
          position: "relative",
          "&::after": {
            background:
              "radial-gradient(circle, rgba(255,255,255,0.2) 0%, rgba(255,255,255,0) 62%)",
            content: '""',
            height: 220,
            position: "absolute",
            right: -80,
            top: -90,
            width: 220,
          },
        })}
      >
        <CardContent sx={{ position: "relative", zIndex: 1 }}>
          <Stack
            direction={{ xs: "column", md: "row" }}
            spacing={2}
            alignItems={{ xs: "flex-start", md: "center" }}
            justifyContent="space-between"
          >
            <Stack spacing={0.75} sx={{ maxWidth: 680 }}>
              <Typography
                variant="overline"
                sx={{ color: "rgba(255,255,255,0.72)", letterSpacing: 1 }}
              >
                Control de accesos interno
              </Typography>
              <Typography variant="h5" fontWeight={900}>
                Gestiona vendedores y administradores sin exponer registro público
              </Typography>
              <Typography sx={{ color: "rgba(255,255,255,0.78)" }}>
                Revisa quién puede vender, quién administra la operación y qué
                accesos deben bloquearse antes de que representen riesgo operativo.
              </Typography>
            </Stack>

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              data-testid="users-hero-chips"
              sx={{ justifyContent: { xs: "flex-start", md: "flex-end" } }}
            >
              <Chip
                label={`${userSummary.activeUsers} activos`}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
              <Chip
                label={`${userSummary.sellerUsers} vendedores`}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
              <Chip
                label={`${inactiveAccessRatio}% bloqueados`}
                sx={{ bgcolor: "rgba(255,255,255,0.18)", color: "inherit" }}
              />
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Box
        sx={{
          display: "grid",
          gap: 2,
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          mb: 2,
        }}
      >
        <SummaryCard
          icon={<CheckCircleOutlineIcon />}
          label="Usuarios activos"
          value={userSummary.activeUsers}
          helper="Pueden iniciar sesión."
          tone="success"
        />
        <SummaryCard
          icon={<BadgeOutlinedIcon />}
          label="Vendedores"
          value={userSummary.sellerUsers}
          helper="Registran ventas."
          tone="seller"
        />
        <SummaryCard
          icon={<AdminPanelSettingsIcon />}
          label="Administradores"
          value={userSummary.adminUsers}
          helper="Gestionan la operación."
          tone="admin"
        />
        <SummaryCard
          icon={<BlockOutlinedIcon />}
          label="Inactivos"
          value={userSummary.inactiveUsers}
          helper="Acceso bloqueado."
          tone="inactive"
        />
      </Box>

      <StatusFeedback
        success={message}
        error={error}
        onSuccessClose={() => setMessage("")}
        onErrorClose={() => setError("")}
      />

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

          <Box component="form" onSubmit={submit}>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: {
                  xs: "1fr",
                  md: "1.2fr 1.4fr",
                  lg: "1.2fr 1.4fr 1.2fr 1fr auto",
                },
                gap: 2,
                alignItems: "start",
              }}
            >
              <TextField
                label="Nombre completo"
                placeholder="Ej. Ana López"
                value={form.name}
                inputProps={{ "data-testid": "users-form-name" }}
                error={Boolean(form.name) && form.name.trim().length < 2}
                helperText="Mínimo 2 caracteres."
                onChange={(event) =>
                  setForm({
                    ...form,
                    name: event.target.value,
                  })
                }
              />

              <TextField
                label="Correo electrónico"
                placeholder="usuario@empresa.com"
                type="email"
                autoComplete="email"
                value={form.email}
                inputProps={{ "data-testid": "users-form-email" }}
                helperText="Será usado para iniciar sesión."
                onChange={(event) =>
                  setForm({
                    ...form,
                    email: event.target.value,
                  })
                }
              />

              <TextField
                label="Contraseña temporal"
                type="password"
                autoComplete="new-password"
                value={form.password}
                inputProps={{ "data-testid": "users-form-password" }}
                error={Boolean(form.password) && !passwordIsValid}
                helperText="8 a 72 caracteres, con mayúscula, minúscula y número."
                onChange={(event) =>
                  setForm({
                    ...form,
                    password: event.target.value,
                  })
                }
              />

              <TextField
                select
                label="Rol"
                value={form.role}
                helperText="Vendedor no administra usuarios."
                inputProps={{ "data-testid": "users-form-role" }}
                onChange={(event) =>
                  setForm({
                    ...form,
                    role: event.target.value as UserRole,
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

      <SearchToolbar
        query={query}
        onQueryChange={setQuery}
        resultCount={filteredRows.length}
        totalCount={rows.length}
        label="Buscar usuarios"
        placeholder="Nombre, correo, rol o estado"
        helperText="Filtra vendedores y administradores sin depender de una tabla horizontal."
      />

      <Card
        variant="outlined"
        sx={{ mb: 2 }}
      >
        <CardContent>
          <Stack spacing={1.5}>
            <Stack spacing={0.25}>
              <Typography variant="subtitle1" fontWeight={800}>
                Panel de búsqueda y filtros
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Enfoca el directorio por rol, estado o texto antes de cambiar
                permisos sensibles.
              </Typography>
            </Stack>

            <Stack
              direction={{ xs: "column", md: "row" }}
              spacing={1.5}
              alignItems={{ xs: "stretch", md: "center" }}
            >
            <TextField
              select
              label="Rol"
              value={roleFilter}
              onChange={(event) =>
                setRoleFilter(event.target.value as RoleFilter)
              }
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

            <Stack
              direction="row"
              spacing={1}
              useFlexGap
              flexWrap="wrap"
              data-testid="users-active-filters"
            >
              <Chip size="small" label={`Rol: ${roleFilterLabel}`} />
              <Chip size="small" label={`Estado: ${statusFilterLabel}`} />
              {query.trim() && (
                <Chip
                  size="small"
                  variant="outlined"
                  label={`Búsqueda: ${query.trim()}`}
                />
              )}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card
        variant="outlined"
        sx={{ mb: 2 }}
      >
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
              label={`${filteredRows.length} de ${rows.length} usuarios visibles`}
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
              xl: "repeat(3, minmax(0, 1fr))",
            },
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

      <ResponsiveDialog
        open={Boolean(roleDialogUser)}
        onClose={closeRoleDialog}
        disableClose={isUpdatingRole}
        title="Cambiar rol"
        description="Actualiza el acceso operativo de este usuario."
        actions={
          <>
            <Button
              variant="outlined"
              onClick={closeRoleDialog}
              disabled={isUpdatingRole}
            >
              Cancelar
            </Button>
            <Button
              data-testid="users-role-save"
              disabled={
                isUpdatingRole ||
                !roleDialogUser ||
                selectedRole === roleDialogUser.role
              }
              onClick={updateUserRole}
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
              setSelectedRole(event.target.value as UserRole)
            }
          >
            <MenuItem value="CASHIER">Vendedor</MenuItem>
            <MenuItem value="ADMIN">Administrador</MenuItem>
          </TextField>
        </Stack>
      </ResponsiveDialog>

      <ResponsiveDialog
        open={Boolean(resetPasswordUser)}
        onClose={closeResetPasswordDialog}
        disableClose={isResettingPassword}
        title="Asignar nueva contraseña"
        description="Genera una contraseña temporal y compártela por un canal seguro."
        actions={
          <>
            <Button
              variant="outlined"
              onClick={closeResetPasswordDialog}
              disabled={isResettingPassword}
            >
              Cancelar
            </Button>
            <Button data-testid="users-reset-password-save" disabled={resetPasswordIsInvalid} onClick={resetPassword}>
              {isResettingPassword ? "Guardando..." : "Guardar contraseña"}
            </Button>
          </>
        }
      >
        <Stack spacing={2}>
          <Alert severity="info">
            Usa una contraseña temporal y compártela por un canal seguro. El
            usuario debe cambiarla después si habilitamos ese flujo.
          </Alert>

          <TextField
            label="Nueva contraseña"
            type="password"
            autoComplete="new-password"
            value={resetPasswordForm.password}
            inputProps={{ "data-testid": "users-reset-password" }}
            error={Boolean(resetPasswordForm.password) && !resetPasswordIsValid}
            helperText="8 a 72 caracteres, con mayúscula, minúscula y número."
            onChange={(event) =>
              setResetPasswordForm({
                ...resetPasswordForm,
                password: event.target.value,
              })
            }
          />

          <TextField
            label="Confirmar contraseña"
            type="password"
            autoComplete="new-password"
            value={resetPasswordForm.confirmPassword}
            inputProps={{ "data-testid": "users-reset-password-confirm" }}
            error={
              Boolean(resetPasswordForm.confirmPassword) &&
              !resetPasswordMatches
            }
            onChange={(event) =>
              setResetPasswordForm({
                ...resetPasswordForm,
                confirmPassword: event.target.value,
              })
            }
          />

          {!resetPasswordMatches && resetPasswordForm.confirmPassword && (
            <FormHelperText error>Las contraseñas no coinciden.</FormHelperText>
          )}
        </Stack>
      </ResponsiveDialog>
    </>
  );
}

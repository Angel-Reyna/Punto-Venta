import { useCallback, useEffect, useMemo, useState } from "react";

import { getApiErrorMessage } from "../../utils/apiError";
import {
  createUser,
  listUsers,
  resetUserPassword,
  toggleUserAccess,
  updateUserRole,
} from "./usersApi";
import {
  filterUsers,
  getRoleFilterLabel,
  getStatusFilterLabel,
  initialForm,
  initialResetPasswordForm,
  isPasswordValid,
  summarizeUsers,
} from "./userShared";
import type {
  ResetPasswordForm,
  RoleFilter,
  StatusFilter,
  User,
  UserForm,
  UserRole,
} from "./userShared";

type UseUsersDataOptions = {
  currentUserId?: string;
};

function getCreateUserDisabledReason(form: UserForm, isCreating: boolean) {
  if (!form.name.trim()) return "Captura el nombre completo.";
  if (!form.email.trim()) return "Captura el correo electrónico.";
  if (!isPasswordValid(form.password)) {
    return "La contraseña debe tener mayúscula, minúscula, número y 8 a 72 caracteres.";
  }
  if (!form.role) return "Selecciona un rol.";
  if (isCreating) return "Creando usuario...";

  return "";
}

export function useUsersData({ currentUserId }: UseUsersDataOptions) {
  const [rows, setRows] = useState<User[]>([]);
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState<RoleFilter>("ALL");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [form, setForm] = useState<UserForm>(initialForm);
  const [isCreating, setIsCreating] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [togglingUserId, setTogglingUserId] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole>("CASHIER");
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resetPasswordForm, setResetPasswordForm] = useState<ResetPasswordForm>(
    initialResetPasswordForm,
  );
  const [isResettingPassword, setIsResettingPassword] = useState(false);

  const load = useCallback(async () => {
    try {
      setIsLoading(true);
      setError("");
      setRows(await listUsers());
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudieron cargar los usuarios."));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const submit = useCallback(async () => {
    setMessage("");
    setError("");

    try {
      setIsCreating(true);
      await createUser(form);
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
  }, [form, load]);

  const toggleUser = useCallback(
    async (targetUser: User) => {
      setMessage("");
      setError("");

      if (targetUser.id === currentUserId) {
        setError("No puedes desactivar tu propio usuario.");
        return;
      }

      try {
        setTogglingUserId(targetUser.id);
        await toggleUserAccess(targetUser.id);
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
    },
    [currentUserId, load],
  );

  const openRoleDialog = useCallback((targetUser: User) => {
    setMessage("");
    setError("");
    setRoleDialogUser(targetUser);
    setSelectedRole(targetUser.role);
  }, []);

  const closeRoleDialog = useCallback(() => {
    if (isUpdatingRole) return;
    setRoleDialogUser(null);
  }, [isUpdatingRole]);

  const saveUserRole = useCallback(async () => {
    if (!roleDialogUser) return;

    setMessage("");
    setError("");

    try {
      setIsUpdatingRole(true);
      await updateUserRole(roleDialogUser.id, selectedRole);
      setMessage(`Rol actualizado para ${roleDialogUser.name}.`);
      setRoleDialogUser(null);
      await load();
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo cambiar el rol."));
    } finally {
      setIsUpdatingRole(false);
    }
  }, [load, roleDialogUser, selectedRole]);

  const openResetPasswordDialog = useCallback((targetUser: User) => {
    setMessage("");
    setError("");
    setResetPasswordUser(targetUser);
    setResetPasswordForm(initialResetPasswordForm);
  }, []);

  const closeResetPasswordDialog = useCallback(() => {
    if (isResettingPassword) return;
    setResetPasswordUser(null);
    setResetPasswordForm(initialResetPasswordForm);
  }, [isResettingPassword]);

  const saveResetPassword = useCallback(async () => {
    if (!resetPasswordUser) return;

    setMessage("");
    setError("");

    try {
      setIsResettingPassword(true);
      await resetUserPassword(resetPasswordUser.id, resetPasswordForm.password);
      setMessage(`Contraseña actualizada para ${resetPasswordUser.name}.`);
      setResetPasswordUser(null);
      setResetPasswordForm(initialResetPasswordForm);
    } catch (err: unknown) {
      setError(getApiErrorMessage(err, "No se pudo actualizar la contraseña."));
    } finally {
      setIsResettingPassword(false);
    }
  }, [resetPasswordForm.password, resetPasswordUser]);

  const clearFilters = useCallback(() => {
    setQuery("");
    setRoleFilter("ALL");
    setStatusFilter("ALL");
  }, []);

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
  const userSummary = useMemo(() => summarizeUsers(rows), [rows]);
  const filteredRows = useMemo(
    () => filterUsers(rows, query, roleFilter, statusFilter),
    [query, roleFilter, rows, statusFilter],
  );
  const anyFilterActive =
    Boolean(query.trim()) || roleFilter !== "ALL" || statusFilter !== "ALL";
  const actionsAreBusy =
    Boolean(togglingUserId) || isUpdatingRole || isResettingPassword;

  return {
    actionsAreBusy,
    anyFilterActive,
    clearError: () => setError(""),
    clearFilters,
    clearMessage: () => setMessage(""),
    closeResetPasswordDialog,
    closeRoleDialog,
    createUserDisabledReason: getCreateUserDisabledReason(form, isCreating),
    error,
    filteredRows,
    form,
    formIsInvalid,
    isCreating,
    isLoading,
    isResettingPassword,
    isUpdatingRole,
    message,
    openResetPasswordDialog,
    openRoleDialog,
    query,
    resetPasswordForm,
    resetPasswordIsInvalid,
    resetPasswordIsValid,
    resetPasswordMatches,
    resetPasswordUser,
    roleDialogUser,
    roleFilter,
    roleFilterLabel: getRoleFilterLabel(roleFilter),
    rows,
    saveResetPassword,
    saveUserRole,
    selectedRole,
    setForm,
    setQuery,
    setResetPasswordForm,
    setRoleFilter,
    setSelectedRole,
    setStatusFilter,
    statusFilter,
    statusFilterLabel: getStatusFilterLabel(statusFilter),
    submit,
    toggleUser,
    togglingUserId,
    userSummary,
  };
}

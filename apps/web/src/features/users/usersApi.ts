import { api } from "../../api/client";
import type { User, UserForm, UserRole } from "./userShared";

export async function listUsers() {
  const response = await api.get<User[]>("/users");

  return response.data;
}

export async function createUser(form: UserForm) {
  await api.post("/users", {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    role: form.role,
  });
}

export async function toggleUserAccess(userId: string) {
  await api.patch(`/users/${userId}/toggle`);
}

export async function updateUserRole(userId: string, role: UserRole) {
  await api.patch(`/users/${userId}/role`, { role });
}

export async function resetUserPassword(userId: string, password: string) {
  await api.patch(`/users/${userId}/password`, { password });
}

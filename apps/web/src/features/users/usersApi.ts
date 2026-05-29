import { getJson, patchJson, postJson } from "../../api/http";
import type { User, UserForm, UserRole } from "./userShared";

export type CreateUserPayload = {
  name: string;
  email: string;
  password: string;
  role: UserRole;
};

export type ResetUserPasswordPayload = {
  password: string;
};

export async function listUsers() {
  return getJson<User[]>("/users");
}

export async function createUser(form: UserForm) {
  const payload: CreateUserPayload = {
    name: form.name.trim(),
    email: form.email.trim().toLowerCase(),
    password: form.password,
    role: form.role,
  };

  await postJson("/users", payload);
}

export async function toggleUserAccess(userId: string) {
  await patchJson(`/users/${userId}/toggle`);
}

export async function updateUserRole(userId: string, role: UserRole) {
  await patchJson(`/users/${userId}/role`, { role });
}

export async function resetUserPassword(userId: string, password: string) {
  const payload: ResetUserPasswordPayload = { password };

  await patchJson(`/users/${userId}/password`, payload);
}

import { Prisma, Role } from "@prisma/client";
import { z } from "zod";

export const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no debe superar 72 caracteres")
  .regex(/[A-Z]/, "La contraseña debe incluir una mayúscula")
  .regex(/[a-z]/, "La contraseña debe incluir una minúscula")
  .regex(/[0-9]/, "La contraseña debe incluir un número");

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(255),
    password: passwordSchema,
    role: z.nativeEnum(Role)
  })
});

export const userIdParamsSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  })
});

export const updateUserRoleSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    role: z.nativeEnum(Role)
  })
});

export const resetUserPasswordSchema = z.object({
  params: z.object({
    id: z.string().uuid()
  }),
  body: z.object({
    password: passwordSchema
  })
});

export const publicUserSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true
} satisfies Prisma.UserSelect;

export type PublicUser = Prisma.UserGetPayload<{
  select: typeof publicUserSelect;
}>;

export type CreateUserInput = z.infer<typeof createUserSchema>["body"];
export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>["body"];
export type ResetUserPasswordInput = z.infer<typeof resetUserPasswordSchema>["body"];

export type UserListFilters = {
  q?: string;
  role?: Role;
  active?: boolean;
  skip: number;
  take: number;
};

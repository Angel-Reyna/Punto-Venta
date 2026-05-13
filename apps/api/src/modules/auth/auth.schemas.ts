import { z } from "zod";

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email("Correo inválido"),
    password: z.string().min(6, "Contraseña inválida")
  })
});

export const refreshSchema = z.object({
  body: z.object({
    refreshToken: z.string().min(10, "Refresh token inválido")
  })
});

export const registerCashierSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(80),
    email: z.string().email(),
    password: z
      .string()
      .min(8)
      .max(72)
      .regex(/[A-Z]/)
      .regex(/[a-z]/)
      .regex(/[0-9]/)
  })
});
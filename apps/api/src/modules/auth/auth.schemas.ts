import { z } from "zod";

const passwordSchema = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(72, "La contraseña no debe superar 72 caracteres")
  .regex(/[A-Z]/, "La contraseña debe incluir una mayúscula")
  .regex(/[a-z]/, "La contraseña debe incluir una minúscula")
  .regex(/[0-9]/, "La contraseña debe incluir un número");

export const loginSchema = z.object({
  body: z.object({
    email: z.string().trim().toLowerCase().email("Correo inválido").max(255),
    password: z.string().min(1, "Contraseña requerida").max(72)
  })
});

export const registerCashierSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2).max(80),
    email: z.string().trim().toLowerCase().email().max(255),
    password: passwordSchema
  })
});

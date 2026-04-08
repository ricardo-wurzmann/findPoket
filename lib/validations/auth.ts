import { z } from "zod";

export const signInSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter ao menos 6 caracteres"),
});

export const signUpSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(8, "Senha deve ter ao menos 8 caracteres"),
  name: z.string().min(2, "Nome deve ter ao menos 2 caracteres").max(80),
  handle: z
    .string()
    .max(30)
    .regex(/^[a-z0-9_]*$/, "Apenas letras minúsculas, números e underscore")
    .transform((v) => (v === "" ? undefined : v))
    .pipe(
      z.string().min(3, "Handle deve ter ao menos 3 caracteres").optional()
    )
    .optional(),
  role: z.enum(["PLAYER", "ORGANIZER"]).default("PLAYER"),
  city: z.string().optional(),
});

export type SignInInput = z.infer<typeof signInSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;

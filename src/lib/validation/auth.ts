import { z } from "zod";

const controlCharacters = /[\u0000-\u001F\u007F]/;

export const emailSchema = z.string().trim().toLowerCase().email().max(254);

export const passwordSchema = z
  .string()
  .min(12, "Use at least 12 characters")
  .max(128, "Password is too long")
  .refine((value) => !controlCharacters.test(value), "Control characters are not allowed")
  .refine((value) => /[a-z]/.test(value), "Add a lowercase letter")
  .refine((value) => /[A-Z]/.test(value), "Add an uppercase letter")
  .refine((value) => /\d/.test(value), "Add a number")
  .refine((value) => /[^A-Za-z0-9]/.test(value), "Add a symbol");

export const signUpSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  acceptTerms: z.literal(true, { error: "Accept the community and privacy rules" }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;

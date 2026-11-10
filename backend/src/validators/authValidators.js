import { z } from "zod";
import {
  emailSchema,
  existingPasswordSchema,
  nameSchema,
  passwordSchema,
  rollNumberSchema,
  sectionSchema,
} from "./common.js";

const rememberSchema = z.boolean({ invalid_type_error: "Remember me must be true or false." });

export const registerSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  rollNumber: rollNumberSchema,
  section: sectionSchema,
  password: passwordSchema(),
  remember: rememberSchema.default(true),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: existingPasswordSchema(),
  remember: rememberSchema.default(false),
});

export const forgotPasswordSchema = z.object({
  email: emailSchema,
});

export const resetTokenParamsSchema = z.object({
  token: z
    .string()
    .regex(/^[A-Za-z0-9_-]{32,128}$/, "This reset link is invalid or has expired. Request a new one."),
});

export const resetPasswordSchema = z.object({
  password: passwordSchema(),
});

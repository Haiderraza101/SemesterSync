import { z } from "zod";
import { emailSchema, existingPasswordSchema, nameSchema, passwordSchema, rollNumberSchema, sectionSchema } from "./common.js";

export const profileSchema = z
  .object({
    name: nameSchema.optional(),
    email: emailSchema.optional(),
    rollNumber: rollNumberSchema.optional(),
    section: sectionSchema.optional(),
  })
  .refine((body) => Object.values(body).some((value) => value !== undefined), {
    message: "Provide at least one field to update.",
    path: ["profile"],
  });

export const changePasswordSchema = z
  .object({
    currentPassword: existingPasswordSchema("Current password"),
    newPassword: passwordSchema("New password"),
  })
  .refine((body) => body.currentPassword !== body.newPassword, {
    message: "Choose a password different from your current one.",
    path: ["newPassword"],
  });

export const avatarParamsSchema = z.object({
  fileId: z.string().regex(/^[a-f0-9]{24}$/i, "Invalid picture id."),
});

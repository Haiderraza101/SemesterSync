import { z } from "zod";

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ROLL_NUMBER_PATTERN = /^\d{2}[A-Z]-\d{4}$/i;
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_BYTES = 72;

export const text = (label) =>
  z.string({ required_error: `${label} is required.`, invalid_type_error: `${label} must be text.` });

export const emailSchema = text("Email")
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .max(254, "Email must be 254 characters or fewer.")
  .regex(EMAIL_PATTERN, "Enter a valid email address.");

export const nameSchema = text("Name").trim().min(1, "Name is required.").max(80, "Name must be 80 characters or fewer.");

export const rollNumberSchema = text("Roll number")
  .trim()
  .toUpperCase()
  .min(1, "Roll number is required.")
  .regex(ROLL_NUMBER_PATTERN, "Use the format 23L-0634.");

export const sectionSchema = text("Section")
  .trim()
  .toUpperCase()
  .min(1, "Section is required.")
  .max(20, "Section must be 20 characters or fewer.");

export const passwordSchema = (label = "Password") =>
  text(label)
    .min(PASSWORD_MIN_LENGTH, `${label} must be at least ${PASSWORD_MIN_LENGTH} characters.`)
    .regex(/[A-Za-z]/, `${label} must include at least one letter.`)
    .regex(/\d/, `${label} must include at least one number.`)
    .refine((value) => Buffer.byteLength(value, "utf8") <= PASSWORD_MAX_BYTES, {
      message: `${label} must be ${PASSWORD_MAX_BYTES} characters or fewer.`,
    });

export const existingPasswordSchema = (label = "Password") =>
  text(label).min(1, `${label} is required.`).max(256, `${label} is too long.`);

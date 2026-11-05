import { ROLL_NUMBER_PATTERN, checkEmail, checkPassword, collect, isNonEmptyString } from "./common.js";

export const PROFILE_FIELDS = ["name", "email", "rollNumber", "section"];

export function profileValidator(body) {
  const provided = PROFILE_FIELDS.filter((field) => body[field] !== undefined);
  if (provided.length === 0) return { profile: "Provide at least one field to update." };

  return collect({
    name: body.name !== undefined && !isNonEmptyString(body.name) ? "Name cannot be empty." : "",
    email: body.email !== undefined ? checkEmail(body.email) : "",
    rollNumber:
      body.rollNumber !== undefined && !ROLL_NUMBER_PATTERN.test(String(body.rollNumber).trim())
        ? "Use the format 23L-0634."
        : "",
    section: body.section !== undefined && !isNonEmptyString(body.section) ? "Section cannot be empty." : "",
  });
}

export function changePasswordValidator(body) {
  const newPasswordError = checkPassword(body.newPassword);
  return collect({
    currentPassword:
      typeof body.currentPassword === "string" && body.currentPassword.length > 0
        ? ""
        : "Current password is required.",
    newPassword: newPasswordError
      ? newPasswordError
      : body.newPassword === body.currentPassword
        ? "Choose a password different from your current one."
        : "",
  });
}

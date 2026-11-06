export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const ROLL_NUMBER_PATTERN = /^\d{2}[A-Z]-\d{4}$/i;
export const PASSWORD_MIN_LENGTH = 8;

export function isNonEmptyString(value) {
  return typeof value === "string" && value.trim().length > 0;
}

export function checkEmail(value) {
  if (!isNonEmptyString(value)) return "Email is required.";
  if (!EMAIL_PATTERN.test(value.trim())) return "Enter a valid email address.";
  return "";
}

export function checkPassword(value) {
  if (typeof value !== "string" || value.length === 0) return "Password is required.";
  if (value.length < PASSWORD_MIN_LENGTH) return `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  if (!/\d/.test(value)) return "Password must include at least one number.";
  return "";
}

export function collect(checks) {
  return Object.fromEntries(Object.entries(checks).filter(([, message]) => Boolean(message)));
}

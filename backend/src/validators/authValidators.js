import { ROLL_NUMBER_PATTERN, checkEmail, checkPassword, collect, isNonEmptyString } from "./common.js";

export function registerValidator(body) {
  return collect({
    name: isNonEmptyString(body.name) ? "" : "Name is required.",
    rollNumber: !isNonEmptyString(body.rollNumber)
      ? "Roll number is required."
      : ROLL_NUMBER_PATTERN.test(body.rollNumber.trim())
        ? ""
        : "Use the format 23L-0634.",
    section: isNonEmptyString(body.section) ? "" : "Section is required.",
    email: checkEmail(body.email),
    password: checkPassword(body.password),
  });
}

export function loginValidator(body) {
  return collect({
    email: checkEmail(body.email),
    password: typeof body.password === "string" && body.password.length > 0 ? "" : "Password is required.",
  });
}

export function forgotPasswordValidator(body) {
  return collect({ email: checkEmail(body.email) });
}

export function resetPasswordValidator(body) {
  return collect({ password: checkPassword(body.password) });
}

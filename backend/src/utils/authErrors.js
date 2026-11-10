import AppError from "./AppError.js";

export const AUTH_ERROR_CODES = {
  authRequired: "AUTH_REQUIRED",
  tokenExpired: "TOKEN_EXPIRED",
  tokenInvalid: "TOKEN_INVALID",
  sessionEnded: "SESSION_ENDED",
  invalidCredentials: "INVALID_CREDENTIALS",
  accountLocked: "ACCOUNT_LOCKED",
  resetTokenInvalid: "RESET_TOKEN_INVALID",
  originNotAllowed: "ORIGIN_NOT_ALLOWED",
};

export const authRequired = () =>
  new AppError("Please log in to continue.", 401, { code: AUTH_ERROR_CODES.authRequired });

export const sessionEnded = () =>
  new AppError("Your session has ended. Please log in again.", 401, { code: AUTH_ERROR_CODES.sessionEnded });

export const invalidCredentials = () =>
  new AppError("Invalid email or password.", 401, { code: AUTH_ERROR_CODES.invalidCredentials });

export const accountLocked = (minutes) =>
  new AppError(
    `Too many failed attempts. Try again in ${minutes} minute${minutes === 1 ? "" : "s"} or reset your password.`,
    429,
    { code: AUTH_ERROR_CODES.accountLocked }
  );

export const resetTokenInvalid = () =>
  new AppError("This reset link is invalid or has expired. Request a new one.", 400, {
    code: AUTH_ERROR_CODES.resetTokenInvalid,
  });

import { env } from "../config/env.js";
import AppError from "../utils/AppError.js";
import { AUTH_ERROR_CODES } from "../utils/authErrors.js";

export const requireTrustedOrigin = (req, res, next) => {
  const origin = req.get("origin");
  if (origin && !env.clientOrigins.includes(origin)) {
    return next(new AppError("Request origin is not allowed.", 403, { code: AUTH_ERROR_CODES.originNotAllowed }));
  }
  return next();
};

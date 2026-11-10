import { isProduction } from "../config/env.js";
import AppError from "../utils/AppError.js";
import { AUTH_ERROR_CODES } from "../utils/authErrors.js";

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, { code: "NOT_FOUND" }));
};

function normalizeError(err) {
  if (err instanceof AppError) return err;

  if (err.name === "ValidationError") {
    const details = Object.fromEntries(Object.entries(err.errors).map(([field, value]) => [field, value.message]));
    return new AppError(Object.values(details)[0] || "Validation failed.", 400, { code: "VALIDATION_FAILED", details });
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "value";
    return new AppError(`An account with this ${field} already exists.`, 409, { code: "DUPLICATE_VALUE" });
  }

  if (err.name === "CastError") return new AppError("Invalid identifier.", 400, { code: "INVALID_ID" });

  if (err.name === "TokenExpiredError") {
    return new AppError("Your session has expired.", 401, { code: AUTH_ERROR_CODES.tokenExpired });
  }

  if (err.name === "JsonWebTokenError" || err.name === "NotBeforeError") {
    return new AppError("Your session is invalid. Please log in again.", 401, { code: AUTH_ERROR_CODES.tokenInvalid });
  }

  if (err.type === "entity.parse.failed") {
    return new AppError("Request body is not valid JSON.", 400, { code: "INVALID_JSON" });
  }

  if (err.type === "entity.too.large") {
    return new AppError("Request body is too large.", 413, { code: "PAYLOAD_TOO_LARGE" });
  }

  return new AppError(err.message || "Something went wrong.", err.statusCode || 500);
}

export const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);
  const status = error.statusCode;
  const hideDetails = status >= 500 && isProduction;

  if (status >= 500) console.error(err);

  res.status(status).json({
    message: hideDetails ? "Something went wrong." : error.message,
    ...(error.code && !hideDetails && { code: error.code }),
    ...(error.details && !hideDetails && { errors: error.details }),
  });
};

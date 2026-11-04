import { isProduction } from "../config/env.js";
import AppError from "../utils/AppError.js";

export const notFound = (req, res, next) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404));
};

function normalizeError(err) {
  if (err instanceof AppError) return err;

  if (err.name === "ValidationError") {
    const details = Object.fromEntries(Object.entries(err.errors).map(([field, value]) => [field, value.message]));
    return new AppError(Object.values(details)[0] || "Validation failed.", 400, details);
  }

  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || "value";
    return new AppError(`An account with this ${field} already exists.`, 409);
  }

  if (err.name === "CastError") return new AppError("Invalid identifier.", 400);

  if (err.name === "JsonWebTokenError" || err.name === "TokenExpiredError") {
    return new AppError("Your session has expired. Please log in again.", 401);
  }

  if (err.type === "entity.parse.failed") return new AppError("Request body is not valid JSON.", 400);

  return new AppError(err.message || "Something went wrong.", err.statusCode || 500);
}

export const errorHandler = (err, req, res, next) => {
  const error = normalizeError(err);
  const status = error.statusCode;

  if (status >= 500) console.error(err);

  res.status(status).json({
    message: status >= 500 && isProduction ? "Something went wrong." : error.message,
    ...(error.details && { errors: error.details }),
  });
};

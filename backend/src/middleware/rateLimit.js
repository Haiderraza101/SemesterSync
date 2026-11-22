import rateLimit from "express-rate-limit";
import { isProduction } from "../config/env.js";

const MINUTE_MS = 60 * 1000;
const LOCAL_MULTIPLIER = 10;

function createLimiter({ minutes, limit, message, skipSuccessfulRequests = false }) {
  return rateLimit({
    windowMs: minutes * MINUTE_MS,
    limit: isProduction ? limit : limit * LOCAL_MULTIPLIER,
    skipSuccessfulRequests,
    standardHeaders: "draft-7",
    legacyHeaders: false,
    message: { message, code: "RATE_LIMITED" },
  });
}

export const apiLimiter = createLimiter({
  minutes: 15,
  limit: 500,
  message: "Too many requests. Please slow down.",
});

export const loginLimiter = createLimiter({
  minutes: 15,
  limit: 10,
  skipSuccessfulRequests: true,
  message: "Too many login attempts. Please wait 15 minutes and try again.",
});

export const registerLimiter = createLimiter({
  minutes: 60,
  limit: 10,
  message: "Too many accounts created from this network. Please try again later.",
});

export const passwordResetLimiter = createLimiter({
  minutes: 15,
  limit: 5,
  message: "Too many password reset requests. Please wait 15 minutes and try again.",
});

export const sessionLimiter = createLimiter({
  minutes: 15,
  limit: 120,
  message: "Too many session requests. Please slow down.",
});

export const uploadLimiter = createLimiter({
  minutes: 15,
  limit: 20,
  message: "Too many uploads. Please wait a few minutes and try again.",
});

export const sensitiveActionLimiter = createLimiter({
  minutes: 15,
  limit: 10,
  message: "Too many attempts. Please wait a few minutes and try again.",
});

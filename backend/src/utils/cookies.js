import { env } from "../config/env.js";

const REFRESH_COOKIE_PATH = "/api/auth";

function baseOptions() {
  return {
    httpOnly: true,
    secure: env.auth.cookieSecure,
    sameSite: env.auth.cookieSameSite,
    path: REFRESH_COOKIE_PATH,
  };
}

export function setRefreshCookie(res, refreshToken, session) {
  res.cookie(env.auth.cookieName, refreshToken, {
    ...baseOptions(),
    ...(session.persistent && { expires: session.expiresAt }),
  });
}

export function clearRefreshCookie(res) {
  res.clearCookie(env.auth.cookieName, baseOptions());
}

export function readRefreshCookie(req) {
  const value = req.cookies?.[env.auth.cookieName];
  return typeof value === "string" && value.length > 0 ? value : null;
}

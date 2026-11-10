import * as authService from "../services/authService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearRefreshCookie, readRefreshCookie, setRefreshCookie } from "../utils/cookies.js";

const RESET_REQUESTED = { message: "If an account exists for that email, a reset link has been sent." };

function clientContext(req) {
  return { userAgent: req.get("user-agent"), ipAddress: req.ip };
}

function sendSession(res, status, { user, session, accessToken, refreshToken }) {
  if (refreshToken) setRefreshCookie(res, refreshToken, session);
  res.status(status).json({ user, accessToken });
}

export const register = asyncHandler(async (req, res) => {
  sendSession(res, 201, await authService.register(req.body, clientContext(req)));
});

export const login = asyncHandler(async (req, res) => {
  sendSession(res, 200, await authService.login(req.body, clientContext(req)));
});

export const refresh = asyncHandler(async (req, res) => {
  try {
    sendSession(res, 200, await authService.refresh(readRefreshCookie(req), clientContext(req)));
  } catch (error) {
    clearRefreshCookie(res);
    throw error;
  }
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(readRefreshCookie(req));
  clearRefreshCookie(res);
  res.status(204).end();
});

export const logoutEverywhere = asyncHandler(async (req, res) => {
  await authService.logoutEverywhere(req.user._id);
  clearRefreshCookie(res);
  res.status(204).end();
});

export const getCurrentUser = (req, res) => {
  res.json({ user: req.user });
};

export const forgotPassword = (req, res) => {
  authService.requestPasswordReset(req.body.email).catch((error) => {
    console.error(`Password reset request failed: ${error.message}`);
  });
  res.status(202).json(RESET_REQUESTED);
};

export const verifyResetToken = asyncHandler(async (req, res) => {
  await authService.verifyResetToken(req.params.token);
  res.json({ valid: true });
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.params.token, req.body.password);
  clearRefreshCookie(res);
  res.json({ message: "Your password has been reset. Log in with your new password." });
});

export const changePassword = asyncHandler(async (req, res) => {
  await authService.changePassword(req.user._id, req.auth.sessionId, req.body);
  res.json({ message: "Password updated. Other devices have been logged out." });
});

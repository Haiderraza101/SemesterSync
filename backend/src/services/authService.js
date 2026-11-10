import bcrypt from "bcryptjs";
import { env } from "../config/env.js";
import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { accountLocked, invalidCredentials, resetTokenInvalid, sessionEnded } from "../utils/authErrors.js";
import { sendEmailInBackground } from "./emailService.js";
import { passwordChangedEmail, passwordResetEmail } from "./emailTemplates.js";
import { createSession, revokeSessionByToken, revokeUserSessions, rotateSession } from "./sessionService.js";
import { generateOpaqueToken, hashToken } from "./tokenService.js";

const MINUTE_MS = 60 * 1000;
const CREDENTIAL_FIELDS = "+password +failedLoginAttempts +lockUntil";
const RESET_FIELDS = "+passwordResetTokenHash +passwordResetExpiresAt +failedLoginAttempts +lockUntil";

let timingGuardHash = null;

function getTimingGuardHash() {
  if (!timingGuardHash) timingGuardHash = bcrypt.hash("semestersync-timing-guard", env.auth.bcryptRounds);
  return timingGuardHash;
}

function forgotPasswordUrl() {
  return `${env.clientUrl}/forgot-password`;
}

async function recordFailedLogin(user) {
  const attempts = (user.failedLoginAttempts || 0) + 1;

  if (attempts >= env.auth.maxLoginAttempts) {
    const lockUntil = new Date(Date.now() + env.auth.lockMinutes * MINUTE_MS);
    await User.updateOne({ _id: user._id }, { $set: { failedLoginAttempts: 0, lockUntil } });
    return true;
  }

  await User.updateOne({ _id: user._id }, { $inc: { failedLoginAttempts: 1 } });
  return false;
}

async function recordSuccessfulLogin(user) {
  user.lastLoginAt = new Date();
  await User.updateOne(
    { _id: user._id },
    { $set: { failedLoginAttempts: 0, lastLoginAt: user.lastLoginAt }, $unset: { lockUntil: 1 } }
  );
}

async function findUserByResetToken(token) {
  return User.findOne({
    passwordResetTokenHash: hashToken(token),
    passwordResetExpiresAt: { $gt: new Date() },
  }).select(RESET_FIELDS);
}

export async function register({ remember, ...profile }, client) {
  const exists = await User.exists({ email: profile.email });
  if (exists) throw new AppError("An account with this email already exists.", 409, { code: "EMAIL_TAKEN" });

  const user = await User.create(profile);
  const session = await createSession(user._id, { persistent: remember, ...client });
  return { user, ...session };
}

export async function login({ email, password, remember }, client) {
  const user = await User.findOne({ email }).select(CREDENTIAL_FIELDS);

  if (!user) {
    await bcrypt.compare(password, await getTimingGuardHash());
    throw invalidCredentials();
  }

  if (user.isLocked()) throw accountLocked(user.lockMinutesRemaining());

  if (!(await user.comparePassword(password))) {
    const locked = await recordFailedLogin(user);
    throw locked ? accountLocked(env.auth.lockMinutes) : invalidCredentials();
  }

  await recordSuccessfulLogin(user);
  const session = await createSession(user._id, { persistent: remember, ...client });
  return { user, ...session };
}

export async function refresh(refreshToken, client) {
  const session = await rotateSession(refreshToken, client);
  const user = await User.findById(session.session.user);
  if (!user) throw sessionEnded();
  return { user, ...session };
}

export async function logout(refreshToken) {
  await revokeSessionByToken(refreshToken, "logout");
}

export async function logoutEverywhere(userId) {
  await revokeUserSessions(userId, "logout_all");
}

export async function requestPasswordReset(email) {
  const user = await User.findOne({ email });
  if (!user) return;

  const token = generateOpaqueToken(32);
  user.passwordResetTokenHash = hashToken(token);
  user.passwordResetExpiresAt = new Date(Date.now() + env.auth.passwordResetMinutes * MINUTE_MS);
  await user.save({ validateBeforeSave: false });

  sendEmailInBackground({
    to: user.email,
    ...passwordResetEmail({
      name: user.name,
      resetUrl: `${env.clientUrl}/reset-password/${token}`,
      expiresInMinutes: env.auth.passwordResetMinutes,
    }),
  });
}

export async function verifyResetToken(token) {
  const user = await findUserByResetToken(token);
  if (!user) throw resetTokenInvalid();
}

export async function resetPassword(token, password) {
  const user = await findUserByResetToken(token);
  if (!user) throw resetTokenInvalid();

  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.failedLoginAttempts = 0;
  user.lockUntil = undefined;
  await user.save();

  await revokeUserSessions(user._id, "password_reset");
  sendEmailInBackground({ to: user.email, ...passwordChangedEmail({ name: user.name, resetUrl: forgotPasswordUrl() }) });
}

export async function changePassword(userId, sessionId, { currentPassword, newPassword }) {
  const user = await User.findById(userId).select("+password");
  if (!user) throw sessionEnded();

  if (!(await user.comparePassword(currentPassword))) {
    throw new AppError("Your current password is incorrect.", 400, {
      code: "INCORRECT_PASSWORD",
      details: { currentPassword: "Your current password is incorrect." },
    });
  }

  user.password = newPassword;
  await user.save();

  await revokeUserSessions(user._id, "password_changed", { exceptSessionId: sessionId });
  sendEmailInBackground({ to: user.email, ...passwordChangedEmail({ name: user.name, resetUrl: forgotPasswordUrl() }) });
}

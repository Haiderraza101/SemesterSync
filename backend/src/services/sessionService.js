import { env } from "../config/env.js";
import Session from "../models/Session.js";
import { sessionEnded } from "../utils/authErrors.js";
import { generateOpaqueToken, hashToken, signAccessToken } from "./tokenService.js";

const HOUR_MS = 60 * 60 * 1000;
const DAY_MS = 24 * HOUR_MS;

function lifetimeMs(persistent) {
  return persistent ? env.auth.refreshTokenDays * DAY_MS : env.auth.sessionHours * HOUR_MS;
}

function clientFields({ userAgent, ipAddress } = {}) {
  return {
    ...(userAgent && { userAgent: String(userAgent).slice(0, 512) }),
    ...(ipAddress && { ipAddress: String(ipAddress).slice(0, 64) }),
  };
}

function withAccessToken(session, refreshToken) {
  return {
    session,
    refreshToken,
    accessToken: signAccessToken({ userId: session.user, sessionId: session.id }),
  };
}

function withinGraceWindow(session, now) {
  if (!session.rotatedAt) return false;
  return now.getTime() - session.rotatedAt.getTime() <= env.auth.refreshGraceSeconds * 1000;
}

export async function createSession(userId, { persistent = false, ...client } = {}) {
  const refreshToken = generateOpaqueToken();
  const session = await Session.create({
    user: userId,
    tokenHash: hashToken(refreshToken),
    persistent,
    expiresAt: new Date(Date.now() + lifetimeMs(persistent)),
    ...clientFields(client),
  });
  return withAccessToken(session, refreshToken);
}

export async function rotateSession(refreshToken, client = {}) {
  if (!refreshToken) throw sessionEnded();

  const now = new Date();
  const tokenHash = hashToken(refreshToken);
  const nextToken = generateOpaqueToken();

  const rotated = await Session.findOneAndUpdate(
    { tokenHash, revokedAt: null, expiresAt: { $gt: now } },
    {
      $set: {
        tokenHash: hashToken(nextToken),
        previousTokenHash: tokenHash,
        rotatedAt: now,
        lastUsedAt: now,
        ...clientFields(client),
      },
    },
    { new: true }
  );
  if (rotated) return withAccessToken(rotated, nextToken);

  const previous = await Session.findOne({ previousTokenHash: tokenHash });
  if (previous?.isActive(now) && withinGraceWindow(previous, now)) {
    return withAccessToken(previous, null);
  }

  if (previous?.isActive(now)) {
    await revokeSession(previous.id, "token_reuse");
  }
  throw sessionEnded();
}

export async function findActiveSession(sessionId, userId) {
  return Session.exists({ _id: sessionId, user: userId, revokedAt: null, expiresAt: { $gt: new Date() } });
}

export async function revokeSession(sessionId, reason) {
  await Session.updateOne({ _id: sessionId, revokedAt: null }, { $set: { revokedAt: new Date(), revokedReason: reason } });
}

export async function revokeSessionByToken(refreshToken, reason) {
  if (!refreshToken) return;
  const tokenHash = hashToken(refreshToken);
  await Session.updateOne(
    { $or: [{ tokenHash }, { previousTokenHash: tokenHash }], revokedAt: null },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );
}

export async function revokeUserSessions(userId, reason, { exceptSessionId } = {}) {
  await Session.updateMany(
    { user: userId, revokedAt: null, ...(exceptSessionId && { _id: { $ne: exceptSessionId } }) },
    { $set: { revokedAt: new Date(), revokedReason: reason } }
  );
}

export async function deleteUserSessions(userId) {
  await Session.deleteMany({ user: userId });
}

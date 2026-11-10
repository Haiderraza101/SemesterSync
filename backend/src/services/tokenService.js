import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

const ISSUER = "semestersync-api";
const AUDIENCE = "semestersync-client";
const ALGORITHM = "HS256";

export function signAccessToken({ userId, sessionId }) {
  return jwt.sign({ sid: String(sessionId) }, env.auth.accessTokenSecret, {
    subject: String(userId),
    expiresIn: env.auth.accessTokenTtl,
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithm: ALGORITHM,
  });
}

export function verifyAccessToken(token) {
  return jwt.verify(token, env.auth.accessTokenSecret, {
    issuer: ISSUER,
    audience: AUDIENCE,
    algorithms: [ALGORITHM],
  });
}

export function generateOpaqueToken(bytes = 48) {
  return crypto.randomBytes(bytes).toString("base64url");
}

export function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

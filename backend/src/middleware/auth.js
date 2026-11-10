import User from "../models/User.js";
import { findActiveSession } from "../services/sessionService.js";
import { verifyAccessToken } from "../services/tokenService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { authRequired, sessionEnded } from "../utils/authErrors.js";

function readBearerToken(header = "") {
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req.headers.authorization);
  if (!token) throw authRequired();

  const payload = verifyAccessToken(token);
  if (!payload.sub || !payload.sid) throw sessionEnded();

  const [user, session] = await Promise.all([User.findById(payload.sub), findActiveSession(payload.sid, payload.sub)]);

  if (!user || !session) throw sessionEnded();

  req.user = user;
  req.auth = { userId: user.id, sessionId: payload.sid };
  next();
});

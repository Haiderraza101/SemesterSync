import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { verifyToken } from "../utils/token.js";

function readBearerToken(header = "") {
  const [scheme, token] = header.split(" ");
  return scheme === "Bearer" && token ? token : null;
}

export const protect = asyncHandler(async (req, res, next) => {
  const token = readBearerToken(req.headers.authorization);
  if (!token) throw new AppError("Please log in to continue.", 401);

  const payload = verifyToken(token);
  const user = await User.findById(payload.sub);

  if (!user) throw new AppError("The account for this session no longer exists.", 401);
  if (user.changedPasswordAfter(payload.iat)) {
    throw new AppError("Your password was changed recently. Please log in again.", 401);
  }

  req.user = user;
  next();
});

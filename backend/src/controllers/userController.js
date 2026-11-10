import * as userService from "../services/userService.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { clearRefreshCookie } from "../utils/cookies.js";

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await userService.updateProfile(req.user, req.body);
  res.json({ user });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await userService.deleteAccount(req.user);
  clearRefreshCookie(res);
  res.status(204).end();
});

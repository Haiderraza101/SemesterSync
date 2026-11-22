import * as avatarService from "../services/avatarService.js";
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

export const uploadAvatar = asyncHandler(async (req, res) => {
  const user = await avatarService.setAvatar(req.user, req.file);
  res.status(201).json({ user });
});

export const removeAvatar = asyncHandler(async (req, res) => {
  const user = await avatarService.removeAvatar(req.user);
  res.json({ user });
});

export const getAvatar = asyncHandler(async (req, res) => {
  const avatar = await avatarService.openAvatar(req.params.fileId);
  res.set({
    "Content-Type": avatar.contentType,
    "Content-Length": String(avatar.length),
    "Cache-Control": "public, max-age=31536000, immutable",
    "Cross-Origin-Resource-Policy": "cross-origin",
  });
  avatar.stream.on("error", () => res.destroy()).pipe(res);
});

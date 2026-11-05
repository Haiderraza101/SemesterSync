import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { signToken } from "../utils/token.js";
import { PROFILE_FIELDS } from "../validators/userValidators.js";

export const updateProfile = asyncHandler(async (req, res) => {
  PROFILE_FIELDS.forEach((field) => {
    if (req.body[field] !== undefined) req.user[field] = req.body[field];
  });
  await req.user.save();
  res.json({ user: req.user });
});

export const changePassword = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id).select("+password");

  if (!(await user.comparePassword(req.body.currentPassword))) {
    throw new AppError("Your current password is incorrect.", 400);
  }

  user.password = req.body.newPassword;
  await user.save();

  res.json({ message: "Password updated.", token: signToken(user.id) });
});

export const deleteAccount = asyncHandler(async (req, res) => {
  await req.user.deleteOne();
  res.status(204).end();
});

import User from "../models/User.js";
import AppError from "../utils/AppError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { createSession } from "../utils/token.js";

export const register = asyncHandler(async (req, res) => {
  const { name, email, rollNumber, section, password } = req.body;
  const user = await User.create({ name, email, rollNumber, section, password });
  res.status(201).json(createSession(user));
});

export const login = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const user = await User.findOne({ email }).select("+password");

  if (!user || !(await user.comparePassword(req.body.password))) {
    throw new AppError("Invalid email or password.", 401);
  }

  res.json(createSession(user));
});

export const getCurrentUser = (req, res) => {
  res.json({ user: req.user });
};

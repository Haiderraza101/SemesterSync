import { env } from "../config/env.js";
import User, { hashResetToken } from "../models/User.js";
import { sendEmail } from "../services/emailService.js";
import { passwordResetEmail } from "../services/emailTemplates.js";
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

const RESET_RESPONSE = { message: "If an account exists for that email, a reset link has been sent." };

export const forgotPassword = asyncHandler(async (req, res) => {
  const email = req.body.email.trim().toLowerCase();
  const user = await User.findOne({ email });

  if (!user) {
    res.json(RESET_RESPONSE);
    return;
  }

  const token = user.createPasswordResetToken();
  await user.save({ validateBeforeSave: false });

  try {
    const resetUrl = `${env.clientUrl}/reset-password/${token}`;
    await sendEmail({ to: user.email, ...passwordResetEmail({ name: user.name, resetUrl }) });
  } catch {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save({ validateBeforeSave: false });
    throw new AppError("The reset email could not be sent. Please try again later.", 502);
  }

  res.json(RESET_RESPONSE);
});

export const resetPassword = asyncHandler(async (req, res) => {
  const user = await User.findOne({
    resetPasswordToken: hashResetToken(req.params.token),
    resetPasswordExpires: { $gt: new Date() },
  }).select("+resetPasswordToken +resetPasswordExpires");

  if (!user) throw new AppError("This reset link is invalid or has expired.", 400);

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json(createSession(user));
});

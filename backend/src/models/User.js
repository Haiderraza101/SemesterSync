import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { env } from "../config/env.js";
import { EMAIL_PATTERN, ROLL_NUMBER_PATTERN } from "../validators/common.js";

const PUBLIC_FIELDS = ["name", "email", "rollNumber", "section", "createdAt", "updatedAt"];

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required."],
      trim: true,
      maxlength: [80, "Name must be 80 characters or fewer."],
    },
    email: {
      type: String,
      required: [true, "Email is required."],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [254, "Email must be 254 characters or fewer."],
      match: [EMAIL_PATTERN, "Enter a valid email address."],
    },
    rollNumber: {
      type: String,
      required: [true, "Roll number is required."],
      uppercase: true,
      trim: true,
      match: [ROLL_NUMBER_PATTERN, "Use the format 23L-0634."],
    },
    section: {
      type: String,
      required: [true, "Section is required."],
      uppercase: true,
      trim: true,
      maxlength: [20, "Section must be 20 characters or fewer."],
    },
    password: {
      type: String,
      required: [true, "Password is required."],
      select: false,
    },
    passwordChangedAt: { type: Date, select: false },
    passwordResetTokenHash: { type: String, select: false, index: { sparse: true } },
    passwordResetExpiresAt: { type: Date, select: false },
    failedLoginAttempts: { type: Number, default: 0, select: false },
    lockUntil: { type: Date, select: false },
    lastLoginAt: Date,
    avatarFileId: { type: mongoose.Schema.Types.ObjectId },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        const result = { id: ret._id.toString() };
        PUBLIC_FIELDS.forEach((field) => {
          if (ret[field] !== undefined) result[field] = ret[field];
        });
        result.avatar = ret.avatarFileId ? ret.avatarFileId.toString() : null;
        return result;
      },
    },
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, env.auth.bcryptRounds);
  if (!this.isNew) this.passwordChangedAt = new Date();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.isLocked = function isLocked(now = new Date()) {
  return Boolean(this.lockUntil && this.lockUntil > now);
};

userSchema.methods.lockMinutesRemaining = function lockMinutesRemaining(now = new Date()) {
  if (!this.isLocked(now)) return 0;
  return Math.max(1, Math.ceil((this.lockUntil.getTime() - now.getTime()) / 60000));
};

const User = mongoose.model("User", userSchema);

export default User;

import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import { EMAIL_PATTERN, ROLL_NUMBER_PATTERN } from "../validators/common.js";

const SALT_ROUNDS = 12;
const RESET_TOKEN_TTL_MS = 30 * 60 * 1000;

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
      minlength: [8, "Password must be at least 8 characters."],
      select: false,
    },
    passwordChangedAt: Date,
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        delete ret.password;
        delete ret.passwordChangedAt;
        delete ret.resetPasswordToken;
        delete ret.resetPasswordExpires;
        return ret;
      },
    },
  }
);

userSchema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
  if (!this.isNew) this.passwordChangedAt = new Date(Date.now() - 1000);
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.changedPasswordAfter = function changedPasswordAfter(issuedAtSeconds) {
  if (!this.passwordChangedAt) return false;
  return Math.floor(this.passwordChangedAt.getTime() / 1000) > issuedAtSeconds;
};

userSchema.methods.createPasswordResetToken = function createPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  this.resetPasswordToken = hashResetToken(token);
  this.resetPasswordExpires = new Date(Date.now() + RESET_TOKEN_TTL_MS);
  return token;
};

export function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const User = mongoose.model("User", userSchema);

export default User;

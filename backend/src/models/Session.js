import mongoose from "mongoose";

export const REVOKE_REASONS = ["logout", "logout_all", "password_changed", "password_reset", "token_reuse", "account_deleted"];

const sessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    previousTokenHash: { type: String, index: { sparse: true } },
    rotatedAt: Date,
    persistent: { type: Boolean, default: false },
    userAgent: { type: String, maxlength: 512 },
    ipAddress: { type: String, maxlength: 64 },
    lastUsedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    revokedAt: Date,
    revokedReason: { type: String, enum: REVOKE_REASONS },
  },
  { timestamps: true }
);

sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

sessionSchema.methods.isActive = function isActive(now = new Date()) {
  return !this.revokedAt && this.expiresAt > now;
};

const Session = mongoose.model("Session", sessionSchema);

export default Session;

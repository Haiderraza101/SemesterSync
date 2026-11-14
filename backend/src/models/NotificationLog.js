import mongoose from "mongoose";

const RETENTION_SECONDS = 45 * 24 * 60 * 60;

const notificationLogSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    key: { type: String, required: true, maxlength: 200 },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

notificationLogSchema.index({ user: 1, key: 1 }, { unique: true });
notificationLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: RETENTION_SECONDS });

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);

export default NotificationLog;

import mongoose from "mongoose";

const includeSchema = new mongoose.Schema(
  {
    exams: { type: Boolean, default: true },
    tasks: { type: Boolean, default: true },
    changes: { type: Boolean, default: true },
  },
  { _id: false }
);

const shareCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    include: { type: includeSchema, default: () => ({}) },
  },
  { timestamps: true }
);

const ShareCode = mongoose.model("ShareCode", shareCodeSchema);

export default ShareCode;

import mongoose from "mongoose";
import { EXAM_TERMS } from "../utils/examTerms.js";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const selectionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true, trim: true },
    section: { type: String, required: true, uppercase: true, trim: true },
  },
  { _id: false }
);

const sharedExamSchema = new mongoose.Schema(
  {
    term: { type: String, enum: EXAM_TERMS, required: true },
    code: { type: String, required: true, uppercase: true, trim: true },
    date: { type: String, required: true, match: DATE_PATTERN },
    start: { type: String, required: true, match: TIME_PATTERN },
    end: { type: String, required: true, match: TIME_PATTERN },
    venue: { type: String, trim: true, maxlength: 80, default: "" },
  },
  { _id: false }
);

const sharedTaskSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 120 },
    courseCode: { type: String, uppercase: true, trim: true, default: "" },
    type: { type: String, enum: ["assignment", "quiz"], default: "assignment" },
    due: { type: String, required: true },
  },
  { _id: false }
);

const shareCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    selections: {
      type: [selectionSchema],
      validate: [(value) => value.length > 0, "A shared schedule needs at least one course."],
    },
    exams: { type: [sharedExamSchema], default: [] },
    tasks: { type: [sharedTaskSchema], default: [] },
  },
  { timestamps: true }
);

const ShareCode = mongoose.model("ShareCode", shareCodeSchema);

export default ShareCode;

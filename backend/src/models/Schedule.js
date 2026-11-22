import mongoose from "mongoose";

const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function isOptionalDate(value) {
  return value === "" || DATE_PATTERN.test(value);
}

const selectionSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, trim: true, uppercase: true },
    section: { type: String, required: true, trim: true, uppercase: true },
  },
  { _id: false }
);

const makeupSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    code: { type: String, required: true, uppercase: true },
    date: { type: String, required: true, match: DATE_PATTERN },
    start: { type: String, required: true, match: TIME_PATTERN },
    end: { type: String, required: true, match: TIME_PATTERN },
    room: { type: String, required: true, trim: true },
  },
  { _id: false }
);

const taskSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    courseCode: { type: String, uppercase: true },
    type: { type: String, enum: ["assignment", "quiz"], default: "assignment" },
    due: { type: String, required: true },
    done: { type: Boolean, default: false },
    lectureId: { type: String, maxlength: 120 },
  },
  { _id: false }
);

const settingsSchema = new mongoose.Schema(
  {
    defaultView: { type: String, enum: ["timeGridDay", "timeGridWeek", "dayGridMonth"], default: "timeGridWeek" },
    showSaturday: { type: Boolean, default: false },
    attendanceRequirement: { type: Number, enum: [75, 80], default: 80 },
    semesterName: { type: String, trim: true, maxlength: 40, default: "" },
    semesterStart: { type: String, default: "", validate: [isOptionalDate, "Use the format YYYY-MM-DD."] },
    semesterEnd: { type: String, default: "", validate: [isOptionalDate, "Use the format YYYY-MM-DD."] },
  },
  { _id: false }
);

const scheduleSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    catalog: { type: mongoose.Schema.Types.Mixed, default: null },
    selections: { type: [selectionSchema], default: [] },
    cancelled: { type: [String], default: [] },
    makeups: { type: [makeupSchema], default: [] },
    dateSheets: {
      midterm: { type: mongoose.Schema.Types.Mixed, default: null },
      midterm2: { type: mongoose.Schema.Types.Mixed, default: null },
      final: { type: mongoose.Schema.Types.Mixed, default: null },
    },
    tasks: { type: [taskSchema], default: [] },
    attendance: {
      baseline: { type: mongoose.Schema.Types.Mixed, default: {} },
      marks: { type: Map, of: { type: String, enum: ["present", "late", "absent"] }, default: {} },
    },
    settings: { type: settingsSchema, default: () => ({}) },
  },
  {
    timestamps: true,
    minimize: false,
    toJSON: {
      flattenMaps: true,
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        return ret;
      },
    },
  }
);

export const EDITABLE_SCHEDULE_FIELDS = [
  "catalog",
  "selections",
  "cancelled",
  "makeups",
  "dateSheets",
  "tasks",
  "attendance",
  "settings",
];

const Schedule = mongoose.model("Schedule", scheduleSchema);

export default Schedule;

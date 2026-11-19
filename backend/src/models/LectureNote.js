import mongoose from "mongoose";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
const TIME_PATTERN = /^([01]\d|2[0-3]):[0-5]\d$/;

const linkSchema = new mongoose.Schema(
  {
    id: { type: String, required: true, maxlength: 60 },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    url: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  { _id: false }
);

const fileSchema = new mongoose.Schema(
  {
    fileId: { type: mongoose.Schema.Types.ObjectId, required: true },
    name: { type: String, required: true, maxlength: 200 },
    size: { type: Number, required: true, min: 0 },
    mimeType: { type: String, maxlength: 120, default: "application/octet-stream" },
    uploadedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const lectureNoteSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    lectureId: { type: String, required: true, maxlength: 120 },
    courseCode: { type: String, required: true, uppercase: true, trim: true, maxlength: 40 },
    courseName: { type: String, trim: true, maxlength: 160, default: "" },
    date: { type: String, required: true, match: DATE_PATTERN },
    start: { type: String, match: TIME_PATTERN },
    notes: { type: String, maxlength: 20000, default: "" },
    links: { type: [linkSchema], default: [] },
    files: { type: [fileSchema], default: [] },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        delete ret._id;
        delete ret.__v;
        delete ret.user;
        ret.files = (ret.files || []).map(({ fileId, ...file }) => ({ id: String(fileId), ...file }));
        return ret;
      },
    },
  }
);

lectureNoteSchema.index({ user: 1, lectureId: 1 }, { unique: true });
lectureNoteSchema.index({ user: 1, courseCode: 1, date: -1 });

const LectureNote = mongoose.model("LectureNote", lectureNoteSchema);

export default LectureNote;

import mongoose from "mongoose";

const shareCodeSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    selections: {
      type: [
        new mongoose.Schema(
          {
            code: { type: String, required: true, uppercase: true, trim: true },
            section: { type: String, required: true, uppercase: true, trim: true },
          },
          { _id: false }
        ),
      ],
      validate: [(value) => value.length > 0, "A shared schedule needs at least one course."],
    },
  },
  { timestamps: true }
);

const ShareCode = mongoose.model("ShareCode", shareCodeSchema);

export default ShareCode;

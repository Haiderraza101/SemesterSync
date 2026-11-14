import { parseTimetable } from "../services/timetable/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_FILE_NAME_LENGTH = 200;

function safeFileName(name) {
  return String(name || "timetable.xlsx")
    .replace(/[\\/\u0000-\u001f]/g, "")
    .slice(0, MAX_FILE_NAME_LENGTH);
}

export const parseTimetableFile = asyncHandler(async (req, res) => {
  const catalog = parseTimetable(req.file.buffer, {
    fileName: safeFileName(req.file.originalname),
    fileSize: req.file.size,
  });
  res.json(catalog);
});

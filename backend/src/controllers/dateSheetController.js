import { parseDateSheet } from "../services/datesheet/index.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const MAX_FILE_NAME_LENGTH = 200;

function safeFileName(name) {
  return String(name || "date-sheet.xlsx")
    .replace(/[\\/\u0000-\u001f]/g, "")
    .slice(0, MAX_FILE_NAME_LENGTH);
}

export const parseDateSheetFile = asyncHandler(async (req, res) => {
  const sheet = parseDateSheet(req.file.buffer, {
    fileName: safeFileName(req.file.originalname),
    fileSize: req.file.size,
  });
  res.json({ ...sheet, term: req.body.term || sheet.detectedTerm || "midterm" });
});

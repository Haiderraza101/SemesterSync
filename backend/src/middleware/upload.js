import multer from "multer";
import AppError from "../utils/AppError.js";

const MAX_FILE_MB = 10;
const SPREADSHEET_EXTENSION_PATTERN = /\.(xlsx|xls)$/i;
const SPREADSHEET_SIGNATURES = [
  Buffer.from([0x50, 0x4b, 0x03, 0x04]),
  Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]),
];

const unsupportedType = () =>
  new AppError("Upload an Excel file (.xlsx or .xls).", 415, { code: "UNSUPPORTED_FILE_TYPE" });

const spreadsheetUploader = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_FILE_MB * 1024 * 1024, files: 1, fields: 5 },
  fileFilter(req, file, callback) {
    if (!SPREADSHEET_EXTENSION_PATTERN.test(file.originalname)) {
      callback(unsupportedType());
      return;
    }
    callback(null, true);
  },
});

function hasSpreadsheetSignature(buffer) {
  return SPREADSHEET_SIGNATURES.some((signature) => buffer.subarray(0, signature.length).equals(signature));
}

function toUploadError(error) {
  if (!(error instanceof multer.MulterError)) return error;
  if (error.code === "LIMIT_FILE_SIZE") {
    return new AppError(`The file must be ${MAX_FILE_MB} MB or smaller.`, 413, { code: "FILE_TOO_LARGE" });
  }
  return new AppError("Upload a single spreadsheet in the file field.", 400, { code: "INVALID_UPLOAD" });
}

export const spreadsheetUpload = (field) => (req, res, next) => {
  spreadsheetUploader.single(field)(req, res, (error) => {
    if (error) return next(toUploadError(error));
    if (!req.file) return next(new AppError("Choose a file to upload.", 400, { code: "FILE_REQUIRED" }));
    if (!hasSpreadsheetSignature(req.file.buffer)) return next(unsupportedType());
    return next();
  });
};

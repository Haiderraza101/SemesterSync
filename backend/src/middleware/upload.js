import multer from "multer";
import AppError from "../utils/AppError.js";

const ZIP_SIGNATURE = Buffer.from([0x50, 0x4b, 0x03, 0x04]);
const OLE_SIGNATURE = Buffer.from([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
const SPREADSHEET_EXTENSIONS = /\.(xlsx|xls)$/i;
const DOCUMENT_EXTENSIONS =
  /\.(pdf|docx?|pptx?|xlsx?|csv|txt|md|rtf|odt|odp|ods|png|jpe?g|gif|webp|zip|ipynb|py|java|c|cpp|h|js|jsx|ts|tsx|html|css|sql|json)$/i;

function decodeFileName(name) {
  const decoded = Buffer.from(name, "latin1").toString("utf8");
  return decoded.includes("\uFFFD") ? name : decoded;
}

function startsWith(buffer, signature) {
  return buffer.subarray(0, signature.length).equals(signature);
}

function createUploader({ maxMb, extensions, typeMessage, validateBuffer }) {
  const unsupported = () => new AppError(typeMessage, 415, { code: "UNSUPPORTED_FILE_TYPE" });

  const uploader = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxMb * 1024 * 1024, files: 1, fields: 5 },
    fileFilter(req, file, callback) {
      if (!extensions.test(file.originalname)) {
        callback(unsupported());
        return;
      }
      callback(null, true);
    },
  });

  return (field) => (req, res, next) => {
    uploader.single(field)(req, res, (error) => {
      if (error instanceof multer.MulterError) {
        return next(
          error.code === "LIMIT_FILE_SIZE"
            ? new AppError(`The file must be ${maxMb} MB or smaller.`, 413, { code: "FILE_TOO_LARGE" })
            : new AppError("Upload a single file in the file field.", 400, { code: "INVALID_UPLOAD" })
        );
      }
      if (error) return next(error);
      if (!req.file) return next(new AppError("Choose a file to upload.", 400, { code: "FILE_REQUIRED" }));
      req.file.originalname = decodeFileName(req.file.originalname);
      if (req.file.size === 0) return next(new AppError("The file is empty.", 400, { code: "EMPTY_FILE" }));
      if (validateBuffer && !validateBuffer(req.file.buffer)) return next(unsupported());
      return next();
    });
  };
}

export const spreadsheetUpload = createUploader({
  maxMb: 10,
  extensions: SPREADSHEET_EXTENSIONS,
  typeMessage: "Upload an Excel file (.xlsx or .xls).",
  validateBuffer: (buffer) => startsWith(buffer, ZIP_SIGNATURE) || startsWith(buffer, OLE_SIGNATURE),
});

export const documentUpload = createUploader({
  maxMb: 25,
  extensions: DOCUMENT_EXTENSIONS,
  typeMessage: "This file type is not supported. Upload documents, slides, images, code or zip files.",
});

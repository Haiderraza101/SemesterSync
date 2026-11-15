import { Router } from "express";
import { parseDateSheetFile } from "../controllers/dateSheetController.js";
import { protect } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimit.js";
import { spreadsheetUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { dateSheetUploadSchema } from "../validators/dateSheetValidators.js";

const router = Router();

router.post(
  "/parse",
  protect,
  uploadLimiter,
  spreadsheetUpload("file"),
  validate({ body: dateSheetUploadSchema }),
  parseDateSheetFile
);

export default router;

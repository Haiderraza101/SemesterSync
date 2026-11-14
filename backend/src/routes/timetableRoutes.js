import { Router } from "express";
import { parseTimetableFile } from "../controllers/timetableController.js";
import { protect } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimit.js";
import { spreadsheetUpload } from "../middleware/upload.js";

const router = Router();

router.post("/parse", protect, uploadLimiter, spreadsheetUpload("file"), parseTimetableFile);

export default router;

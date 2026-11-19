import { Router } from "express";
import {
  deleteLectureFile,
  downloadLectureFile,
  getLecture,
  listLectures,
  updateLecture,
  uploadLectureFile,
} from "../controllers/lectureController.js";
import { protect } from "../middleware/auth.js";
import { uploadLimiter } from "../middleware/rateLimit.js";
import { documentUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import {
  lectureFileBodySchema,
  lectureFileParamsSchema,
  lectureListQuerySchema,
  lectureParamsSchema,
  lectureUpdateSchema,
} from "../validators/lectureValidators.js";

const router = Router();

router.use(protect);

router.get("/", validate({ query: lectureListQuerySchema }), listLectures);
router
  .route("/:lectureId")
  .get(validate({ params: lectureParamsSchema }), getLecture)
  .put(validate({ params: lectureParamsSchema, body: lectureUpdateSchema }), updateLecture);
router.post(
  "/:lectureId/files",
  uploadLimiter,
  documentUpload("file"),
  validate({ params: lectureParamsSchema, body: lectureFileBodySchema }),
  uploadLectureFile
);
router
  .route("/:lectureId/files/:fileId")
  .get(validate({ params: lectureFileParamsSchema }), downloadLectureFile)
  .delete(validate({ params: lectureFileParamsSchema }), deleteLectureFile);

export default router;

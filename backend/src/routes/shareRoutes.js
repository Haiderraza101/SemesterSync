import { Router } from "express";
import { createShareCode, disableShareCode, getShareCode } from "../controllers/shareController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { shareValidator } from "../validators/shareValidators.js";

const router = Router();

router.use(protect);

router.route("/").post(validate(shareValidator), createShareCode).delete(disableShareCode);
router.get("/:code", getShareCode);

export default router;

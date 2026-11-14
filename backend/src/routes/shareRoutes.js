import { Router } from "express";
import { createShareCode, disableShareCode, getMyShareCode, getShareCode } from "../controllers/shareController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { shareSchema } from "../validators/shareValidators.js";

const router = Router();

router.use(protect);

router.route("/").get(getMyShareCode).post(validate({ body: shareSchema }), createShareCode).delete(disableShareCode);
router.get("/:code", getShareCode);

export default router;

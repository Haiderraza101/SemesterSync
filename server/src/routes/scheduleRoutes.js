import { Router } from "express";
import { getSchedule, resetSchedule, updateSchedule } from "../controllers/scheduleController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { scheduleValidator } from "../validators/scheduleValidators.js";

const router = Router();

router.use(protect);

router.route("/").get(getSchedule).put(validate(scheduleValidator), updateSchedule).delete(resetSchedule);

export default router;

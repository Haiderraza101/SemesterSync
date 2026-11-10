import { Router } from "express";
import { getSchedule, resetSchedule, updateSchedule } from "../controllers/scheduleController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { scheduleSchema } from "../validators/scheduleValidators.js";

const router = Router();

router.use(protect);

router.route("/").get(getSchedule).put(validate({ body: scheduleSchema }), updateSchedule).delete(resetSchedule);

export default router;

import { Router } from "express";
import { changePassword, getCurrentUser } from "../controllers/authController.js";
import { deleteAccount, updateProfile } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { sensitiveActionLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import { changePasswordSchema, profileSchema } from "../validators/userValidators.js";

const router = Router();

router.use(protect);

router
  .route("/me")
  .get(getCurrentUser)
  .put(validate({ body: profileSchema }), updateProfile)
  .delete(sensitiveActionLimiter, deleteAccount);
router.put("/me/password", sensitiveActionLimiter, validate({ body: changePasswordSchema }), changePassword);

export default router;

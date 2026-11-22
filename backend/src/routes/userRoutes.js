import { Router } from "express";
import { changePassword, getCurrentUser } from "../controllers/authController.js";
import { deleteAccount, getAvatar, removeAvatar, updateProfile, uploadAvatar } from "../controllers/userController.js";
import { protect } from "../middleware/auth.js";
import { sensitiveActionLimiter, uploadLimiter } from "../middleware/rateLimit.js";
import { imageUpload } from "../middleware/upload.js";
import { validate } from "../middleware/validate.js";
import { avatarParamsSchema, changePasswordSchema, profileSchema } from "../validators/userValidators.js";

const router = Router();

router.get("/avatars/:fileId", validate({ params: avatarParamsSchema }), getAvatar);

router.use(protect);

router
  .route("/me")
  .get(getCurrentUser)
  .put(validate({ body: profileSchema }), updateProfile)
  .delete(sensitiveActionLimiter, deleteAccount);
router.route("/me/avatar").post(uploadLimiter, imageUpload("avatar"), uploadAvatar).delete(removeAvatar);
router.put("/me/password", sensitiveActionLimiter, validate({ body: changePasswordSchema }), changePassword);

export default router;

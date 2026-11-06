import { Router } from "express";
import { changePassword, deleteAccount, updateProfile } from "../controllers/userController.js";
import { getCurrentUser } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import { changePasswordValidator, profileValidator } from "../validators/userValidators.js";

const router = Router();

router.use(protect);

router.route("/me").get(getCurrentUser).put(validate(profileValidator), updateProfile).delete(deleteAccount);
router.put("/me/password", validate(changePasswordValidator), changePassword);

export default router;

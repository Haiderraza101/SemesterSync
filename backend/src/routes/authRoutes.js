import { Router } from "express";
import { forgotPassword, getCurrentUser, login, register, resetPassword } from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordValidator,
  loginValidator,
  registerValidator,
  resetPasswordValidator,
} from "../validators/authValidators.js";

const router = Router();

router.post("/register", validate(registerValidator), register);
router.post("/login", validate(loginValidator), login);
router.post("/forgot-password", validate(forgotPasswordValidator), forgotPassword);
router.post("/reset-password/:token", validate(resetPasswordValidator), resetPassword);
router.get("/me", protect, getCurrentUser);

export default router;

import { Router } from "express";
import {
  forgotPassword,
  getCurrentUser,
  login,
  logout,
  logoutEverywhere,
  refresh,
  register,
  resetPassword,
  verifyResetToken,
} from "../controllers/authController.js";
import { protect } from "../middleware/auth.js";
import { requireTrustedOrigin } from "../middleware/originGuard.js";
import { loginLimiter, passwordResetLimiter, registerLimiter, sessionLimiter } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordSchema,
  resetTokenParamsSchema,
} from "../validators/authValidators.js";

const router = Router();

router.use(requireTrustedOrigin);

router.post("/register", registerLimiter, validate({ body: registerSchema }), register);
router.post("/login", loginLimiter, validate({ body: loginSchema }), login);
router.post("/refresh", sessionLimiter, refresh);
router.post("/logout", sessionLimiter, logout);
router.post("/logout-all", protect, logoutEverywhere);
router.get("/me", protect, getCurrentUser);

router.post("/forgot-password", passwordResetLimiter, validate({ body: forgotPasswordSchema }), forgotPassword);
router.get("/reset-password/:token", sessionLimiter, validate({ params: resetTokenParamsSchema }), verifyResetToken);
router.post(
  "/reset-password/:token",
  passwordResetLimiter,
  validate({ params: resetTokenParamsSchema, body: resetPasswordSchema }),
  resetPassword
);

export default router;

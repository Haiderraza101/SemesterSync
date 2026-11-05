import { Router } from "express";
import authRoutes from "./authRoutes.js";
import scheduleRoutes from "./scheduleRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "semestersync-api" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/schedule", scheduleRoutes);

export default router;

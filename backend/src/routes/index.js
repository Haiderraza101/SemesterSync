import { Router } from "express";
import authRoutes from "./authRoutes.js";
import dateSheetRoutes from "./dateSheetRoutes.js";
import scheduleRoutes from "./scheduleRoutes.js";
import shareRoutes from "./shareRoutes.js";
import timetableRoutes from "./timetableRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "semestersync-api" });
});

router.use("/auth", authRoutes);
router.use("/users", userRoutes);
router.use("/schedule", scheduleRoutes);
router.use("/share", shareRoutes);
router.use("/timetable", timetableRoutes);
router.use("/datesheets", dateSheetRoutes);

export default router;

import { Router } from "express";
import authRoutes from "./authRoutes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "semestersync-api" });
});

router.use("/auth", authRoutes);

export default router;

import { Router } from "express";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok", service: "semestersync-api" });
});

export default router;

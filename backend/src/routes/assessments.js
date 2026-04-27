const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const {
  saveAssessment,
  getAssessmentsByUser,
} = require("../db/assessmentRepository");

// ── POST /api/assessments ─────────────────────────────────────────────────────
router.post("/", async (req, res) => {
  const { type, input, result } = req.body;
  const userId = req.user?.id;

  if (!type || !result) {
    return res.status(400).json({ success: false, error: "type and result are required" });
  }

  const validTypes = ["career", "roi", "admission", "loan"];
  if (!validTypes.includes(type)) {
    return res.status(400).json({
      success: false,
      error: `type must be one of: ${validTypes.join(", ")}`,
    });
  }

  try {
    const assessment = await saveAssessment(userId, type, input ?? {}, result);
    res.status(201).json({ success: true, data: assessment });
  } catch (err) {
    console.error("Save assessment error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/assessments (authenticated user's own) ───────────────────────────
router.get("/", async (req, res) => {
  const userId = req.user?.id;
  const { type, limit } = req.query;

  try {
    const all = await getAssessmentsByUser(
      userId,
      typeof type === "string" ? type : null
    );
    const capped = limit ? all.slice(0, Number(limit)) : all.slice(0, 10);
    res.json({ success: true, data: capped });
  } catch (err) {
    console.error("Get assessments error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/assessments/recent ───────────────────────────────────────────────
router.get("/recent", async (req, res) => {
  const userId = req.user?.id;
  try {
    const all = await getAssessmentsByUser(userId);
    res.json({ success: true, data: all.slice(0, 5) });
  } catch (err) {
    console.error("Get recent assessments error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/assessments/:userId ──────────────────────────────────────────────
// Returns last 10 assessments for a given userId.
// Accepts optional ?type= and ?limit= query params.
router.get("/:userId", async (req, res) => {
  const { userId } = req.params;
  const { type, limit } = req.query;

  // Only allow users to fetch their own assessments
  if (req.user?.id !== userId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  try {
    const all = await getAssessmentsByUser(
      userId,
      typeof type === "string" ? type : null
    );
    const capped = all.slice(0, limit ? Number(limit) : 10);
    res.json({ success: true, data: capped });
  } catch (err) {
    console.error("Get assessments by userId error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ── GET /api/assessments/:userId/:assessmentId ────────────────────────────────
// Returns a single assessment with full input and result.
router.get("/:userId/:assessmentId", async (req, res) => {
  const { userId, assessmentId } = req.params;

  if (req.user?.id !== userId) {
    return res.status(403).json({ success: false, error: "Forbidden" });
  }

  if (!mongoose.Types.ObjectId.isValid(assessmentId)) {
    return res.status(400).json({ success: false, error: "Invalid assessment ID" });
  }

  try {
    const Assessment = require("../models/Assessment");
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      userId,
    }).lean();

    if (!assessment) {
      return res.status(404).json({ success: false, error: "Assessment not found" });
    }

    res.json({ success: true, data: assessment });
  } catch (err) {
    console.error("Get single assessment error:", err.message);
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;

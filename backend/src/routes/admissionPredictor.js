const express = require("express");
const router = express.Router();
const { cerebrasService } = require("../services");
const { saveAssessment } = require("../db/assessmentRepository");
const { addPoints, addBadge } = require("../db/userRepository");

/**
 * POST /api/admission-predictor
 * Predicts admission chances and provides profile analysis.
 */
router.post("/", async (req, res) => {
  const {
    university,
    course,
    gre,
    gmat,
    gpa,
    workExp,
    publications,
    extraCurricular,
    sop,
  } = req.body;

  if (!university || !course) {
    return res.status(400).json({
      success: false,
      error: "university and course are required",
    });
  }

  const systemPrompt = `You are an admission committee expert who has reviewed 10000+ applications.`;

  const userPrompt = `Evaluate this application for an Indian student:

- Target University: ${university}
- Course / Program: ${course}
- GRE Score: ${gre ?? "Not taken"}
- GMAT Score: ${gmat ?? "Not taken"}
- GPA / CGPA: ${gpa ?? "Not provided"}
- Work Experience (years): ${workExp ?? 0}
- Publications / Research: ${publications ?? 0}
- Extra-Curricular Activities: ${extraCurricular || "Not mentioned"}
- SOP Summary: ${sop || "Not provided"}

Return a JSON object with exactly this structure:
{
  "admissionChance": number,
  "profileStrength": string,
  "strengths": [string],
  "weaknesses": [string],
  "improvementTips": [string],
  "similarProfiles": [
    { "university": string, "result": string }
  ]
}

admissionChance is a percentage (0-100). profileStrength is one of: "Excellent", "Strong", "Average", "Below Average", "Weak". Include 3-5 items in strengths, weaknesses, and improvementTips. Include 3-4 similar profiles with realistic outcomes.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 1536, temperature: 0.6 }
    );

    if (req.user?.id) {
      const uid = req.user.id;
      Promise.all([
        saveAssessment(uid, "admission", req.body, data),
        addPoints(uid, 25),
        addBadge(uid, "Dream Chaser"),
      ]).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("admission-predictor error:", err.message);
    const userMessage = err.message.includes("timed out")
      ? "The AI took too long to respond. Please try again."
      : "Failed to predict admission chances. Please try again.";
    res.status(502).json({ success: false, error: userMessage });
  }
});

module.exports = router;

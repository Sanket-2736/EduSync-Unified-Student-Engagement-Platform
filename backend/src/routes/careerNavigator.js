const express = require("express");
const router = express.Router();
const { cerebrasService } = require("../services");
const { saveAssessment } = require("../db/assessmentRepository");
const { addPoints, addBadge } = require("../db/userRepository");

/**
 * POST /api/career-navigator
 */
router.post("/", async (req, res) => {
  const {
    gre,
    gpa,
    budget,
    field,
    workExp,
    preferredCountries = [],
  } = req.body;

  if (!field) {
    return res.status(400).json({ success: false, error: "field is required" });
  }

  const systemPrompt = `You are an expert study-abroad counselor for Indian students with 15 years experience. Analyze the student profile and recommend universities.`;

  const userPrompt = `Analyze this Indian student profile and provide personalized recommendations:

- GRE Score: ${gre ?? "Not taken"}
- GPA / CGPA: ${gpa ?? "Not provided"}
- Budget (USD/year): ${budget ?? "Not specified"}
- Field of Study: ${field}
- Work Experience (years): ${workExp ?? 0}
- Preferred Countries: ${preferredCountries.length ? preferredCountries.join(", ") : "Open to all"}

Return a JSON object with exactly this structure:
{
  "topCountries": [
    { "name": string, "reason": string, "avgCost": string, "visaDifficulty": string }
  ],
  "topUniversities": [
    { "name": string, "country": string, "rank": number, "admissionChance": string, "avgPackage": string, "tuitionFee": string }
  ],
  "recommendedCourses": [
    { "name": string, "duration": string, "whyFit": string }
  ],
  "personalizedMessage": string
}

Include 3-5 countries, 6-8 universities (mix of reach/match/safe), and 3-4 courses.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 2048, temperature: 0.7 }
    );

    // Persist result + reward user (fire-and-forget, never block the response)
    if (req.user?.id) {
      const uid = req.user.id;
      Promise.all([
        saveAssessment(uid, "career", req.body, data),
        addPoints(uid, 25),
        addBadge(uid, "Career Explorer"),
      ]).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("career-navigator error:", err.message);
    const userMessage = err.message.includes("timed out")
      ? "The AI took too long to respond. Please try again."
      : err.message.includes("API error")
      ? "AI service error. Please try again in a moment."
      : "Failed to generate recommendations. Please try again.";
    res.status(502).json({ success: false, error: userMessage });
  }
});

module.exports = router;

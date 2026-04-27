const express = require("express");
const router = express.Router();
const { cerebrasService } = require("../services");
const { saveAssessment } = require("../db/assessmentRepository");
const { addPoints, addBadge } = require("../db/userRepository");

/**
 * POST /api/roi-calculator
 * Calculates education ROI for a given university, course, and loan amount.
 */
router.post("/", async (req, res) => {
  const { university, course, loanAmount, country, fieldOfStudy } = req.body;

  if (!university || !course || !country) {
    return res.status(400).json({
      success: false,
      error: "university, course, and country are required",
    });
  }

  const systemPrompt = `You are a financial advisor specializing in education ROI for Indian students.`;

  const userPrompt = `Calculate the education ROI for this Indian student:

- University: ${university}
- Course: ${course}
- Country: ${country}
- Field of Study: ${fieldOfStudy || course}
- Education Loan Amount (USD): ${loanAmount ?? 0}

Provide realistic salary estimates in USD based on the country and field. Include a 10-year salary growth curve.

Return a JSON object with exactly this structure:
{
  "avgSalaryYear1": number,
  "avgSalaryYear3": number,
  "avgSalaryYear5": number,
  "loanPayoffYears": number,
  "netROI5yr": number,
  "netROI10yr": number,
  "verdict": string,
  "salaryGrowthCurve": [
    { "year": number, "salary": number }
  ]
}

salaryGrowthCurve should cover years 1 through 10. netROI values are percentages. verdict should be a 2-3 sentence summary.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 1536, temperature: 0.5 }
    );

    if (req.user?.id) {
      const uid = req.user.id;
      Promise.all([
        saveAssessment(uid, "roi", req.body, data),
        addPoints(uid, 25),
        addBadge(uid, "ROI Explorer"),
      ]).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("roi-calculator error:", err.message);
    const userMessage = err.message.includes("timed out")
      ? "The AI took too long to respond. Please try again."
      : "Failed to calculate ROI. Please try again.";
    res.status(502).json({ success: false, error: userMessage });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { computeApplicationScore, computeLoanRisk } = require("../services/scoringEngine");
const { cerebrasService } = require("../services");

/**
 * POST /api/scores/application
 * Returns the deterministic Application Strength Score.
 * The LLM generates a short explanation of the score — it does NOT produce the score.
 *
 * Body: { profile: { academics, preferences, finances, goals } }
 */
router.post("/application", async (req, res) => {
  const { profile } = req.body;

  if (!profile) {
    return res.status(400).json({ success: false, error: "profile is required" });
  }

  // 1. Compute score deterministically
  const scoreResult = computeApplicationScore(profile);

  // 2. Ask LLM to explain the score (not produce it)
  const systemPrompt = `You are a concise study-abroad advisor. You are given a student's Application Strength Score that was computed by a deterministic scoring system. Your job is to explain what the score means and give 2-3 specific, actionable improvements. Be direct and encouraging. Max 4 sentences total.`;

  const userPrompt = `Application Strength Score: ${scoreResult.overall}/100 (${scoreResult.tier})

Sub-scores:
- Academics (GPA/Degree): ${scoreResult.sub.academics}/100
- Test Scores (GRE/IELTS): ${scoreResult.sub.testScores}/100
- Work Experience: ${scoreResult.sub.experience}/100
- Financial Readiness: ${scoreResult.sub.financial}/100
- Profile Completeness: ${scoreResult.sub.completeness}/100

Student profile summary:
- GPA: ${profile.academics?.gpa ?? "not provided"}
- GRE: ${profile.academics?.greScore ?? "not provided"}
- Work experience: ${profile.academics?.workExperience ?? 0} years
- Target field: ${profile.preferences?.targetField ?? "not specified"}
- Education budget: $${profile.finances?.educationBudget ?? 0}k

Explain what this score means for their university applications and give 2-3 specific improvements for the weakest sub-scores.`;

  try {
    const explanation = await cerebrasService.chat(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 300, temperature: 0.5 }
    );

    res.json({
      success: true,
      data: {
        ...scoreResult,
        explanation,
      },
    });
  } catch (err) {
    // Score is still valid even if LLM explanation fails
    console.error("Score explanation error:", err.message);
    res.json({
      success: true,
      data: {
        ...scoreResult,
        explanation: null,
      },
    });
  }
});

/**
 * POST /api/scores/loan-risk
 * Returns the deterministic Loan Risk Score + flag.
 * The LLM generates a plain-English explanation of the risk.
 *
 * Body: { loanAmountUSD, familyIncomeINR, hasCollateral, targetCountries, targetField, gpa, greScore }
 */
router.post("/loan-risk", async (req, res) => {
  const {
    loanAmountUSD,
    familyIncomeINR,
    hasCollateral,
    targetCountries,
    targetField,
    gpa,
    greScore,
  } = req.body;

  if (!loanAmountUSD) {
    return res.status(400).json({ success: false, error: "loanAmountUSD is required" });
  }

  // 1. Compute risk deterministically
  const riskResult = computeLoanRisk({
    loanAmountUSD,
    familyIncomeINR,
    hasCollateral,
    targetCountries,
    targetField,
    gpa,
    greScore,
  });

  // 2. Ask LLM to explain the risk in plain English
  const systemPrompt = `You are a financial advisor for Indian students taking education loans. You are given a computed Loan Risk Score. Explain what it means in 2-3 sentences. If risk is high, be direct about the concern. Always end with one actionable suggestion. Do not repeat the numbers — they are shown separately.`;

  const userPrompt = `Loan Risk Level: ${riskResult.riskLevel} (score: ${riskResult.riskScore}/100)
Loan-to-salary ratio: ${riskResult.loanToSalaryRatio}x (safe threshold: ${riskResult.safeThreshold}x)
EMI as % of expected salary: ${riskResult.emiToIncomeRatio}%
Target country: ${riskResult.bestCountry} (${riskResult.postStudyWorkYears} years post-study work rights)
${riskResult.warnings.length > 0 ? "Warnings: " + riskResult.warnings.join(" | ") : "No critical warnings."}

Explain this risk assessment in plain English for the student.`;

  try {
    const explanation = await cerebrasService.chat(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 200, temperature: 0.4 }
    );

    res.json({
      success: true,
      data: {
        ...riskResult,
        explanation,
      },
    });
  } catch (err) {
    console.error("Loan risk explanation error:", err.message);
    res.json({
      success: true,
      data: {
        ...riskResult,
        explanation: null,
      },
    });
  }
});

module.exports = router;

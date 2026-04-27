const express = require("express");
const router = express.Router();
const { cerebrasService } = require("../services");
const { saveAssessment } = require("../db/assessmentRepository");
const { addPoints, addBadge } = require("../db/userRepository");

/**
 * POST /api/loan/eligibility
 * Calculates education loan eligibility and recommends lenders.
 */
router.post("/eligibility", async (req, res) => {
  const {
    course,
    university,
    country,
    loanAmount,
    familyIncome,
    hasCollateral,
    coApplicantIncome,
    cibilScore,
  } = req.body;

  if (!course || !university || !country || !loanAmount) {
    return res.status(400).json({
      success: false,
      error: "course, university, country, and loanAmount are required",
    });
  }

  const systemPrompt = `You are an Indian education loan expert familiar with SBI, HDFC Credila, Avanse, Auxilo, and ICICI Bank education loan products.`;

  const userPrompt = `Analyze education loan eligibility for this Indian student:

- Course: ${course}
- University: ${university}
- Country: ${country}
- Requested Loan Amount (USD): ${loanAmount}
- Family Annual Income (INR): ${familyIncome ?? "Not provided"}
- Has Collateral: ${hasCollateral ? "Yes" : "No"}
- Co-Applicant Income (INR): ${coApplicantIncome ?? "Not provided"}
- CIBIL Score: ${cibilScore ?? "Not provided"}

Return a JSON object with exactly this structure:
{
  "eligibleAmount": number,
  "recommendedLoanAmount": number,
  "estimatedInterestRate": number,
  "emiEstimate": number,
  "loanTenure": number,
  "approvalChance": string,
  "topLenders": [
    { "name": string, "interestRate": number, "maxAmount": number, "processingFee": number, "pros": [string], "cons": [string] }
  ],
  "requiredDocuments": [string],
  "tips": [string]
}

eligibleAmount and recommendedLoanAmount in USD. interestRate as percentage. emiEstimate in INR. loanTenure in years. approvalChance is one of: "Very High", "High", "Moderate", "Low", "Very Low". Include 3-4 lenders. Include 5-6 required documents and 4-5 tips.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 2048, temperature: 0.5 }
    );

    if (req.user?.id) {
      const uid = req.user.id;
      Promise.all([
        saveAssessment(uid, "loan", req.body, data),
        addPoints(uid, 25),
        addBadge(uid, "Loan Ready"),
      ]).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("loan eligibility error:", err.message);
    const userMessage = err.message.includes("timed out")
      ? "The AI took too long to respond. Please try again."
      : "Failed to check eligibility. Please try again.";
    res.status(502).json({ success: false, error: userMessage });
  }
});

/**
 * POST /api/loan/repayment-scenarios
 * Generates repayment scenarios for different EMI strategies.
 */
router.post("/repayment-scenarios", async (req, res) => {
  const { loanAmount, interestRate, tenure, expectedSalary } = req.body;

  if (!loanAmount || !interestRate || !tenure) {
    return res.status(400).json({
      success: false,
      error: "loanAmount, interestRate, and tenure are required",
    });
  }

  const systemPrompt = `You are an Indian education loan expert familiar with SBI, HDFC Credila, Avanse, Auxilo, and ICICI Bank education loan products.`;

  const userPrompt = `Generate repayment scenarios for this education loan:

- Loan Amount (USD): ${loanAmount}
- Interest Rate (% per annum): ${interestRate}
- Tenure (years): ${tenure}
- Expected Salary (USD/year): ${expectedSalary ?? "Not provided"}

Return a JSON object with exactly this structure:
{
  "scenarios": [
    { "name": string, "emiAmount": number, "totalInterest": number, "totalPayment": number, "payoffMonths": number }
  ],
  "recommendation": string,
  "repaymentTimeline": [
    { "month": number, "balance": number, "emi": number }
  ]
}

scenarios should include 3-4 different strategies (e.g., "Standard EMI", "Accelerated Repayment", "Income-Based"). All amounts in INR. repaymentTimeline should cover the first 24 months. recommendation should be 2-3 sentences based on expected salary.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 2048, temperature: 0.5 }
    );
    res.json({ success: true, data });
  } catch (err) {
    console.error("loan repayment-scenarios error:", err.message);
    const userMessage = err.message.includes("timed out")
      ? "The AI took too long to respond. Please try again."
      : "Failed to generate repayment plan. Please try again.";
    res.status(502).json({ success: false, error: userMessage });
  }
});

module.exports = router;

/**
 * Profile Strength Scoring Engine
 * Pure deterministic math — no LLM involved.
 * The LLM is only used to explain the output, never to produce it.
 */

// ── Country job market data ───────────────────────────────────────────────────
// Post-study work rights duration (years) and avg first-year salary (USD)
const COUNTRY_DATA = {
  USA:         { workRights: 3,   avgSalaryUSD: 85000,  jobMarket: "excellent" },
  Canada:      { workRights: 3,   avgSalaryUSD: 55000,  jobMarket: "very_good" },
  UK:          { workRights: 2,   avgSalaryUSD: 45000,  jobMarket: "good"      },
  Australia:   { workRights: 2,   avgSalaryUSD: 60000,  jobMarket: "good"      },
  Germany:     { workRights: 1.5, avgSalaryUSD: 50000,  jobMarket: "good"      },
  Singapore:   { workRights: 1,   avgSalaryUSD: 55000,  jobMarket: "good"      },
  Ireland:     { workRights: 2,   avgSalaryUSD: 48000,  jobMarket: "moderate"  },
  Netherlands: { workRights: 1,   avgSalaryUSD: 48000,  jobMarket: "moderate"  },
  France:      { workRights: 1,   avgSalaryUSD: 42000,  jobMarket: "moderate"  },
  Sweden:      { workRights: 1,   avgSalaryUSD: 45000,  jobMarket: "moderate"  },
  "New Zealand":{ workRights: 3,  avgSalaryUSD: 50000,  jobMarket: "good"      },
  Japan:       { workRights: 1,   avgSalaryUSD: 38000,  jobMarket: "moderate"  },
  UAE:         { workRights: 0,   avgSalaryUSD: 55000,  jobMarket: "moderate"  },
};

const JOB_MARKET_MULTIPLIER = {
  excellent: 1.0,
  very_good: 0.9,
  good:      0.8,
  moderate:  0.65,
};

// ── Sub-score calculators (each returns 0–100) ────────────────────────────────

/**
 * Academics score: GPA (0–10 scale) + degree level
 */
function scoreAcademics(profile) {
  const gpa = profile.academics?.gpa ?? 0;
  const degree = profile.academics?.undergradDegree ?? "";

  // GPA: 0–10 scale → 0–70 points
  // 8.5+ = 70, 7.5–8.5 = 55, 6.5–7.5 = 40, 5.5–6.5 = 25, <5.5 = 10
  let gpaScore = 10;
  if (gpa >= 8.5)      gpaScore = 70;
  else if (gpa >= 7.5) gpaScore = 55;
  else if (gpa >= 6.5) gpaScore = 40;
  else if (gpa >= 5.5) gpaScore = 25;

  // Degree bonus: 0–30 points
  const degreeScore = degree ? 30 : 0;

  return Math.min(Math.round(gpaScore + degreeScore), 100);
}

/**
 * Test scores: GRE (260–340) + IELTS/TOEFL bonus
 */
function scoreTestScores(profile) {
  const gre = profile.academics?.greScore ?? 0;
  const ielts = profile.academics?.ieltsScore ?? 0;
  const toefl = profile.academics?.toeflScore ?? 0;

  // GRE: 260–340 → 0–80 points
  let greScore = 0;
  if (gre >= 330)      greScore = 80;
  else if (gre >= 320) greScore = 65;
  else if (gre >= 310) greScore = 50;
  else if (gre >= 300) greScore = 35;
  else if (gre >= 290) greScore = 20;
  else if (gre > 0)    greScore = 10;

  // English test bonus: 0–20 points
  let englishBonus = 0;
  if (ielts >= 7.5 || toefl >= 105)      englishBonus = 20;
  else if (ielts >= 7.0 || toefl >= 100) englishBonus = 15;
  else if (ielts >= 6.5 || toefl >= 90)  englishBonus = 10;
  else if (ielts > 0 || toefl > 0)       englishBonus = 5;

  return Math.min(Math.round(greScore + englishBonus), 100);
}

/**
 * Experience: work experience years
 */
function scoreExperience(profile) {
  const years = profile.academics?.workExperience ?? 0;

  // 0 = 20 (fresh grad is fine), 1 = 40, 2 = 55, 3 = 70, 4 = 80, 5+ = 100
  if (years >= 5)      return 100;
  if (years >= 4)      return 80;
  if (years >= 3)      return 70;
  if (years >= 2)      return 55;
  if (years >= 1)      return 40;
  return 20;
}

/**
 * Financial readiness: budget vs typical cost, family income, collateral
 */
function scoreFinancialReadiness(profile) {
  const budget = profile.finances?.educationBudget ?? 0;       // USD thousands
  const familyIncome = profile.finances?.familyIncome ?? 0;    // INR lakhs
  const hasCollateral = profile.finances?.hasCollateral ?? false;

  // Budget adequacy: $50k+ = 40pts, $30–50k = 30, $20–30k = 20, <$20k = 10
  let budgetScore = 10;
  if (budget >= 50)      budgetScore = 40;
  else if (budget >= 30) budgetScore = 30;
  else if (budget >= 20) budgetScore = 20;

  // Family income: ₹10L+ = 30pts, ₹5–10L = 20, ₹2–5L = 10, <₹2L = 5
  let incomeScore = 5;
  if (familyIncome >= 10)     incomeScore = 30;
  else if (familyIncome >= 5) incomeScore = 20;
  else if (familyIncome >= 2) incomeScore = 10;

  // Collateral bonus: 30pts
  const collateralScore = hasCollateral ? 30 : 0;

  return Math.min(Math.round(budgetScore + incomeScore + collateralScore), 100);
}

/**
 * Profile completeness: how many key fields are filled
 */
function scoreProfileCompleteness(profile) {
  const checks = [
    profile.academics?.gpa,
    profile.academics?.greScore,
    profile.academics?.undergradDegree,
    profile.preferences?.targetField,
    profile.preferences?.preferredCountries?.length > 0,
    profile.preferences?.studyTimeline,
    profile.finances?.educationBudget,
    profile.finances?.familyIncome,
    profile.goals?.careerGoal,
    profile.goals?.biggestConcerns?.length > 0,
  ];

  const filled = checks.filter(Boolean).length;
  return Math.round((filled / checks.length) * 100);
}

/**
 * Weighted overall Application Strength Score (0–100)
 */
function computeApplicationScore(profile) {
  const sub = {
    academics:    scoreAcademics(profile),
    testScores:   scoreTestScores(profile),
    experience:   scoreExperience(profile),
    financial:    scoreFinancialReadiness(profile),
    completeness: scoreProfileCompleteness(profile),
  };

  // Weights: academics 25%, tests 25%, experience 15%, financial 20%, completeness 15%
  const overall = Math.round(
    sub.academics    * 0.25 +
    sub.testScores   * 0.25 +
    sub.experience   * 0.15 +
    sub.financial    * 0.20 +
    sub.completeness * 0.15
  );

  const tier =
    overall >= 80 ? "Strong"   :
    overall >= 60 ? "Good"     :
    overall >= 40 ? "Average"  :
                    "Needs Work";

  return { overall, sub, tier };
}

// ── Loan Risk Engine ──────────────────────────────────────────────────────────

/**
 * Compute loan repayment risk score and flag.
 *
 * @param {object} params
 * @param {number} params.loanAmountUSD       - Total loan in USD
 * @param {number} params.familyIncomeINR     - Annual family income in INR lakhs
 * @param {boolean} params.hasCollateral
 * @param {string[]} params.targetCountries   - e.g. ["USA", "Canada"]
 * @param {string} params.targetField         - e.g. "Computer Science"
 * @param {number} params.gpa
 * @param {number} params.greScore
 * @returns {object} risk assessment
 */
function computeLoanRisk(params) {
  const {
    loanAmountUSD = 0,
    familyIncomeINR = 0,
    hasCollateral = false,
    targetCountries = [],
    targetField = "",
    gpa = 0,
    greScore = 0,
  } = params;

  // Pick best country for salary estimate
  const bestCountry = targetCountries.find((c) => COUNTRY_DATA[c]) || "USA";
  const countryInfo = COUNTRY_DATA[bestCountry] || COUNTRY_DATA["USA"];

  // Field salary multiplier (tech/finance pays more)
  const fieldMultiplier = getFieldSalaryMultiplier(targetField);

  // Estimated first-year salary
  const estimatedSalaryUSD = Math.round(
    countryInfo.avgSalaryUSD *
    fieldMultiplier *
    JOB_MARKET_MULTIPLIER[countryInfo.jobMarket]
  );

  // Loan-to-salary ratio (key metric)
  const loanToSalaryRatio = estimatedSalaryUSD > 0
    ? Math.round((loanAmountUSD / estimatedSalaryUSD) * 10) / 10
    : 99;

  // Monthly EMI estimate (10% p.a., 10-year tenure, INR)
  const loanINR = loanAmountUSD * 83; // approx USD→INR
  const monthlyRate = 0.10 / 12;
  const months = 120;
  const emi = loanINR > 0
    ? Math.round(loanINR * monthlyRate * Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1))
    : 0;

  // Monthly salary in INR
  const monthlySalaryINR = Math.round((estimatedSalaryUSD * 83) / 12);

  // EMI-to-income ratio
  const emiToIncomeRatio = monthlySalaryINR > 0
    ? Math.round((emi / monthlySalaryINR) * 100)
    : 100;

  // Family income safety net (INR lakhs/year → monthly INR)
  const familyMonthlyINR = Math.round((familyIncomeINR * 100000) / 12);

  // Risk score (0 = safe, 100 = very risky)
  let riskScore = 0;

  // Loan-to-salary ratio: safe < 2x, warning 2–3x, danger > 3x
  if (loanToSalaryRatio > 4)      riskScore += 40;
  else if (loanToSalaryRatio > 3) riskScore += 25;
  else if (loanToSalaryRatio > 2) riskScore += 15;

  // EMI burden: safe < 20%, warning 20–35%, danger > 35%
  if (emiToIncomeRatio > 40)      riskScore += 25;
  else if (emiToIncomeRatio > 30) riskScore += 15;
  else if (emiToIncomeRatio > 20) riskScore += 8;

  // Family income safety net
  if (familyIncomeINR < 3)        riskScore += 20;
  else if (familyIncomeINR < 6)   riskScore += 10;

  // Collateral reduces risk
  if (hasCollateral)              riskScore -= 15;

  // Strong academic profile reduces risk (better job prospects)
  if (gpa >= 8 && greScore >= 320) riskScore -= 10;
  else if (gpa >= 7 && greScore >= 310) riskScore -= 5;

  // Post-study work rights
  if (countryInfo.workRights >= 3) riskScore -= 10;
  else if (countryInfo.workRights < 1) riskScore += 10;

  riskScore = Math.max(0, Math.min(100, riskScore));

  const riskLevel =
    riskScore >= 60 ? "High"     :
    riskScore >= 35 ? "Moderate" :
                      "Low";

  const safeThreshold = 2.0;
  const isAboveThreshold = loanToSalaryRatio > safeThreshold;

  // Generate specific warning messages
  const warnings = [];
  if (loanToSalaryRatio > safeThreshold) {
    warnings.push(
      `Your loan-to-first-year-salary ratio is ${loanToSalaryRatio}x. The safe threshold is ${safeThreshold}x.`
    );
  }
  if (emiToIncomeRatio > 30) {
    warnings.push(
      `Your estimated EMI (₹${emi.toLocaleString()}/mo) is ${emiToIncomeRatio}% of your expected monthly salary. Lenders prefer below 30%.`
    );
  }
  if (familyIncomeINR < 3 && !hasCollateral) {
    warnings.push(
      "Low family income with no collateral significantly reduces approval chances for large loans."
    );
  }

  return {
    riskScore,
    riskLevel,
    loanToSalaryRatio,
    safeThreshold,
    isAboveThreshold,
    estimatedSalaryUSD,
    estimatedMonthlyEMI: emi,
    emiToIncomeRatio,
    bestCountry,
    postStudyWorkYears: countryInfo.workRights,
    warnings,
  };
}

function getFieldSalaryMultiplier(field = "") {
  const f = field.toLowerCase();
  if (f.includes("computer") || f.includes("software") || f.includes("data") || f.includes("ai") || f.includes("cloud") || f.includes("cyber"))
    return 1.15;
  if (f.includes("finance") || f.includes("mba") || f.includes("business") || f.includes("analytics"))
    return 1.05;
  if (f.includes("engineer"))
    return 1.0;
  if (f.includes("medicine") || f.includes("health") || f.includes("pharma"))
    return 0.9;
  if (f.includes("law"))
    return 0.85;
  if (f.includes("design") || f.includes("media") || f.includes("art"))
    return 0.75;
  return 0.9;
}

module.exports = { computeApplicationScore, computeLoanRisk };

const express = require("express");
const router = express.Router();
const { cerebrasService } = require("../services");
const { saveAssessment } = require("../db/assessmentRepository");
const { addPoints, addBadge } = require("../db/userRepository");

/**
 * POST /api/test-prep/questions
 * Generate adaptive practice questions for a given test and section.
 */
router.post("/questions", async (req, res) => {
  const { test, section, difficulty, currentScore, targetScore, count = 5 } = req.body;

  if (!test || !section) {
    return res.status(400).json({ success: false, error: "test and section are required" });
  }

  const systemPrompt = `You are an expert test preparation coach for GRE, GMAT, IELTS, and TOEFL exams.
You create high-quality, realistic practice questions that match the actual exam format.`;

  const userPrompt = `Generate ${count} adaptive practice questions for an Indian student.

Test: ${test}
Section: ${section}
Difficulty: ${difficulty || "Medium"}
Current Score: ${currentScore || "Not provided"}
Target Score: ${targetScore || "Not provided"}

Return a JSON object with exactly this structure:
{
  "questions": [
    {
      "id": number,
      "type": string,
      "question": string,
      "options": [string] or null,
      "correctAnswer": string,
      "explanation": string,
      "difficulty": "Easy" | "Medium" | "Hard",
      "topic": string,
      "timeLimit": number
    }
  ],
  "sectionTips": [string],
  "adaptiveNote": string
}

For MCQ questions, options must be an array of 4 strings labeled A, B, C, D.
For fill-in-the-blank or essay questions, options is null.
timeLimit is in seconds per question.
adaptiveNote explains why these questions match the student's level.
Include 3 sectionTips specific to this test section.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 2048, temperature: 0.6 }
    );

    if (req.user?.id) {
      Promise.all([
        addPoints(req.user.id, 10),
        addBadge(req.user.id, "Test Taker"),
      ]).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("test-prep/questions error:", err.message);
    const userMessage = err.message.includes("timed out")
      ? "The AI took too long to respond. Please try again."
      : "Failed to generate questions. Please try again.";
    res.status(502).json({ success: false, error: userMessage });
  }
});

/**
 * POST /api/test-prep/study-plan
 * Generate a personalized study plan based on current and target scores.
 */
router.post("/study-plan", async (req, res) => {
  const { test, currentScore, targetScore, weeksAvailable, weakAreas, strongAreas } = req.body;

  if (!test || !currentScore || !targetScore) {
    return res.status(400).json({
      success: false,
      error: "test, currentScore, and targetScore are required",
    });
  }

  const systemPrompt = `You are a world-class test preparation strategist who has helped thousands of Indian students achieve their target scores for GRE, GMAT, IELTS, and TOEFL.`;

  const userPrompt = `Create a personalized study plan for an Indian student:

Test: ${test}
Current Score: ${currentScore}
Target Score: ${targetScore}
Weeks Available: ${weeksAvailable || 12}
Weak Areas: ${weakAreas?.join(", ") || "Not specified"}
Strong Areas: ${strongAreas?.join(", ") || "Not specified"}

Return a JSON object with exactly this structure:
{
  "overview": string,
  "scoreGap": number,
  "feasibility": "Highly Achievable" | "Achievable" | "Challenging" | "Very Challenging",
  "weeklyPlan": [
    {
      "week": number,
      "focus": string,
      "dailyHours": number,
      "tasks": [string],
      "milestone": string
    }
  ],
  "resourceRecommendations": [
    { "name": string, "type": string, "url": string, "free": boolean }
  ],
  "weakAreaStrategies": [
    { "area": string, "strategy": string, "estimatedWeeks": number }
  ],
  "mockTestSchedule": [
    { "week": number, "test": string, "purpose": string }
  ],
  "dailyRoutine": {
    "morning": string,
    "afternoon": string,
    "evening": string
  },
  "motivationalTip": string
}

weeklyPlan should cover all ${weeksAvailable || 12} weeks.
resourceRecommendations should include 4-6 real, well-known resources.
weakAreaStrategies should address each weak area with a concrete plan.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 2048, temperature: 0.5 }
    );

    if (req.user?.id) {
      const uid = req.user.id;
      Promise.all([
        saveAssessment(uid, "test-prep", req.body, data),
        addPoints(uid, 30),
        addBadge(uid, "Study Planner"),
      ]).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("test-prep/study-plan error:", err.message);
    const userMessage = err.message.includes("timed out")
      ? "The AI took too long to respond. Please try again."
      : "Failed to generate study plan. Please try again.";
    res.status(502).json({ success: false, error: userMessage });
  }
});

/**
 * POST /api/test-prep/explain
 * AI tutor explains a concept or a wrong answer.
 */
router.post("/explain", async (req, res) => {
  const { test, topic, question, userAnswer, correctAnswer } = req.body;

  if (!test || !topic) {
    return res.status(400).json({ success: false, error: "test and topic are required" });
  }

  const systemPrompt = `You are a patient, expert tutor for ${test} exam preparation. 
You explain concepts clearly with examples relevant to Indian students.`;

  const userPrompt = `Explain the following for a student preparing for ${test}:

Topic: ${topic}
${question ? `Question: ${question}` : ""}
${userAnswer ? `Student's Answer: ${userAnswer}` : ""}
${correctAnswer ? `Correct Answer: ${correctAnswer}` : ""}

Return a JSON object with exactly this structure:
{
  "conceptExplanation": string,
  "whyWrong": string or null,
  "keyRule": string,
  "examples": [
    { "example": string, "solution": string }
  ],
  "memoryTip": string,
  "relatedTopics": [string],
  "practiceHint": string
}

conceptExplanation should be 3-4 sentences, clear and simple.
whyWrong explains why the student's answer was incorrect (null if no userAnswer provided).
keyRule is a one-line rule to remember.
examples should have 2 worked examples.
memoryTip is a mnemonic or trick to remember the concept.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 1536, temperature: 0.5 }
    );

    if (req.user?.id) {
      addPoints(req.user.id, 5).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("test-prep/explain error:", err.message);
    res.status(502).json({ success: false, error: "Failed to get explanation. Please try again." });
  }
});

/**
 * POST /api/test-prep/analyze
 * Analyze quiz results and identify weak areas.
 */
router.post("/analyze", async (req, res) => {
  const { test, answers, totalQuestions } = req.body;

  if (!test || !answers) {
    return res.status(400).json({ success: false, error: "test and answers are required" });
  }

  const systemPrompt = `You are a data-driven test prep analyst who identifies patterns in student performance.`;

  const correct = answers.filter((a) => a.isCorrect).length;
  const accuracy = Math.round((correct / (answers.length || 1)) * 100);

  const userPrompt = `Analyze this student's ${test} practice session:

Total Questions: ${totalQuestions || answers.length}
Correct: ${correct}
Accuracy: ${accuracy}%
Question breakdown:
${answers.map((a) => `- Topic: ${a.topic}, Difficulty: ${a.difficulty}, Correct: ${a.isCorrect}`).join("\n")}

Return a JSON object with exactly this structure:
{
  "overallScore": number,
  "accuracy": number,
  "performanceLevel": "Excellent" | "Good" | "Average" | "Needs Improvement",
  "weakAreas": [
    { "topic": string, "accuracy": number, "priority": "High" | "Medium" | "Low" }
  ],
  "strongAreas": [string],
  "timeManagement": string,
  "nextSteps": [string],
  "estimatedScore": string,
  "improvementPotential": string
}

weakAreas should list topics where accuracy < 70%.
nextSteps should have 3-4 specific, actionable recommendations.
estimatedScore should be a realistic score range based on performance.`;

  try {
    const data = await cerebrasService.chatJSON(
      [{ role: "user", content: userPrompt }],
      systemPrompt,
      { maxTokens: 1024, temperature: 0.4 }
    );

    if (req.user?.id) {
      addPoints(req.user.id, 15).catch(() => {});
    }

    res.json({ success: true, data });
  } catch (err) {
    console.error("test-prep/analyze error:", err.message);
    res.status(502).json({ success: false, error: "Failed to analyze results. Please try again." });
  }
});

module.exports = router;

const express = require("express");
const router = express.Router();
const { cerebrasService } = require("../services");
const { saveChatMessage } = require("../db/chatRepository");
const { addPoints, addBadge } = require("../db/userRepository");

/**
 * POST /api/mentor/chat
 * Streams a mentor response via SSE for real-time chat UI.
 * Saves the user message + completed assistant response to MongoDB.
 */
router.post("/chat", async (req, res) => {
  const { messages, studentProfile = {} } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({
      success: false,
      error: "messages array is required",
    });
  }

  // Build a rich system prompt from the student's profile
  const name = studentProfile.name || "student";
  const profileLines = [];

  if (studentProfile.targetField)
    profileLines.push(`- Target field: ${studentProfile.targetField}`);
  if (studentProfile.greScore)
    profileLines.push(`- GRE score: ${studentProfile.greScore}`);
  if (studentProfile.gpa)
    profileLines.push(`- GPA/CGPA: ${studentProfile.gpa}`);
  if (studentProfile.preferredCountries?.length)
    profileLines.push(`- Preferred countries: ${studentProfile.preferredCountries.join(", ")}`);
  if (studentProfile.studyTimeline)
    profileLines.push(`- Study timeline: ${studentProfile.studyTimeline}`);
  if (studentProfile.educationBudget)
    profileLines.push(`- Education budget: $${studentProfile.educationBudget}k USD`);
  if (studentProfile.careerGoal)
    profileLines.push(`- Career goal: ${studentProfile.careerGoal}`);

  const profileContext = profileLines.length
    ? `\n\nStudent profile:\n${profileLines.join("\n")}`
    : "";

  const systemPrompt = `You are Arya, a warm and knowledgeable AI mentor for Indian students planning higher education abroad. You have deep expertise in GRE/GMAT prep, SOP writing, visa processes (F-1, UK Student, Canada Study Permit), scholarships, and education loans. Address the student by name (${name}). Be concise (max 3 paragraphs), encouraging, and give actionable advice with Indian context and examples. Never make up specific admission statistics — say "typically" or "generally" when uncertain.${profileContext}`;

  // Identify the last user message for saving
  const lastUserMsg = [...messages].reverse().find((m) => m.role === "user");
  const userId = req.user?.id;

  // Generate a stable session ID for this user (one session per user for now)
  const sessionId = userId ? `session_${userId}` : `anon_${Date.now()}`;

  // Save user message to MongoDB (fire-and-forget)
  if (userId && lastUserMsg) {
    saveChatMessage(userId, "user", lastUserMsg.content, sessionId).catch(() => {});
  }

  try {
    // We need to capture the full assistant response to save it
    // Use a custom streaming approach that intercepts the content
    let assistantContent = "";

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const axios = require("axios");
    const payload = {
      model: "llama3.1-8b",
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: 1024,
      temperature: 0.7,
      stream: true,
    };

    const apiKey = process.env.CEREBRAS_API_KEY;
    const baseURL = process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1";

    const response = await axios.post(
      `${baseURL}/chat/completions`,
      payload,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        responseType: "stream",
        timeout: 120000,
      }
    );

    response.data.on("data", (chunk) => {
      const lines = chunk
        .toString("utf8")
        .split("\n")
        .filter((line) => line.trim() !== "");

      for (const line of lines) {
        if (!line.startsWith("data: ")) continue;
        const jsonStr = line.slice(6).trim();
        if (jsonStr === "[DONE]") {
          res.write("data: [DONE]\n\n");
          return;
        }
        try {
          const parsed = JSON.parse(jsonStr);
          const delta = parsed.choices?.[0]?.delta?.content;
          if (delta) {
            assistantContent += delta;
            res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
          }
        } catch (_) {}
      }
    });

    response.data.on("end", () => {
      res.write("data: [DONE]\n\n");
      res.end();

      // Save completed assistant response + award points (fire-and-forget)
      if (userId && assistantContent) {
        Promise.all([
          saveChatMessage(userId, "assistant", assistantContent, sessionId),
          addPoints(userId, 5),
          addBadge(userId, "First Chat"),
        ]).catch(() => {});
      }
    });

    response.data.on("error", (err) => {
      console.error("Cerebras stream error:", err.message);
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    });

    res.on("close", () => {
      response.data.destroy();
    });
  } catch (err) {
    console.error("mentor chat error:", err.message);
    if (!res.headersSent) {
      res.status(502).json({ success: false, error: err.message });
    } else {
      res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
      res.end();
    }
  }
});

module.exports = router;

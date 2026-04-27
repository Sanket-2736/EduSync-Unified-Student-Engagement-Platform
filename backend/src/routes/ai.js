const express = require("express");
const router = express.Router();
const { cerebrasService } = require("../services");

/**
 * POST /api/ai/chat
 * Body: { messages: Array<{ role, content }>, systemPrompt?: string }
 */
router.post("/chat", async (req, res) => {
  const { messages, systemPrompt = "You are a helpful study assistant for Indian students planning higher education." } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const reply = await cerebrasService.chat(messages, systemPrompt);
    res.json({ reply });
  } catch (err) {
    console.error("AI chat error:", err.message);
    res.status(502).json({ error: err.message });
  }
});

/**
 * POST /api/ai/chat/json
 * Body: { messages: Array<{ role, content }>, systemPrompt?: string }
 * Returns structured JSON from the model.
 */
router.post("/chat/json", async (req, res) => {
  const { messages, systemPrompt = "You are a helpful study assistant." } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    const data = await cerebrasService.chatJSON(messages, systemPrompt);
    res.json(data);
  } catch (err) {
    console.error("AI chatJSON error:", err.message);
    res.status(502).json({ error: err.message });
  }
});

/**
 * POST /api/ai/chat/stream
 * Body: { messages: Array<{ role, content }>, systemPrompt?: string }
 * Streams SSE tokens back to the client.
 */
router.post("/chat/stream", async (req, res) => {
  const { messages, systemPrompt = "You are a helpful study assistant." } = req.body;

  if (!messages || !Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages array is required" });
  }

  try {
    await cerebrasService.streamChat(messages, systemPrompt, res);
  } catch (err) {
    console.error("AI stream error:", err.message);
    // Headers may already be sent if streaming started
    if (!res.headersSent) {
      res.status(502).json({ error: err.message });
    }
  }
});

module.exports = router;

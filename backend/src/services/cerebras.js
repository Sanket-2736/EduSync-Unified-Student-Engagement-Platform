const axios = require("axios");

class CerebrasService {
  constructor() {
    this.apiKey = process.env.CEREBRAS_API_KEY;
    this.baseURL = process.env.CEREBRAS_BASE_URL || "https://api.cerebras.ai/v1";
    this.defaultModel = "llama3.1-8b";

    if (!this.apiKey) {
      console.warn("Warning: CEREBRAS_API_KEY is not set in environment variables.");
    }
  }

  /**
   * Send a chat completion request to Cerebras.
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   * @param {{ maxTokens?: number, temperature?: number, model?: string }} options
   * @returns {Promise<string>}
   */
  async chat(messages, systemPrompt, options = {}) {
    if (!this.apiKey) {
      throw new Error("Cerebras API key is not configured. Set CEREBRAS_API_KEY in your .env file.");
    }

    const payload = {
      model: options.model || this.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
            "Content-Type": "application/json",
          },
          timeout: 60000,
        }
      );

      const content = response.data?.choices?.[0]?.message?.content;
      if (content === undefined || content === null) {
        throw new Error("Cerebras returned an empty response.");
      }

      return content;
    } catch (err) {
      if (err.response) {
        // HTTP error from Cerebras
        const status = err.response.status;
        const detail = err.response.data?.error?.message || err.response.statusText;
        throw new Error(`Cerebras API error (${status}): ${detail}`);
      }
      if (err.code === "ECONNABORTED") {
        throw new Error("Cerebras API request timed out. Please try again.");
      }
      // Re-throw errors we already formatted, or unknown errors
      throw err;
    }
  }

  /**
   * Like chat(), but instructs the model to return valid JSON and parses it.
   * Retries once with a simplified prompt if the first attempt fails to parse.
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   * @param {{ maxTokens?: number, temperature?: number, model?: string }} options
   * @returns {Promise<object>}
   */
  async chatJSON(messages, systemPrompt, options = {}) {
    const jsonSystemPrompt =
      systemPrompt +
      "\nRespond ONLY with valid JSON. No markdown fences, no explanation, no text before or after the JSON object.";

    const attemptParse = async (attempt) => {
      const raw = await this.chat(messages, jsonSystemPrompt, {
        ...options,
        // Lower temperature on retry for more deterministic output
        temperature: attempt === 0 ? (options.temperature ?? 0.7) : 0.3,
      });

      // Strip markdown code fences if model wraps JSON in ```json ... ```
      const stripped = raw
        .replace(/^```(?:json)?\s*/i, "")
        .replace(/\s*```\s*$/, "")
        .trim();

      // First attempt: direct parse
      try {
        return JSON.parse(stripped);
      } catch (_) {
        // Second attempt: extract first JSON object/array from the string
        const jsonMatch = stripped.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
        if (jsonMatch) {
          try {
            return JSON.parse(jsonMatch[0]);
          } catch (_inner) {
            throw new Error(
              `Could not parse JSON from response. Raw: ${raw.slice(0, 200)}`
            );
          }
        }
        throw new Error(
          `No JSON found in response. Raw: ${raw.slice(0, 200)}`
        );
      }
    };

    // Try twice before giving up
    try {
      return await attemptParse(0);
    } catch (firstErr) {
      console.warn("chatJSON first attempt failed, retrying:", firstErr.message);
      try {
        return await attemptParse(1);
      } catch (secondErr) {
        throw new Error(`Cerebras JSON parse failed after 2 attempts: ${secondErr.message}`);
      }
    }
  }

  /**
   * Stream a chat completion via Server-Sent Events to an Express response.
   * @param {Array<{role: string, content: string}>} messages
   * @param {string} systemPrompt
   * @param {import("express").Response} res  Express response object
   * @param {{ maxTokens?: number, temperature?: number, model?: string }} options
   */
  async streamChat(messages, systemPrompt, res, options = {}) {
    if (!this.apiKey) {
      throw new Error("Cerebras API key is not configured. Set CEREBRAS_API_KEY in your .env file.");
    }

    // Set SSE headers before streaming begins
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    const payload = {
      model: options.model || this.defaultModel,
      messages: [
        { role: "system", content: systemPrompt },
        ...messages,
      ],
      max_tokens: options.maxTokens || 1024,
      temperature: options.temperature ?? 0.7,
      stream: true,
    };

    try {
      const response = await axios.post(
        `${this.baseURL}/chat/completions`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.apiKey}`,
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
          // Forward raw SSE lines as-is (they already start with "data: ")
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6).trim();

            // Stream is done
            if (jsonStr === "[DONE]") {
              res.write("data: [DONE]\n\n");
              return;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const delta = parsed.choices?.[0]?.delta?.content;
              if (delta) {
                res.write(`data: ${JSON.stringify({ content: delta })}\n\n`);
              }
            } catch (_) {
              // Malformed chunk — skip silently
            }
          }
        }
      });

      response.data.on("end", () => {
        res.write("data: [DONE]\n\n");
        res.end();
      });

      response.data.on("error", (err) => {
        console.error("Cerebras stream error:", err.message);
        res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
        res.end();
      });

      // Clean up if the client disconnects early
      res.on("close", () => {
        response.data.destroy();
      });
    } catch (err) {
      const message =
        err.response?.data?.error?.message ||
        err.message ||
        "Unknown streaming error";
      res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
      res.end();
    }
  }
}

module.exports = CerebrasService;

"use client";

import { useState, useCallback, useRef } from "react";
import {
  saveChatHistory,
  getChatHistory as getStoredHistory,
  clearChatHistory,
  type StoredChatMessage,
} from "@/lib/storage";
import { getToken } from "@/lib/storage";

export type ChatMessage = StoredChatMessage;

// Shown only while the personalised greeting is being generated
const LOADING_PLACEHOLDER: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content: "",
  timestamp: Date.now(),
};

// Fallback if profile is empty / API fails
const GENERIC_WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi! I'm Arya, your AI study-abroad mentor. I can help you with university selection, SOP writing, visa guidance, and education loans. What's on your mind today?",
  timestamp: Date.now(),
};

export interface StudentProfile {
  name?: string;
  targetField?: string;
  greScore?: number;
  gpa?: number;
  preferredCountries?: string[];
  studyTimeline?: string;
  educationBudget?: number;
  careerGoal?: string;
  undergradDegree?: string;
  familyIncome?: number;
  hasCollateral?: boolean;
  biggestConcerns?: string[];
}

export function useChat(userId: string | null) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const greetingFiredRef = useRef(false);

  // ── Persist via storage lib ─────────────────────────────────────────────────
  const saveToStorage = useCallback(
    (msgs: ChatMessage[]) => {
      if (userId) saveChatHistory(userId, msgs);
    },
    [userId]
  );

  // ── Load from storage — returns true if history existed ────────────────────
  const loadFromStorage = useCallback((uid: string) => {
    const parsed = getStoredHistory(uid);
    if (parsed.length > 0) {
      setMessages(parsed);
      greetingFiredRef.current = true; // history exists, no greeting needed
      return true;
    }
    return false;
  }, []);

  // ── Clear history ───────────────────────────────────────────────────────────
  const clearHistory = useCallback(() => {
    setMessages([]);
    greetingFiredRef.current = false;
    if (userId) clearChatHistory(userId);
  }, [userId]);

  // ── Core streaming fetch ────────────────────────────────────────────────────
  const streamFromAPI = useCallback(
    async (
      apiMessages: { role: string; content: string }[],
      studentProfile: object,
      onChunk: (delta: string) => void
    ): Promise<string> => {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const token = getToken();

      const response = await fetch(`${apiUrl}/api/mentor/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ messages: apiMessages, studentProfile }),
      });

      if (!response.ok || !response.body) {
        throw new Error(`API error: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.trim() !== "");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) throw new Error(parsed.error);
            if (parsed.content) {
              accumulated += parsed.content;
              onChunk(accumulated);
            }
          } catch {
            // skip malformed chunks
          }
        }
      }

      return accumulated;
    },
    []
  );

  // ── Generate personalised opening greeting ──────────────────────────────────
  const generateGreeting = useCallback(
    async (profile: StudentProfile) => {
      if (greetingFiredRef.current) return;
      greetingFiredRef.current = true;

      const greetingId = `welcome_${Date.now()}`;

      // Show placeholder immediately so the typing indicator appears
      setMessages([{ ...LOADING_PLACEHOLDER, id: greetingId }]);
      setIsLoading(true);

      // Build a prompt that forces Arya to reference the student's actual data
      const hasProfile = profile.targetField || profile.greScore || profile.preferredCountries?.length;

      const greetingPrompt = hasProfile
        ? `Generate a warm, personalised opening greeting for this student. Reference their specific details naturally — mention their name, field of study, target countries, and career goal. Make it feel like you already know them. Keep it to 2-3 sentences. Do NOT ask what they need help with — instead, offer one specific, proactive insight or tip based on their profile.`
        : `Generate a warm opening greeting. Introduce yourself as Arya, their AI study-abroad mentor. Keep it to 2 sentences and invite them to share their goals.`;

      try {
        let finalContent = "";
        await streamFromAPI(
          [{ role: "user", content: greetingPrompt }],
          profile,
          (accumulated) => {
            finalContent = accumulated;
            setMessages([{
              id: greetingId,
              role: "assistant",
              content: accumulated,
              timestamp: Date.now(),
            }]);
          }
        );

        // Persist the greeting
        const greetingMsg: ChatMessage = {
          id: greetingId,
          role: "assistant",
          content: finalContent || GENERIC_WELCOME.content,
          timestamp: Date.now(),
        };
        if (userId) saveChatHistory(userId, [greetingMsg]);
      } catch {
        setMessages([GENERIC_WELCOME]);
      } finally {
        setIsLoading(false);
      }
    },
    [userId, streamFromAPI]
  );

  // ── Send message with SSE streaming ────────────────────────────────────────
  const sendMessage = useCallback(
    async (content: string, studentProfile?: StudentProfile) => {
      if (!content.trim() || isLoading) return;

      const userMsg: ChatMessage = {
        id: `user_${Date.now()}`,
        role: "user",
        content: content.trim(),
        timestamp: Date.now(),
      };

      const assistantMsg: ChatMessage = {
        id: `assistant_${Date.now()}`,
        role: "assistant",
        content: "",
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      setIsLoading(true);

      try {
        const historyForApi = [...messages, userMsg]
          .filter((m) => m.role !== "assistant" || m.content.length > 0)
          .map(({ role, content }) => ({ role, content }));

        await streamFromAPI(
          historyForApi,
          studentProfile ?? {},
          (accumulated) => {
            setMessages((prev) => {
              const updated = [...prev];
              const lastIdx = updated.length - 1;
              if (updated[lastIdx]?.role === "assistant") {
                updated[lastIdx] = { ...updated[lastIdx], content: accumulated };
              }
              return updated;
            });
          }
        );

        // Persist completed exchange
        setMessages((prev) => {
          saveToStorage(prev);
          return prev;
        });
      } catch (err: unknown) {
        const errMsg =
          err instanceof Error
            ? err.message
            : "Sorry, I couldn't respond. Please try again.";
        setMessages((prev) => {
          const updated = [...prev];
          const lastIdx = updated.length - 1;
          if (updated[lastIdx]?.role === "assistant") {
            updated[lastIdx] = { ...updated[lastIdx], content: errMsg };
          }
          return updated;
        });
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, messages, streamFromAPI, saveToStorage]
  );

  return { messages, isLoading, sendMessage, clearHistory, loadFromStorage, generateGreeting };
}

"use client";

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  Suspense,
} from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Copy, ThumbsUp, ThumbsDown, Trash2, Check } from "lucide-react";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useChat, type StudentProfile } from "@/hooks/useChat";
import { useUserStore } from "@/store/userStore";

const DEFAULT_QUICK_PROMPTS = [
  "Help me write my SOP",
  "What GRE score do I need for MIT?",
  "Explain F-1 visa process",
  "How much loan can I get?",
  "Compare UK vs Canada for CS",
  "What scholarships are available?",
];

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-2 h-2 bg-purple-400 rounded-full"
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </div>
  );
}

// ── Lightweight markdown renderer ────────────────────────────────────────────
// Handles: **bold**, *italic*, `code`, # headers, - / * bullet lists,
// 1. numbered lists, blank-line paragraph breaks.
function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split("\n");
  const nodes: React.ReactNode[] = [];
  let i = 0;

  // Inline: **bold**, *italic*, `code`
  function parseInline(raw: string, key: string): React.ReactNode {
    const parts: React.ReactNode[] = [];
    // Combined regex: **bold**, *italic*, `code`
    const re = /(\*\*(.+?)\*\*|\*(.+?)\*|`(.+?)`)/g;
    let last = 0;
    let m: RegExpExecArray | null;
    let idx = 0;
    while ((m = re.exec(raw)) !== null) {
      if (m.index > last) parts.push(raw.slice(last, m.index));
      if (m[2] !== undefined)      parts.push(<strong key={`${key}-b${idx}`}>{m[2]}</strong>);
      else if (m[3] !== undefined) parts.push(<em key={`${key}-i${idx}`}>{m[3]}</em>);
      else if (m[4] !== undefined) parts.push(<code key={`${key}-c${idx}`} className="px-1 py-0.5 bg-gray-100 text-purple-700 rounded text-xs font-mono">{m[4]}</code>);
      last = m.index + m[0].length;
      idx++;
    }
    if (last < raw.length) parts.push(raw.slice(last));
    return parts.length === 1 ? parts[0] : <>{parts}</>;
  }

  while (i < lines.length) {
    const line = lines[i];

    // Blank line → paragraph break (skip)
    if (line.trim() === "") { i++; continue; }

    // Heading: # ## ###
    const headingMatch = line.match(/^(#{1,3})\s+(.+)/);
    if (headingMatch) {
      const level = headingMatch[1].length;
      const cls = level === 1
        ? "text-base font-bold text-gray-900 mt-3 mb-1"
        : level === 2
        ? "text-sm font-bold text-gray-900 mt-2 mb-0.5"
        : "text-sm font-semibold text-gray-800 mt-1";
      nodes.push(<p key={i} className={cls}>{parseInline(headingMatch[2], `h${i}`)}</p>);
      i++; continue;
    }

    // Bullet list: lines starting with - or *
    if (/^[\-\*]\s/.test(line)) {
      const items: React.ReactNode[] = [];
      while (i < lines.length && /^[\-\*]\s/.test(lines[i])) {
        items.push(
          <li key={i} className="flex gap-2">
            <span className="text-purple-500 mt-0.5 flex-shrink-0">•</span>
            <span>{parseInline(lines[i].replace(/^[\-\*]\s/, ""), `li${i}`)}</span>
          </li>
        );
        i++;
      }
      nodes.push(<ul key={`ul${i}`} className="space-y-1 my-1">{items}</ul>);
      continue;
    }

    // Numbered list: lines starting with 1. 2. etc.
    if (/^\d+\.\s/.test(line)) {
      const items: React.ReactNode[] = [];
      let num = 1;
      while (i < lines.length && /^\d+\.\s/.test(lines[i])) {
        items.push(
          <li key={i} className="flex gap-2">
            <span className="text-purple-500 font-semibold flex-shrink-0 min-w-[1.2rem]">{num}.</span>
            <span>{parseInline(lines[i].replace(/^\d+\.\s/, ""), `ol${i}`)}</span>
          </li>
        );
        i++; num++;
      }
      nodes.push(<ol key={`ol${i}`} className="space-y-1 my-1">{items}</ol>);
      continue;
    }

    // Regular paragraph line
    nodes.push(
      <p key={i} className="leading-relaxed">
        {parseInline(line, `p${i}`)}
      </p>
    );
    i++;
  }

  return <div className="space-y-1">{nodes}</div>;
}

function MessageBubble({
  message,
}: {
  message: { id: string; role: string; content: string; timestamp: number };
}) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    toast.success("Copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}
    >
      {/* Avatar */}
      {!isUser && (
        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0 mt-1">
          A
        </div>
      )}

      <div className={`max-w-[75%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1`}>
        {/* Bubble */}
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "bg-purple-600 text-white rounded-tr-sm whitespace-pre-wrap"
              : "bg-white border border-gray-100 shadow-sm text-gray-800 rounded-tl-sm"
          }`}
        >
          {message.content
            ? isUser
              ? message.content
              : renderMarkdown(message.content)
            : <span className="opacity-50 italic">Thinking…</span>
          }
        </div>

        {/* Actions (Arya messages only) */}
        {!isUser && message.content && (
          <div className="flex items-center gap-1 px-1">
            <button
              onClick={handleCopy}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
              title="Copy"
            >
              {copied ? (
                <Check className="w-3.5 h-3.5 text-green-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
            <button
              onClick={() => toast.success("Thanks for the feedback!")}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-green-600 transition-colors"
              title="Helpful"
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => toast("We'll improve this response.", { icon: "📝" })}
              className="p-1 rounded hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors"
              title="Not helpful"
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs text-gray-400 ml-1">
              {new Date(message.timestamp).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function ChatPageInner() {
  const searchParams = useSearchParams();
  const { user, userId } = useUserStore();
  const [input, setInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const { messages, isLoading, sendMessage, clearHistory, loadFromStorage, generateGreeting } =
    useChat(userId);

  // Build full profile object from nested store data
  const profile: StudentProfile | null = user ? {
    name: user.name,
    targetField: (user.profile as any)?.preferences?.targetField,
    greScore: (user.profile as any)?.academics?.greScore,
    gpa: (user.profile as any)?.academics?.gpa,
    undergradDegree: (user.profile as any)?.academics?.undergradDegree,
    preferredCountries: (user.profile as any)?.preferences?.preferredCountries,
    studyTimeline: (user.profile as any)?.preferences?.studyTimeline,
    careerGoal: (user.profile as any)?.goals?.careerGoal,
    biggestConcerns: (user.profile as any)?.goals?.biggestConcerns,
    educationBudget: (user.profile as any)?.finances?.educationBudget,
    familyIncome: (user.profile as any)?.finances?.familyIncome,
    hasCollateral: (user.profile as any)?.finances?.hasCollateral,
  } : null;

  const hasProfile = !!(profile?.targetField || profile?.greScore || profile?.preferredCountries?.length);

  // Build profile-aware quick prompts
  const quickPrompts = hasProfile ? [
    profile?.targetField
      ? `What universities are best for ${profile.targetField}?`
      : "What universities are best for my field?",
    profile?.preferredCountries?.length
      ? `Compare ${profile.preferredCountries.slice(0, 2).join(" vs ")} for my profile`
      : "Compare UK vs Canada for CS",
    "Help me write my SOP",
    profile?.greScore
      ? `Is my GRE score of ${profile.greScore} competitive?`
      : "What GRE score do I need?",
    profile?.careerGoal
      ? `How do I achieve: ${profile.careerGoal.slice(0, 40)}…`
      : "What career paths suit my profile?",
    "What scholarships am I eligible for?",
  ] : DEFAULT_QUICK_PROMPTS;

  // On mount: load history or generate personalised greeting
  useEffect(() => {
    if (!userId) return;
    const hadHistory = loadFromStorage(userId);
    if (!hadHistory && profile) {
      generateGreeting(profile);
    }

    const prefill = searchParams.get("message");
    if (prefill) setInput(decodeURIComponent(prefill));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`;
    }
  };

  const handleSend = useCallback(async () => {
    if (!input.trim() || isLoading) return;
    const msg = input.trim();
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    await sendMessage(msg, profile ?? undefined);
  }, [input, isLoading, sendMessage, profile]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickPrompt = (prompt: string) => {
    setInput(prompt);
    textareaRef.current?.focus();
  };

  return (
    <div className="flex h-[calc(100vh-64px)] overflow-hidden">
      {/* ── Sidebar ─────────────────────────────────────────────────────────── */}
      <aside className="hidden md:flex flex-col w-72 border-r border-gray-200 bg-white p-4 gap-4 overflow-y-auto">
        {/* Arya branding */}
        <div className="flex items-center gap-3 pb-4 border-b border-gray-100">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white font-bold text-xl">
            A
          </div>
          <div>
            <h2 className="font-bold text-gray-900">Arya</h2>
            <p className="text-xs text-gray-500">AI Study Mentor</p>
          </div>
        </div>

        {/* "Arya knows you" indicator */}
        {hasProfile && (
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <div className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0" />
            <p className="text-xs text-green-700 font-medium">
              Arya knows your profile
            </p>
          </div>
        )}

        {/* Quick prompts */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
            {hasProfile ? "Suggested for You" : "Quick Start"}
          </p>
          <div className="flex flex-col gap-2">
            {quickPrompts.map((prompt) => (
              <button
                key={prompt}
                onClick={() => handleQuickPrompt(prompt)}
                className="text-left text-sm px-3 py-2 rounded-lg bg-gray-50 hover:bg-purple-50 hover:text-purple-700 text-gray-700 transition-colors"
              >
                {prompt}
              </button>
            ))}
          </div>
        </div>

        {/* Profile summary */}
        {profile && hasProfile && (
          <div className="mt-auto">
            <Card padding="sm" className="bg-purple-50 border-purple-100">
              <p className="text-xs font-semibold text-purple-700 mb-2">
                Arya knows about you
              </p>
              <div className="space-y-1 text-xs text-gray-600">
                {profile.name && <p>👤 {profile.name}</p>}
                {profile.targetField && <p>🎯 {profile.targetField}</p>}
                {profile.greScore && <p>📝 GRE: {profile.greScore}</p>}
                {profile.gpa && <p>📊 GPA: {profile.gpa}</p>}
                {profile.preferredCountries && profile.preferredCountries.length > 0 && (
                  <p>🌍 {profile.preferredCountries.slice(0, 2).join(", ")}</p>
                )}
                {profile.studyTimeline && <p>📅 {profile.studyTimeline}</p>}
                {profile.educationBudget && <p>💰 Budget: ${profile.educationBudget}k</p>}
                {profile.careerGoal && (
                  <p className="line-clamp-2">🚀 {profile.careerGoal}</p>
                )}
              </div>
            </Card>
          </div>
        )}

        {/* Clear history */}
        <button
          onClick={() => {
            clearHistory();
            // Re-generate greeting after clearing
            if (profile) setTimeout(() => generateGreeting(profile), 100);
            toast.success("Chat history cleared");
          }}
          className="flex items-center gap-2 text-sm text-gray-500 hover:text-red-500 transition-colors mt-2"
        >
          <Trash2 className="w-4 h-4" />
          Clear history
        </button>
      </aside>

      {/* ── Main chat area ───────────────────────────────────────────────────── */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-gray-200 bg-white">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white font-bold">
            A
          </div>
          <div className="flex-1">
            <h1 className="font-bold text-gray-900">Chat with Arya</h1>
            <p className="text-xs text-gray-500">
              {isLoading ? (
                <span className="text-purple-600 animate-pulse">Typing…</span>
              ) : hasProfile ? (
                <span className="text-green-600">● Personalised for {profile?.name?.split(" ")[0]}</span>
              ) : (
                "Online · AI Study Mentor"
              )}
            </p>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 md:px-8 py-6 space-y-4 bg-gray-50">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isLoading && messages[messages.length - 1]?.content === "" && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                A
              </div>
              <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-tl-sm">
                <TypingIndicator />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input area */}
        <div className="border-t border-gray-200 bg-white px-4 md:px-8 py-4">
          {/* Mobile quick prompts */}
          <div className="md:hidden flex gap-2 overflow-x-auto pb-3 scrollbar-hide">
            {quickPrompts.slice(0, 3).map((p) => (
              <button
                key={p}
                onClick={() => handleQuickPrompt(p)}
                className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors"
              >
                {p}
              </button>
            ))}
          </div>

          <div className="flex items-end gap-3">
            <div className="flex-1 relative">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={
                  hasProfile
                    ? `Ask Arya about your ${profile?.targetField || "studies"} journey…`
                    : "Ask Arya anything about studying abroad…"
                }
                rows={1}
                maxLength={2000}
                className="w-full resize-none px-4 py-3 pr-16 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm leading-relaxed"
                style={{ maxHeight: "120px" }}
              />
              <span className="absolute bottom-3 right-3 text-xs text-gray-400">
                {input.length}/2000
              </span>
            </div>
            <Button
              variant="primary"
              size="md"
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="flex-shrink-0 h-12 w-12 p-0 rounded-xl"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Arya is powered by Cerebras AI · Responses may not always be accurate
          </p>
        </div>
      </div>
    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense>
      <ChatPageInner />
    </Suspense>
  );
}

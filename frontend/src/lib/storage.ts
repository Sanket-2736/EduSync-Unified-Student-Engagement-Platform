/**
 * Typed localStorage wrapper.
 * All functions are safe to call during SSR (they no-op when window is absent).
 */

const isBrowser = typeof window !== "undefined";

// ── Keys ──────────────────────────────────────────────────────────────────────
const KEYS = {
  USER_ID: "userId",
  USER_PROFILE: "userProfile",
  CHAT_HISTORY: "arya_chat_history",
  AUTH_TOKEN: "authToken",
} as const;

// ── Auth token ────────────────────────────────────────────────────────────────
const TOKEN_COOKIE = "studyai_token";

/**
 * Save JWT to both localStorage (for JS access) and a cookie
 * (so Next.js middleware can read it server-side).
 */
export function saveToken(token: string): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(KEYS.AUTH_TOKEN, token);
    // Set cookie: 7-day expiry, SameSite=Lax, no HttpOnly so JS can read it
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toUTCString();
    document.cookie = `${TOKEN_COOKIE}=${token}; expires=${expires}; path=/; SameSite=Lax`;
  } catch {
    // ignore
  }
}

export function getToken(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(KEYS.AUTH_TOKEN);
}

export function clearToken(): void {
  if (!isBrowser) return;
  localStorage.removeItem(KEYS.AUTH_TOKEN);
  // Expire the cookie immediately
  document.cookie = `${TOKEN_COOKIE}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/; SameSite=Lax`;
}

// ── User ID ───────────────────────────────────────────────────────────────────
export function saveUserId(id: string): void {
  if (!isBrowser) return;
  localStorage.setItem(KEYS.USER_ID, id);
}

export function getUserId(): string | null {
  if (!isBrowser) return null;
  return localStorage.getItem(KEYS.USER_ID);
}

// ── User profile ──────────────────────────────────────────────────────────────
export interface StoredProfile {
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  undergradDegree?: string;
  gpa?: number;
  greScore?: number;
  ieltsScore?: number;
  toeflScore?: number;
  targetField?: string;
  preferredCountries?: string[];
  studyTimeline?: string;
  familyIncome?: number;
  educationBudget?: number;
  hasCollateral?: boolean;
  careerGoal?: string;
  biggestConcerns?: string[];
  workExperience?: number;
  [key: string]: unknown;
}

export function saveProfile(profile: StoredProfile): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(profile));
  } catch {
    // ignore quota errors
  }
}

export function getProfile(): StoredProfile | null {
  if (!isBrowser) return null;
  try {
    const raw = localStorage.getItem(KEYS.USER_PROFILE);
    return raw ? (JSON.parse(raw) as StoredProfile) : null;
  } catch {
    return null;
  }
}

// ── Chat history ──────────────────────────────────────────────────────────────
export interface StoredChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: number;
}

/** Key is per-user: arya_chat_{userId} */
function chatKey(userId: string) {
  return `arya_chat_${userId}`;
}

export function saveChatHistory(
  userId: string,
  history: StoredChatMessage[]
): void {
  if (!isBrowser) return;
  try {
    localStorage.setItem(chatKey(userId), JSON.stringify(history));
  } catch {
    // ignore quota errors
  }
}

export function getChatHistory(userId: string): StoredChatMessage[] {
  if (!isBrowser) return [];
  try {
    const raw = localStorage.getItem(chatKey(userId));
    return raw ? (JSON.parse(raw) as StoredChatMessage[]) : [];
  } catch {
    return [];
  }
}

export function clearChatHistory(userId: string): void {
  if (!isBrowser) return;
  localStorage.removeItem(chatKey(userId));
}

// ── Clear everything ──────────────────────────────────────────────────────────
export function clearAll(): void {
  if (!isBrowser) return;
  Object.values(KEYS).forEach((key) => localStorage.removeItem(key));
  const userId = localStorage.getItem(KEYS.USER_ID);
  if (userId) localStorage.removeItem(chatKey(userId));
  clearToken();
}

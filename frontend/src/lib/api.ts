import axios, { AxiosInstance, AxiosError } from "axios";
import toast from "react-hot-toast";
import { getToken } from "./storage";

// ── Axios instance ────────────────────────────────────────────────────────────
const api: AxiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000",
  timeout: 60_000,
  headers: { "Content-Type": "application/json" },
});

// ── Request interceptor: attach Authorization header (JWT) ───────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 / 409 / 500 ───────────────────────────────────
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError<{ error?: string }>) => {
    const status = error.response?.status;
    const errorMsg = error.response?.data?.error;

    if (status === 401) {
      // Import here to avoid circular dependency
      const { useUserStore } = require("@/store/userStore");
      useUserStore.getState().logout();
      return Promise.reject(error);
    }

    if (status === 409) {
      // Conflict error (e.g., email already registered)
      const err = new Error(errorMsg || "This resource already exists");
      return Promise.reject(err);
    }

    if (status && status >= 500) {
      const msg = errorMsg || "Server error. Please try again.";
      toast.error(msg);
    }

    return Promise.reject(error);
  }
);

// ── Types ─────────────────────────────────────────────────────────────────────

export interface CareerParams {
  gre?: number;
  gpa?: number;
  budget?: number;
  field: string;
  workExp?: number;
  preferredCountries?: string[];
}

export interface ROIParams {
  university: string;
  course: string;
  loanAmount: number;
  country: string;
  fieldOfStudy: string;
}

export interface AdmissionParams {
  university: string;
  course: string;
  gre?: number;
  gmat?: number;
  gpa?: number;
  workExp?: number;
  publications?: number;
  extraCurricular?: string;
  sop?: string;
}

export interface LoanEligibilityParams {
  course: string;
  university: string;
  country: string;
  loanAmount: number;
  familyIncome?: number;
  hasCollateral?: boolean;
  coApplicantIncome?: number;
  cibilScore?: number;
}

export interface RepaymentParams {
  loanAmount: number;
  interestRate: number;
  tenure: number;
  expectedSalary?: number;
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface UserProfileUpdate {
  name?: string;
  phone?: string;
  city?: string;
  onboardingComplete?: boolean;
  profile?: Record<string, unknown>;
}

// ── Typed API functions ───────────────────────────────────────────────────────

export async function getCareerRecommendations(params: CareerParams) {
  const { data } = await api.post("/api/career-navigator", params);
  return data.data;
}

export async function calculateROI(params: ROIParams) {
  const { data } = await api.post("/api/roi-calculator", params);
  return data.data;
}

export async function predictAdmission(params: AdmissionParams) {
  const { data } = await api.post("/api/admission-predictor", params);
  return data.data;
}

export async function checkLoanEligibility(params: LoanEligibilityParams) {
  const { data } = await api.post("/api/loan/eligibility", params);
  return data.data;
}

export async function getLoanRepaymentScenarios(params: RepaymentParams) {
  const { data } = await api.post("/api/loan/repayment-scenarios", params);
  return data.data;
}

/**
 * Streaming chat — returns the raw fetch Response so callers can
 * consume the ReadableStream directly.
 */
export async function sendChatMessage(
  messages: ChatMessage[],
  studentProfile: Record<string, unknown> = {}
): Promise<Response> {
  const token = getToken();
  const baseURL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const authHeaders: Record<string, string> = token
    ? { Authorization: `Bearer ${token}` }
    : {};

  const response = await fetch(`${baseURL}/api/mentor/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...authHeaders },
    body: JSON.stringify({ messages, studentProfile }),
  });

  if (!response.ok) throw new Error(`Chat API error: ${response.status}`);
  return response;
}

export async function getUserProfile(id: string) {
  const { data } = await api.get(`/api/users/${id}`);
  return data.data;
}

export async function updateUserProfile(
  id: string,
  updates: UserProfileUpdate
) {
  const { data } = await api.put(`/api/users/${id}`, updates);
  return data.data;
}

export async function createUser(payload: {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  profile?: Record<string, unknown>;
}) {
  const { data } = await api.post("/api/users/create", payload);
  return data.data;
}

export async function loginUser(id: string) {
  const { data } = await api.post(`/api/users/${id}/login`);
  return data.data;
}

// ── Auth (JWT) ────────────────────────────────────────────────────────────────

export async function authRegister(payload: {
  name: string;
  email: string;
  password: string;
  phone?: string;
  city?: string;
  referralCode?: string;
}): Promise<{ token: string; userId: string; user: Record<string, unknown> }> {
  const { data } = await api.post("/api/auth/register", payload);
  return data.data;
}

export async function authLogin(payload: {
  email: string;
  password: string;
}): Promise<{
  token: string;
  userId: string;
  user: Record<string, unknown>;
  streak: number;
  points: number;
}> {
  const { data } = await api.post("/api/auth/login", payload);
  return data.data;
}

export async function authVerify(): Promise<{ userId: string; email: string }> {
  const { data } = await api.post("/api/auth/verify");
  return data.data;
}

export async function getUserByEmail(email: string) {
  const { data } = await api.get(
    `/api/users/by-email/${encodeURIComponent(email)}`
  );
  return data.data;
}

// ── Assessments ───────────────────────────────────────────────────────────────

export async function saveAssessmentResult(
  type: "career" | "roi" | "admission" | "loan",
  input: Record<string, unknown>,
  result: Record<string, unknown>
) {
  const { data } = await api.post("/api/assessments", { type, input, result });
  return data.data;
}

export async function getRecentAssessments() {
  const { data } = await api.get("/api/assessments/recent");
  return data.data as Array<{
    _id: string;
    type: string;
    input: Record<string, unknown>;
    result: Record<string, unknown>;
    createdAt: string;
  }>;
}

export async function getAllAssessments(
  type?: "career" | "roi" | "admission" | "loan"
) {
  const params = type ? `?type=${type}` : "";
  const { data } = await api.get(`/api/assessments${params}`);
  return data.data;
}

export async function getAssessmentsByUserId(
  userId: string,
  type?: string,
  limit = 10
) {
  const params = new URLSearchParams();
  if (type) params.set("type", type);
  params.set("limit", String(limit));
  const { data } = await api.get(`/api/assessments/${userId}?${params}`);
  return data.data as Array<{
    _id: string;
    type: "career" | "roi" | "admission" | "loan";
    input: Record<string, unknown>;
    result: Record<string, unknown>;
    createdAt: string;
  }>;
}

export async function getAssessmentById(userId: string, assessmentId: string) {
  const { data } = await api.get(`/api/assessments/${userId}/${assessmentId}`);
  return data.data as {
    _id: string;
    type: "career" | "roi" | "admission" | "loan";
    input: Record<string, unknown>;
    result: Record<string, unknown>;
    createdAt: string;
  };
}

// ── Loan documents ────────────────────────────────────────────────────────────

export async function createLoanApplication(payload: {
  loanAmount?: number;
  university?: string;
  course?: string;
  country?: string;
  selectedLender?: string;
  eligibilityResult?: Record<string, unknown>;
  repaymentPlan?: Record<string, unknown>;
}) {
  const { data } = await api.post("/api/loan/applications", payload);
  return data.data;
}

export async function getCurrentLoanApplication() {
  const { data } = await api.get("/api/loan/applications/current");
  return data.data;
}

export async function updateDocumentStatus(
  applicationId: string,
  documentId: string,
  status: "pending" | "uploaded" | "verified"
) {
  const { data } = await api.patch(
    `/api/loan/applications/${applicationId}/documents/${documentId}`,
    { status }
  );
  return data.data;
}

export async function submitLoanApplication(applicationId: string) {
  const { data } = await api.post(
    `/api/loan/applications/${applicationId}/submit`
  );
  return data.data;
}

// ── Scores (deterministic engine) ────────────────────────────────────────────

export interface ApplicationScoreResult {
  overall: number;
  tier: "Strong" | "Good" | "Average" | "Needs Work";
  sub: {
    academics: number;
    testScores: number;
    experience: number;
    financial: number;
    completeness: number;
  };
  explanation: string | null;
}

export interface LoanRiskResult {
  riskScore: number;
  riskLevel: "Low" | "Moderate" | "High";
  loanToSalaryRatio: number;
  safeThreshold: number;
  isAboveThreshold: boolean;
  estimatedSalaryUSD: number;
  estimatedMonthlyEMI: number;
  emiToIncomeRatio: number;
  bestCountry: string;
  postStudyWorkYears: number;
  warnings: string[];
  explanation: string | null;
}

export async function getApplicationScore(profile: Record<string, unknown>): Promise<ApplicationScoreResult> {
  const { data } = await api.post("/api/scores/application", { profile });
  return data.data;
}

export async function getLoanRiskScore(params: {
  loanAmountUSD: number;
  familyIncomeINR?: number;
  hasCollateral?: boolean;
  targetCountries?: string[];
  targetField?: string;
  gpa?: number;
  greScore?: number;
}): Promise<LoanRiskResult> {
  const { data } = await api.post("/api/scores/loan-risk", params);
  return data.data;
}

export default api;

// ── Test Preparation ──────────────────────────────────────────────────────────

export interface TestPrepQuestion {
  id: number;
  type: string;
  question: string;
  options: string[] | null;
  correctAnswer: string;
  explanation: string;
  difficulty: "Easy" | "Medium" | "Hard";
  topic: string;
  timeLimit: number;
}

export interface TestPrepQuestionsResult {
  questions: TestPrepQuestion[];
  sectionTips: string[];
  adaptiveNote: string;
}

export interface StudyPlanResult {
  overview: string;
  scoreGap: number;
  feasibility: string;
  weeklyPlan: Array<{
    week: number;
    focus: string;
    dailyHours: number;
    tasks: string[];
    milestone: string;
  }>;
  resourceRecommendations: Array<{
    name: string;
    type: string;
    url: string;
    free: boolean;
  }>;
  weakAreaStrategies: Array<{
    area: string;
    strategy: string;
    estimatedWeeks: number;
  }>;
  mockTestSchedule: Array<{ week: number; test: string; purpose: string }>;
  dailyRoutine: { morning: string; afternoon: string; evening: string };
  motivationalTip: string;
}

export interface ExplainResult {
  conceptExplanation: string;
  whyWrong: string | null;
  keyRule: string;
  examples: Array<{ example: string; solution: string }>;
  memoryTip: string;
  relatedTopics: string[];
  practiceHint: string;
}

export interface AnalyzeResult {
  overallScore: number;
  accuracy: number;
  performanceLevel: string;
  weakAreas: Array<{ topic: string; accuracy: number; priority: string }>;
  strongAreas: string[];
  timeManagement: string;
  nextSteps: string[];
  estimatedScore: string;
  improvementPotential: string;
}

export async function generateTestQuestions(params: {
  test: string;
  section: string;
  difficulty?: string;
  currentScore?: number;
  targetScore?: number;
  count?: number;
}): Promise<TestPrepQuestionsResult> {
  const { data } = await api.post("/api/test-prep/questions", params);
  return data.data;
}

export async function generateStudyPlan(params: {
  test: string;
  currentScore: number;
  targetScore: number;
  weeksAvailable?: number;
  weakAreas?: string[];
  strongAreas?: string[];
}): Promise<StudyPlanResult> {
  const { data } = await api.post("/api/test-prep/study-plan", params);
  return data.data;
}

export async function explainConcept(params: {
  test: string;
  topic: string;
  question?: string;
  userAnswer?: string;
  correctAnswer?: string;
}): Promise<ExplainResult> {
  const { data } = await api.post("/api/test-prep/explain", params);
  return data.data;
}

export async function analyzeTestResults(params: {
  test: string;
  answers: Array<{ topic: string; difficulty: string; isCorrect: boolean }>;
  totalQuestions?: number;
}): Promise<AnalyzeResult> {
  const { data } = await api.post("/api/test-prep/analyze", params);
  return data.data;
}

// ── Content Generator ─────────────────────────────────────────────────────────

export interface SOPResult {
  sop: string;
  wordCount: number;
  highlights: string[];
  improvementSuggestions: string[];
  keyThemes: string[];
  openingHook: string;
  alternativeOpenings: string[];
}

export interface CoverLetterResult {
  coverLetter: string;
  wordCount: number;
  keySellingPoints: string[];
  toneAnalysis: string;
  customizationTips: string[];
  subjectLine: string;
  followUpTemplate: string;
}

export interface EmailResult {
  subject: string;
  emailBody: string;
  wordCount: number;
  toneNotes: string;
  doList: string[];
  dontList: string[];
  followUpTiming: string;
  alternativeSubjects: string[];
}

export interface SocialContentResult {
  mainPost: string;
  hashtags: string[];
  alternativeVersions: string[];
  engagementTips: string[];
  bestPostingTime: string;
  callToAction: string;
  characterCount: number;
}

export async function generateSOP(params: {
  name?: string;
  university: string;
  program: string;
  gpa?: number;
  greScore?: number;
  workExp?: number;
  researchInterests?: string;
  careerGoal?: string;
  achievements?: string;
  whyThisUniversity?: string;
  targetField?: string;
  preferredCountry?: string;
}): Promise<SOPResult> {
  const { data } = await api.post("/api/content/sop", params);
  return data.data;
}

export async function generateCoverLetter(params: {
  name?: string;
  company: string;
  role: string;
  roleType?: string;
  skills?: string;
  experience?: string;
  careerGoal?: string;
  achievements?: string;
  targetField?: string;
  university?: string;
}): Promise<CoverLetterResult> {
  const { data } = await api.post("/api/content/cover-letter", params);
  return data.data;
}

export async function generateEmail(params: {
  emailType: string;
  recipientName?: string;
  recipientTitle?: string;
  university: string;
  program?: string;
  senderName?: string;
  researchInterest?: string;
  specificQuestion?: string;
  targetField?: string;
}): Promise<EmailResult> {
  const { data } = await api.post("/api/content/email", params);
  return data.data;
}

export async function generateSocialContent(params: {
  platform: string;
  contentType: string;
  name?: string;
  university?: string;
  program?: string;
  achievement?: string;
  targetField?: string;
  careerGoal?: string;
  tone?: string;
}): Promise<SocialContentResult> {
  const { data } = await api.post("/api/content/social", params);
  return data.data;
}

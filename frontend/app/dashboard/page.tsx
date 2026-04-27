"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import {
  Compass, TrendingUp, GraduationCap, Banknote,
  Flame, Star, ArrowRight, Zap, Share2, Copy, Check,
  BookOpen, Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { StreakCard } from "@/components/gamification/StreakCard";
import { PointsDisplay } from "@/components/gamification/PointsDisplay";
import { BadgeCollection } from "@/components/gamification/BadgeCollection";
import { ResultsModal } from "@/components/ResultsModal";
import { ApplicationScoreCard } from "@/components/ApplicationScoreCard";
import { LoanRiskCard } from "@/components/LoanRiskCard";
import { getAssessmentsByUserId } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

// ── Types ─────────────────────────────────────────────────────────────────────
interface User {
  id: string;
  name: string;
  points: number;
  streak: number;
  badges: string[];
  profile?: Record<string, unknown>;
}

type AssessmentType = "career" | "roi" | "admission" | "loan";

interface Assessment {
  _id: string;
  type: AssessmentType;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
}

// ── Static data ───────────────────────────────────────────────────────────────
const tips = [
  "Start preparing for standardized tests 6-8 months before your target intake.",
  "A strong SOP can make up for slightly lower test scores.",
  "Research universities thoroughly before applying — fit matters!",
  "Build your profile with internships and projects relevant to your field.",
  "Apply to a mix of reach, match, and safety universities.",
  "Don't ignore scholarship opportunities — they can significantly reduce costs.",
  "Connect with alumni on LinkedIn to learn about their experiences.",
  "Keep your documents organized and backup copies ready.",
  "Start the visa process early to avoid last-minute stress.",
  "Consider taking the IELTS/TOEFL even if not required — it strengthens your profile.",
];

const tools = [
  { icon: Compass,      title: "Career Navigator",    description: "Get personalized university recommendations", href: "/tools/career-navigator",    challengeLabel: "Run Career Navigator"         },
  { icon: TrendingUp,   title: "ROI Calculator",      description: "Calculate education ROI and salary projections", href: "/tools/roi-calculator",  challengeLabel: "Calculate your ROI"           },
  { icon: GraduationCap,title: "Admission Predictor", description: "Predict admission chances and get tips",  href: "/tools/admission-predictor",    challengeLabel: "Predict your admission chances"},
  { icon: Banknote,     title: "Loan Advisor",        description: "Find the best education loan options",    href: "/loan",                         challengeLabel: "Check loan eligibility"       },
  { icon: BookOpen,     title: "Test Prep Hub",       description: "Adaptive practice tests and study plans", href: "/tools/test-prep",              challengeLabel: "Start test preparation"       },
  { icon: Sparkles,     title: "Content Generator",   description: "AI-powered SOP, emails, and social posts", href: "/tools/content-generator",     challengeLabel: "Generate content"             },
];

const TYPE_META: Record<AssessmentType, { emoji: string; label: string; dot: string }> = {
  career:    { emoji: "🎓", label: "Career Navigator",    dot: "bg-purple-600" },
  roi:       { emoji: "💰", label: "ROI Calculator",      dot: "bg-blue-600"   },
  admission: { emoji: "📊", label: "Admission Predictor", dot: "bg-green-600"  },
  loan:      { emoji: "🏦", label: "Loan Advisor",        dot: "bg-amber-600"  },
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function getOneLiner(a: Assessment): string {
  const r = a.result as any;
  const inp = a.input as any;
  switch (a.type) {
    case "career":
      return r.topUniversities?.[0]?.name
        ? `Top pick: ${r.topUniversities[0].name}`
        : `Field: ${inp.field ?? "—"}`;
    case "roi":
      return r.verdict
        ? r.verdict.slice(0, 70) + (r.verdict.length > 70 ? "…" : "")
        : `${inp.university ?? "—"} · ${inp.course ?? "—"}`;
    case "admission":
      return `${inp.university ?? "—"} — ${r.admissionChance ?? "?"}% admission chance`;
    case "loan":
      return `₹${((r.eligibleAmount ?? 0) / 100000).toFixed(0)}L eligible · payoff ${r.loanTenure ?? "—"} yrs`;
    default:
      return "View details";
  }
}

function isProfileIncomplete(profile: Record<string, unknown> | undefined): boolean {
  if (!profile) return true;
  const flat = { ...profile, ...(profile.academics as object ?? {}), ...(profile.preferences as object ?? {}), ...(profile.finances as object ?? {}), ...(profile.goals as object ?? {}) };
  const keyFields = ["gpa", "greScore", "targetField", "preferredCountries", "educationBudget", "careerGoal"];
  const filled = keyFields.filter((k) => {
    const v = (flat as any)[k];
    return v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0);
  });
  return filled.length < 5;
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3_600_000);
  const d = Math.floor(diff / 86_400_000);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  return `${d}d ago`;
}

// ── Sub-components ────────────────────────────────────────────────────────────
const fadeInUp = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.5 } };
const stagger  = { animate: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } } };

function ReferralSection({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/onboard?ref=${userId}`
    : `/onboard?ref=${userId}`;

  const handleCopy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    toast.success("Referral link copied!");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <Card padding="md" className="bg-gradient-to-r from-teal-50 to-purple-50 border-teal-200">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-teal-100 rounded-lg flex-shrink-0">
          <Share2 className="w-5 h-5 text-teal-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-gray-900 mb-1">Invite a Friend → Earn 200 Points 🎁</h3>
          <p className="text-sm text-gray-600 mb-3">Share your referral link. When a friend joins, you both get 200 bonus points!</p>
          <div className="flex items-center gap-2">
            <div className="flex-1 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-600 truncate font-mono">{url}</div>
            <Button size="sm" variant="secondary" onClick={handleCopy}>
              {copied ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </div>
    </Card>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function DashboardPage() {
  const router = useRouter();
  const { user: storeUser, userId, isAuthenticated, isLoading: authLoading } = useUserStore();
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [todayTip, setTodayTip] = useState(tips[0]);
  const [challengeDone, setChallengeDone] = useState(false);
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  useEffect(() => {
    // Wait for auth to resolve before deciding to redirect
    if (authLoading) return;
    if (!isAuthenticated || !userId) {
      router.replace("/login");
      return;
    }

    // Fetch assessments (user data already in store)
    getAssessmentsByUserId(userId, undefined, 5)
      .then(setAssessments)
      .catch(() => setAssessments([]))
      .finally(() => setLoading(false));

    const dayOfYear = Math.floor(
      (Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000
    );
    setTodayTip(tips[dayOfYear % tips.length]);

    const lastChallenge = localStorage.getItem("lastChallengeDate");
    if (lastChallenge === new Date().toISOString().slice(0, 10)) setChallengeDone(true);
  }, [authLoading, isAuthenticated, userId, router]);

  const handleChallengeClick = () => {
    localStorage.setItem("lastChallengeDate", new Date().toISOString().slice(0, 10));
    setChallengeDone(true);
    toast.success("+50 points! Challenge accepted 🎯");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading your dashboard…</p>
        </div>
      </div>
    );
  }

  if (!storeUser) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card padding="lg" className="text-center max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Unable to Load Dashboard</h2>
          <p className="text-gray-600 mb-6">Please log in again to continue.</p>
          <Link href="/login"><Button variant="primary">Go to Login</Button></Link>
        </Card>
      </div>
    );
  }

  // Map store user to local User shape
  const user: User = {
    id: storeUser._id,
    name: storeUser.name || "Student",
    points: storeUser.points || 0,
    streak: storeUser.streak || 0,
    badges: (storeUser.badges as string[]) || [],
    profile: storeUser.profile as Record<string, unknown>,
  };

  const profileIncomplete = isProfileIncomplete(storeUser.profile as Record<string, unknown>);
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const dailyChallenge = tools[dayOfYear % tools.length];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* ── Profile incomplete banner ──────────────────────────────────── */}
        {profileIncomplete && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-between gap-4 px-5 py-3 bg-amber-50 border border-amber-300 rounded-xl">
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <p className="text-sm font-medium text-amber-900">
                  Your profile is incomplete — fill it in to unlock personalised recommendations and earn{" "}
                  <span className="font-bold">+50 points</span>!
                </p>
              </div>
              <Link href="/onboard" className="flex-shrink-0">
                <Button size="sm" variant="primary">Complete Profile</Button>
              </Link>
            </div>
          </motion.div>
        )}

        {/* ── Welcome header ─────────────────────────────────────────────── */}
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-1">Welcome back, {user.name} 👋</h1>
              <p className="text-gray-600">
                {user.streak > 0 ? `You're on a ${user.streak}-day streak! Keep it up! 🔥` : "Log in daily to build your streak!"}
              </p>
            </div>
            <div className="flex items-center gap-6">
              <div className="text-center">
                <div className="flex items-center gap-1 text-amber-600 font-bold text-2xl mb-0.5">
                  <Flame className="w-6 h-6" />{user.streak}
                </div>
                <p className="text-xs text-gray-500">Streak</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-yellow-500 font-bold text-2xl mb-0.5">
                  <Star className="w-6 h-6" />{user.points}
                </div>
                <p className="text-xs text-gray-500">Points</p>
              </div>
              <div className="text-center">
                <div className="flex items-center gap-1 text-purple-600 font-bold text-2xl mb-0.5">
                  🏅 {user.badges?.length ?? 0}
                </div>
                <p className="text-xs text-gray-500">Badges</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Score cards ────────────────────────────────────────────────── */}
        <motion.div className="grid md:grid-cols-2 gap-6" initial="initial" animate="animate" variants={stagger}>
          <motion.div variants={fadeInUp}><ApplicationScoreCard /></motion.div>
          <motion.div variants={fadeInUp}><LoanRiskCard /></motion.div>
        </motion.div>

        {/* ── Daily challenge ────────────────────────────────────────────── */}
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <Card padding="md" className={`border-2 transition-colors ${challengeDone ? "border-green-300 bg-green-50" : "border-purple-300 bg-gradient-to-r from-purple-50 to-indigo-50"}`}>
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl ${challengeDone ? "bg-green-100" : "bg-purple-100"}`}>
                  <Zap className={`w-6 h-6 ${challengeDone ? "text-green-600" : "text-purple-600"}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">Today's Challenge</p>
                  <h3 className="font-bold text-gray-900">
                    {challengeDone ? "Challenge Complete! 🎉" : `${dailyChallenge.challengeLabel} → +50 points`}
                  </h3>
                  {!challengeDone && (
                    <p className="text-sm text-gray-600 mt-0.5">Use the {dailyChallenge.title} tool today to earn bonus points</p>
                  )}
                </div>
              </div>
              {!challengeDone ? (
                <Link href={dailyChallenge.href} onClick={handleChallengeClick}>
                  <Button variant="primary" size="sm">Start Challenge <ArrowRight className="w-4 h-4 ml-1" /></Button>
                </Link>
              ) : (
                <span className="text-green-600 font-semibold text-sm">✓ +50 pts earned</span>
              )}
            </div>
          </Card>
        </motion.div>

        {/* ── Gamification row ───────────────────────────────────────────── */}
        <motion.div className="grid md:grid-cols-3 gap-6" initial="initial" animate="animate" variants={stagger}>
          <motion.div variants={fadeInUp}><StreakCard streak={user.streak} /></motion.div>
          <motion.div variants={fadeInUp}><PointsDisplay points={user.points} /></motion.div>
          <motion.div variants={fadeInUp}><BadgeCollection earnedBadges={user.badges || []} /></motion.div>
        </motion.div>

        {/* ── Tools grid ─────────────────────────────────────────────────── */}
        <motion.div initial="initial" animate="animate" variants={stagger}>
          <h2 className="text-2xl font-bold text-gray-900 mb-6">AI Tools</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {tools.map((tool, index) => {
              const Icon = tool.icon;
              return (
                <motion.div key={index} variants={fadeInUp}>
                  <Card padding="md" className="h-full hover:shadow-lg transition-shadow flex flex-col">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <Icon className="w-5 h-5 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900">{tool.title}</h3>
                    </div>
                    <p className="text-sm text-gray-600 mb-4 flex-1">{tool.description}</p>
                    <Link href={tool.href}>
                      <Button size="sm" variant="ghost" className="w-full justify-between">
                        Launch <ArrowRight className="w-4 h-4" />
                      </Button>
                    </Link>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* ── Past assessments ───────────────────────────────────────────── */}
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <Card padding="md">
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-lg font-bold text-gray-900">Past Assessments</h3>
              {assessments.length > 0 && (
                <Badge variant="info">{assessments.length} result{assessments.length !== 1 ? "s" : ""}</Badge>
              )}
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-400 text-sm mb-3">No assessments yet — try one of the AI tools above!</p>
                <Link href="/tools/career-navigator">
                  <Button size="sm" variant="secondary">Run Career Navigator</Button>
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {assessments.map((a) => {
                  const meta = TYPE_META[a.type];
                  return (
                    <div
                      key={a._id}
                      className="flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-purple-200 hover:bg-purple-50/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedAssessment(a)}
                    >
                      {/* Icon */}
                      <div className="text-2xl flex-shrink-0">{meta.emoji}</div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-gray-900">{meta.label}</span>
                          <div className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                          <span className="text-xs text-gray-500">{relativeTime(a.createdAt)}</span>
                        </div>
                        <p className="text-sm text-gray-600 truncate">{getOneLiner(a)}</p>
                      </div>

                      {/* CTA */}
                      <Button
                        size="sm"
                        variant="ghost"
                        className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => { e.stopPropagation(); setSelectedAssessment(a); }}
                      >
                        View Details
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </motion.div>

        {/* ── Tip of the day ─────────────────────────────────────────────── */}
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <Card padding="md" className="bg-gradient-to-r from-purple-600 to-teal-600 text-white">
            <div className="flex items-start gap-4">
              <div className="text-3xl">💡</div>
              <div>
                <h3 className="font-bold mb-1">Tip of the Day</h3>
                <p className="opacity-90 text-sm leading-relaxed">{todayTip}</p>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* ── Referral ───────────────────────────────────────────────────── */}
        <motion.div initial="initial" animate="animate" variants={fadeInUp}>
          <ReferralSection userId={user.id} />
        </motion.div>

      </div>

      {/* ── Results modal ──────────────────────────────────────────────────── */}
      <ResultsModal
        assessment={selectedAssessment}
        onClose={() => setSelectedAssessment(null)}
      />
    </div>
  );
}

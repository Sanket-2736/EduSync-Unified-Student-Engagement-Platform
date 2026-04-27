"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShieldCheck, TrendingUp, BookOpen, Briefcase, Wallet, CheckSquare, RefreshCw } from "lucide-react";
import { Card } from "./ui/Card";
import { getApplicationScore, type ApplicationScoreResult } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

// ── Sub-score row ─────────────────────────────────────────────────────────────
function SubScoreRow({
  icon: Icon,
  label,
  score,
  color,
}: {
  icon: React.ElementType;
  label: string;
  score: number;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className={`p-1.5 rounded-lg ${color} bg-opacity-10 flex-shrink-0`}>
        <Icon className={`w-3.5 h-3.5 ${color}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs text-gray-600">{label}</span>
          <span className="text-xs font-semibold text-gray-800">{score}</span>
        </div>
        <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden">
          <motion.div
            className={`h-full rounded-full ${
              score >= 70 ? "bg-green-500" :
              score >= 45 ? "bg-amber-500" :
              "bg-red-400"
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${score}%` }}
            transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          />
        </div>
      </div>
    </div>
  );
}

// ── Circular score dial ───────────────────────────────────────────────────────
function ScoreDial({ score, tier }: { score: number; tier: string }) {
  const radius = 52;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (score / 100) * circ;

  const color =
    score >= 70 ? "#22c55e" :
    score >= 50 ? "#f59e0b" :
    score >= 30 ? "#f97316" :
    "#ef4444";

  const tierColor =
    tier === "Strong"     ? "text-green-600 bg-green-50"  :
    tier === "Good"       ? "text-amber-600 bg-amber-50"  :
    tier === "Average"    ? "text-orange-600 bg-orange-50":
    "text-red-600 bg-red-50";

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative flex items-center justify-center w-32 h-32">
        <svg width="128" height="128" className="-rotate-90">
          <circle cx="64" cy="64" r={radius} fill="none" stroke="#f3f4f6" strokeWidth="10" />
          <motion.circle
            cx="64" cy="64" r={radius}
            fill="none" stroke={color} strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={circ}
            initial={{ strokeDashoffset: circ }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: "easeOut" }}
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="text-3xl font-black text-gray-900">{score}</span>
          <span className="text-xs text-gray-500">/ 100</span>
        </div>
      </div>
      <span className={`text-xs font-semibold px-3 py-1 rounded-full ${tierColor}`}>
        {tier}
      </span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export function ApplicationScoreCard() {
  const { user } = useUserStore();
  const [score, setScore] = useState<ApplicationScoreResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchScore = async () => {
    if (!user?.profile) return;
    setLoading(true);
    setError(false);
    try {
      const result = await getApplicationScore(user.profile as Record<string, unknown>);
      setScore(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchScore();
  }, [user?._id]); // eslint-disable-line

  const subScores = score ? [
    { icon: BookOpen,    label: "Academics",           score: score.sub.academics,    color: "text-purple-600" },
    { icon: TrendingUp,  label: "Test Scores",          score: score.sub.testScores,   color: "text-blue-600"   },
    { icon: Briefcase,   label: "Work Experience",      score: score.sub.experience,   color: "text-teal-600"   },
    { icon: Wallet,      label: "Financial Readiness",  score: score.sub.financial,    color: "text-amber-600"  },
    { icon: CheckSquare, label: "Profile Completeness", score: score.sub.completeness, color: "text-green-600"  },
  ] : [];

  return (
    <Card padding="md" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-purple-600" />
          <h3 className="font-bold text-gray-900">Application Strength</h3>
        </div>
        <button
          onClick={fetchScore}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
          title="Refresh score"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !score && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-8 h-8 border-3 border-purple-200 border-t-purple-600 rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Calculating your score…</p>
        </div>
      )}

      {error && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-3">Could not load score</p>
          <button onClick={fetchScore} className="text-xs text-purple-600 hover:underline">
            Try again
          </button>
        </div>
      )}

      {score && (
        <div className="space-y-4">
          {/* Dial */}
          <div className="flex justify-center">
            <ScoreDial score={score.overall} tier={score.tier} />
          </div>

          {/* Sub-scores */}
          <div className="space-y-2.5">
            {subScores.map((s) => (
              <SubScoreRow key={s.label} {...s} />
            ))}
          </div>

          {/* LLM explanation */}
          {score.explanation && (
            <div className="pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-600 leading-relaxed">{score.explanation}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { X, RotateCcw, CheckCircle, XCircle } from "lucide-react";
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { Badge } from "./ui/Badge";

// ── Types ─────────────────────────────────────────────────────────────────────
type AssessmentType = "career" | "roi" | "admission" | "loan";

interface Assessment {
  _id: string;
  type: AssessmentType;
  input: Record<string, unknown>;
  result: Record<string, unknown>;
  createdAt: string;
}

interface ResultsModalProps {
  assessment: Assessment | null;
  onClose: () => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const TYPE_META: Record<AssessmentType, { emoji: string; label: string; color: string }> = {
  career:    { emoji: "🎓", label: "Career Navigator",    color: "text-purple-600" },
  roi:       { emoji: "💰", label: "ROI Calculator",      color: "text-blue-600"   },
  admission: { emoji: "📊", label: "Admission Predictor", color: "text-green-600"  },
  loan:      { emoji: "🏦", label: "Loan Advisor",        color: "text-amber-600"  },
};

const TOOL_ROUTES: Record<AssessmentType, string> = {
  career:    "/tools/career-navigator",
  roi:       "/tools/roi-calculator",
  admission: "/tools/admission-predictor",
  loan:      "/loan",
};

function countryFlags(name: string) {
  const map: Record<string, string> = {
    USA: "🇺🇸", UK: "🇬🇧", Canada: "🇨🇦", Germany: "🇩🇪",
    Australia: "🇦🇺", Singapore: "🇸🇬", France: "🇫🇷",
  };
  return map[name] ?? "🌍";
}

// ── Result renderers ──────────────────────────────────────────────────────────

function CareerResult({ result }: { result: Record<string, unknown> }) {
  const r = result as any;
  const chartData = (r.topUniversities ?? []).slice(0, 6).map((u: any) => ({
    name: u.name?.split(" ").slice(0, 2).join(" "),
    chance: parseInt(u.admissionChance) || 50,
  }));

  return (
    <div className="space-y-5">
      {r.personalizedMessage && (
        <Card padding="md" className="bg-purple-50 border-purple-200">
          <p className="text-gray-800 text-sm leading-relaxed">💬 {r.personalizedMessage}</p>
        </Card>
      )}

      {/* Countries */}
      {r.topCountries?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Top Countries</h4>
          <div className="grid sm:grid-cols-3 gap-3">
            {r.topCountries.slice(0, 3).map((c: any, i: number) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="text-2xl mb-1">{countryFlags(c.name)}</div>
                <p className="font-semibold text-sm text-gray-900">{c.name}</p>
                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{c.reason}</p>
                <p className="text-xs text-gray-500 mt-1">💰 {c.avgCost}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Universities table */}
      {r.topUniversities?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Universities</h4>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left text-gray-500">
                  <th className="pb-2 pr-3">University</th>
                  <th className="pb-2 pr-3">Country</th>
                  <th className="pb-2 pr-3">Rank</th>
                  <th className="pb-2">Admission</th>
                </tr>
              </thead>
              <tbody>
                {r.topUniversities.map((u: any, i: number) => (
                  <tr key={i} className="border-b border-gray-100">
                    <td className="py-2 pr-3 font-medium text-gray-900">{u.name}</td>
                    <td className="py-2 pr-3 text-gray-600">{u.country}</td>
                    <td className="py-2 pr-3 text-gray-600">#{u.rank}</td>
                    <td className="py-2">
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700">
                        {u.admissionChance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chart */}
      {chartData.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Admission Chances</h4>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-15} textAnchor="end" height={40} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="chance" name="Chance %" fill="#6C63FF" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function ROIResult({ result }: { result: Record<string, unknown> }) {
  const r = result as any;
  const chartData = (r.salaryGrowthCurve ?? []).map((p: any) => ({
    year: `Y${p.year}`,
    salary: p.salary,
  }));

  const verdictColor = (() => {
    const v = r.verdict?.toLowerCase() ?? "";
    if (v.includes("excellent") || v.includes("great")) return "bg-green-50 border-green-200 text-green-800";
    if (v.includes("good") || v.includes("positive")) return "bg-teal-50 border-teal-200 text-teal-800";
    if (v.includes("moderate")) return "bg-amber-50 border-amber-200 text-amber-800";
    return "bg-red-50 border-red-200 text-red-800";
  })();

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Year 1 Salary", value: `$${(r.avgSalaryYear1 ?? 0).toLocaleString()}` },
          { label: "Year 5 Salary", value: `$${(r.avgSalaryYear5 ?? 0).toLocaleString()}` },
          { label: "Loan Payoff",   value: `${r.loanPayoffYears ?? "—"} yrs` },
        ].map((m) => (
          <div key={m.label} className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-lg font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      {r.verdict && (
        <div className={`p-4 rounded-xl border ${verdictColor}`}>
          <p className="text-sm leading-relaxed">{r.verdict}</p>
          <div className="flex gap-4 mt-2 text-xs font-medium">
            <span>5-yr ROI: {r.netROI5yr}%</span>
            <span>10-yr ROI: {r.netROI10yr}%</span>
          </div>
        </div>
      )}

      {chartData.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">10-Year Salary Projection</h4>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="year" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={(v: number) => `$${v.toLocaleString()}`} />
              <Line type="monotone" dataKey="salary" stroke="#6C63FF" strokeWidth={2} dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

function AdmissionResult({ result }: { result: Record<string, unknown> }) {
  const r = result as any;
  const pct = r.admissionChance ?? 0;
  const radius = 54;
  const circ = 2 * Math.PI * radius;
  const offset = circ - (pct / 100) * circ;
  const color = pct >= 70 ? "#22c55e" : pct >= 45 ? "#f59e0b" : "#ef4444";

  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row items-center gap-6">
        {/* Circular progress */}
        <div className="relative flex items-center justify-center w-36 h-36 flex-shrink-0">
          <svg width="144" height="144" className="-rotate-90">
            <circle cx="72" cy="72" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="10" />
            <circle cx="72" cy="72" r={radius} fill="none" stroke={color} strokeWidth="10"
              strokeLinecap="round" strokeDasharray={circ} strokeDashoffset={offset}
              style={{ transition: "stroke-dashoffset 1s ease" }} />
          </svg>
          <div className="absolute flex flex-col items-center">
            <span className="text-3xl font-black" style={{ color }}>{pct}%</span>
            <span className="text-xs text-gray-500">Chance</span>
          </div>
        </div>
        <div>
          <p className="text-sm text-gray-600 mb-2">Profile Strength</p>
          <span className={`inline-flex px-3 py-1 rounded-full text-sm font-semibold ${
            r.profileStrength === "Excellent" || r.profileStrength === "Strong"
              ? "bg-green-100 text-green-800"
              : r.profileStrength === "Average"
              ? "bg-amber-100 text-amber-800"
              : "bg-red-100 text-red-800"
          }`}>{r.profileStrength}</span>
        </div>
      </div>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <h4 className="font-semibold text-green-700 mb-2 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Strengths
          </h4>
          <ul className="space-y-1">
            {(r.strengths ?? []).map((s: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <CheckCircle className="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" />{s}
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h4 className="font-semibold text-red-600 mb-2 flex items-center gap-1">
            <XCircle className="w-4 h-4" /> Weaknesses
          </h4>
          <ul className="space-y-1">
            {(r.weaknesses ?? []).map((w: string, i: number) => (
              <li key={i} className="flex gap-2 text-sm text-gray-700">
                <XCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />{w}
              </li>
            ))}
          </ul>
        </div>
      </div>

      {r.improvementTips?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-2">Action Plan</h4>
          <ol className="space-y-2">
            {r.improvementTips.map((tip: string, i: number) => (
              <li key={i} className="flex gap-3 text-sm text-gray-700">
                <span className="w-6 h-6 rounded-full bg-purple-100 text-purple-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                  {i + 1}
                </span>
                {tip}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

function LoanResult({ result }: { result: Record<string, unknown> }) {
  const r = result as any;
  const approvalColor = (() => {
    const a = r.approvalChance?.toLowerCase() ?? "";
    if (a.includes("very high") || a.includes("high")) return "success";
    if (a.includes("moderate")) return "warning";
    return "danger";
  })() as "success" | "warning" | "danger";

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Eligible Amount", value: `₹${((r.eligibleAmount ?? 0) / 100000).toFixed(0)}L` },
          { label: "Interest Rate",   value: `${r.estimatedInterestRate ?? "—"}%` },
          { label: "EMI Estimate",    value: `₹${(r.emiEstimate ?? 0).toLocaleString()}` },
          { label: "Tenure",          value: `${r.loanTenure ?? "—"} yrs` },
        ].map((m) => (
          <div key={m.label} className="p-3 bg-gray-50 rounded-xl text-center">
            <p className="text-xs text-gray-500 mb-1">{m.label}</p>
            <p className="text-base font-bold text-gray-900">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-600">Approval Chance:</span>
        <Badge variant={approvalColor}>{r.approvalChance}</Badge>
      </div>

      {r.topLenders?.length > 0 && (
        <div>
          <h4 className="font-semibold text-gray-900 mb-3">Top Lenders</h4>
          <div className="space-y-2">
            {r.topLenders.slice(0, 3).map((l: any, i: number) => (
              <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div>
                  <p className="font-medium text-sm text-gray-900">{l.name}</p>
                  <p className="text-xs text-gray-500">Max ₹{((l.maxAmount ?? 0) / 100000).toFixed(0)}L</p>
                </div>
                <span className="text-sm font-bold text-purple-700">{l.interestRate}% p.a.</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main modal ────────────────────────────────────────────────────────────────
export function ResultsModal({ assessment, onClose }: ResultsModalProps) {
  const router = useRouter();

  // Close on Escape key
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  // Prevent body scroll while open
  useEffect(() => {
    if (assessment) document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, [assessment]);

  const handleRunAgain = () => {
    if (!assessment) return;
    // Encode inputs as query params so the tool page can pre-fill
    const params = new URLSearchParams({ prefill: JSON.stringify(assessment.input) });
    router.push(`${TOOL_ROUTES[assessment.type]}?${params}`);
    onClose();
  };

  const meta = assessment ? TYPE_META[assessment.type] : null;

  return (
    <AnimatePresence>
      {assessment && (
        <>
          {/* Backdrop */}
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal panel */}
          <motion.div
            key="modal"
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ type: "spring", damping: 28, stiffness: 320 }}
            className="fixed inset-x-4 top-[5vh] bottom-[5vh] md:inset-x-auto md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-2xl z-50 flex flex-col bg-white rounded-2xl shadow-2xl overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{meta?.emoji}</span>
                <div>
                  <h2 className={`font-bold text-lg ${meta?.color}`}>{meta?.label}</h2>
                  <p className="text-xs text-gray-500">
                    {new Date(assessment.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric", month: "short", year: "numeric",
                      hour: "2-digit", minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {assessment.type === "career"    && <CareerResult    result={assessment.result} />}
              {assessment.type === "roi"       && <ROIResult       result={assessment.result} />}
              {assessment.type === "admission" && <AdmissionResult result={assessment.result} />}
              {assessment.type === "loan"      && <LoanResult      result={assessment.result} />}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 flex-shrink-0 bg-gray-50">
              <Button variant="ghost" onClick={onClose}>Close</Button>
              <Button variant="primary" onClick={handleRunAgain}>
                <RotateCcw className="w-4 h-4 mr-2" />
                Run Again
              </Button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

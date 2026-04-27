"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { GraduationCap, CheckCircle, XCircle, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { Badge } from "@/components/ui/Badge";
import { useProfile } from "@/hooks/useProfile";
import { predictAdmission, saveAssessmentResult } from "@/lib/api";

// ── Circular progress SVG ────────────────────────────────────────────────────
function CircularProgress({ percentage }: { percentage: number }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;

  const color =
    percentage >= 70
      ? "#22c55e"
      : percentage >= 45
      ? "#f59e0b"
      : "#ef4444";

  return (
    <div className="flex flex-col items-center">
      <svg width="180" height="180" className="-rotate-90">
        {/* Track */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
        />
        {/* Progress */}
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 1s ease" }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-4xl font-bold" style={{ color }}>
          {percentage}%
        </span>
        <span className="text-sm text-gray-500">Chance</span>
      </div>
    </div>
  );
}

function strengthVariant(
  strength: string
): "success" | "warning" | "danger" | "info" {
  const s = strength?.toLowerCase();
  if (s === "excellent" || s === "strong") return "success";
  if (s === "average") return "warning";
  if (s === "below average" || s === "weak") return "danger";
  return "info";
}

export default function AdmissionPredictorPage() {
  const router = useRouter();
  const profile = useProfile();

  const [form, setForm] = useState({
    university: "",
    course: "",
    gre: 310,
    gmat: 0,
    gpa: 3.5,
    workExp: 1,
    publications: 0,
    extraCurricular: "",
    sop: "",
  });
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Pre-fill from profile — runs once when profile loads
  useEffect(() => {
    if (!profile) return;
    setForm((prev) => ({
      ...prev,
      gre:     profile.greScore    ?? prev.gre,
      gpa:     profile.gpa         ?? prev.gpa,
      workExp: profile.workExperience ?? prev.workExp,
      course:  prev.course || (profile.targetField ? `MS ${profile.targetField}` : ""),
    }));
  }, [profile?.greScore, profile?.gpa, profile?.workExperience, profile?.targetField]); // eslint-disable-line

  const set = (field: string, value: any) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handlePredict = async () => {
    if (!form.university || !form.course) {
      toast.error("University and course are required");
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const data = await predictAdmission(form);
      setResults(data);
      saveAssessmentResult("admission", form, data).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to predict admission");
    } finally {
      setLoading(false);
    }
  };

  const handleImproveSOP = () => {
    const msg = encodeURIComponent(
      `I'm applying to ${form.university} for ${form.course}. Can you help me improve my SOP? Here's what I have so far:\n\n${form.sop || "[paste your SOP here]"}`
    );
    router.push(`/chat?message=${msg}`);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-green-100 rounded-xl">
            <GraduationCap className="w-7 h-7 text-green-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Admission Predictor
            </h1>
            <p className="text-gray-600">
              Predict your chances and get actionable improvement tips
            </p>
          </div>
        </div>

        {/* Form */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Application Details</h2>
            {(profile?.greScore || profile?.gpa) && (
              <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Pre-filled from your profile
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="Target University"
              placeholder="e.g. Carnegie Mellon University"
              value={form.university}
              onChange={(e) => set("university", e.target.value)}
            />
            <Input
              label="Program / Course"
              placeholder="e.g. MS in Computer Science"
              value={form.course}
              onChange={(e) => set("course", e.target.value)}
            />
            <Slider
              label="GRE Score (260–340)"
              min={260}
              max={340}
              value={form.gre}
              onChange={(v) => set("gre", v)}
            />
            <Slider
              label="GMAT Score (200–800)"
              min={200}
              max={800}
              step={10}
              value={form.gmat}
              onChange={(v) => set("gmat", v)}
            />
            <Slider
              label="GPA / CGPA (0–10)"
              min={0}
              max={10}
              step={0.1}
              value={form.gpa}
              onChange={(v) => set("gpa", v)}
              formatValue={(v) => v.toFixed(1)}
            />
            <Slider
              label="Work Experience (years)"
              min={0}
              max={15}
              value={form.workExp}
              onChange={(v) => set("workExp", v)}
            />
            <Slider
              label="Publications / Research Papers"
              min={0}
              max={20}
              value={form.publications}
              onChange={(v) => set("publications", v)}
            />
            <Input
              label="Extra-Curricular Activities"
              placeholder="e.g. Hackathons, open source, clubs"
              value={form.extraCurricular}
              onChange={(e) => set("extraCurricular", e.target.value)}
            />
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Statement of Purpose (paste or summarize)
              </label>
              <textarea
                value={form.sop}
                onChange={(e) => set("sop", e.target.value)}
                placeholder="Paste your SOP here for a more accurate prediction…"
                rows={5}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none text-sm"
              />
            </div>
          </div>
          <div className="mt-6 flex gap-4">
            <Button
              variant="primary"
              size="lg"
              onClick={handlePredict}
              loading={loading}
            >
              Predict My Chances
            </Button>
            <Button variant="secondary" size="lg" onClick={handleImproveSOP}>
              <MessageSquare className="w-4 h-4 mr-2" />
              Improve my SOP
            </Button>
          </div>
        </Card>

        {/* Results */}
        <AnimatePresence mode="wait">
          {loading && (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center justify-center py-16"
            >
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-4" />
                <p className="text-gray-600">Analyzing your profile…</p>
              </div>
            </motion.div>
          )}

          {!loading && results && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {/* Circular progress + strength */}
              <Card padding="lg">
                <div className="flex flex-col md:flex-row items-center gap-8">
                  {/* Circular progress */}
                  <div className="relative flex items-center justify-center w-44 h-44 flex-shrink-0">
                    <CircularProgress
                      percentage={results.admissionChance ?? 0}
                    />
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">
                      {form.university}
                    </h3>
                    <p className="text-gray-600 mb-4">{form.course}</p>
                    <div className="flex items-center gap-3 justify-center md:justify-start">
                      <span className="text-sm text-gray-600">
                        Profile Strength:
                      </span>
                      <Badge
                        variant={strengthVariant(results.profileStrength)}
                      >
                        {results.profileStrength}
                      </Badge>
                    </div>

                    {/* Similar profiles */}
                    {results.similarProfiles?.length > 0 && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Similar Profiles:
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {results.similarProfiles.map(
                            (p: any, i: number) => (
                              <span
                                key={i}
                                className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-700"
                              >
                                {p.university} —{" "}
                                <span
                                  className={
                                    p.result?.toLowerCase().includes("admit")
                                      ? "text-green-600 font-medium"
                                      : "text-red-500 font-medium"
                                  }
                                >
                                  {p.result}
                                </span>
                              </span>
                            )
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </Card>

              {/* Strengths & Weaknesses */}
              <div className="grid md:grid-cols-2 gap-6">
                <Card padding="md">
                  <h3 className="text-lg font-bold text-green-700 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" /> Strengths
                  </h3>
                  <ul className="space-y-3">
                    {results.strengths?.map((s: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{s}</span>
                      </li>
                    ))}
                  </ul>
                </Card>

                <Card padding="md">
                  <h3 className="text-lg font-bold text-red-600 mb-4 flex items-center gap-2">
                    <XCircle className="w-5 h-5" /> Weaknesses
                  </h3>
                  <ul className="space-y-3">
                    {results.weaknesses?.map((w: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <XCircle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0" />
                        <span className="text-sm text-gray-700">{w}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>

              {/* Improvement Tips */}
              <Card padding="md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Action Plan
                </h3>
                <ol className="space-y-3">
                  {results.improvementTips?.map((tip: string, i: number) => (
                    <li key={i} className="flex items-start gap-4">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-purple-100 text-purple-700 font-bold text-sm flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="text-sm text-gray-700 pt-0.5">
                        {tip}
                      </span>
                    </li>
                  ))}
                </ol>

                <div className="mt-6 pt-4 border-t border-gray-100">
                  <Button variant="secondary" onClick={handleImproveSOP}>
                    <MessageSquare className="w-4 h-4 mr-2" />
                    Improve my SOP with Arya
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

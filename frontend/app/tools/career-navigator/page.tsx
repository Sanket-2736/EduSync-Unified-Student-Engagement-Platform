"use client";

import React, { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import { Compass, ChevronDown, X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/Slider";
import { useUserStore } from "@/store/userStore";
import { getCareerRecommendations, saveAssessmentResult } from "@/lib/api";

// ── Data ──────────────────────────────────────────────────────────────────────
const ALL_COUNTRIES = [
  { code: "USA",         flag: "🇺🇸", label: "USA" },
  { code: "UK",          flag: "🇬🇧", label: "UK" },
  { code: "Canada",      flag: "🇨🇦", label: "Canada" },
  { code: "Germany",     flag: "🇩🇪", label: "Germany" },
  { code: "Australia",   flag: "🇦🇺", label: "Australia" },
  { code: "Singapore",   flag: "🇸🇬", label: "Singapore" },
  { code: "France",      flag: "🇫🇷", label: "France" },
  { code: "Netherlands", flag: "🇳🇱", label: "Netherlands" },
  { code: "Ireland",     flag: "🇮🇪", label: "Ireland" },
  { code: "Sweden",      flag: "🇸🇪", label: "Sweden" },
  { code: "Switzerland", flag: "🇨🇭", label: "Switzerland" },
  { code: "New Zealand", flag: "🇳🇿", label: "New Zealand" },
  { code: "Japan",       flag: "🇯🇵", label: "Japan" },
  { code: "South Korea", flag: "🇰🇷", label: "South Korea" },
  { code: "UAE",         flag: "🇦🇪", label: "UAE" },
];

const ALL_FIELDS = [
  "Computer Science",
  "Data Science & AI",
  "Software Engineering",
  "Cybersecurity",
  "Cloud Computing",
  "MBA",
  "Finance & Accounting",
  "Marketing",
  "Business Analytics",
  "Entrepreneurship",
  "Mechanical Engineering",
  "Electrical Engineering",
  "Civil Engineering",
  "Aerospace Engineering",
  "Biomedical Engineering",
  "Medicine & Healthcare",
  "Public Health",
  "Pharmacy",
  "Law",
  "International Relations",
  "Architecture",
  "Design & UX",
  "Media & Communications",
  "Psychology",
  "Education",
];

const countryFlagMap: Record<string, string> = Object.fromEntries(
  ALL_COUNTRIES.map((c) => [c.code, c.flag])
);

// ── Custom Dropdown (single select) ──────────────────────────────────────────
function FieldSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = ALL_FIELDS.filter((f) =>
    f.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Field of Study
      </label>
      <button
        type="button"
        onClick={() => { setOpen(!open); setSearch(""); }}
        className="w-full flex items-center justify-between px-3 py-2.5 border border-gray-300 rounded-lg bg-white hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors"
      >
        <span className="text-gray-900 truncate">{value}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 flex-shrink-0 ml-2 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="p-2 border-b border-gray-100">
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search fields…"
                className="w-full px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-400"
              />
            </div>
            <div className="max-h-52 overflow-y-auto">
              {filtered.map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => { onChange(f); setOpen(false); }}
                  className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between hover:bg-purple-50 transition-colors ${
                    f === value ? "bg-purple-50 text-purple-700 font-medium" : "text-gray-700"
                  }`}
                >
                  {f}
                  {f === value && <Check className="w-3.5 h-3.5 text-purple-600" />}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="px-4 py-3 text-sm text-gray-400 text-center">No results</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Custom Multi-select (countries) ──────────────────────────────────────────
function CountryMultiSelect({
  selected,
  onChange,
}: {
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (code: string) => {
    onChange(
      selected.includes(code)
        ? selected.filter((c) => c !== code)
        : [...selected, code]
    );
  };

  return (
    <div ref={ref} className="relative">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Preferred Countries
      </label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full min-h-[42px] flex flex-wrap items-center gap-1.5 px-3 py-2 border border-gray-300 rounded-lg bg-white hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm transition-colors text-left"
      >
        {selected.length === 0 ? (
          <span className="text-gray-400">Select countries…</span>
        ) : (
          selected.map((code) => {
            const c = ALL_COUNTRIES.find((x) => x.code === code);
            return (
              <span
                key={code}
                className="inline-flex items-center gap-1 px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium"
              >
                {c?.flag} {code}
                <span
                  role="button"
                  onClick={(e) => { e.stopPropagation(); toggle(code); }}
                  className="ml-0.5 hover:text-purple-900 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </span>
              </span>
            );
          })
        )}
        <ChevronDown className={`w-4 h-4 text-gray-400 ml-auto flex-shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden"
          >
            <div className="max-h-56 overflow-y-auto p-2 grid grid-cols-2 gap-1">
              {ALL_COUNTRIES.map((c) => {
                const isSelected = selected.includes(c.code);
                return (
                  <button
                    key={c.code}
                    type="button"
                    onClick={() => toggle(c.code)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                      isSelected
                        ? "bg-purple-100 text-purple-700 font-medium"
                        : "hover:bg-gray-50 text-gray-700"
                    }`}
                  >
                    <span className="text-base">{c.flag}</span>
                    <span className="flex-1 text-left">{c.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-purple-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
            <div className="px-3 py-2 border-t border-gray-100 flex justify-between items-center">
              <span className="text-xs text-gray-500">{selected.length} selected</span>
              {selected.length > 0 && (
                <button
                  type="button"
                  onClick={() => onChange([])}
                  className="text-xs text-red-500 hover:text-red-700"
                >
                  Clear all
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Custom tooltip for chart ──────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-lg px-3 py-2 text-sm">
      <p className="font-semibold text-gray-900 mb-1">{label}</p>
      <p className="text-purple-600">Admission Chance: <strong>{payload[0]?.value}%</strong></p>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse">
      <div className="h-6 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded" />
        <div className="h-4 bg-gray-200 rounded w-5/6" />
        <div className="h-4 bg-gray-200 rounded w-4/6" />
      </div>
    </div>
  );
}

function visaDifficultyVariant(d: string): "success" | "warning" | "danger" | "info" {
  const v = d?.toLowerCase();
  if (v?.includes("easy") || v?.includes("low")) return "success";
  if (v?.includes("moderate") || v?.includes("medium")) return "warning";
  if (v?.includes("hard") || v?.includes("high")) return "danger";
  return "info";
}

function admissionChanceVariant(c: string): "success" | "warning" | "danger" | "info" {
  const v = c?.toLowerCase();
  if (v?.includes("high") || v?.includes("very high")) return "success";
  if (v?.includes("moderate") || v?.includes("medium")) return "warning";
  if (v?.includes("low")) return "danger";
  return "info";
}

// Shorten university name for chart axis — max 12 chars
function shortName(name: string): string {
  // Known abbreviations
  const abbrevs: Record<string, string> = {
    "Massachusetts Institute of Technology": "MIT",
    "Carnegie Mellon University": "CMU",
    "University of California": "UC",
    "Georgia Institute of Technology": "Georgia Tech",
    "University of Toronto": "U Toronto",
    "University of British Columbia": "UBC",
    "University of Waterloo": "Waterloo",
    "University of Melbourne": "U Melbourne",
    "National University of Singapore": "NUS",
    "Nanyang Technological University": "NTU",
    "Technical University of Munich": "TU Munich",
    "University of Edinburgh": "U Edinburgh",
    "Imperial College London": "Imperial",
    "University College London": "UCL",
  };
  for (const [full, abbr] of Object.entries(abbrevs)) {
    if (name.includes(full)) return abbr;
  }
  // Fallback: first word + first letter of second word if long
  const words = name.split(" ");
  if (name.length <= 12) return name;
  if (words[0] === "University" && words[1] === "of") return `U. ${words[2]}`;
  return words[0].length > 10 ? words[0].slice(0, 10) + "…" : words[0];
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function CareerNavigatorPage() {
  const [gre, setGre] = useState(310);
  const [gpa, setGpa] = useState(3.5);
  const [budget, setBudget] = useState(50000);
  const [field, setField] = useState("Computer Science");
  const [workExp, setWorkExp] = useState(1);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["USA", "Canada"]);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  const { user } = useUserStore();

  useEffect(() => {
    if (!user) return;
    const academics   = (user.profile as any)?.academics   || {};
    const preferences = (user.profile as any)?.preferences || {};
    const finances    = (user.profile as any)?.finances    || {};
    if (academics.greScore)                    setGre(academics.greScore);
    if (academics.gpa)                         setGpa(academics.gpa);
    if (finances.educationBudget)              setBudget(finances.educationBudget * 1000);
    if (preferences.targetField)               setField(preferences.targetField);
    if (preferences.preferredCountries?.length) setSelectedCountries(preferences.preferredCountries);
  }, [user]); // eslint-disable-line

  const handleSubmit = async () => {
    setLoading(true);
    setResults(null);
    try {
      const params = { gre, gpa, budget, field, workExp, preferredCountries: selectedCountries };
      const data = await getCareerRecommendations(params);
      setResults(data);
      saveAssessmentResult("career", params, data).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to get recommendations");
    } finally {
      setLoading(false);
    }
  };

  // Chart: use shortName for axis, full name in tooltip
  const chartData =
    results?.topUniversities?.slice(0, 6).map((u: any) => ({
      shortLabel: shortName(u.name || ""),
      fullName: u.name,
      chance: parseInt(u.admissionChance) || 50,
    })) ?? [];

  const barColors = ["#6C63FF", "#7C73FF", "#8C83FF", "#9C93FF", "#AC9FFF", "#BCB0FF"];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-purple-100 rounded-xl">
            <Compass className="w-7 h-7 text-purple-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Career Navigator</h1>
            <p className="text-gray-600">Get personalized university recommendations based on your profile</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-[380px_1fr] gap-8">
          {/* ── Left Panel ───────────────────────────────────────────────────── */}
          <Card padding="lg" className="h-fit sticky top-24">
            <h2 className="text-lg font-bold text-gray-900 mb-6">Your Profile</h2>
            <div className="space-y-5">
              <Slider label="GRE Score" min={260} max={340} value={gre} onChange={setGre} />
              <Slider
                label="GPA / CGPA" min={0} max={10} step={0.1}
                value={gpa} onChange={setGpa} formatValue={(v) => v.toFixed(1)}
              />
              <Slider
                label="Annual Budget (USD)" min={10000} max={100000} step={5000}
                value={budget} onChange={setBudget}
                formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
              />
              <Slider label="Work Experience (years)" min={0} max={10} value={workExp} onChange={setWorkExp} />

              <FieldSelect value={field} onChange={setField} />
              <CountryMultiSelect selected={selectedCountries} onChange={setSelectedCountries} />

              <Button variant="primary" className="w-full" onClick={handleSubmit} loading={loading}>
                Find My Best Path
              </Button>
            </div>
          </Card>

          {/* ── Right Panel ──────────────────────────────────────────────────── */}
          <div className="space-y-6">
            <AnimatePresence mode="wait">
              {loading && (
                <motion.div key="skeleton" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-6">
                  {[1, 2, 3].map((i) => <Card key={i} padding="md"><SkeletonCard /></Card>)}
                </motion.div>
              )}

              {!loading && !results && (
                <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="flex flex-col items-center justify-center py-24 text-center"
                >
                  <Compass className="w-16 h-16 text-gray-300 mb-4" />
                  <h3 className="text-xl font-semibold text-gray-500 mb-2">Ready to explore?</h3>
                  <p className="text-gray-400">Fill in your profile and click "Find My Best Path"</p>
                </motion.div>
              )}

              {!loading && results && (
                <motion.div key="results" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">

                  {/* Personalised message */}
                  {results.personalizedMessage && (
                    <Card padding="md" className="bg-gradient-to-r from-purple-50 to-teal-50 border-purple-200">
                      <p className="text-gray-800 leading-relaxed">💬 {results.personalizedMessage}</p>
                    </Card>
                  )}

                  {/* Top Countries */}
                  {results.topCountries?.length > 0 && (
                    <Card padding="md">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Top Countries for You</h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        {results.topCountries.slice(0, 3).map((c: any, i: number) => (
                          <div key={i} className="p-4 bg-gray-50 rounded-xl border border-gray-100">
                            <div className="text-3xl mb-2">{countryFlagMap[c.name] || "🌍"}</div>
                            <h4 className="font-semibold text-gray-900 mb-1">{c.name}</h4>
                            <p className="text-xs text-gray-600 mb-2 line-clamp-2">{c.reason}</p>
                            <p className="text-xs text-gray-500 mb-2">💰 {c.avgCost}</p>
                            <Badge variant={visaDifficultyVariant(c.visaDifficulty)}>
                              Visa: {c.visaDifficulty}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}

                  {/* University Table */}
                  {results.topUniversities?.length > 0 && (
                    <Card padding="md">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">University Recommendations</h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200">
                              <th className="text-left py-2 pr-4 text-gray-600 font-medium">University</th>
                              <th className="text-left py-2 pr-4 text-gray-600 font-medium">Country</th>
                              <th className="text-left py-2 pr-4 text-gray-600 font-medium">Rank</th>
                              <th className="text-left py-2 pr-4 text-gray-600 font-medium">Admission</th>
                              <th className="text-left py-2 text-gray-600 font-medium">Avg Package</th>
                            </tr>
                          </thead>
                          <tbody>
                            {results.topUniversities.map((u: any, i: number) => (
                              <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                                <td className="py-3 pr-4 font-medium text-gray-900">{u.name}</td>
                                <td className="py-3 pr-4 text-gray-600">
                                  {countryFlagMap[u.country] || ""} {u.country}
                                </td>
                                <td className="py-3 pr-4 text-gray-600">#{u.rank}</td>
                                <td className="py-3 pr-4">
                                  <Badge variant={admissionChanceVariant(u.admissionChance)}>
                                    {u.admissionChance}
                                  </Badge>
                                </td>
                                <td className="py-3 text-gray-600">{u.avgPackage}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </Card>
                  )}

                  {/* Bar Chart — fixed labels */}
                  {chartData.length > 0 && (
                    <Card padding="md">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Admission Chance by University</h3>
                      <ResponsiveContainer width="100%" height={260}>
                        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 60 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                          <XAxis
                            dataKey="shortLabel"
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            interval={0}
                            angle={-35}
                            textAnchor="end"
                            height={70}
                          />
                          <YAxis
                            tick={{ fontSize: 11, fill: "#6b7280" }}
                            domain={[0, 100]}
                            tickFormatter={(v) => `${v}%`}
                          />
                          <Tooltip content={<CustomTooltip />} />
                          <Bar dataKey="chance" name="Admission Chance %" radius={[6, 6, 0, 0]}>
                            {chartData.map((_: any, i: number) => (
                              <Cell key={i} fill={barColors[i % barColors.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </Card>
                  )}

                  {/* Recommended Courses */}
                  {results.recommendedCourses?.length > 0 && (
                    <Card padding="md">
                      <h3 className="text-lg font-bold text-gray-900 mb-4">Recommended Courses</h3>
                      <div className="flex flex-wrap gap-3">
                        {results.recommendedCourses.map((c: any, i: number) => (
                          <div key={i} className="px-4 py-2 bg-purple-50 border border-purple-200 rounded-full">
                            <span className="text-sm font-medium text-purple-700">{c.name}</span>
                            <span className="text-xs text-purple-500 ml-2">{c.duration}</span>
                          </div>
                        ))}
                      </div>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}

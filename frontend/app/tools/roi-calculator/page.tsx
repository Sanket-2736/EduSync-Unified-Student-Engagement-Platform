"use client";

import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Slider } from "@/components/ui/Slider";
import { useProfile } from "@/hooks/useProfile";
import { calculateROI, saveAssessmentResult } from "@/lib/api";

const countries = ["USA", "UK", "Canada", "Germany", "Australia", "Singapore"];

// Approximate average India salaries (USD/year) by field
const indiaSalaryByField: Record<string, number> = {
  "Computer Science": 12000,
  "Data Science": 14000,
  Engineering: 10000,
  MBA: 15000,
  Finance: 13000,
  Medicine: 11000,
  Law: 9000,
  Design: 8000,
};

function MetricCard({
  label,
  value,
  sub,
  color = "purple",
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  const colorMap: Record<string, string> = {
    purple: "from-purple-50 to-purple-100 text-purple-700",
    teal: "from-teal-50 to-teal-100 text-teal-700",
    amber: "from-amber-50 to-amber-100 text-amber-700",
  };
  return (
    <Card
      padding="md"
      className={`bg-gradient-to-br ${colorMap[color] || colorMap.purple}`}
    >
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className={`text-3xl font-bold ${colorMap[color]?.split(" ")[2]}`}>
        {value}
      </p>
      {sub && <p className="text-xs text-gray-500 mt-1">{sub}</p>}
    </Card>
  );
}

function verdictStyle(verdict: string) {
  const v = verdict?.toLowerCase();
  if (v?.includes("excellent") || v?.includes("great") || v?.includes("strong"))
    return "bg-green-50 border-green-200 text-green-800";
  if (v?.includes("good") || v?.includes("positive"))
    return "bg-teal-50 border-teal-200 text-teal-800";
  if (v?.includes("moderate") || v?.includes("average"))
    return "bg-amber-50 border-amber-200 text-amber-800";
  return "bg-red-50 border-red-200 text-red-800";
}

export default function ROICalculatorPage() {
  const profile = useProfile();

  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [loanAmount, setLoanAmount] = useState(40);
  const [country, setCountry] = useState("USA");
  const [fieldOfStudy, setFieldOfStudy] = useState("Computer Science");
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);

  // Pre-fill from profile — runs once when profile loads
  useEffect(() => {
    if (!profile) return;
    if (profile.targetField)        setFieldOfStudy(profile.targetField);
    if (profile.preferredCountries?.length) setCountry(profile.preferredCountries[0]);
    if (profile.educationBudget)    setLoanAmount(Math.min(Math.round(profile.educationBudget * 0.8), 80));
  }, [profile?.targetField, profile?.preferredCountries?.[0], profile?.educationBudget]); // eslint-disable-line

  const handleCalculate = async () => {
    if (!university || !course) {
      toast.error("Please enter university and course");
      return;
    }
    setLoading(true);
    setResults(null);
    try {
      const params = {
        university,
        course,
        loanAmount: loanAmount * 100000,
        country,
        fieldOfStudy,
      };
      const data = await calculateROI(params);
      setResults(data);
      saveAssessmentResult("roi", params, data).catch(() => {});
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to calculate ROI");
    } finally {
      setLoading(false);
    }
  };

  // Build comparison chart data
  const indiaSalary = indiaSalaryByField[fieldOfStudy] || 10000;
  const chartData =
    results?.salaryGrowthCurve?.map((point: any) => ({
      year: `Y${point.year}`,
      abroad: point.salary,
      india: Math.round(indiaSalary * Math.pow(1.1, point.year - 1)),
    })) ?? [];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-blue-100 rounded-xl">
            <TrendingUp className="w-7 h-7 text-blue-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">ROI Calculator</h1>
            <p className="text-gray-600">
              Calculate the return on your education investment
            </p>
          </div>
        </div>

        {/* Input Form */}
        <Card padding="lg" className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-gray-900">Education Details</h2>
            {profile?.targetField && (
              <span className="flex items-center gap-1.5 text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                Pre-filled from your profile
              </span>
            )}
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <Input
              label="University Name"
              placeholder="e.g. University of Toronto"
              value={university}
              onChange={(e) => setUniversity(e.target.value)}
            />
            <Input
              label="Course / Program"
              placeholder="e.g. MS Computer Science"
              value={course}
              onChange={(e) => setCourse(e.target.value)}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                {countries.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Field of Study
              </label>
              <select
                value={fieldOfStudy}
                onChange={(e) => setFieldOfStudy(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
              >
                {Object.keys(indiaSalaryByField).map((f) => (
                  <option key={f}>{f}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <Slider
                label="Education Loan Amount (₹ Lakhs)"
                min={5}
                max={80}
                step={5}
                value={loanAmount}
                onChange={setLoanAmount}
                formatValue={(v) => `₹${v}L`}
              />
            </div>
          </div>
          <div className="mt-6">
            <Button
              variant="primary"
              onClick={handleCalculate}
              loading={loading}
              size="lg"
            >
              Calculate ROI
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
                <p className="text-gray-600">Calculating your ROI…</p>
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
              {/* Metric Cards */}
              <div className="grid md:grid-cols-3 gap-4">
                <MetricCard
                  label="Year 1 Salary"
                  value={`$${results.avgSalaryYear1?.toLocaleString()}`}
                  sub="Expected first-year earnings"
                  color="purple"
                />
                <MetricCard
                  label="Year 5 Salary"
                  value={`$${results.avgSalaryYear5?.toLocaleString()}`}
                  sub="Projected 5-year earnings"
                  color="teal"
                />
                <MetricCard
                  label="Loan Payoff"
                  value={`${results.loanPayoffYears} yrs`}
                  sub="Estimated repayment period"
                  color="amber"
                />
              </div>

              {/* Verdict */}
              {results.verdict && (
                <Card
                  padding="md"
                  className={`border ${verdictStyle(results.verdict)}`}
                >
                  <h3 className="font-bold mb-2">ROI Verdict</h3>
                  <p className="leading-relaxed">{results.verdict}</p>
                  <div className="flex gap-6 mt-4 text-sm font-medium">
                    <span>5-Year ROI: {results.netROI5yr}%</span>
                    <span>10-Year ROI: {results.netROI10yr}%</span>
                  </div>
                </Card>
              )}

              {/* Salary Growth Chart */}
              {chartData.length > 0 && (
                <Card padding="md">
                  <h3 className="text-lg font-bold text-gray-900 mb-2">
                    10-Year Salary Projection
                  </h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Abroad vs staying in India ({fieldOfStudy})
                  </p>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                      <YAxis
                        tick={{ fontSize: 12 }}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                      />
                      <Tooltip
                        formatter={(v: number) => `$${v.toLocaleString()}`}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="abroad"
                        name="Abroad"
                        stroke="#6C63FF"
                        strokeWidth={2.5}
                        dot={{ r: 4 }}
                        activeDot={{ r: 6 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="india"
                        name="India (est.)"
                        stroke="#00C9A7"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </Card>
              )}

              {/* India Comparison */}
              <Card padding="md" className="bg-teal-50 border-teal-200">
                <h3 className="font-bold text-teal-800 mb-3">
                  vs Staying in India
                </h3>
                <div className="grid sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-gray-600">India Avg (Year 1)</p>
                    <p className="text-xl font-bold text-teal-700">
                      ${indiaSalary.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Abroad (Year 1)</p>
                    <p className="text-xl font-bold text-purple-700">
                      ${results.avgSalaryYear1?.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-gray-600">Salary Premium</p>
                    <p className="text-xl font-bold text-green-700">
                      {results.avgSalaryYear1
                        ? `${Math.round(
                            ((results.avgSalaryYear1 - indiaSalary) /
                              indiaSalary) *
                              100
                          )}%`
                        : "—"}
                    </p>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

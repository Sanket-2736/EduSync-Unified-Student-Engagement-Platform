"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Check, ChevronRight, Info, Printer, Banknote } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Slider } from "@/components/ui/Slider";
import { Input } from "@/components/ui/Input";
import { useUserStore } from "@/store/userStore";
import { checkLoanEligibility, getLoanRepaymentScenarios, saveAssessmentResult } from "@/lib/api";

// ── Stepper ──────────────────────────────────────────────────────────────────
function Stepper({ current }: { current: number }) {
  const steps = ["Eligibility Check", "Lender Comparison", "Repayment Planner"];
  return (
    <div className="flex items-center justify-center mb-10">
      {steps.map((label, i) => {
        const idx = i + 1;
        const done = idx < current;
        const active = idx === current;
        return (
          <React.Fragment key={idx}>
            <div className="flex flex-col items-center gap-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm transition-colors ${
                  done
                    ? "bg-green-500 text-white"
                    : active
                    ? "bg-purple-600 text-white"
                    : "bg-gray-200 text-gray-500"
                }`}
              >
                {done ? <Check className="w-4 h-4" /> : idx}
              </div>
              <span
                className={`text-xs font-medium hidden sm:block ${
                  active ? "text-purple-600" : "text-gray-500"
                }`}
              >
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div
                className={`flex-1 h-0.5 mx-2 mb-4 transition-colors ${
                  done ? "bg-green-400" : "bg-gray-200"
                }`}
              />
            )}
          </React.Fragment>
        );
      })}
    </div>
  );
}

// ── Approval chance badge ────────────────────────────────────────────────────
function approvalVariant(chance: string): "success" | "warning" | "danger" | "info" {
  const c = chance?.toLowerCase();
  if (c?.includes("very high") || c?.includes("high")) return "success";
  if (c?.includes("moderate")) return "warning";
  if (c?.includes("low")) return "danger";
  return "info";
}

// ── Lender initial circle ────────────────────────────────────────────────────
const lenderColors: Record<string, string> = {
  SBI: "bg-blue-600",
  HDFC: "bg-red-600",
  ICICI: "bg-orange-500",
  Avanse: "bg-teal-600",
  Auxilo: "bg-purple-600",
};
function LenderCircle({ name }: { name: string }) {
  const key = Object.keys(lenderColors).find((k) =>
    name?.toUpperCase().includes(k)
  );
  return (
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ${
        key ? lenderColors[key] : "bg-gray-500"
      }`}
    >
      {name?.slice(0, 2).toUpperCase()}
    </div>
  );
}

// ── Step 1 ───────────────────────────────────────────────────────────────────
function Step1({
  onNext,
}: {
  onNext: (eligibility: any, inputs: any) => void;
}) {
  const [course, setCourse] = useState("");
  const [university, setUniversity] = useState("");
  const [country, setCountry] = useState("USA");
  const [loanAmount, setLoanAmount] = useState(40);
  const [familyIncome, setFamilyIncome] = useState(10);
  const [hasCollateral, setHasCollateral] = useState(false);
  const [coApplicantIncome, setCoApplicantIncome] = useState(5);
  const [cibilScore, setCibilScore] = useState(700);
  const [loading, setLoading] = useState(false);

  const { user } = useUserStore();

  // Pre-fill from Zustand store (nested profile schema)
  useEffect(() => {
    if (!user) return;
    const preferences = (user.profile as any)?.preferences || {};
    const finances = (user.profile as any)?.finances || {};

    if (preferences.targetField) setCourse(preferences.targetField);
    if (finances.hasCollateral !== undefined) setHasCollateral(finances.hasCollateral);
    if (finances.familyIncome) setFamilyIncome(finances.familyIncome);
    if (finances.educationBudget) setLoanAmount(Math.min(Math.round(finances.educationBudget * 0.8), 80));
  }, [user]);

  const handleCheck = async () => {
    if (!course || !university) {
      toast.error("Please enter course and university");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        course,
        university,
        country,
        loanAmount: loanAmount * 100000,
        familyIncome: familyIncome * 100000,
        hasCollateral,
        coApplicantIncome: coApplicantIncome * 100000,
        cibilScore,
      };
      const data = await checkLoanEligibility(payload);
      // Save result for revisiting (fire-and-forget)
      saveAssessmentResult("loan", payload, data).catch(() => {});
      onNext(data, payload);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to check eligibility");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="lg">
      <h2 className="text-xl font-bold text-gray-900 mb-6">
        Loan Eligibility Check
      </h2>
      <div className="grid md:grid-cols-2 gap-6">
        <Input
          label="Course / Program"
          placeholder="e.g. MS Computer Science"
          value={course}
          onChange={(e) => setCourse(e.target.value)}
        />
        <Input
          label="University"
          placeholder="e.g. University of Toronto"
          value={university}
          onChange={(e) => setUniversity(e.target.value)}
        />
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Country
          </label>
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-sm"
          >
            {["USA", "UK", "Canada", "Germany", "Australia", "Singapore"].map(
              (c) => <option key={c}>{c}</option>
            )}
          </select>
        </div>
        <Slider
          label="Loan Amount Needed (₹ Lakhs)"
          min={5}
          max={80}
          step={5}
          value={loanAmount}
          onChange={setLoanAmount}
          formatValue={(v) => `₹${v}L`}
        />
        <Slider
          label="Annual Family Income (₹ Lakhs)"
          min={2}
          max={50}
          step={1}
          value={familyIncome}
          onChange={setFamilyIncome}
          formatValue={(v) => `₹${v}L`}
        />
        <Slider
          label="Co-Applicant Annual Income (₹ Lakhs)"
          min={0}
          max={30}
          step={1}
          value={coApplicantIncome}
          onChange={setCoApplicantIncome}
          formatValue={(v) => `₹${v}L`}
        />
        <Slider
          label="CIBIL Score"
          min={300}
          max={900}
          step={10}
          value={cibilScore}
          onChange={setCibilScore}
        />
        <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer">
            <div
              onClick={() => setHasCollateral(!hasCollateral)}
              className={`w-12 h-6 rounded-full transition-colors cursor-pointer ${
                hasCollateral ? "bg-purple-600" : "bg-gray-300"
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full shadow mt-0.5 transition-transform ${
                  hasCollateral ? "translate-x-6" : "translate-x-0.5"
                }`}
              />
            </div>
            <span className="text-sm font-medium text-gray-700">
              Has Collateral
            </span>
          </label>
        </div>
      </div>
      <div className="mt-8">
        <Button
          variant="primary"
          size="lg"
          onClick={handleCheck}
          loading={loading}
        >
          {loading ? "Analyzing with 5+ NBFCs..." : "Check My Eligibility"}
        </Button>
      </div>
    </Card>
  );
}

// ── Step 2 ───────────────────────────────────────────────────────────────────
function Step2({
  eligibility,
  onNext,
  onBack,
}: {
  eligibility: any;
  onNext: (lender: any) => void;
  onBack: () => void;
}) {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  const toggleDoc = (doc: string) =>
    setCheckedDocs((prev) => ({ ...prev, [doc]: !prev[doc] }));

  return (
    <div className="space-y-6">
      {/* Summary bar */}
      <Card padding="md" className="bg-gradient-to-r from-green-50 to-teal-50 border-green-200">
        <div className="flex flex-wrap gap-6 items-center">
          <div>
            <p className="text-xs text-gray-600 mb-1">Eligible Amount</p>
            <p className="text-2xl font-bold text-green-700">
              ₹{((eligibility.eligibleAmount || 0) / 100000).toFixed(0)}L
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Interest Rate</p>
            <p className="text-2xl font-bold text-purple-700">
              {eligibility.estimatedInterestRate}%
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">EMI Estimate</p>
            <p className="text-2xl font-bold text-blue-700">
              ₹{(eligibility.emiEstimate || 0).toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-600 mb-1">Approval Chance</p>
            <Badge variant={approvalVariant(eligibility.approvalChance)}>
              {eligibility.approvalChance}
            </Badge>
          </div>
        </div>
      </Card>

      {/* Lender cards */}
      <Card padding="md">
        <h3 className="text-lg font-bold text-gray-900 mb-4">
          Top Lenders for You
        </h3>
        <div className="space-y-4">
          {eligibility.topLenders?.map((lender: any, i: number) => (
            <div
              key={i}
              className="p-4 border border-gray-200 rounded-xl hover:border-purple-300 transition-colors"
            >
              <div className="flex items-start gap-4">
                <LenderCircle name={lender.name} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                    <h4 className="font-semibold text-gray-900">{lender.name}</h4>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        toast.success(`Redirecting to ${lender.name} portal...`)
                      }
                    >
                      Apply with {lender.name.split(" ")[0]}
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-3">
                    <span>
                      📊 <strong>{lender.interestRate}%</strong> p.a.
                    </span>
                    <span>
                      💰 Max ₹{((lender.maxAmount || 0) / 100000).toFixed(0)}L
                    </span>
                    <span>
                      🏷️ {lender.processingFee}% processing fee
                    </span>
                  </div>
                  <div className="grid sm:grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs font-semibold text-green-700 mb-1">
                        Pros
                      </p>
                      <ul className="space-y-1">
                        {lender.pros?.map((p: string, j: number) => (
                          <li key={j} className="text-xs text-gray-600 flex gap-1">
                            <span className="text-green-500">✓</span> {p}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-red-600 mb-1">
                        Cons
                      </p>
                      <ul className="space-y-1">
                        {lender.cons?.map((c: string, j: number) => (
                          <li key={j} className="text-xs text-gray-600 flex gap-1">
                            <span className="text-red-400">✗</span> {c}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Required documents */}
      {eligibility.requiredDocuments?.length > 0 && (
        <Card padding="md">
          <h3 className="text-lg font-bold text-gray-900 mb-4">
            Required Documents
          </h3>
          <div className="grid sm:grid-cols-2 gap-2">
            {eligibility.requiredDocuments.map((doc: string, i: number) => (
              <label
                key={i}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!checkedDocs[doc]}
                  onChange={() => toggleDoc(doc)}
                  className="w-4 h-4 rounded border-gray-300 text-purple-600"
                />
                <span
                  className={`text-sm ${
                    checkedDocs[doc]
                      ? "line-through text-gray-400"
                      : "text-gray-700"
                  }`}
                >
                  {doc}
                </span>
              </label>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-3">
            {Object.values(checkedDocs).filter(Boolean).length} /{" "}
            {eligibility.requiredDocuments.length} documents ready
          </p>
        </Card>
      )}

      {/* Tips */}
      {eligibility.tips?.length > 0 && (
        <Card padding="md" className="bg-amber-50 border-amber-200">
          <h3 className="font-bold text-amber-800 mb-3 flex items-center gap-2">
            <Info className="w-4 h-4" /> Expert Tips
          </h3>
          <ul className="space-y-2">
            {eligibility.tips.map((tip: string, i: number) => (
              <li key={i} className="text-sm text-amber-900 flex gap-2">
                <span className="text-amber-500 font-bold">{i + 1}.</span>
                {tip}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex gap-4">
        <Button variant="ghost" onClick={onBack}>
          ← Back
        </Button>
        <Button
          variant="primary"
          onClick={() => onNext(eligibility.topLenders?.[0])}
        >
          Plan Repayment →
        </Button>
      </div>
    </div>
  );
}

// ── Step 3 ───────────────────────────────────────────────────────────────────
function Step3({
  selectedLender,
  eligibility,
  onBack,
}: {
  selectedLender: any;
  eligibility: any;
  onBack: () => void;
}) {
  const [loanAmount, setLoanAmount] = useState(
    Math.round((eligibility?.recommendedLoanAmount || 4000000) / 100000)
  );
  const [interestRate, setInterestRate] = useState(
    selectedLender?.interestRate || eligibility?.estimatedInterestRate || 10.5
  );
  const [tenure, setTenure] = useState(10);
  const [expectedSalary, setExpectedSalary] = useState(80000);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const handlePlan = async () => {
    setLoading(true);
    setResults(null);
    try {
      const data = await getLoanRepaymentScenarios({
        loanAmount: loanAmount * 100000,
        interestRate,
        tenure,
        expectedSalary,
      });
      setResults(data);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || "Failed to plan repayment");
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => window.print();

  // Chart data from repayment timeline
  const chartData =
    results?.repaymentTimeline?.map((pt: any) => ({
      month: `M${pt.month}`,
      balance: Math.round(pt.balance),
    })) ?? [];

  const scenarioColors = [
    "border-gray-200",
    "border-purple-500 ring-2 ring-purple-200",
    "border-gray-200",
  ];

  return (
    <div className="space-y-6">
      {/* Inputs */}
      <Card padding="lg">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Repayment Planner
        </h2>
        <div className="grid md:grid-cols-2 gap-6">
          <Slider
            label="Confirmed Loan Amount (₹ Lakhs)"
            min={5}
            max={80}
            step={5}
            value={loanAmount}
            onChange={setLoanAmount}
            formatValue={(v) => `₹${v}L`}
          />
          <Slider
            label="Interest Rate (% p.a.)"
            min={7}
            max={18}
            step={0.25}
            value={interestRate}
            onChange={setInterestRate}
            formatValue={(v) => `${v}%`}
          />
          <Slider
            label="Loan Tenure (years)"
            min={5}
            max={15}
            step={1}
            value={tenure}
            onChange={setTenure}
            formatValue={(v) => `${v} yrs`}
          />
          <Slider
            label="Expected First Salary (USD/year)"
            min={30000}
            max={200000}
            step={5000}
            value={expectedSalary}
            onChange={setExpectedSalary}
            formatValue={(v) => `$${(v / 1000).toFixed(0)}k`}
          />
        </div>
        <div className="mt-6 flex gap-4">
          <Button variant="ghost" onClick={onBack}>
            ← Back
          </Button>
          <Button
            variant="primary"
            size="lg"
            onClick={handlePlan}
            loading={loading}
          >
            Plan Repayment
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
            className="flex items-center justify-center py-12"
          >
            <div className="text-center">
              <div className="w-10 h-10 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Building your repayment plan…</p>
            </div>
          </motion.div>
        )}

        {!loading && results && (
          <motion.div
            key="results"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
            ref={printRef}
          >
            {/* Recommendation */}
            {results.recommendation && (
              <Card padding="md" className="bg-purple-50 border-purple-200">
                <p className="text-purple-800 leading-relaxed">
                  💡 {results.recommendation}
                </p>
              </Card>
            )}

            {/* Scenario cards */}
            <div className="grid md:grid-cols-3 gap-4">
              {results.scenarios?.map((s: any, i: number) => (
                <div
                  key={i}
                  className={`p-5 bg-white rounded-2xl border-2 ${scenarioColors[i] || "border-gray-200"}`}
                >
                  {i === 1 && (
                    <Badge variant="info" className="mb-3">
                      Recommended
                    </Badge>
                  )}
                  <h4 className="font-bold text-gray-900 mb-3">{s.name}</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Monthly EMI</span>
                      <span className="font-semibold text-gray-900">
                        ₹{(s.emiAmount || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Interest</span>
                      <span className="font-semibold text-red-600">
                        ₹{(s.totalInterest || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Payment</span>
                      <span className="font-semibold text-gray-900">
                        ₹{(s.totalPayment || 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payoff</span>
                      <span className="font-semibold text-purple-700">
                        {s.payoffMonths} months
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Area chart */}
            {chartData.length > 0 && (
              <Card padding="md">
                <h3 className="text-lg font-bold text-gray-900 mb-4">
                  Outstanding Balance Over Time
                </h3>
                <ResponsiveContainer width="100%" height={240}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6C63FF" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#6C63FF" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} interval={2} />
                    <YAxis
                      tick={{ fontSize: 11 }}
                      tickFormatter={(v) => `₹${(v / 100000).toFixed(0)}L`}
                    />
                    <Tooltip
                      formatter={(v: number) =>
                        `₹${v.toLocaleString()}`
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="balance"
                      name="Outstanding Balance"
                      stroke="#6C63FF"
                      strokeWidth={2}
                      fill="url(#balanceGrad)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
            )}

            {/* Actions */}
            <div className="flex flex-wrap gap-4">
              <Button variant="secondary" onClick={handlePrint}>
                <Printer className="w-4 h-4 mr-2" />
                Download Plan as PDF
              </Button>
              <Link href="/loan/apply">
                <Button variant="primary">
                  Proceed to Application →
                </Button>
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function LoanPage() {
  const [step, setStep] = useState(1);
  const [eligibility, setEligibility] = useState<any>(null);
  const [selectedLender, setSelectedLender] = useState<any>(null);

  const handleStep1Done = (data: any, _inputs: any) => {
    setEligibility(data);
    setStep(2);
  };

  const handleStep2Done = (lender: any) => {
    setSelectedLender(lender);
    setStep(3);
  };

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="p-3 bg-amber-100 rounded-xl">
            <Banknote className="w-7 h-7 text-amber-600" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Loan Advisor</h1>
            <p className="text-gray-600">
              Find the best education loan and plan your repayment
            </p>
          </div>
        </div>

        <Stepper current={step} />

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
          >
            {step === 1 && <Step1 onNext={handleStep1Done} />}
            {step === 2 && eligibility && (
              <Step2
                eligibility={eligibility}
                onNext={handleStep2Done}
                onBack={() => setStep(1)}
              />
            )}
            {step === 3 && (
              <Step3
                selectedLender={selectedLender}
                eligibility={eligibility}
                onBack={() => setStep(2)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

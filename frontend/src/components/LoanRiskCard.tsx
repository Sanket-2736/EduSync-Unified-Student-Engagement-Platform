"use client";

import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, CheckCircle, Info, RefreshCw } from "lucide-react";
import { Card } from "./ui/Card";
import { getLoanRiskScore, type LoanRiskResult } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

function RiskMeter({ score }: { score: number }) {
  const color =
    score >= 60 ? "bg-red-500"    :
    score >= 35 ? "bg-amber-500"  :
    "bg-green-500";

  const label =
    score >= 60 ? "High Risk"     :
    score >= 35 ? "Moderate Risk" :
    "Low Risk";

  const labelColor =
    score >= 60 ? "text-red-600"    :
    score >= 35 ? "text-amber-600"  :
    "text-green-600";

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Loan Risk</span>
        <span className={`text-xs font-bold ${labelColor}`}>{label}</span>
      </div>
      <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ duration: 1, ease: "easeOut" }}
        />
      </div>
      <div className="flex justify-between text-xs text-gray-400">
        <span>Safe</span>
        <span>Moderate</span>
        <span>High</span>
      </div>
    </div>
  );
}

function MetricRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-gray-50 last:border-0">
      <span className="text-xs text-gray-500">{label}</span>
      <span className={`text-xs font-semibold ${highlight ? "text-red-600" : "text-gray-800"}`}>
        {value}
      </span>
    </div>
  );
}

export function LoanRiskCard() {
  const { user } = useUserStore();
  const [risk, setRisk] = useState<LoanRiskResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  const fetchRisk = async () => {
    if (!user) return;
    const finances    = (user.profile as any)?.finances    ?? {};
    const preferences = (user.profile as any)?.preferences ?? {};
    const academics   = (user.profile as any)?.academics   ?? {};

    const loanAmountUSD = (finances.educationBudget ?? 0) * 1000;
    if (!loanAmountUSD) return; // no budget set yet

    setLoading(true);
    setError(false);
    try {
      const result = await getLoanRiskScore({
        loanAmountUSD,
        familyIncomeINR: finances.familyIncome ?? 0,
        hasCollateral:   finances.hasCollateral ?? false,
        targetCountries: preferences.preferredCountries ?? [],
        targetField:     preferences.targetField ?? "",
        gpa:             academics.gpa ?? 0,
        greScore:        academics.greScore ?? 0,
      });
      setRisk(result);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRisk();
  }, [user?._id]); // eslint-disable-line

  const finances = (user?.profile as any)?.finances ?? {};
  const hasBudget = (finances.educationBudget ?? 0) > 0;

  if (!hasBudget) {
    return (
      <Card padding="md" className="h-full">
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-900">Loan Risk Score</h3>
        </div>
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-3">
            Complete your financial profile to see your loan risk assessment.
          </p>
          <a href="/onboard" className="text-xs text-purple-600 hover:underline">
            Complete profile →
          </a>
        </div>
      </Card>
    );
  }

  return (
    <Card padding="md" className="h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-amber-500" />
          <h3 className="font-bold text-gray-900">Loan Risk Score</h3>
        </div>
        <button
          onClick={fetchRisk}
          disabled={loading}
          className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors disabled:opacity-40"
          title="Refresh"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
        </button>
      </div>

      {loading && !risk && (
        <div className="flex flex-col items-center justify-center py-8 gap-3">
          <div className="w-8 h-8 border-2 border-amber-200 border-t-amber-500 rounded-full animate-spin" />
          <p className="text-xs text-gray-500">Analysing loan risk…</p>
        </div>
      )}

      {error && (
        <div className="text-center py-6">
          <p className="text-sm text-gray-500 mb-3">Could not load risk score</p>
          <button onClick={fetchRisk} className="text-xs text-purple-600 hover:underline">Try again</button>
        </div>
      )}

      {risk && (
        <div className="space-y-4">
          {/* Risk meter */}
          <RiskMeter score={risk.riskScore} />

          {/* Key metrics */}
          <div className="bg-gray-50 rounded-xl p-3 space-y-0">
            <MetricRow
              label="Loan-to-Salary Ratio"
              value={`${risk.loanToSalaryRatio}x (safe: ${risk.safeThreshold}x)`}
              highlight={risk.isAboveThreshold}
            />
            <MetricRow
              label="Est. First-Year Salary"
              value={`$${risk.estimatedSalaryUSD.toLocaleString()}`}
            />
            <MetricRow
              label="Monthly EMI"
              value={`₹${risk.estimatedMonthlyEMI.toLocaleString()}`}
              highlight={risk.emiToIncomeRatio > 30}
            />
            <MetricRow
              label="EMI / Monthly Salary"
              value={`${risk.emiToIncomeRatio}%`}
              highlight={risk.emiToIncomeRatio > 30}
            />
            <MetricRow
              label="Post-Study Work Rights"
              value={`${risk.postStudyWorkYears} yrs (${risk.bestCountry})`}
            />
          </div>

          {/* Warnings */}
          {risk.warnings.length > 0 && (
            <div className="space-y-2">
              {risk.warnings.map((w, i) => (
                <div key={i} className="flex gap-2 p-2.5 bg-red-50 border border-red-200 rounded-lg">
                  <AlertTriangle className="w-3.5 h-3.5 text-red-500 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-red-700 leading-relaxed">{w}</p>
                </div>
              ))}
            </div>
          )}

          {risk.warnings.length === 0 && (
            <div className="flex gap-2 p-2.5 bg-green-50 border border-green-200 rounded-lg">
              <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-green-700">Your loan profile looks healthy. Repayment should be manageable.</p>
            </div>
          )}

          {/* LLM explanation */}
          {risk.explanation && (
            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <Info className="w-3.5 h-3.5 text-gray-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-gray-600 leading-relaxed">{risk.explanation}</p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}

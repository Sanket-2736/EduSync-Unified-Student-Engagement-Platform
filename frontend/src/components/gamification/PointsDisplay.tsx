"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Star, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface PointsAction {
  label: string;
  points: number;
  timestamp: number;
}

interface PointsDisplayProps {
  points: number;
  recentActions?: PointsAction[];
}

// ── Level definitions ────────────────────────────────────────────────────────
const LEVELS = [
  { name: "Explorer", min: 0, max: 499, color: "text-gray-600", bg: "bg-gray-100" },
  { name: "Pathfinder", min: 500, max: 1999, color: "text-blue-600", bg: "bg-blue-100" },
  { name: "Scholar", min: 2000, max: 4999, color: "text-purple-600", bg: "bg-purple-100" },
  { name: "Ambassador", min: 5000, max: Infinity, color: "text-amber-600", bg: "bg-amber-100" },
];

function getLevel(points: number) {
  return LEVELS.find((l) => points >= l.min && points <= l.max) ?? LEVELS[0];
}

function getLevelProgress(points: number) {
  const level = getLevel(points);
  if (level.max === Infinity) return 100;
  return Math.round(((points - level.min) / (level.max - level.min + 1)) * 100);
}

// ── Animated counter ─────────────────────────────────────────────────────────
function AnimatedCounter({ target }: { target: number }) {
  const [display, setDisplay] = useState(0);
  const rafRef = useRef<number | null>(null);
  const startRef = useRef<number | null>(null);
  const startValRef = useRef(0);
  const DURATION = 1200;

  useEffect(() => {
    startValRef.current = display;
    startRef.current = null;

    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const elapsed = ts - startRef.current;
      const progress = Math.min(elapsed / DURATION, 1);
      // Ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startValRef.current + (target - startValRef.current) * eased));
      if (progress < 1) rafRef.current = requestAnimationFrame(animate);
    };

    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return <span>{display.toLocaleString()}</span>;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function PointsDisplay({ points, recentActions = [] }: PointsDisplayProps) {
  const level = getLevel(points);
  const nextLevel = LEVELS[LEVELS.indexOf(level) + 1];
  const progress = getLevelProgress(points);
  const pointsToNext = nextLevel ? nextLevel.min - points : 0;

  return (
    <Card padding="md" className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Points</h3>
        <Star className="w-5 h-5 text-yellow-500" />
      </div>

      {/* Points counter */}
      <div className="flex items-end gap-2 mb-1">
        <span className="text-5xl font-black text-yellow-500 leading-none">
          <AnimatedCounter target={points} />
        </span>
        <span className="text-gray-500 text-sm mb-1">pts</span>
      </div>

      {/* Level badge */}
      <div className="flex items-center gap-2 mb-4">
        <span
          className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${level.bg} ${level.color}`}
        >
          <TrendingUp className="w-3.5 h-3.5" />
          {level.name}
        </span>
        {nextLevel && (
          <span className="text-xs text-gray-500">
            {pointsToNext} pts to {nextLevel.name}
          </span>
        )}
      </div>

      {/* Level progress bar */}
      <div className="mb-5">
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{level.name} ({level.min})</span>
          {nextLevel && <span>{nextLevel.name} ({nextLevel.min})</span>}
        </div>
      </div>

      {/* Recent actions */}
      {recentActions.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Recent Earnings
          </p>
          <div className="space-y-2">
            {recentActions.slice(0, 3).map((action, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center justify-between text-sm"
              >
                <span className="text-gray-600">{action.label}</span>
                <span className="font-semibold text-green-600">
                  +{action.points}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* All levels legend */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">
          Levels
        </p>
        <div className="grid grid-cols-2 gap-1">
          {LEVELS.map((l) => (
            <div
              key={l.name}
              className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${
                l.name === level.name
                  ? `${l.bg} ${l.color} font-semibold`
                  : "text-gray-400"
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  l.name === level.name ? "bg-current" : "bg-gray-300"
                }`}
              />
              {l.name}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

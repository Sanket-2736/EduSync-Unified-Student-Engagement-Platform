"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";

interface BadgeDef {
  id: string;
  label: string;
  emoji: string;
  hint: string;
  description: string;
}

const ALL_BADGES: BadgeDef[] = [
  {
    id: "First Step",
    label: "First Step",
    emoji: "👣",
    hint: "Create your account",
    description: "Awarded for joining StudyAI",
  },
  {
    id: "First Chat",
    label: "First Chat",
    emoji: "💬",
    hint: "Send your first message to Arya",
    description: "Started a conversation with Arya",
  },
  {
    id: "ROI Explorer",
    label: "ROI Explorer",
    emoji: "📈",
    hint: "Use the ROI Calculator",
    description: "Calculated education return on investment",
  },
  {
    id: "Dream University",
    label: "Dream University",
    emoji: "🎓",
    hint: "Run the Admission Predictor",
    description: "Predicted admission chances for a university",
  },
  {
    id: "Loan Ready",
    label: "Loan Ready",
    emoji: "🏦",
    hint: "Complete loan eligibility check",
    description: "Checked education loan eligibility",
  },
  {
    id: "Week Warrior",
    label: "Week Warrior",
    emoji: "🔥",
    hint: "Maintain a 7-day streak",
    description: "Logged in for 7 consecutive days",
  },
  {
    id: "Profile Complete",
    label: "Profile Complete",
    emoji: "✅",
    hint: "Fill all profile fields",
    description: "Completed your full student profile",
  },
  {
    id: "Navigator",
    label: "Navigator",
    emoji: "🧭",
    hint: "Use the Career Navigator",
    description: "Explored university recommendations",
  },
];

interface BadgeCollectionProps {
  earnedBadges: string[];
}

function BadgeTile({ badge, earned }: { badge: BadgeDef; earned: boolean }) {
  const [showTooltip, setShowTooltip] = useState(false);

  return (
    <div className="relative flex flex-col items-center gap-2">
      <motion.button
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
        className={`w-16 h-16 rounded-2xl flex items-center justify-center text-3xl transition-all border-2 ${
          earned
            ? "bg-gradient-to-br from-purple-100 to-teal-100 border-purple-300 shadow-md"
            : "bg-gray-100 border-gray-200 grayscale opacity-50"
        }`}
        aria-label={earned ? badge.label : `Locked: ${badge.hint}`}
      >
        {earned ? badge.emoji : "?"}
      </motion.button>

      <span
        className={`text-xs font-medium text-center leading-tight ${
          earned ? "text-gray-800" : "text-gray-400"
        }`}
      >
        {earned ? badge.label : "Locked"}
      </span>

      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 4 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 z-20 w-44 p-2.5 bg-gray-900 text-white text-xs rounded-lg shadow-xl text-center leading-relaxed pointer-events-none"
          >
            <p className="font-semibold mb-0.5">
              {earned ? badge.label : "🔒 Locked"}
            </p>
            <p className="opacity-80">
              {earned ? badge.description : badge.hint}
            </p>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45 -mt-1" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function BadgeCollection({ earnedBadges }: BadgeCollectionProps) {
  const earnedSet = new Set(earnedBadges);
  const earnedCount = ALL_BADGES.filter((b) => earnedSet.has(b.id)).length;

  return (
    <Card padding="md" className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Badges</h3>
        <span className="text-sm text-gray-500">
          {earnedCount} / {ALL_BADGES.length}
        </span>
      </div>

      {/* Progress */}
      <div className="mb-5">
        <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-purple-500 to-teal-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${(earnedCount / ALL_BADGES.length) * 100}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* Badge grid */}
      <div className="grid grid-cols-4 gap-4">
        {ALL_BADGES.map((badge) => (
          <BadgeTile
            key={badge.id}
            badge={badge}
            earned={earnedSet.has(badge.id)}
          />
        ))}
      </div>

      {earnedCount === ALL_BADGES.length && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-4 p-3 bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-xl text-center text-sm font-semibold text-purple-700"
        >
          🏆 All badges collected! You're a StudyAI Champion!
        </motion.div>
      )}
    </Card>
  );
}

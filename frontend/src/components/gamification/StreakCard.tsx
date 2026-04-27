"use client";

import React from "react";
import { motion } from "framer-motion";
import { Flame } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface StreakCardProps {
  streak: number;
  /** ISO date strings of the last 7 login days */
  recentLoginDates?: string[];
}

const MILESTONES = [7, 30, 100];

function getNextMilestone(streak: number) {
  return MILESTONES.find((m) => m > streak) ?? MILESTONES[MILESTONES.length - 1];
}

function getMilestoneProgress(streak: number) {
  const prev = MILESTONES.filter((m) => m <= streak).at(-1) ?? 0;
  const next = getNextMilestone(streak);
  if (streak >= next) return 100;
  return Math.round(((streak - prev) / (next - prev)) * 100);
}

function getEncouragement(streak: number) {
  if (streak === 0) return "Log in daily to start your streak! 🚀";
  if (streak < 3) return "Great start! Keep it going! 💪";
  if (streak < 7) return "You're on fire! Almost at 7 days! 🔥";
  if (streak < 30) return "Week warrior! Aim for 30 days! 🏆";
  if (streak < 100) return "Incredible dedication! 100 days awaits! 🌟";
  return "Legend! You're unstoppable! 👑";
}

export function StreakCard({ streak, recentLoginDates = [] }: StreakCardProps) {
  const nextMilestone = getNextMilestone(streak);
  const progress = getMilestoneProgress(streak);
  const daysLeft = Math.max(nextMilestone - streak, 0);

  // Build last-7-days heatmap
  const today = new Date();
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(today.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const loginSet = new Set(
    recentLoginDates.map((d) => new Date(d).toISOString().slice(0, 10))
  );

  const dayLabels = ["S", "M", "T", "W", "T", "F", "S"];

  return (
    <Card padding="md" className="h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-gray-900">Daily Streak</h3>
        <motion.div
          animate={{ scale: streak > 0 ? [1, 1.2, 1] : 1 }}
          transition={{ duration: 0.6, repeat: streak > 0 ? Infinity : 0, repeatDelay: 2 }}
        >
          <Flame className="w-5 h-5 text-amber-500" />
        </motion.div>
      </div>

      {/* Streak count */}
      <div className="flex items-end gap-2 mb-1">
        <motion.span
          key={streak}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-5xl font-black text-amber-500 leading-none"
        >
          {streak}
        </motion.span>
        <span className="text-gray-500 text-sm mb-1">days</span>
      </div>

      <p className="text-sm text-gray-600 mb-4">{getEncouragement(streak)}</p>

      {/* Progress to next milestone */}
      <div className="mb-4">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>Next milestone: {nextMilestone} days</span>
          <span>{daysLeft} to go</span>
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
      </div>

      {/* 7-day heatmap */}
      <div>
        <p className="text-xs text-gray-500 mb-2">Last 7 days</p>
        <div className="flex gap-1.5">
          {last7.map((dateStr, i) => {
            const active = loginSet.has(dateStr);
            const isToday = dateStr === today.toISOString().slice(0, 10);
            const dayOfWeek = new Date(dateStr).getDay();
            return (
              <div key={dateStr} className="flex flex-col items-center gap-1">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: i * 0.05 }}
                  className={`w-7 h-7 rounded-md border-2 transition-colors ${
                    active
                      ? "bg-amber-400 border-amber-500"
                      : isToday
                      ? "bg-gray-100 border-purple-400 border-dashed"
                      : "bg-gray-100 border-gray-200"
                  }`}
                  title={dateStr}
                />
                <span className="text-xs text-gray-400">
                  {dayLabels[dayOfWeek]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </Card>
  );
}

import React from "react";
import { cn } from "@/lib/theme";

interface CardSkeletonProps {
  /** Number of text lines to render */
  lines?: number;
  showHeader?: boolean;
  showAvatar?: boolean;
  className?: string;
}

function Bone({ className }: { className?: string }) {
  return (
    <div className={cn("bg-gray-200 rounded animate-pulse", className)} />
  );
}

export function CardSkeleton({
  lines = 3,
  showHeader = true,
  showAvatar = false,
  className,
}: CardSkeletonProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-2xl border border-gray-100 shadow-sm p-6",
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center gap-3 mb-4">
          {showAvatar && <Bone className="w-10 h-10 rounded-full flex-shrink-0" />}
          <div className="flex-1 space-y-2">
            <Bone className="h-4 w-1/3" />
            {showAvatar && <Bone className="h-3 w-1/4" />}
          </div>
        </div>
      )}
      <div className="space-y-3">
        {Array.from({ length: lines }).map((_, i) => (
          <Bone
            key={i}
            className={cn(
              "h-3",
              i === lines - 1 ? "w-2/3" : i % 2 === 0 ? "w-full" : "w-5/6"
            )}
          />
        ))}
      </div>
    </div>
  );
}

/** A row of N metric cards */
export function MetricCardsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-1 md:grid-cols-${count} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 animate-pulse"
        >
          <Bone className="h-3 w-1/2 mb-3" />
          <Bone className="h-8 w-1/3 mb-2" />
          <Bone className="h-3 w-2/3" />
        </div>
      ))}
    </div>
  );
}

/** Full-page loading skeleton for tool pages */
export function ToolPageSkeleton() {
  return (
    <div className="min-h-screen py-8 px-4 animate-pulse">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <Bone className="w-14 h-14 rounded-xl" />
          <div className="space-y-2">
            <Bone className="h-6 w-48" />
            <Bone className="h-4 w-72" />
          </div>
        </div>
        {/* Form card */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">
          <Bone className="h-5 w-1/4 mb-2" />
          <div className="grid md:grid-cols-2 gap-5">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Bone className="h-3 w-1/3" />
                <Bone className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
          <Bone className="h-11 w-40 rounded-lg mt-2" />
        </div>
      </div>
    </div>
  );
}

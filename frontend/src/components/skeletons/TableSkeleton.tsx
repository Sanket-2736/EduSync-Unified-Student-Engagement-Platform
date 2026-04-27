import React from "react";
import { cn } from "@/lib/theme";

interface TableSkeletonProps {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
  className?: string;
}

function Bone({ className }: { className?: string }) {
  return <div className={cn("bg-gray-200 rounded animate-pulse", className)} />;
}

export function TableSkeleton({
  rows = 5,
  cols = 5,
  showHeader = true,
  className,
}: TableSkeletonProps) {
  // Vary column widths for a realistic look
  const colWidths = ["w-1/3", "w-1/5", "w-1/6", "w-1/5", "w-1/4"];

  return (
    <div className={cn("w-full overflow-x-auto", className)}>
      <table className="w-full">
        {showHeader && (
          <thead>
            <tr className="border-b border-gray-200">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="py-3 pr-4 text-left">
                  <Bone className={cn("h-3", colWidths[i % colWidths.length])} />
                </th>
              ))}
            </tr>
          </thead>
        )}
        <tbody>
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b border-gray-100">
              {Array.from({ length: cols }).map((_, colIdx) => (
                <td key={colIdx} className="py-3 pr-4">
                  <Bone
                    className={cn(
                      "h-3",
                      colIdx === 0
                        ? "w-2/3"
                        : colWidths[colIdx % colWidths.length]
                    )}
                  />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Results panel skeleton used in career navigator / admission predictor */
export function ResultsPanelSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Highlight card */}
      <div className="bg-purple-50 rounded-2xl border border-purple-100 p-5 space-y-3">
        <Bone className="h-4 w-3/4" />
        <Bone className="h-3 w-full" />
        <Bone className="h-3 w-5/6" />
      </div>
      {/* Country cards row */}
      <div className="grid sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-100 p-4 space-y-3"
          >
            <Bone className="h-8 w-8 rounded-lg" />
            <Bone className="h-4 w-1/2" />
            <Bone className="h-3 w-full" />
            <Bone className="h-3 w-2/3" />
            <Bone className="h-6 w-20 rounded-full" />
          </div>
        ))}
      </div>
      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <Bone className="h-5 w-1/4 mb-4" />
        <TableSkeleton rows={4} cols={5} />
      </div>
      {/* Chart placeholder */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <Bone className="h-5 w-1/3 mb-4" />
        <Bone className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}

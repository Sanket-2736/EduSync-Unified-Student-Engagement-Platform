import React from "react";
import { cn } from "@/lib/theme";

interface ProgressBarProps extends React.HTMLAttributes<HTMLDivElement> {
  percentage: number;
  showLabel?: boolean;
  animated?: boolean;
}

export const ProgressBar = React.forwardRef<HTMLDivElement, ProgressBarProps>(
  (
    { percentage, showLabel = true, animated = true, className, ...props },
    ref
  ) => {
    const clampedPercentage = Math.min(Math.max(percentage, 0), 100);

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all duration-500",
              animated && "animate-pulse"
            )}
            style={{ width: `${clampedPercentage}%` }}
          />
        </div>
        {showLabel && (
          <div className="mt-2 text-sm font-medium text-gray-600">
            {clampedPercentage}%
          </div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

import React from "react";
import { cn } from "@/lib/theme";

interface LoadingSpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: "sm" | "md" | "lg";
}

export const LoadingSpinner = React.forwardRef<
  HTMLDivElement,
  LoadingSpinnerProps
>(({ size = "md", className, ...props }, ref) => {
  const sizeStyles = {
    sm: "w-4 h-4 border-2",
    md: "w-8 h-8 border-3",
    lg: "w-12 h-12 border-4",
  };

  return (
    <div ref={ref} className={cn("flex items-center justify-center", className)} {...props}>
      <div
        className={cn(
          "rounded-full border-purple-300 border-t-purple-600 animate-spin",
          sizeStyles[size]
        )}
      />
    </div>
  );
});

LoadingSpinner.displayName = "LoadingSpinner";

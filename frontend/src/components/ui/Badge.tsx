import React from "react";
import { cn } from "@/lib/theme";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "success" | "warning" | "info" | "danger";
  children: React.ReactNode;
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ variant = "info", className, children, ...props }, ref) => {
    const variants = {
      success: "bg-green-100 text-green-800 border border-green-200",
      warning: "bg-amber-100 text-amber-800 border border-amber-200",
      info: "bg-purple-100 text-purple-800 border border-purple-200",
      danger: "bg-red-100 text-red-800 border border-red-200",
    };

    return (
      <span
        ref={ref}
        className={cn(
          "inline-flex items-center px-3 py-1 rounded-full text-sm font-medium",
          variants[variant],
          className
        )}
        {...props}
      >
        {children}
      </span>
    );
  }
);

Badge.displayName = "Badge";

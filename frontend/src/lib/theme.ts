import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind CSS classes with clsx for conditional styling.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Color palette for StudyAI
 */
export const colors = {
  primary: "#6C63FF", // Purple
  secondary: "#00C9A7", // Teal
  accent: "#FF6B6B", // Coral
  warning: "#FFA94D", // Amber
};

/**
 * Tailwind color classes for easy reference
 */
export const tailwindColors = {
  primary: "text-purple-600 bg-purple-50 border-purple-200",
  secondary: "text-teal-600 bg-teal-50 border-teal-200",
  accent: "text-red-600 bg-red-50 border-red-200",
  warning: "text-amber-600 bg-amber-50 border-amber-200",
};

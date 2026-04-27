import React from "react";
import { cn } from "@/lib/theme";

interface SliderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'onChange'> {
  min: number;
  max: number;
  value: number;
  onChange: (value: number) => void;
  step?: number;
  label?: string;
  showValue?: boolean;
  formatValue?: (value: number) => string;
}

export const Slider = React.forwardRef<HTMLDivElement, SliderProps>(
  (
    {
      min,
      max,
      value,
      onChange,
      step = 1,
      label,
      showValue = true,
      formatValue,
      className,
      ...props
    },
    ref
  ) => {
    const percentage = ((value - min) / (max - min)) * 100;

    return (
      <div ref={ref} className={cn("w-full", className)} {...props}>
        {label && (
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {label}
          </label>
        )}
        <div className="flex items-center gap-4">
          <input
            type="range"
            min={min}
            max={max}
            value={value}
            step={step}
            onChange={(e) => onChange(Number(e.target.value))}
            className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
            style={{
              background: `linear-gradient(to right, #a78bfa 0%, #a78bfa ${percentage}%, #e5e7eb ${percentage}%, #e5e7eb 100%)`,
            }}
          />
          {showValue && (
            <span className="text-sm font-medium text-gray-700 min-w-12">
              {formatValue ? formatValue(value) : value}
            </span>
          )}
        </div>
      </div>
    );
  }
);

Slider.displayName = "Slider";

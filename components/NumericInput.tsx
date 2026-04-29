"use client";

import { cn } from "@/lib/utils";

type NumericInputProps = {
  label: string;
  value: number | null;
  onChange: (v: number | null) => void;
  unit?: string;
  min?: number;
  max?: number;
  step?: number;
  placeholder?: string;
  warnAbove?: number;
  warnBelow?: number;
  dangerAbove?: number;
  dangerBelow?: number;
  className?: string;
};

export function NumericInput({
  label,
  value,
  onChange,
  unit,
  min,
  max,
  step = 1,
  placeholder,
  warnAbove,
  warnBelow,
  dangerAbove,
  dangerBelow,
  className,
}: NumericInputProps) {
  const isDanger =
    value !== null &&
    ((dangerAbove !== undefined && value > dangerAbove) ||
      (dangerBelow !== undefined && value < dangerBelow));

  const isWarn =
    !isDanger &&
    value !== null &&
    ((warnAbove !== undefined && value > warnAbove) ||
      (warnBelow !== undefined && value < warnBelow));

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <label className="text-sm font-medium">{label}</label>
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={value ?? ""}
          min={min}
          max={max}
          step={step}
          placeholder={placeholder}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Number(v));
          }}
          className={cn(
            "w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-colors",
            isDanger && "border-red-400 bg-red-50 focus:ring-red-400",
            isWarn && "border-amber-400 bg-amber-50 focus:ring-amber-400",
            !isDanger && !isWarn && "border-input bg-background"
          )}
        />
        {unit && <span className="text-sm text-muted-foreground whitespace-nowrap">{unit}</span>}
      </div>
    </div>
  );
}

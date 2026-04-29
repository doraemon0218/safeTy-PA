"use client";

import { cn } from "@/lib/utils";

type TriStateToggleProps = {
  label: string;
  value: boolean | null;
  onChange: (v: boolean | null) => void;
  dangerOnTrue?: boolean;
  className?: string;
};

export function TriStateToggle({
  label,
  value,
  onChange,
  dangerOnTrue = false,
  className,
}: TriStateToggleProps) {
  const options: { label: string; val: boolean | null }[] = [
    { label: "未確認", val: null },
    { label: "なし", val: false },
    { label: "あり", val: true },
  ];

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium leading-snug">{label}</span>
      <div className="flex gap-1">
        {options.map((opt) => {
          const isSelected = value === opt.val;
          const isDanger = isSelected && opt.val === true && dangerOnTrue;
          const isSafe = isSelected && opt.val === false;
          return (
            <button
              key={String(opt.val)}
              type="button"
              onClick={() => onChange(opt.val)}
              className={cn(
                "flex-1 py-1.5 text-xs font-medium rounded-md border transition-all",
                isSelected && isDanger &&
                  "bg-red-500 border-red-500 text-white shadow-sm",
                isSelected && isSafe &&
                  "bg-emerald-500 border-emerald-500 text-white shadow-sm",
                isSelected && opt.val === null &&
                  "bg-slate-400 border-slate-400 text-white",
                !isSelected &&
                  "bg-white border-border text-muted-foreground hover:border-primary/40 hover:text-foreground"
              )}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

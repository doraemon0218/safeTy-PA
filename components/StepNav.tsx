"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, ShieldAlert } from "lucide-react";

const STEPS = [
  { href: "/case", label: "患者情報", short: "患者" },
  { href: "/nihss", label: "NIHSS評価", short: "NIHSS" },
  { href: "/contraindications", label: "禁忌確認", short: "禁忌" },
  { href: "/imaging", label: "画像評価", short: "画像" },
  { href: "/dosing", label: "投与計算", short: "投与" },
];

export function StepNav() {
  const pathname = usePathname();
  const currentIdx = STEPS.findIndex((s) => pathname.startsWith(s.href));
  const isSafety = pathname.startsWith("/safety");

  return (
    <nav className="bg-white border-b border-border sticky top-0 z-10 shadow-sm">
      <div className="max-w-2xl mx-auto px-2 py-1.5">
        <div className="flex items-center gap-0.5">
          {STEPS.map((step, i) => {
            const done = i < currentIdx;
            const active = i === currentIdx;
            return (
              <Link
                key={step.href}
                href={step.href}
                className={cn(
                  "flex-1 flex flex-col items-center gap-0.5 py-1.5 px-0.5 rounded-md text-center transition-colors",
                  active && "bg-primary/10 text-primary font-semibold",
                  done && "text-emerald-600",
                  !active && !done && "text-muted-foreground hover:text-foreground"
                )}
              >
                {done ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                ) : (
                  <Circle className={cn("w-4 h-4", active ? "text-primary fill-primary/20" : "text-muted-foreground")} />
                )}
                <span className="text-[10px] leading-tight hidden sm:block">{step.label}</span>
                <span className="text-[10px] leading-tight sm:hidden">{step.short}</span>
              </Link>
            );
          })}

          {/* 区切り */}
          <div className="w-px h-8 bg-border mx-1" />

          {/* 安全対策（独立タブ） */}
          <Link
            href="/safety"
            className={cn(
              "flex flex-col items-center gap-0.5 py-1.5 px-2 rounded-md text-center transition-colors",
              isSafety
                ? "bg-red-50 text-red-600 font-semibold"
                : "text-muted-foreground hover:text-red-600 hover:bg-red-50"
            )}
          >
            <ShieldAlert className={cn("w-4 h-4", isSafety ? "text-red-500" : "")} />
            <span className="text-[10px] leading-tight whitespace-nowrap">安全対策</span>
          </Link>
        </div>
      </div>
    </nav>
  );
}

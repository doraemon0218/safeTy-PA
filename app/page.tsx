"use client";

import Link from "next/link";
import { useCase } from "@/lib/store";
import { AlertTriangle, Activity, Clock, ShieldCheck } from "lucide-react";

export default function HomePage() {
  const { resetCase } = useCase();

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
      {/* ヘッダー */}
      <div className="flex flex-col items-center gap-2 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <Activity className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight">SafeTy-PA</h1>
            <p className="text-xs text-muted-foreground">t-PA 安全投与支援システム</p>
          </div>
        </div>
      </div>

      {/* 注意書き */}
      <div className="w-full max-w-sm mb-6 p-3 bg-amber-50 border border-amber-300 rounded-lg flex gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
        <p className="text-xs text-amber-800">
          本ツールは臨床判断の補助です。最終的な投与判断は担当医師が行い、施設プロトコルに従ってください。
        </p>
      </div>

      {/* 機能カード */}
      <div className="w-full max-w-sm space-y-3 mb-8">
        {[
          { icon: Clock, title: "時間管理", desc: "発症〜投与までの時間を正確に把握" },
          { icon: ShieldCheck, title: "禁忌チェック", desc: "絶対・相対禁忌を系統的にスクリーニング" },
          { icon: Activity, title: "NIHSS評価", desc: "15項目を入力してスコアを自動計算" },
        ].map(({ icon: Icon, title, desc }) => (
          <div key={title} className="flex items-start gap-3 p-3 bg-white rounded-xl border border-border shadow-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold">{title}</p>
              <p className="text-xs text-muted-foreground">{desc}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 開始ボタン */}
      <Link
        href="/case"
        onClick={resetCase}
        className="w-full max-w-sm flex items-center justify-center gap-2 bg-primary text-white font-bold py-4 rounded-xl shadow-lg hover:bg-primary/90 active:scale-[0.98] transition-all text-base"
      >
        新規ケースを開始
      </Link>

      <p className="mt-4 text-xs text-muted-foreground">
        rt-PA（アルテプラーゼ）0.6 mg/kg 日本標準プロトコル
      </p>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCase } from "@/lib/store";
import { StepNav } from "@/components/StepNav";
import { calcDose, getSummary } from "@/lib/tpa";
import {
  CheckCircle2, XCircle, AlertTriangle, Syringe,
  Timer, RefreshCw, ChevronDown, ChevronUp
} from "lucide-react";
import { cn } from "@/lib/utils";

type Protocol = "japan" | "international";

export default function DosingPage() {
  const { state, setDose } = useCase();
  const { patient, dose } = state;
  const [protocol, setProtocol] = useState<Protocol>("japan");
  const [showMonitoring, setShowMonitoring] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [timerRunning, setTimerRunning] = useState(false);

  const summary = getSummary(state);
  const { nihssHistory } = state;
  const weight = patient.weight;
  const plan = weight ? calcDose(weight, protocol) : null;

  useEffect(() => {
    if (plan) setDose(plan);
  }, [plan, setDose]);

  // タイマー
  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setElapsedSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const { canProceed, contraindicationResult, imagingResult, timeWindowStatus, nihssScore } = summary;
  const nihssCount = nihssHistory.filter((m) => m.finalized).length;

  const MONITORING_ITEMS = [
    "投与開始5分：バイタル確認・出血症状",
    "投与開始15分：意識・神経症状の変化",
    "投与開始30分：血圧（目標 180/105 未満）",
    "ボーラス終了後：注入ポンプ速度確認",
    "投与中 15分毎：血圧・神経症状",
    "投与終了後 2時間：バイタル 15分毎",
    "投与終了後 4〜6時間：頭部CT",
    "24時間以内：抗血小板薬・抗凝固薬は禁忌",
    "出血疑い時：投与直ちに中止・医師報告",
  ];

  return (
    <div className="min-h-screen bg-background">
      <StepNav />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Syringe className="w-5 h-5 text-primary" />
          投与計算・プロトコル
        </h1>

        {/* 総合判定 */}
        <div
          className={cn(
            "rounded-xl border p-4",
            canProceed ? "status-eligible" : "status-contraindicated"
          )}
        >
          <div className="flex items-center gap-2 mb-2">
            {canProceed ? (
              <CheckCircle2 className="w-5 h-5 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 shrink-0" />
            )}
            <span className="font-bold text-base">
              {canProceed ? "t-PA 投与可能（禁忌なし）" : "t-PA 投与禁忌または要慎重判断"}
            </span>
          </div>
          <div className="space-y-1 text-sm">
            <p>• NIHSS：{nihssScore}点（{nihssCount}回測定）</p>
            <p>• 時間：{timeWindowStatus.label}</p>
            {contraindicationResult.absolute.length > 0 && (
              <p className="text-red-800 font-medium">
                • 絶対禁忌 {contraindicationResult.absolute.length} 件
              </p>
            )}
            {contraindicationResult.relative.length > 0 && (
              <p>• 相対禁忌 {contraindicationResult.relative.length} 件（慎重判断）</p>
            )}
            {!imagingResult.safe && (
              <p className="font-medium">• 画像所見：{imagingResult.issues.join("／")}</p>
            )}
          </div>
        </div>

        {/* 禁忌リスト */}
        {contraindicationResult.absolute.length > 0 && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-2">
            <p className="font-bold text-red-700 text-sm flex items-center gap-1.5">
              <XCircle className="w-4 h-4" /> 絶対禁忌（投与不可）
            </p>
            {contraindicationResult.absolute.map((item) => (
              <p key={item.key} className="text-sm text-red-800 flex gap-1.5">
                <span>•</span>{item.label}
              </p>
            ))}
          </div>
        )}

        {contraindicationResult.warning && contraindicationResult.eligible && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
            <p className="font-bold text-amber-700 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> 相対禁忌（慎重判断）
            </p>
            {contraindicationResult.relative.map((item) => (
              <p key={item.key} className="text-sm text-amber-800 flex gap-1.5">
                <span>•</span>{item.label}
              </p>
            ))}
          </div>
        )}

        {/* プロトコル選択 */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold">投与プロトコル選択</h2>
          <div className="flex gap-2">
            {(["japan", "international"] as Protocol[]).map((p) => (
              <button
                key={p}
                onClick={() => setProtocol(p)}
                className={cn(
                  "flex-1 py-2.5 text-sm font-medium rounded-lg border transition-all",
                  protocol === p
                    ? "bg-primary text-white border-primary"
                    : "bg-white border-border text-muted-foreground hover:border-primary/40"
                )}
              >
                {p === "japan"
                  ? "🇯🇵 日本 0.6 mg/kg（max 60 mg）"
                  : "🌍 海外 0.9 mg/kg（max 90 mg）"}
              </button>
            ))}
          </div>
        </section>

        {/* 投与量計算結果 */}
        {plan && weight && (
          <section className="bg-white rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">投与量計算結果</h2>
              <span className="text-xs text-muted-foreground">体重 {weight} kg</span>
            </div>

            {/* 総量 */}
            <div className="rounded-lg bg-primary/5 border border-primary/20 p-3 text-center">
              <p className="text-xs text-muted-foreground mb-1">総投与量</p>
              <p className="text-3xl font-bold text-primary tabular-nums">
                {plan.totalDose} <span className="text-lg">mg</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {protocol === "japan" ? "0.6" : "0.9"} mg/kg × {weight} kg
                {weight * (protocol === "japan" ? 0.6 : 0.9) >
                  (protocol === "japan" ? 60 : 90) && "（上限適用）"}
              </p>
            </div>

            {/* ボーラス・維持 */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">① ボーラス（10%）</p>
                <p className="text-xl font-bold tabular-nums">{plan.bolusDose} mg</p>
                <p className="text-sm text-primary font-medium">{plan.bolusVolume} mL</p>
                <p className="text-xs text-muted-foreground">1分間で静注</p>
              </div>
              <div className="rounded-lg border border-border p-3 space-y-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase">② 維持（90%）</p>
                <p className="text-xl font-bold tabular-nums">{plan.infusionDose} mg</p>
                <p className="text-sm text-primary font-medium">{plan.infusionVolume} mL</p>
                <p className="text-xs text-muted-foreground">60分で点滴</p>
              </div>
            </div>

            {/* 注入速度 */}
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 space-y-2">
              <p className="text-sm font-semibold text-blue-900">点滴ポンプ設定値</p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-800">投与速度</span>
                <span className="text-xl font-bold text-blue-900 tabular-nums">
                  {plan.infusionRate} mL/h
                </span>
              </div>
              <p className="text-xs text-blue-700">
                ※ rt-PA 1バイアル（20 mg/20 mL）を生食で{plan.infusionVolume} mL に調製（1 mg/mL）
              </p>
            </div>

            <div className="text-xs text-muted-foreground space-y-0.5 p-3 bg-muted rounded-lg">
              <p className="font-medium">調製方法</p>
              <p>• rt-PA {Math.ceil(plan.totalDose / 20)} バイアル使用</p>
              <p>• 生理食塩液で溶解し、最終濃度 1 mg/mL に調製</p>
              <p>• ボーラス用シリンジ：{plan.bolusVolume} mL</p>
              <p>• 点滴バッグ（または持続シリンジ）：{plan.infusionVolume} mL</p>
            </div>
          </section>
        )}

        {/* タイマー */}
        {plan && (
          <section className="bg-white rounded-xl border border-border p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Timer className="w-4 h-4 text-primary" />
              投与タイマー
            </h2>
            <div className="text-center">
              <p className={cn(
                "text-5xl font-mono font-bold tabular-nums",
                elapsedSeconds < 60 ? "text-primary" : "text-orange-500"
              )}>
                {formatTime(elapsedSeconds)}
              </p>
              {elapsedSeconds >= 60 && elapsedSeconds < 120 && (
                <p className="text-sm text-orange-600 mt-1 font-medium">ボーラス終了 — 点滴開始してください</p>
              )}
              {elapsedSeconds >= 3600 + 60 && (
                <p className="text-sm text-emerald-600 mt-1 font-medium">投与終了（60分経過）</p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setTimerRunning((r) => !r)}
                className="flex-1 py-2.5 bg-primary text-white rounded-lg font-medium text-sm hover:bg-primary/90 transition-colors"
              >
                {timerRunning ? "一時停止" : elapsedSeconds === 0 ? "投与開始" : "再開"}
              </button>
              <button
                onClick={() => { setTimerRunning(false); setElapsedSeconds(0); }}
                className="py-2.5 px-3 border border-border rounded-lg text-muted-foreground hover:text-foreground transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1.5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>ボーラス終了目安</span>
                <span className={cn("font-mono", elapsedSeconds >= 60 && "text-emerald-600")}>01:00</span>
              </div>
              <div className="flex justify-between">
                <span>点滴終了（60分）</span>
                <span className={cn("font-mono", elapsedSeconds >= 3660 && "text-emerald-600")}>61:00</span>
              </div>
            </div>
          </section>
        )}

        {/* モニタリングチェックリスト */}
        <section className="bg-white rounded-xl border border-border overflow-hidden">
          <button
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:bg-muted/30 transition-colors"
            onClick={() => setShowMonitoring((v) => !v)}
          >
            <span>投与後モニタリング</span>
            {showMonitoring ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
          {showMonitoring && (
            <div className="px-4 pb-4 space-y-2 border-t border-border pt-3">
              {MONITORING_ITEMS.map((item, i) => (
                <CheckItem key={i} label={item} />
              ))}
            </div>
          )}
        </section>

        {/* 最初からやり直す */}
        <Link
          href="/"
          className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors text-sm"
        >
          <RefreshCw className="w-4 h-4" />
          新規ケースへ戻る
        </Link>
      </div>
    </div>
  );
}

function CheckItem({ label }: { label: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked((v) => !v)}
      className={cn(
        "w-full flex items-start gap-2 text-left text-sm py-1.5 transition-colors",
        checked && "line-through text-muted-foreground"
      )}
    >
      <span className={cn(
        "mt-0.5 w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center transition-colors",
        checked ? "bg-emerald-500 border-emerald-500" : "border-border"
      )}>
        {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
      </span>
      {label}
    </button>
  );
}

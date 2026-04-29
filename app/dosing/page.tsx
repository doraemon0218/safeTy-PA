"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useCase } from "@/lib/store";
import { StepNav } from "@/components/StepNav";
import { calcDose, getSummary } from "@/lib/tpa";
import {
  CheckCircle2, XCircle, AlertTriangle, Syringe,
  Timer, RefreshCw, ChevronDown, ChevronUp, FlaskConical, Pill
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

        {/* 薬剤規格 */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <Pill className="w-4 h-4 text-primary" />
            薬剤規格
          </h2>
          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3 space-y-2 text-sm">
            <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
              <span className="font-bold text-slate-800">アクチバシン注（アルテプラーゼ）</span>
              <span className="text-xs text-slate-500 whitespace-nowrap">rt-PA</span>
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
              <div>
                <p className="text-muted-foreground">規格</p>
                <p className="font-semibold">6,000,000 IU / バイアル</p>
                <p className="text-muted-foreground">= <span className="font-bold text-foreground">60 mg</span> / バイアル（粉末）</p>
              </div>
              <div>
                <p className="text-muted-foreground">付属溶解液</p>
                <p className="font-semibold">注射用水 60 mL</p>
                <p className="text-muted-foreground">溶解後 → 1 mg/mL</p>
              </div>
              <div>
                <p className="text-muted-foreground">外観（溶解後）</p>
                <p className="font-semibold">無色〜淡黄色・透明</p>
              </div>
              <div>
                <p className="text-muted-foreground">安定性（調製後）</p>
                <p className="font-semibold">室温8時間以内に使用</p>
              </div>
            </div>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1.5">
              ⚠️ 他剤との混注不可。ガラス製またはPVC製容器を使用。希釈する場合は 0.1 mg/mL 以上を維持。
            </p>
          </div>
        </section>

        {/* 溶解手順 */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-3">
          <h2 className="font-semibold flex items-center gap-2">
            <FlaskConical className="w-4 h-4 text-primary" />
            溶解手順
          </h2>
          {plan && weight ? (
            <div className="space-y-2">
              {[
                {
                  step: "①",
                  label: `アクチバシン ${protocol === "japan" ? 1 : plan.totalDose > 60 ? 2 : 1} バイアルを準備`,
                  sub: `必要量 ${plan.totalDose} mg（バイアル1本 = 60 mg）`,
                },
                {
                  step: "②",
                  label: "付属の注射用水 60 mL をバイアルに加える",
                  sub: "針を粉末に直接当てず、瓶壁に沿って注入する",
                },
                {
                  step: "③",
                  label: "穏やかに転倒混和（泡立てない）",
                  sub: "激しく振らない。泡が生じた場合は消えるまで静置",
                },
                {
                  step: "④",
                  label: "溶解確認：無色〜淡黄色・透明であること",
                  sub: "混濁・沈殿がある場合は使用しない",
                },
                {
                  step: "⑤",
                  label: `ボーラス用シリンジに ${plan.bolusVolume} mL を吸う`,
                  sub: `${plan.bolusDose} mg 相当（総量の10%）`,
                },
                {
                  step: "⑥",
                  label: `残り ${plan.infusionVolume} mL を点滴バッグ or シリンジポンプへ移す`,
                  sub: `${plan.infusionDose} mg 相当（総量の90%）。使用しない残液は廃棄`,
                },
              ].map(({ step, label, sub }) => (
                <div key={step} className="flex gap-3 items-start">
                  <span className="w-7 h-7 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center shrink-0 mt-0.5">
                    {step}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{label}</p>
                    <p className="text-xs text-muted-foreground">{sub}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">体重を入力すると溶解手順が表示されます</p>
          )}
        </section>

        {/* 投与量計算結果 */}
        {plan && weight && (
          <section className="bg-white rounded-xl border border-border p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">投与量・速度</h2>
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
                　→　{plan.totalDose} mL（1 mg/mL溶液）
              </p>
            </div>

            {/* ボーラス・維持 並べて */}
            <div className="grid grid-cols-2 gap-3">
              {/* ボーラス */}
              <div className="rounded-lg border-2 border-primary/30 bg-primary/5 p-3 space-y-2">
                <p className="text-xs font-bold text-primary uppercase tracking-wide">① ボーラス（10%）</p>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{plan.bolusDose} mg</p>
                  <p className="text-sm font-semibold text-primary">{plan.bolusVolume} mL</p>
                </div>
                <div className="rounded bg-white/70 px-2 py-1.5 space-y-0.5">
                  <p className="text-xs font-semibold">投与法</p>
                  <p className="text-xs text-muted-foreground">シリンジで<span className="font-bold text-foreground">1分間</span>かけて静注</p>
                  <p className="text-xs text-muted-foreground">速度：{plan.bolusVolume} mL/min</p>
                </div>
              </div>

              {/* 維持 */}
              <div className="rounded-lg border-2 border-blue-300 bg-blue-50 p-3 space-y-2">
                <p className="text-xs font-bold text-blue-700 uppercase tracking-wide">② 維持投与（90%）</p>
                <div>
                  <p className="text-2xl font-bold tabular-nums">{plan.infusionDose} mg</p>
                  <p className="text-sm font-semibold text-blue-700">{plan.infusionVolume} mL</p>
                </div>
                <div className="rounded bg-white/70 px-2 py-1.5 space-y-0.5">
                  <p className="text-xs font-semibold">投与法</p>
                  <p className="text-xs text-muted-foreground">輸液ポンプで<span className="font-bold text-foreground">60分間</span>で点滴</p>
                  <p className="text-xs text-muted-foreground">ボーラス終了後すぐに開始</p>
                </div>
              </div>
            </div>

            {/* ポンプ設定 強調 */}
            <div className="rounded-xl bg-blue-600 p-4 space-y-2 text-white">
              <p className="text-xs font-semibold opacity-80 uppercase tracking-wide">輸液ポンプ設定値</p>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm opacity-80">投与速度</p>
                  <p className="text-4xl font-bold tabular-nums leading-none">{plan.infusionRate}
                    <span className="text-xl font-semibold ml-1">mL/h</span>
                  </p>
                </div>
                <div className="text-right space-y-0.5">
                  <p className="text-xs opacity-70">投与量</p>
                  <p className="text-lg font-bold">{plan.infusionVolume} mL</p>
                  <p className="text-xs opacity-70">投与時間：60分</p>
                </div>
              </div>
              <div className="border-t border-white/30 pt-2 text-xs opacity-80 space-y-0.5">
                <p>• 濃度：1 mg/mL（アクチバシン60 mg ＋ 注射用水60 mL）</p>
                <p>• ライン：専用ルートを使用、他剤と混注しない</p>
                <p>• 設定確認：ボーラス終了直後に速度をセット</p>
              </div>
            </div>

            {/* 投与フロー図 */}
            <div className="rounded-lg bg-muted p-3 space-y-2">
              <p className="text-xs font-semibold">投与シーケンス</p>
              <div className="flex items-center gap-0 text-xs">
                {[
                  { label: "溶解", sub: "準備完了", color: "bg-slate-400" },
                  { label: `ボーラス\n${plan.bolusVolume} mL`, sub: "1分間", color: "bg-primary" },
                  { label: `維持投与\n${plan.infusionRate} mL/h`, sub: "60分間", color: "bg-blue-500" },
                  { label: "終了", sub: "61分後", color: "bg-emerald-500" },
                ].map((item, i, arr) => (
                  <div key={i} className="flex items-center flex-1">
                    <div className="flex-1 flex flex-col items-center gap-0.5">
                      <div className={cn("w-full rounded text-white text-center py-1.5 px-1 text-[10px] font-medium leading-tight whitespace-pre-line", item.color)}>
                        {item.label}
                      </div>
                      <p className="text-[10px] text-muted-foreground">{item.sub}</p>
                    </div>
                    {i < arr.length - 1 && (
                      <div className="w-3 h-0.5 bg-border shrink-0" />
                    )}
                  </div>
                ))}
              </div>
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

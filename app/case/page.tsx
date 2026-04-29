"use client";

import { useRouter } from "next/navigation";
import { useCase } from "@/lib/store";
import { StepNav } from "@/components/StepNav";
import { NumericInput } from "@/components/NumericInput";
import { calcTimeFromOnset } from "@/lib/tpa";
import { Clock, User, Thermometer, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

export default function CasePage() {
  const router = useRouter();
  const { state, setPatient, setVitals } = useCase();
  const { patient, vitals } = state;

  const timeMinutes = calcTimeFromOnset(
    patient.onsetTime,
    patient.arrivalTime,
    patient.onsetUnknown
  );

  const timeStatus =
    timeMinutes === null
      ? null
      : timeMinutes <= 270
      ? "ok"
      : timeMinutes <= 360
      ? "warning"
      : "over";

  const canNext =
    patient.age !== null &&
    patient.weight !== null &&
    (patient.onsetTime || patient.onsetUnknown) &&
    patient.arrivalTime &&
    vitals.sbp !== null &&
    vitals.dbp !== null &&
    vitals.bloodGlucose !== null;

  return (
    <div className="min-h-screen bg-background">
      <StepNav />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <User className="w-5 h-5 text-primary" />
          患者情報・初期評価
        </h1>

        {/* 患者基本情報 */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">患者基本情報</h2>

          <div className="grid grid-cols-2 gap-3">
            <NumericInput
              label="年齢"
              value={patient.age}
              onChange={(v) => setPatient({ age: v })}
              unit="歳"
              min={0}
              max={120}
            />
            <NumericInput
              label="体重"
              value={patient.weight}
              onChange={(v) => setPatient({ weight: v })}
              unit="kg"
              min={1}
              max={300}
              step={0.1}
            />
          </div>

          <div>
            <label className="text-sm font-medium block mb-1">性別</label>
            <div className="flex gap-2">
              {(["male", "female"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPatient({ sex: s })}
                  className={cn(
                    "flex-1 py-2 text-sm rounded-md border transition-colors",
                    patient.sex === s
                      ? "bg-primary text-white border-primary"
                      : "bg-white border-border text-muted-foreground hover:border-primary/40"
                  )}
                >
                  {s === "male" ? "男性" : "女性"}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* 時刻情報 */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Clock className="w-4 h-4" />
            時刻管理
          </h2>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="onsetUnknown"
              checked={patient.onsetUnknown}
              onChange={(e) => setPatient({ onsetUnknown: e.target.checked, onsetTime: "" })}
              className="w-4 h-4 accent-primary"
            />
            <label htmlFor="onsetUnknown" className="text-sm font-medium">
              発症時刻不明（wake-up stroke / 目撃なし）
            </label>
          </div>

          {!patient.onsetUnknown && (
            <div>
              <label className="text-sm font-medium block mb-1">発症時刻（最終健常確認時刻）</label>
              <input
                type="time"
                value={patient.onsetTime}
                onChange={(e) => setPatient({ onsetTime: e.target.value })}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          )}

          <div>
            <label className="text-sm font-medium block mb-1">搬入時刻</label>
            <input
              type="time"
              value={patient.arrivalTime}
              onChange={(e) => setPatient({ arrivalTime: e.target.value })}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          {timeMinutes !== null && (
            <div
              className={cn(
                "rounded-lg p-3 border text-sm font-medium text-center",
                timeStatus === "ok" && "status-eligible",
                timeStatus === "warning" && "status-warning",
                timeStatus === "over" && "status-contraindicated"
              )}
            >
              {timeStatus === "ok" && `発症から ${timeMinutes} 分（残り ${270 - timeMinutes} 分）`}
              {timeStatus === "warning" && `発症から ${timeMinutes} 分 ⚠️ 4.5時間超 — 慎重に適応検討`}
              {timeStatus === "over" && `発症から ${timeMinutes} 分 — 原則適応外（6時間超）`}
            </div>
          )}

          {patient.onsetUnknown && (
            <div className="rounded-lg p-3 border status-warning text-sm">
              発症時刻不明：MRI DWI/FLAIR不一致基準で適応を検討します
            </div>
          )}
        </section>

        {/* バイタルサイン */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Thermometer className="w-4 h-4" />
            バイタルサイン・検査値
          </h2>

          <div className="grid grid-cols-2 gap-3">
            <NumericInput
              label="収縮期血圧"
              value={vitals.sbp}
              onChange={(v) => setVitals({ sbp: v })}
              unit="mmHg"
              min={0}
              max={300}
              warnAbove={180}
              dangerAbove={185}
            />
            <NumericInput
              label="拡張期血圧"
              value={vitals.dbp}
              onChange={(v) => setVitals({ dbp: v })}
              unit="mmHg"
              min={0}
              max={200}
              warnAbove={105}
              dangerAbove={110}
            />
          </div>

          {vitals.sbp !== null && vitals.sbp > 185 && (
            <div className="rounded-lg p-2.5 border status-contraindicated text-xs">
              収縮期血圧 &gt; 185 mmHg：降圧治療を行い185/110以下に管理してから投与を検討
            </div>
          )}
          {vitals.dbp !== null && vitals.dbp > 110 && (
            <div className="rounded-lg p-2.5 border status-contraindicated text-xs">
              拡張期血圧 &gt; 110 mmHg：降圧治療を行い185/110以下に管理してから投与を検討
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <NumericInput
              label="心拍数"
              value={vitals.hr}
              onChange={(v) => setVitals({ hr: v })}
              unit="bpm"
              min={0}
              max={300}
            />
            <NumericInput
              label="SpO₂"
              value={vitals.spo2}
              onChange={(v) => setVitals({ spo2: v })}
              unit="%"
              min={0}
              max={100}
              dangerBelow={90}
              warnBelow={94}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <NumericInput
              label="血糖値"
              value={vitals.bloodGlucose}
              onChange={(v) => setVitals({ bloodGlucose: v })}
              unit="mg/dL"
              min={0}
              max={800}
              dangerBelow={50}
              dangerAbove={400}
            />
            <NumericInput
              label="体温"
              value={vitals.temperature}
              onChange={(v) => setVitals({ temperature: v })}
              unit="℃"
              min={30}
              max={45}
              step={0.1}
            />
          </div>

          {vitals.bloodGlucose !== null &&
            (vitals.bloodGlucose < 50 || vitals.bloodGlucose > 400) && (
              <div className="rounded-lg p-2.5 border status-contraindicated text-xs">
                血糖値 {vitals.bloodGlucose} mg/dL：t-PA 禁忌範囲（50未満 または 400超）
              </div>
            )}

          <div className="grid grid-cols-2 gap-3">
            <NumericInput
              label="血小板数"
              value={vitals.platelets}
              onChange={(v) => setVitals({ platelets: v })}
              unit="×10³/μL"
              min={0}
              max={2000}
              dangerBelow={100}
              warnBelow={150}
            />
            <NumericInput
              label="PT-INR"
              value={vitals.inr}
              onChange={(v) => setVitals({ inr: v })}
              unit=""
              min={0}
              max={10}
              step={0.01}
              dangerAbove={1.7}
              warnAbove={1.5}
            />
          </div>

          {vitals.platelets !== null && vitals.platelets < 100 && (
            <div className="rounded-lg p-2.5 border status-contraindicated text-xs">
              血小板 &lt; 10万/μL：t-PA 禁忌
            </div>
          )}
          {vitals.inr !== null && vitals.inr > 1.7 && (
            <div className="rounded-lg p-2.5 border status-contraindicated text-xs">
              PT-INR &gt; 1.7：t-PA 禁忌（抗凝固療法の影響）
            </div>
          )}
        </section>

        {/* GCS */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Brain className="w-4 h-4" />
            GCS（Glasgow Coma Scale）
          </h2>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1 text-muted-foreground">開眼 E（1-4）</label>
              <div className="space-y-1">
                {[
                  { v: 4, label: "自然開眼" },
                  { v: 3, label: "呼びかけ" },
                  { v: 2, label: "疼痛刺激" },
                  { v: 1, label: "なし" },
                ].map(({ v, label }) => (
                  <button key={v} onClick={() => setVitals({ gcsE: v })}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded text-xs border transition-colors",
                      vitals.gcsE === v ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                    )}>
                    E{v} {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-muted-foreground">言語 V（1-5）</label>
              <div className="space-y-1">
                {[
                  { v: 5, label: "見当識あり" },
                  { v: 4, label: "混乱した会話" },
                  { v: 3, label: "単語のみ" },
                  { v: 2, label: "理解不能な声" },
                  { v: 1, label: "なし" },
                ].map(({ v, label }) => (
                  <button key={v} onClick={() => setVitals({ gcsV: v })}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded text-xs border transition-colors",
                      vitals.gcsV === v ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                    )}>
                    V{v} {label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1 text-muted-foreground">運動 M（1-6）</label>
              <div className="space-y-1">
                {[
                  { v: 6, label: "命令に従う" },
                  { v: 5, label: "疼痛部位確認" },
                  { v: 4, label: "疼痛から逃避" },
                  { v: 3, label: "異常屈曲" },
                  { v: 2, label: "異常伸展" },
                  { v: 1, label: "なし" },
                ].map(({ v, label }) => (
                  <button key={v} onClick={() => setVitals({ gcsM: v })}
                    className={cn(
                      "w-full text-left px-2 py-1 rounded text-xs border transition-colors",
                      vitals.gcsM === v ? "bg-primary text-white border-primary" : "border-border hover:border-primary/40"
                    )}>
                    M{v} {label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {vitals.gcsE !== null && vitals.gcsV !== null && vitals.gcsM !== null && (() => {
            const total = vitals.gcsE + vitals.gcsV + vitals.gcsM;
            const needsAirway = total <= 8;
            return (
              <div className={cn(
                "rounded-lg p-3 border text-sm font-medium flex items-center justify-between",
                needsAirway ? "status-contraindicated" : "status-eligible"
              )}>
                <span>GCS合計：<span className="text-lg font-bold">{total}</span> / 15</span>
                {needsAirway && (
                  <span className="text-xs font-bold uppercase">⚠️ 気道確保を検討</span>
                )}
              </div>
            );
          })()}

          {vitals.gcsE !== null && vitals.gcsV !== null && vitals.gcsM !== null &&
            vitals.gcsE + vitals.gcsV + vitals.gcsM <= 8 && (
            <div className="rounded-lg p-2.5 border status-warning text-xs space-y-1">
              <p className="font-semibold">GCS ≤ 8：CT/MRI移動前の気道評価が必要です</p>
              <p>安全ガイド（ISLS・RSI）→ <a href="/safety" className="underline font-medium">安全対策ページ</a> を参照</p>
            </div>
          )}
        </section>

        {/* 次へ */}
        <button
          onClick={() => router.push("/nihss")}
          disabled={!canNext}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-base transition-all",
            canNext
              ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-md"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          次へ：NIHSS評価
        </button>
      </div>
    </div>
  );
}

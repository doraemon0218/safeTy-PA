"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useCase } from "@/lib/store";
import { StepNav } from "@/components/StepNav";
import { calcNIHSS, latestNIHSS } from "@/lib/tpa";
import { Brain, Clock, Lock, PlusCircle, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NIHSSScores } from "@/types/patient";

type NIHSSItemDef = {
  id: keyof NIHSSScores;
  title: string;
  options: { score: number; label: string }[];
};

const NIHSS_ITEMS: NIHSSItemDef[] = [
  {
    id: "1a", title: "1a. 意識レベル",
    options: [
      { score: 0, label: "清明" },
      { score: 1, label: "傾眠（軽い刺激で覚醒）" },
      { score: 2, label: "昏迷（強い刺激が必要）" },
      { score: 3, label: "昏睡（無反応）" },
    ],
  },
  {
    id: "1b", title: "1b. 意識：月と年齢の質問",
    options: [
      { score: 0, label: "2問とも正解" },
      { score: 1, label: "1問のみ正解" },
      { score: 2, label: "2問とも不正解" },
    ],
  },
  {
    id: "1c", title: "1c. 意識：指示への従命",
    options: [
      { score: 0, label: "2つとも従命" },
      { score: 1, label: "1つのみ従命" },
      { score: 2, label: "2つとも不従命" },
    ],
  },
  {
    id: "2", title: "2. 最良の注視",
    options: [
      { score: 0, label: "正常" },
      { score: 1, label: "部分的注視麻痺（共同偏視できるが克服可能）" },
      { score: 2, label: "完全注視麻痺（共同偏視・克服不能）" },
    ],
  },
  {
    id: "3", title: "3. 視野",
    options: [
      { score: 0, label: "視野異常なし" },
      { score: 1, label: "部分的半盲" },
      { score: 2, label: "完全半盲" },
      { score: 3, label: "両側半盲（皮質盲含む）" },
    ],
  },
  {
    id: "4", title: "4. 顔面麻痺",
    options: [
      { score: 0, label: "正常な対称性" },
      { score: 1, label: "軽度麻痺（鼻唇溝扁平、笑顔非対称）" },
      { score: 2, label: "部分麻痺（下顔面の完全麻痺）" },
      { score: 3, label: "完全麻痺（上下顔面ともに麻痺）" },
    ],
  },
  {
    id: "5a", title: "5a. 左上肢運動（90°保持 10秒）",
    options: [
      { score: 0, label: "10秒間保持できる" },
      { score: 1, label: "10秒以内に下垂するが下ろさない" },
      { score: 2, label: "重力に抗えるが10秒以内に下ろす" },
      { score: 3, label: "重力に抗えない" },
      { score: 4, label: "まったく動かない" },
    ],
  },
  {
    id: "5b", title: "5b. 右上肢運動（90°保持 10秒）",
    options: [
      { score: 0, label: "10秒間保持できる" },
      { score: 1, label: "10秒以内に下垂するが下ろさない" },
      { score: 2, label: "重力に抗えるが10秒以内に下ろす" },
      { score: 3, label: "重力に抗えない" },
      { score: 4, label: "まったく動かない" },
    ],
  },
  {
    id: "6a", title: "6a. 左下肢運動（30°保持 5秒）",
    options: [
      { score: 0, label: "5秒間保持できる" },
      { score: 1, label: "5秒以内に下垂するが下ろさない" },
      { score: 2, label: "重力に抗えるが5秒以内に下ろす" },
      { score: 3, label: "重力に抗えない" },
      { score: 4, label: "まったく動かない" },
    ],
  },
  {
    id: "6b", title: "6b. 右下肢運動（30°保持 5秒）",
    options: [
      { score: 0, label: "5秒間保持できる" },
      { score: 1, label: "5秒以内に下垂するが下ろさない" },
      { score: 2, label: "重力に抗えるが5秒以内に下ろす" },
      { score: 3, label: "重力に抗えない" },
      { score: 4, label: "まったく動かない" },
    ],
  },
  {
    id: "7", title: "7. 運動失調",
    options: [
      { score: 0, label: "なし" },
      { score: 1, label: "1肢に認める" },
      { score: 2, label: "2肢以上に認める" },
    ],
  },
  {
    id: "8", title: "8. 感覚",
    options: [
      { score: 0, label: "正常" },
      { score: 1, label: "軽度〜中等度の感覚障害" },
      { score: 2, label: "重度〜完全な感覚障害" },
    ],
  },
  {
    id: "9", title: "9. 最良の言語（失語）",
    options: [
      { score: 0, label: "正常（失語なし）" },
      { score: 1, label: "軽度〜中等度の失語" },
      { score: 2, label: "重度の失語（断片的な表現のみ）" },
      { score: 3, label: "無言・全失語、または昏睡" },
    ],
  },
  {
    id: "10", title: "10. 構音障害",
    options: [
      { score: 0, label: "正常" },
      { score: 1, label: "軽度〜中等度（聴き取れるが不明瞭）" },
      { score: 2, label: "重度（ほぼ聴き取れない）" },
    ],
  },
  {
    id: "11", title: "11. 消去現象・不注意（半側無視）",
    options: [
      { score: 0, label: "異常なし" },
      { score: 1, label: "1つの感覚様式で消去現象" },
      { score: 2, label: "2つ以上の感覚様式で消去・無視" },
    ],
  },
];

function nowHHMM() {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function severityLabel(score: number) {
  if (score === 0) return { label: "正常", color: "text-emerald-600" };
  if (score <= 4) return { label: "軽症", color: "text-amber-600" };
  if (score <= 15) return { label: "中等症", color: "text-orange-600" };
  if (score <= 21) return { label: "重症", color: "text-red-600" };
  return { label: "最重症", color: "text-red-700" };
}

export default function NIHSSPage() {
  const router = useRouter();
  const { state, addNIHSSMeasurement, updateNIHSSScores, finalizeNIHSS } = useCase();
  const { nihssHistory } = state;

  const [newTimestamp, setNewTimestamp] = useState(nowHHMM());

  const active = nihssHistory.find((m) => !m.finalized) ?? null;
  const finalized = nihssHistory.filter((m) => m.finalized);
  const latestFinalized = latestNIHSS(nihssHistory);

  const activeScore = active ? calcNIHSS(active.scores) : null;
  const activeAnswered = active
    ? Object.values(active.scores).filter((v) => v !== null).length
    : 0;
  const activeComplete = activeAnswered === NIHSS_ITEMS.length;

  const canProceed = latestFinalized !== null;

  return (
    <div className="min-h-screen bg-background">
      <StepNav />

      {/* スコアスティッキーバー */}
      <div className="bg-white border-b border-border sticky top-[52px] z-10">
        <div className="max-w-2xl mx-auto px-4 py-2 flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            {finalized.length > 0
              ? `記録済み ${finalized.length}回`
              : "未記録"}
          </span>
          {latestFinalized && (() => {
            const s = calcNIHSS(latestFinalized.scores);
            const { label, color } = severityLabel(s);
            return (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">{latestFinalized.timestamp}</span>
                <span className={cn("text-2xl font-bold tabular-nums", color)}>{s}</span>
                <span className="text-xs text-muted-foreground">/ 42</span>
                <span className={cn("text-xs font-medium px-2 py-0.5 rounded-full bg-muted", color)}>{label}</span>
              </div>
            );
          })()}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Brain className="w-5 h-5 text-primary" />
          NIHSS評価（反復測定）
        </h1>

        {/* 確定済み測定履歴 */}
        {finalized.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5" /> 確定済み記録
            </h2>
            {finalized.map((m, i) => {
              const score = calcNIHSS(m.scores);
              const { label, color } = severityLabel(score);
              return (
                <div key={m.id} className="bg-white rounded-xl border border-border p-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold text-muted-foreground">
                      {i + 1}
                    </div>
                    <div>
                      <p className="text-sm font-medium flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {m.timestamp}
                      </p>
                      <p className="text-xs text-muted-foreground">全15項目</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn("text-2xl font-bold tabular-nums", color)}>{score}</span>
                    <span className="text-xs text-muted-foreground">/ 42</span>
                    <span className={cn("text-xs px-2 py-0.5 rounded-full bg-muted font-medium", color)}>{label}</span>
                    <Lock className="w-3.5 h-3.5 text-muted-foreground ml-1" />
                  </div>
                </div>
              );
            })}
          </section>
        )}

        {/* 新規測定追加 or 入力フォーム */}
        {!active ? (
          <section className="bg-white rounded-xl border border-dashed border-primary/40 p-4 space-y-3">
            <h2 className="font-semibold flex items-center gap-2 text-primary">
              <PlusCircle className="w-4 h-4" />
              新規NIHSS測定
            </h2>
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <label className="text-xs font-medium text-muted-foreground block mb-1">測定時刻</label>
                <input
                  type="time"
                  value={newTimestamp}
                  onChange={(e) => setNewTimestamp(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <button
                onClick={() => setNewTimestamp(nowHHMM())}
                className="flex items-center gap-1.5 px-3 py-2 text-xs border border-border rounded-md text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors whitespace-nowrap"
              >
                <Clock className="w-3.5 h-3.5" /> 現在時刻
              </button>
              <button
                onClick={() => addNIHSSMeasurement(newTimestamp)}
                disabled={!newTimestamp}
                className="px-4 py-2 bg-primary text-white text-sm font-medium rounded-md hover:bg-primary/90 transition-colors whitespace-nowrap"
              >
                測定開始
              </button>
            </div>
          </section>
        ) : (
          <section className="space-y-3">
            {/* 入力中ヘッダー */}
            <div className="bg-white rounded-xl border border-primary/30 p-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold flex items-center gap-1.5 text-primary">
                  <Clock className="w-3.5 h-3.5" /> {active.timestamp} — 入力中
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {activeAnswered} / {NIHSS_ITEMS.length} 項目
                  {activeScore !== null && (
                    <> — 現在 <span className={cn("font-bold", severityLabel(activeScore).color)}>{activeScore}点</span></>
                  )}
                </p>
              </div>
              {activeComplete && (
                <button
                  onClick={() => finalizeNIHSS(active.id)}
                  className="flex items-center gap-1.5 px-3 py-2 bg-emerald-500 text-white text-sm font-medium rounded-lg hover:bg-emerald-600 transition-colors"
                >
                  <CheckCircle2 className="w-4 h-4" /> 確定
                </button>
              )}
            </div>

            {/* 15項目入力 */}
            {NIHSS_ITEMS.map((item) => {
              const current = active.scores[item.id];
              return (
                <div key={item.id} className="bg-white rounded-xl border border-border p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">{item.title}</h3>
                    {current !== null && (
                      <span className={cn(
                        "text-sm font-bold px-2 py-0.5 rounded-md",
                        current === 0 ? "bg-emerald-100 text-emerald-700" : "bg-orange-100 text-orange-700"
                      )}>
                        {current}点
                      </span>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    {item.options.map((opt) => (
                      <button
                        key={opt.score}
                        onClick={() => updateNIHSSScores(active.id, { [item.id]: opt.score })}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-lg border text-sm transition-all",
                          current === opt.score
                            ? opt.score === 0
                              ? "bg-emerald-50 border-emerald-400 text-emerald-800 font-medium"
                              : "bg-orange-50 border-orange-400 text-orange-800 font-medium"
                            : "bg-white border-border text-foreground hover:border-primary/40 hover:bg-primary/5"
                        )}
                      >
                        <span className="font-mono text-xs text-muted-foreground mr-2">{opt.score}</span>
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* 確定ボタン（下部） */}
            <div className="sticky bottom-4 z-10">
              <button
                onClick={() => activeComplete && finalizeNIHSS(active.id)}
                disabled={!activeComplete}
                className={cn(
                  "w-full py-4 rounded-xl font-bold text-base shadow-lg transition-all",
                  activeComplete
                    ? "bg-emerald-500 text-white hover:bg-emerald-600 active:scale-[0.98]"
                    : "bg-muted text-muted-foreground cursor-not-allowed"
                )}
              >
                {activeComplete
                  ? `${activeScore}点で確定 (${active.timestamp})`
                  : `あと ${NIHSS_ITEMS.length - activeAnswered} 項目`}
              </button>
            </div>
          </section>
        )}

        {/* スコア推移グラフ（2回以上の場合） */}
        {finalized.length >= 2 && (
          <section className="bg-white rounded-xl border border-border p-4 space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">スコア推移</h2>
            <div className="flex items-end gap-3 h-16">
              {finalized.map((m) => {
                const score = calcNIHSS(m.scores);
                const heightPct = Math.max(8, (score / 42) * 100);
                return (
                  <div key={m.id} className="flex flex-col items-center gap-1 flex-1">
                    <span className="text-xs font-bold">{score}</span>
                    <div
                      className={cn(
                        "w-full rounded-t",
                        score <= 4 ? "bg-amber-400" : score <= 15 ? "bg-orange-400" : "bg-red-500"
                      )}
                      style={{ height: `${heightPct}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{m.timestamp}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* 次へ */}
        <button
          onClick={() => router.push("/contraindications")}
          disabled={!canProceed}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-base transition-all",
            canProceed
              ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-md"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          {canProceed ? "次へ：禁忌確認" : "NIHSS評価を確定してください"}
        </button>
      </div>
    </div>
  );
}

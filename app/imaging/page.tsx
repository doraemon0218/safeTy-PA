"use client";

import { useRouter } from "next/navigation";
import { useCase } from "@/lib/store";
import { StepNav } from "@/components/StepNav";
import { TriStateToggle } from "@/components/TriStateToggle";
import { NumericInput } from "@/components/NumericInput";
import { evaluateImaging } from "@/lib/tpa";
import { Scan, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ImagingPage() {
  const router = useRouter();
  const { state, setImaging } = useCase();
  const { imaging, patient } = state;

  const imagingResult = evaluateImaging(imaging);

  const canNext =
    imaging.ctDone === true &&
    imaging.hemorrhage !== null &&
    (imaging.aspectsScore !== null);

  return (
    <div className="min-h-screen bg-background">
      <StepNav />

      {/* ステータスバナー */}
      {imaging.hemorrhage !== null && (
        <div
          className={cn(
            "sticky top-[52px] z-10 border-b",
            !imagingResult.safe ? "status-contraindicated" : "status-eligible"
          )}
        >
          <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm font-medium">
            {!imagingResult.safe ? (
              <><XCircle className="w-4 h-4 shrink-0" />画像上 t-PA 禁忌あり</>
            ) : (
              <><CheckCircle2 className="w-4 h-4 shrink-0" />画像上 出血なし</>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Scan className="w-5 h-5 text-primary" />
          画像評価
        </h1>

        {/* CT評価 */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-4">
          <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">CT評価</h2>

          <TriStateToggle
            label="単純CT撮影済み"
            value={imaging.ctDone}
            onChange={(v) => setImaging({ ctDone: v })}
          />

          {imaging.ctDone === true && (
            <>
              <TriStateToggle
                label="頭蓋内出血"
                value={imaging.hemorrhage}
                onChange={(v) => setImaging({ hemorrhage: v })}
                dangerOnTrue
              />

              {imaging.hemorrhage === true && (
                <div className="rounded-lg p-3 border status-contraindicated text-sm font-semibold">
                  頭蓋内出血：t-PA 絶対禁忌
                </div>
              )}

              <TriStateToggle
                label="広範な早期虚血変化（ASPECTS低下）"
                value={imaging.earlyIschemicChanges}
                onChange={(v) => setImaging({ earlyIschemicChanges: v })}
                dangerOnTrue
              />

              <div>
                <NumericInput
                  label="ASPECTSスコア"
                  value={imaging.aspectsScore}
                  onChange={(v) => setImaging({ aspectsScore: v })}
                  min={0}
                  max={10}
                  unit="点"
                  dangerBelow={7}
                  warnBelow={8}
                />
                <div className="mt-2 text-xs text-muted-foreground space-y-0.5">
                  <p>• 10点：正常　• ≥ 7点：適応目安　• ≤ 6点：出血リスク高（慎重判断）</p>
                  <p>C, P, IC, I, M1〜M6の10領域で評価</p>
                </div>
              </div>

              {imaging.aspectsScore !== null && imaging.aspectsScore < 7 && (
                <div className="rounded-lg p-3 border status-warning text-sm">
                  ASPECTS {imaging.aspectsScore}点：広範な早期虚血変化。出血リスクが高く、症例によっては適応を慎重に検討してください。
                </div>
              )}

              <TriStateToggle
                label="大血管閉塞（LVO）の疑い"
                value={imaging.largeVesselOcclusion}
                onChange={(v) => setImaging({ largeVesselOcclusion: v })}
              />
              {imaging.largeVesselOcclusion === true && (
                <div className="rounded-lg p-3 border bg-blue-50 border-blue-300 text-blue-800 text-sm">
                  LVO疑い：t-PAに加え、血栓回収療法（EVT）の適応を同時に検討してください
                </div>
              )}
            </>
          )}
        </section>

        {/* MRI評価（wake-up strokeの場合） */}
        {patient.onsetUnknown && (
          <section className="bg-white rounded-xl border border-border p-4 space-y-4">
            <h2 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">MRI評価（発症時刻不明）</h2>
            <p className="text-xs text-muted-foreground">
              Wake-up stroke では DWI/FLAIR 不一致の確認が適応判断の根拠となります（WAKE-UP試験）
            </p>

            <TriStateToggle
              label="MRI施行済み"
              value={imaging.mriDone}
              onChange={(v) => setImaging({ mriDone: v })}
            />

            {imaging.mriDone === true && (
              <>
                <TriStateToggle
                  label="DWI/FLAIR 不一致あり"
                  value={imaging.dwiFlairMismatch}
                  onChange={(v) => setImaging({ dwiFlairMismatch: v })}
                />
                {imaging.dwiFlairMismatch === true && (
                  <div className="rounded-lg p-3 border status-eligible text-sm">
                    DWI/FLAIR不一致：発症3時間以内の可能性が高く、t-PA適応を検討できます
                  </div>
                )}
                {imaging.dwiFlairMismatch === false && (
                  <div className="rounded-lg p-3 border status-contraindicated text-sm">
                    DWI/FLAIR不一致なし：発症3時間以上経過している可能性。適応外となる場合が多い
                  </div>
                )}
              </>
            )}
          </section>
        )}

        {/* 問題点サマリー */}
        {imagingResult.issues.length > 0 && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-2">
            <p className="font-bold text-red-700 text-sm">画像上の問題点</p>
            {imagingResult.issues.map((issue, i) => (
              <p key={i} className="text-sm text-red-800 flex items-start gap-1.5">
                <span>•</span> {issue}
              </p>
            ))}
          </div>
        )}

        <button
          onClick={() => router.push("/dosing")}
          disabled={!canNext}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-base transition-all",
            canNext
              ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-md"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          次へ：投与計算
        </button>
      </div>
    </div>
  );
}

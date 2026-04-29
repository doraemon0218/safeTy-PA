"use client";

import { useRouter } from "next/navigation";
import { useCase } from "@/lib/store";
import { StepNav } from "@/components/StepNav";
import { TriStateToggle } from "@/components/TriStateToggle";
import { evaluateContraindications } from "@/lib/tpa";
import { ShieldAlert, ShieldCheck, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { ContraindicationFlags } from "@/types/patient";

type ContraindicationDef = {
  key: keyof ContraindicationFlags;
  label: string;
  note?: string;
};

const ABSOLUTE: ContraindicationDef[] = [
  { key: "icBleedingOnCT", label: "頭蓋内出血（CT確認）", note: "画像評価で確認" },
  { key: "sah", label: "くも膜下出血の疑い" },
  { key: "intracranialLesion", label: "脳腫瘍・AVM・脳動脈瘤" },
  { key: "recentStrokeOrTrauma", label: "3ヶ月以内の脳卒中・頭部外傷・頭蓋内手術" },
  { key: "recentGiUroBleeding", label: "3週間以内の消化管・尿路出血" },
  { key: "recentMajorSurgery", label: "2週間以内の大手術・重篤な外傷" },
  { key: "recentArterialPuncture", label: "1週間以内の動脈穿刺（圧迫困難部位）" },
  { key: "recentLumbarPuncture", label: "3日以内の腰椎穿刺" },
  { key: "anticoagulant", label: "抗凝固療法中", note: "ワルファリン（INR>1.7）/ DOAC 48時間以内" },
  { key: "lowPlatelets", label: "血小板 < 10万/μL", note: "検査値から自動判定可能" },
  { key: "uncontrolledHT", label: "降圧治療後もBP > 185/110 mmHg" },
  { key: "abnormalGlucose", label: "血糖 < 50 または > 400 mg/dL", note: "検査値から自動判定可能" },
  { key: "acutePancreatitis", label: "急性膵炎" },
  { key: "endocarditis", label: "感染性心内膜炎の疑い" },
  { key: "activeBleeding", label: "活動性の内出血（月経除く）" },
  { key: "severeLiverDisease", label: "重篤な肝機能障害" },
];

const RELATIVE: ContraindicationDef[] = [
  { key: "rapidImprovement", label: "症状の急速な改善（自然回復の可能性）" },
  { key: "minorDeficit", label: "軽微な神経症状（NIHSS ≤ 4）" },
  { key: "severeStroke", label: "重症脳卒中（NIHSS ≥ 22）" },
  { key: "age80plus", label: "80歳超" },
  { key: "diabetesWithPriorStroke", label: "糖尿病 + 脳卒中既往の合併" },
  { key: "recentMI", label: "3ヶ月以内の心筋梗塞" },
  { key: "pregnancy", label: "妊娠" },
];

export default function ContraindicationsPage() {
  const router = useRouter();
  const { state, setContraindications } = useCase();
  const { contraindications } = state;

  const result = evaluateContraindications(contraindications);

  const absoluteAnswered = ABSOLUTE.filter(
    (d) => contraindications[d.key] !== null
  ).length;
  const relativeAnswered = RELATIVE.filter(
    (d) => contraindications[d.key] !== null
  ).length;
  const allAnswered =
    absoluteAnswered === ABSOLUTE.length && relativeAnswered === RELATIVE.length;

  return (
    <div className="min-h-screen bg-background">
      <StepNav />

      {/* サマリーバナー */}
      {(result.absolute.length > 0 || (allAnswered && result.absolute.length === 0)) && (
        <div
          className={cn(
            "sticky top-[52px] z-10 border-b",
            result.absolute.length > 0 ? "status-contraindicated" : "status-eligible"
          )}
        >
          <div className="max-w-2xl mx-auto px-4 py-2.5 flex items-center gap-2 text-sm font-medium">
            {result.absolute.length > 0 ? (
              <>
                <ShieldAlert className="w-4 h-4 shrink-0" />
                絶対禁忌あり（{result.absolute.length}件）— t-PA 投与不可
              </>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4 shrink-0" />
                絶対禁忌なし
                {result.relative.length > 0 && ` — 相対禁忌 ${result.relative.length}件あり（慎重判断）`}
              </>
            )}
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          禁忌・注意事項の確認
        </h1>

        {/* 絶対禁忌 */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-red-700 flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" />
              絶対禁忌
            </h2>
            <span className="text-xs text-muted-foreground">{absoluteAnswered} / {ABSOLUTE.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">1つでも「あり」の場合はt-PA投与不可</p>

          <div className="space-y-3">
            {ABSOLUTE.map((def) => (
              <div key={def.key}>
                <TriStateToggle
                  label={def.label + (def.note ? `（${def.note}）` : "")}
                  value={contraindications[def.key]}
                  onChange={(v) => setContraindications({ [def.key]: v })}
                  dangerOnTrue={true}
                />
              </div>
            ))}
          </div>
        </section>

        {/* 相対禁忌 */}
        <section className="bg-white rounded-xl border border-border p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-bold text-amber-700 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" />
              相対禁忌（慎重判断）
            </h2>
            <span className="text-xs text-muted-foreground">{relativeAnswered} / {RELATIVE.length}</span>
          </div>
          <p className="text-xs text-muted-foreground">あり＝禁忌ではないが、リスク・ベネフィットの慎重な検討が必要</p>

          <div className="space-y-3">
            {RELATIVE.map((def) => (
              <TriStateToggle
                key={def.key}
                label={def.label}
                value={contraindications[def.key]}
                onChange={(v) => setContraindications({ [def.key]: v })}
                dangerOnTrue={false}
              />
            ))}
          </div>
        </section>

        {/* 絶対禁忌リスト表示 */}
        {result.absolute.length > 0 && (
          <div className="rounded-xl border border-red-300 bg-red-50 p-4 space-y-2">
            <p className="font-bold text-red-700 text-sm flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4" /> 確認された絶対禁忌
            </p>
            <ul className="space-y-1">
              {result.absolute.map((item) => (
                <li key={item.key} className="text-sm text-red-800 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span> {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* 相対禁忌リスト表示 */}
        {result.warning && result.eligible && (
          <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 space-y-2">
            <p className="font-bold text-amber-700 text-sm flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4" /> 確認された相対禁忌
            </p>
            <ul className="space-y-1">
              {result.relative.map((item) => (
                <li key={item.key} className="text-sm text-amber-800 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span> {item.label}
                </li>
              ))}
            </ul>
          </div>
        )}

        <button
          onClick={() => router.push("/imaging")}
          disabled={!allAnswered}
          className={cn(
            "w-full py-4 rounded-xl font-bold text-base transition-all",
            allAnswered
              ? "bg-primary text-white hover:bg-primary/90 active:scale-[0.98] shadow-md"
              : "bg-muted text-muted-foreground cursor-not-allowed"
          )}
        >
          次へ：画像評価
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useCase } from "@/lib/store";
import { StepNav } from "@/components/StepNav";
import { calcRSIDosing } from "@/lib/tpa";
import {
  ShieldAlert, Wind, Move, Zap, ChevronDown, ChevronUp,
  CheckCircle2, AlertTriangle, Syringe, Activity, Eye
} from "lucide-react";
import { cn } from "@/lib/utils";

// チェックリストアイテム（クライアント側状態で管理）
function CheckItem({ label, sub }: { label: string; sub?: string }) {
  const [checked, setChecked] = useState(false);
  return (
    <button
      onClick={() => setChecked((v) => !v)}
      className={cn(
        "w-full flex items-start gap-2.5 text-left py-2 transition-colors",
        checked && "opacity-50"
      )}
    >
      <span className={cn(
        "mt-0.5 w-5 h-5 rounded border-2 flex-shrink-0 flex items-center justify-center transition-colors",
        checked ? "bg-emerald-500 border-emerald-500" : "border-border"
      )}>
        {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
      </span>
      <div>
        <p className={cn("text-sm", checked && "line-through")}>{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
    </button>
  );
}

function Section({
  title, icon: Icon, children, defaultOpen = true, danger = false
}: {
  title: string; icon: React.ElementType; children: React.ReactNode;
  defaultOpen?: boolean; danger?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-xl border border-border overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "w-full flex items-center justify-between px-4 py-3 transition-colors",
          danger ? "bg-red-50 hover:bg-red-100" : "hover:bg-muted/30"
        )}
      >
        <span className={cn(
          "font-semibold flex items-center gap-2 text-sm",
          danger ? "text-red-700" : "text-foreground"
        )}>
          <Icon className="w-4 h-4" />
          {title}
        </span>
        {open ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-2 border-t border-border space-y-1">
          {children}
        </div>
      )}
    </div>
  );
}

// 薬剤カード
function DrugCard({
  color, name, role, dose, volume, concentration, timing, note
}: {
  color: string; name: string; role: string; dose: string;
  volume: string; concentration: string; timing?: string; note?: string;
}) {
  return (
    <div className={cn("rounded-lg border p-3 space-y-1.5", color)}>
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-bold text-sm">{name}</p>
          <p className="text-xs opacity-75">{role}</p>
        </div>
        {timing && (
          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-white/60 whitespace-nowrap">{timing}</span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-2 text-sm">
        <div>
          <p className="text-xs opacity-70">投与量</p>
          <p className="font-bold text-base">{dose}</p>
        </div>
        <div>
          <p className="text-xs opacity-70">容量（{concentration}）</p>
          <p className="font-bold text-base">{volume}</p>
        </div>
      </div>
      {note && <p className="text-xs opacity-80 border-t border-white/30 pt-1.5">{note}</p>}
    </div>
  );
}

export default function SafetyPage() {
  const { state } = useCase();
  const { vitals, patient } = state;

  const gcs = (vitals.gcsE ?? 0) + (vitals.gcsV ?? 0) + (vitals.gcsM ?? 0);
  const gcsEntered = vitals.gcsE !== null && vitals.gcsV !== null && vitals.gcsM !== null;
  const needsAirway = gcsEntered && gcs <= 8;

  const weight = patient.weight;
  const rsi = weight ? calcRSIDosing(weight) : null;

  return (
    <div className="min-h-screen bg-background">
      <StepNav />
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">

        <h1 className="text-xl font-bold flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-primary" />
          安全対策ガイド（ISLS準拠）
        </h1>

        {/* GCS表示バナー */}
        {gcsEntered && (
          <div className={cn(
            "rounded-xl border p-3 flex items-center justify-between text-sm font-medium",
            needsAirway ? "status-contraindicated" : "status-eligible"
          )}>
            <span>
              GCS {gcsEntered ? `E${vitals.gcsE}V${vitals.gcsV}M${vitals.gcsM} = ${gcs}点` : "未入力"}
            </span>
            {needsAirway
              ? <span className="text-xs font-bold">⚠️ 気道確保を検討</span>
              : <span className="text-xs">気道自己維持の可能性あり</span>}
          </div>
        )}

        {/* ─── ISLS Primary Survey ─── */}
        <Section title="ISLS Primary Survey（初期評価）" icon={Activity}>
          <div className="space-y-3 pt-1">
            {[
              {
                letter: "A",
                title: "Airway（気道）",
                items: ["呼名反応・口腔内確認（嘔吐物・義歯）", "気道開通性の評価", "頭部後屈・顎先挙上 / 下顎挙上法", "GCS ≤ 8 → 気管挿管を検討（下記 RSI ガイド参照）"],
              },
              {
                letter: "B",
                title: "Breathing（呼吸）",
                items: ["呼吸数・SpO₂測定", "SpO₂ < 94% → 酸素投与（目標 94〜98%）", "呼吸様式の確認（Cheyne-Stokes など）"],
              },
              {
                letter: "C",
                title: "Circulation（循環）",
                items: ["血圧・心拍数測定", "t-PA前目標：BP ≤ 185/110 mmHg", "末梢静脈路2本確保、採血（CBC・凝固・血糖）"],
              },
              {
                letter: "D",
                title: "Disability（意識・神経）",
                items: ["GCS、瞳孔（左右差・対光反射）", "NIHSS測定（時刻記録）", "血糖測定（低血糖の除外）"],
              },
              {
                letter: "E",
                title: "Exposure（脱衣・体温）",
                items: ["全身観察（外傷・発疹・出血痕の確認）", "体温測定（発熱 → 感染性疾患の除外）", "保温（低体温回避）"],
              },
            ].map(({ letter, title, items }) => (
              <div key={letter} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-primary flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5">
                  {letter}
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-sm mb-1">{title}</p>
                  <ul className="space-y-0.5">
                    {items.map((item, i) => (
                      <li key={i} className={cn(
                        "text-xs flex items-start gap-1.5",
                        item.includes("RSI") && "text-red-700 font-medium"
                      )}>
                        <span className="mt-0.5 opacity-40">•</span>{item}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* ─── CT/MRI 移動前チェック ─── */}
        <Section title="CT/MRI 搬送前チェックリスト" icon={Move}>
          <p className="text-xs text-muted-foreground mb-2">
            モニター装着・気道確認を完了してから移動してください
          </p>
          <CheckItem label="バイタルサイン安定を確認" sub="BP・HR・SpO₂・呼吸数" />
          <CheckItem label="静脈路確保・点滴速度確認" />
          <CheckItem label="心電図モニター・SpO₂プローブ装着" />
          <CheckItem label="気道保護（必要に応じて挿管済み）" />
          <CheckItem label="吸引器・BVMを携帯" />
          <CheckItem label="救急カート or 蘇生物品を搬送に同伴" />
          <CheckItem label="同行者の確認（医師 or 看護師）" />
          <CheckItem label="MRI室：金属除去・ペースメーカー禁忌確認" />
          <CheckItem label="CT/MRI 室スタッフへ引き継ぎ" />
        </Section>

        {/* ─── 気道確保ガイド ─── */}
        {needsAirway && (
          <>
            <div className="rounded-xl border-2 border-red-400 bg-red-50 px-4 py-3 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5 shrink-0" />
              <div>
                <p className="font-bold text-red-700 text-sm">GCS ≤ 8：気管挿管を推奨</p>
                <p className="text-xs text-red-700 mt-0.5">
                  自己気道維持が困難な状態です。CT/MRI 搬送前に安全な気道確保を行ってください。<br />
                  脳卒中では急激な血圧変動が出血拡大リスクとなるため、<strong>優しい RSI（Gentle RSI）</strong>を行います。
                </p>
              </div>
            </div>

            {/* SOAPMD チェック */}
            <Section title="SOAPMD — 挿管準備チェック" icon={Wind} danger>
              <p className="text-xs text-muted-foreground mb-3">
                挿管を開始する前に全項目を確認してください
              </p>
              <div className="space-y-3">
                {[
                  {
                    letter: "S",
                    title: "Suction（吸引）",
                    items: [
                      "吸引器の電源・吸引圧確認（-400〜-600 mmHg）",
                      "ヤンカー吸引管 + カテーテル準備",
                      "口腔内・咽頭の吸引（挿管直前）",
                    ],
                  },
                  {
                    letter: "O",
                    title: "Oxygen（酸素）",
                    items: [
                      "100% 酸素で3分間前酸素化（SpO₂ ≥ 95% 目標）",
                      "BVM（バッグマスク換気）準備・接続確認",
                      "フロー：10〜15 L/min（NRBM または BVM）",
                    ],
                  },
                  {
                    letter: "A",
                    title: "Airway（気道器具）",
                    items: [
                      "気管チューブ：男性 8.0〜8.5 mm / 女性 7.0〜7.5 mm（±1サイズ準備）",
                      "スタイレット挿入・先端をカフ内に収める",
                      "喉頭鏡（直視型 or ビデオ喉頭鏡）・ブレード確認",
                      "バイトブロック、固定テープ",
                      "10 mL シリンジ（カフ用）",
                    ],
                  },
                  {
                    letter: "P",
                    title: "Positioning（体位）",
                    items: [
                      "スニッフィングポジション：頭部を10 cm 挙上",
                      "ベッド高さを術者の剣状突起に調整",
                      "頭頸部をできるだけ正中位に保つ",
                      "顎先を前方に引き出す（下顎前突位）",
                    ],
                  },
                  {
                    letter: "M",
                    title: "Monitor（モニター）",
                    items: [
                      "心電図・SpO₂・血圧（連続測定、非観血的）",
                      "ETCO₂ カプノメーター準備（挿管確認用）",
                      "IV ライン確保・確実な点滴路の確認",
                    ],
                  },
                  {
                    letter: "D",
                    title: "Drugs（薬剤）",
                    items: [
                      "フェンタニル：シリンジ準備 → 挿管 3分前に投与",
                      "プロポフォール または ミダゾラム：誘導薬",
                      "ロクロニウム：筋弛緩薬（投与直前に準備）",
                      "スガマデクス：救急逆転薬として必ず準備",
                      "アトロピン（徐脈発生時の備え）",
                    ],
                  },
                ].map(({ letter, title, items }) => (
                  <div key={letter} className="flex gap-3 py-1.5 border-b border-border last:border-0">
                    <div className="w-7 h-7 rounded-full bg-red-100 border-2 border-red-400 flex items-center justify-center text-red-700 text-xs font-bold shrink-0 mt-0.5">
                      {letter}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-sm text-red-800 mb-1.5">{title}</p>
                      <div className="space-y-0.5">
                        {items.map((item, i) => (
                          <CheckItem key={i} label={item} />
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Section>

            {/* RSI 薬剤計算 */}
            <Section title="Gentle RSI — 薬剤投与量" icon={Syringe} danger>
              {!weight ? (
                <div className="rounded-lg p-3 border status-warning text-sm">
                  患者情報ページで体重を入力してください（計算に必要です）
                </div>
              ) : rsi ? (
                <div className="space-y-4">
                  <div className="text-xs text-muted-foreground bg-muted rounded-lg px-3 py-2 space-y-1">
                    <p className="font-semibold text-foreground">脳卒中での Gentle RSI の原則</p>
                    <p>• 血圧急上昇を防ぐため<strong>フェンタニル前投薬</strong>が重要</p>
                    <p>• プロポフォールは低容量から（血圧低下注意）。低血圧時はミダゾラムを選択</p>
                    <p>• ロクロニウム 1.2 mg/kg → 60〜90秒で完全弛緩</p>
                    <p>• スガマデクスを必ず手元に準備（緊急逆転）</p>
                  </div>

                  <p className="text-xs font-medium text-muted-foreground">体重 {weight} kg をもとに計算</p>

                  {/* ① フェンタニル */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">① 前投薬（挿管 3分前）</p>
                    <DrugCard
                      color="bg-blue-50 border-blue-200 text-blue-900"
                      name="フェンタニル"
                      role="前投薬 — 喉頭反射・血圧急上昇を抑制"
                      dose={`${rsi.fentanyl.dose} μg（1 μg/kg）`}
                      volume={`${rsi.fentanyl.volume} mL`}
                      concentration={rsi.fentanyl.concentration}
                      timing="挿管3分前"
                      note="ゆっくり 1〜2分かけて静注。急速投与で胸壁硬直（木製胸郭）に注意。"
                    />
                  </div>

                  {/* ② 誘導薬 */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">② 誘導薬（意識消失）</p>
                    <div className="space-y-2">
                      <DrugCard
                        color="bg-purple-50 border-purple-200 text-purple-900"
                        name="プロポフォール（第1選択）"
                        role="誘導薬 — 血圧低下注意。若年・血圧安定例に"
                        dose={`${rsi.propofol.doseMin}〜${rsi.propofol.doseMax} mg（0.5〜1.0 mg/kg）`}
                        volume={`${rsi.propofol.volumeMin}〜${rsi.propofol.volumeMax} mL`}
                        concentration={rsi.propofol.concentration}
                        note="血圧 < 100 mmHg では使用を避ける。20〜30秒で静注。"
                      />
                      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
                        <div className="flex-1 h-px bg-border" /> または <div className="flex-1 h-px bg-border" />
                      </div>
                      <DrugCard
                        color="bg-indigo-50 border-indigo-200 text-indigo-900"
                        name="ミダゾラム（代替）"
                        role="誘導薬 — 血圧低下が軽度。低血圧・高齢例に"
                        dose={`${rsi.midazolam.doseMin}〜${rsi.midazolam.doseMax} mg（0.05〜0.1 mg/kg）`}
                        volume={`${rsi.midazolam.volumeMin}〜${rsi.midazolam.volumeMax} mL`}
                        concentration={rsi.midazolam.concentration}
                        note="呼吸抑制が比較的緩徐。効果発現に 2〜3 分かかる場合あり。"
                      />
                    </div>
                  </div>

                  {/* ③ ロクロニウム */}
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground mb-2">③ 筋弛緩薬（誘導薬直後）</p>
                    <DrugCard
                      color="bg-orange-50 border-orange-200 text-orange-900"
                      name="ロクロニウム"
                      role="脱分極性筋弛緩薬（RSI用量）"
                      dose={`${rsi.rocuronium.dose} mg（1.2 mg/kg）`}
                      volume={`${rsi.rocuronium.volume} mL`}
                      concentration={rsi.rocuronium.concentration}
                      timing="誘導薬直後"
                      note="60〜90秒で挿管条件完成。スガマデクスで即時逆転可能。"
                    />
                  </div>

                  {/* スガマデクス（逆転薬） */}
                  <div className="rounded-lg border border-emerald-300 bg-emerald-50 p-3 space-y-1.5">
                    <p className="text-xs font-bold text-emerald-800 flex items-center gap-1.5">
                      <ShieldAlert className="w-3.5 h-3.5" /> 緊急逆転薬（必ず手元に準備）
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-emerald-900">
                      <div>
                        <p className="text-xs opacity-70">スガマデクス</p>
                        <p className="font-bold">{rsi.sugammadex.dose} mg（16 mg/kg）</p>
                        <p className="text-xs">{rsi.sugammadex.volume} mL（{rsi.sugammadex.concentration}）</p>
                      </div>
                      <div className="text-xs opacity-80 flex items-center">
                        挿管不能・換気不能（CICV）時に即座に静注。60秒以内に完全逆転。
                      </div>
                    </div>
                  </div>

                  {/* 投与シーケンス */}
                  <div className="rounded-lg bg-muted px-4 py-3 space-y-2">
                    <p className="text-xs font-semibold">RSI 投与シーケンス</p>
                    {[
                      { step: "T-3min", label: "フェンタニル 静注（ゆっくり1〜2分）" },
                      { step: "T-0:00", label: "プロポフォール or ミダゾラム 静注" },
                      { step: "T+0:10", label: "ロクロニウム 静注" },
                      { step: "T+1:00", label: "挿管実施（60〜90秒で弛緩完成）" },
                      { step: "T+1:30", label: "胸郭挙上・ETCO₂・両側呼吸音確認" },
                    ].map(({ step, label }) => (
                      <div key={step} className="flex items-start gap-2.5 text-xs">
                        <span className="font-mono text-primary font-semibold w-14 shrink-0">{step}</span>
                        <span>{label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}
            </Section>

            {/* 挿管後確認 */}
            <Section title="挿管後確認" icon={Eye}>
              <CheckItem label="胸郭挙上を目視確認（左右対称）" />
              <CheckItem label="ETCO₂ 波形確認（35〜45 mmHg）" />
              <CheckItem label="両側肺野の呼吸音聴診" />
              <CheckItem label="SpO₂ 上昇確認（目標 94〜98%）" />
              <CheckItem label="チューブ深さ確認（門歯から男性22〜23 cm、女性20〜21 cm）" />
              <CheckItem label="固定テープ or チューブホルダーで固定" />
              <CheckItem label="バイトブロック挿入" />
              <CheckItem label="人工呼吸器設定（または搬送用BVM）" />
              <CheckItem label="胸部X線（挿管位置確認）" />
            </Section>
          </>
        )}

        {/* ─── 痙攣対策 ─── */}
        <Section title="痙攣対策" icon={Zap} defaultOpen={false}>
          <p className="text-xs text-muted-foreground mb-3">
            脳卒中発症時に痙攣が生じた場合（またはリスクが高い場合）の対応
          </p>
          <div className="space-y-3">
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 space-y-1">
              <p className="font-semibold">発作時の初期対応</p>
              <CheckItem label="安全な体位（側臥位）に変換" />
              <CheckItem label="時刻と持続時間を記録" />
              <CheckItem label="吸引・気道開通維持" />
              <CheckItem label="SpO₂モニタリング・酸素投与" />
              <CheckItem label="静脈路確保（未確保の場合）" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-muted-foreground">抗てんかん薬（重積発作時）</p>
              {weight && [
                {
                  name: "ジアゼパム（第1選択）",
                  dose: `${Math.round(weight * 0.1 * 10) / 10}〜${Math.round(weight * 0.3 * 10) / 10} mg（0.1〜0.3 mg/kg）IV`,
                  note: "2〜5 mg/分で静注。呼吸抑制に注意。最大 10 mg。",
                },
                {
                  name: "ロラゼパム（代替）",
                  dose: `${Math.round(weight * 0.05 * 100) / 100}〜${Math.round(weight * 0.1 * 100) / 100} mg（0.05〜0.1 mg/kg）IV`,
                  note: "ゆっくり静注。最大 4 mg。",
                },
                {
                  name: "フェニトイン（維持療法）",
                  dose: `${Math.round(weight * 15 * 10) / 10}〜${Math.round(weight * 20 * 10) / 10} mg（15〜20 mg/kg）IV`,
                  note: "50 mg/分以下でゆっくり点滴。血圧・心拍数モニタリング。",
                },
              ].map(({ name, dose, note }) => (
                <div key={name} className="rounded-lg border border-border p-3 space-y-1">
                  <p className="text-sm font-semibold">{name}</p>
                  <p className="text-sm text-primary font-medium">{dose}</p>
                  <p className="text-xs text-muted-foreground">{note}</p>
                </div>
              ))}
            </div>
            <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900 space-y-1">
              <p className="font-semibold">t-PA投与後の痙攣発作</p>
              <p>• 出血性梗塞転化を強く疑う → <strong>t-PA投与を直ちに中止</strong></p>
              <p>• 緊急頭部CTを施行</p>
              <p>• 神経内科・脳外科へ緊急コンサルト</p>
            </div>
          </div>
        </Section>

      </div>
    </div>
  );
}

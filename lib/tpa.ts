import type {
  CaseState, DosePlan, NIHSSScores, NIHSSMeasurement,
  ContraindicationFlags, ImagingFindings,
} from "@/types/patient";

export function calcNIHSS(scores: NIHSSScores): number {
  return Object.values(scores).reduce<number>((sum, v) => sum + (v ?? 0), 0);
}

export function latestNIHSS(history: NIHSSMeasurement[]): NIHSSMeasurement | null {
  const finalized = history.filter((m) => m.finalized);
  return finalized.length > 0 ? finalized[finalized.length - 1] : null;
}

export function activeNIHSS(history: NIHSSMeasurement[]): NIHSSMeasurement | null {
  return history.find((m) => !m.finalized) ?? null;
}

export function calcTimeFromOnset(
  onsetTime: string,
  arrivalTime: string,
  onsetUnknown: boolean
): number | null {
  if (onsetUnknown || !onsetTime || !arrivalTime) return null;
  const [oh, om] = onsetTime.split(":").map(Number);
  const [ah, am] = arrivalTime.split(":").map(Number);
  let diff = (ah * 60 + am) - (oh * 60 + om);
  if (diff < 0) diff += 24 * 60;
  return diff;
}

export function calcDose(weight: number, protocol: "japan" | "international"): DosePlan {
  const mgPerKg = protocol === "japan" ? 0.6 : 0.9;
  const maxDose = protocol === "japan" ? 60 : 90;
  const totalDose = Math.min(Math.round(weight * mgPerKg * 10) / 10, maxDose);
  const bolusDose = Math.round(totalDose * 0.1 * 10) / 10;
  const infusionDose = Math.round((totalDose - bolusDose) * 10) / 10;
  const concentration = 1;
  const bolusVolume = Math.round(bolusDose / concentration * 10) / 10;
  const infusionVolume = Math.round(infusionDose / concentration * 10) / 10;
  const infusionRate = Math.round(infusionVolume);
  const now = new Date();
  const startTime = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  return { protocol, totalDose, bolusDose, infusionDose, concentration, bolusVolume, infusionVolume, infusionRate, startTime };
}

// RSI（迅速導入挿管）薬剤投与量計算
export interface RSIDosing {
  weight: number;
  fentanyl: { dose: number; unit: string; volume: number; concentration: string; timing: string };
  propofol: { doseMin: number; doseMax: number; unit: string; volumeMin: number; volumeMax: number; concentration: string };
  midazolam: { doseMin: number; doseMax: number; unit: string; volumeMin: number; volumeMax: number; concentration: string };
  rocuronium: { dose: number; unit: string; volume: number; concentration: string };
  sugammadex: { dose: number; unit: string; volume: number; concentration: string };
}

export function calcRSIDosing(weight: number): RSIDosing {
  const fentanylDose = Math.round(weight * 1);
  const fentanylVolume = Math.round(fentanylDose / 50 * 10) / 10; // 50 μg/mL

  const propofolDoseMin = Math.round(weight * 0.5);
  const propofolDoseMax = Math.round(weight * 1.0);
  const propofolVolMin = Math.round(propofolDoseMin / 10 * 10) / 10; // 10 mg/mL
  const propofolVolMax = Math.round(propofolDoseMax / 10 * 10) / 10;

  const midazolamDoseMin = Math.round(weight * 0.05 * 10) / 10;
  const midazolamDoseMax = Math.round(weight * 0.1 * 10) / 10;
  const midazolamVolMin = Math.round(midazolamDoseMin / 5 * 10) / 10; // 5 mg/mL
  const midazolamVolMax = Math.round(midazolamDoseMax / 5 * 10) / 10;

  const rocuroniumDose = Math.round(weight * 1.2 * 10) / 10;
  const rocuroniumVol = Math.round(rocuroniumDose / 10 * 10) / 10; // 10 mg/mL

  const sugammadexDose = Math.round(weight * 16); // 16 mg/kg for immediate reversal
  const sugammadexVol = Math.round(sugammadexDose / 200 * 10) / 10; // 200 mg/2mL → 100 mg/mL

  return {
    weight,
    fentanyl: { dose: fentanylDose, unit: "μg", volume: fentanylVolume, concentration: "50 μg/mL（0.1 mg/mL）", timing: "挿管3分前" },
    propofol: { doseMin: propofolDoseMin, doseMax: propofolDoseMax, unit: "mg", volumeMin: propofolVolMin, volumeMax: propofolVolMax, concentration: "10 mg/mL（1%）" },
    midazolam: { doseMin: midazolamDoseMin, doseMax: midazolamDoseMax, unit: "mg", volumeMin: midazolamVolMin, volumeMax: midazolamVolMax, concentration: "5 mg/mL" },
    rocuronium: { dose: rocuroniumDose, unit: "mg", volume: rocuroniumVol, concentration: "10 mg/mL" },
    sugammadex: { dose: sugammadexDose, unit: "mg", volume: sugammadexVol, concentration: "200 mg/2 mL" },
  };
}

export type ContraindicationResult = {
  absolute: { key: keyof ContraindicationFlags; label: string }[];
  relative: { key: keyof ContraindicationFlags; label: string }[];
  eligible: boolean;
  warning: boolean;
};

const ABSOLUTE_LABELS: Partial<Record<keyof ContraindicationFlags, string>> = {
  icBleedingOnCT: "CT上の頭蓋内出血",
  sah: "くも膜下出血の疑い",
  intracranialLesion: "脳腫瘍・AVM・脳動脈瘤",
  recentStrokeOrTrauma: "3ヶ月以内の脳卒中・頭部外傷・頭蓋内手術",
  recentGiUroBleeding: "3週間以内の消化管・尿路出血",
  recentMajorSurgery: "2週間以内の大手術・重篤な外傷",
  recentArterialPuncture: "1週間以内の動脈穿刺（圧迫困難部位）",
  recentLumbarPuncture: "3日以内の腰椎穿刺",
  anticoagulant: "抗凝固療法中（INR>1.7 / DOAC48h以内）",
  lowPlatelets: "血小板 < 10万/μL",
  uncontrolledHT: "降圧治療後もBP > 185/110 mmHg",
  abnormalGlucose: "血糖 < 50 または > 400 mg/dL",
  acutePancreatitis: "急性膵炎",
  endocarditis: "感染性心内膜炎の疑い",
  activeBleeding: "活動性の内出血（月経除く）",
  severeLiverDisease: "重篤な肝機能障害",
};

const RELATIVE_LABELS: Partial<Record<keyof ContraindicationFlags, string>> = {
  rapidImprovement: "症状の急速な改善（自然回復の可能性）",
  minorDeficit: "軽微な神経症状（NIHSS ≤ 4）",
  severeStroke: "重症脳卒中（NIHSS ≥ 22）",
  age80plus: "80歳超",
  diabetesWithPriorStroke: "糖尿病 + 脳卒中既往の合併",
  recentMI: "3ヶ月以内の心筋梗塞",
  pregnancy: "妊娠",
};

export function evaluateContraindications(flags: ContraindicationFlags): ContraindicationResult {
  const absolute = (Object.keys(ABSOLUTE_LABELS) as (keyof ContraindicationFlags)[])
    .filter((k) => flags[k] === true)
    .map((k) => ({ key: k, label: ABSOLUTE_LABELS[k]! }));
  const relative = (Object.keys(RELATIVE_LABELS) as (keyof ContraindicationFlags)[])
    .filter((k) => flags[k] === true)
    .map((k) => ({ key: k, label: RELATIVE_LABELS[k]! }));
  return { absolute, relative, eligible: absolute.length === 0, warning: relative.length > 0 };
}

export function evaluateImaging(imaging: ImagingFindings): { safe: boolean; issues: string[] } {
  const issues: string[] = [];
  if (imaging.hemorrhage === true) issues.push("頭蓋内出血が確認されています（絶対禁忌）");
  if (imaging.aspectsScore !== null && imaging.aspectsScore < 7)
    issues.push(`ASPECTS ${imaging.aspectsScore}点：広範な早期虚血変化（出血リスク高）`);
  return { safe: issues.length === 0, issues };
}

export function getTimeWindowStatus(minutesFromOnset: number | null, onsetUnknown: boolean) {
  if (onsetUnknown || minutesFromOnset === null)
    return { status: "unknown" as const, label: "発症時刻不明（wake-up stroke）：MRI DWI/FLAIR不一致で適応検討" };
  if (minutesFromOnset <= 270) {
    const remaining = 270 - minutesFromOnset;
    return { status: "ok" as const, label: `発症から${minutesFromOnset}分（残り${remaining}分）` };
  }
  if (minutesFromOnset <= 360)
    return { status: "warning" as const, label: `発症から${minutesFromOnset}分（4.5時間超：慎重に適応検討）` };
  return { status: "over" as const, label: `発症から${minutesFromOnset}分（6時間超：原則適応外）` };
}

export function getSummary(state: CaseState) {
  const latest = latestNIHSS(state.nihssHistory);
  const nihssScore = latest ? calcNIHSS(latest.scores) : 0;
  const timeMinutes = calcTimeFromOnset(
    state.patient.onsetTime, state.patient.arrivalTime, state.patient.onsetUnknown
  );
  const contraindicationResult = evaluateContraindications(state.contraindications);
  const imagingResult = evaluateImaging(state.imaging);
  const timeWindowStatus = getTimeWindowStatus(timeMinutes, state.patient.onsetUnknown);
  const canProceed =
    contraindicationResult.eligible &&
    imagingResult.safe &&
    timeWindowStatus.status !== "over";
  return { nihssScore, timeMinutes, contraindicationResult, imagingResult, timeWindowStatus, canProceed };
}

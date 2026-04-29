export interface PatientInfo {
  age: number | null;
  weight: number | null; // kg
  sex: "male" | "female" | null;
  onsetTime: string;
  lastKnownWell: string;
  arrivalTime: string;
  onsetUnknown: boolean;
}

export interface Vitals {
  sbp: number | null;
  dbp: number | null;
  hr: number | null;
  spo2: number | null;
  bloodGlucose: number | null;
  temperature: number | null;
  platelets: number | null;
  inr: number | null;
  aptt: boolean | null;
  // GCS（意識レベル）
  gcsE: number | null; // 開眼 1-4
  gcsV: number | null; // 言語 1-5
  gcsM: number | null; // 運動 1-6
}

export type NIHSSScores = {
  "1a": number | null;
  "1b": number | null;
  "1c": number | null;
  "2": number | null;
  "3": number | null;
  "4": number | null;
  "5a": number | null;
  "5b": number | null;
  "6a": number | null;
  "6b": number | null;
  "7": number | null;
  "8": number | null;
  "9": number | null;
  "10": number | null;
  "11": number | null;
};

export interface NIHSSMeasurement {
  id: string;
  timestamp: string; // "HH:MM"
  scores: NIHSSScores;
  finalized: boolean;
}

export interface ContraindicationFlags {
  icBleedingOnCT: boolean | null;
  sah: boolean | null;
  intracranialLesion: boolean | null;
  recentStrokeOrTrauma: boolean | null;
  recentGiUroBleeding: boolean | null;
  recentMajorSurgery: boolean | null;
  recentArterialPuncture: boolean | null;
  recentLumbarPuncture: boolean | null;
  anticoagulant: boolean | null;
  lowPlatelets: boolean | null;
  uncontrolledHT: boolean | null;
  abnormalGlucose: boolean | null;
  acutePancreatitis: boolean | null;
  endocarditis: boolean | null;
  activeBleeding: boolean | null;
  severeLiverDisease: boolean | null;
  rapidImprovement: boolean | null;
  minorDeficit: boolean | null;
  severeStroke: boolean | null;
  age80plus: boolean | null;
  diabetesWithPriorStroke: boolean | null;
  recentMI: boolean | null;
  pregnancy: boolean | null;
}

export interface ImagingFindings {
  ctDone: boolean | null;
  mriDone: boolean | null;
  hemorrhage: boolean | null;
  earlyIschemicChanges: boolean | null;
  aspectsScore: number | null;
  dwiFlairMismatch: boolean | null;
  largeVesselOcclusion: boolean | null;
}

export interface DosePlan {
  protocol: "japan" | "international";
  totalDose: number;
  bolusDose: number;
  infusionDose: number;
  concentration: number;
  bolusVolume: number;
  infusionVolume: number;
  infusionRate: number;
  startTime: string;
}

export interface CaseState {
  patient: PatientInfo;
  vitals: Vitals;
  nihssHistory: NIHSSMeasurement[];
  contraindications: ContraindicationFlags;
  imaging: ImagingFindings;
  dose: DosePlan | null;
}

export const emptyNIHSSScores: NIHSSScores = {
  "1a": null, "1b": null, "1c": null,
  "2": null, "3": null, "4": null,
  "5a": null, "5b": null,
  "6a": null, "6b": null,
  "7": null, "8": null,
  "9": null, "10": null, "11": null,
};

export const emptyPatient: PatientInfo = {
  age: null, weight: null, sex: null,
  onsetTime: "", lastKnownWell: "", arrivalTime: "",
  onsetUnknown: false,
};

export const emptyVitals: Vitals = {
  sbp: null, dbp: null, hr: null, spo2: null,
  bloodGlucose: null, temperature: null,
  platelets: null, inr: null, aptt: null,
  gcsE: null, gcsV: null, gcsM: null,
};

export const emptyContraindications: ContraindicationFlags = {
  icBleedingOnCT: null, sah: null, intracranialLesion: null,
  recentStrokeOrTrauma: null, recentGiUroBleeding: null,
  recentMajorSurgery: null, recentArterialPuncture: null,
  recentLumbarPuncture: null, anticoagulant: null,
  lowPlatelets: null, uncontrolledHT: null, abnormalGlucose: null,
  acutePancreatitis: null, endocarditis: null, activeBleeding: null,
  severeLiverDisease: null, rapidImprovement: null, minorDeficit: null,
  severeStroke: null, age80plus: null, diabetesWithPriorStroke: null,
  recentMI: null, pregnancy: null,
};

export const emptyImaging: ImagingFindings = {
  ctDone: null, mriDone: null, hemorrhage: null,
  earlyIschemicChanges: null, aspectsScore: null,
  dwiFlairMismatch: null, largeVesselOcclusion: null,
};

export const initialCaseState: CaseState = {
  patient: emptyPatient,
  vitals: emptyVitals,
  nihssHistory: [],
  contraindications: emptyContraindications,
  imaging: emptyImaging,
  dose: null,
};

"use client";

import {
  createContext, useContext, useState, useCallback, type ReactNode,
} from "react";
import type {
  CaseState, PatientInfo, Vitals, NIHSSScores, NIHSSMeasurement,
  ContraindicationFlags, ImagingFindings, DosePlan,
} from "@/types/patient";
import { initialCaseState, emptyNIHSSScores } from "@/types/patient";

type CaseContextType = {
  state: CaseState;
  setPatient: (p: Partial<PatientInfo>) => void;
  setVitals: (v: Partial<Vitals>) => void;
  // NIHSS history
  addNIHSSMeasurement: (timestamp: string) => void;
  updateNIHSSScores: (id: string, scores: Partial<NIHSSScores>) => void;
  finalizeNIHSS: (id: string) => void;
  setContraindications: (c: Partial<ContraindicationFlags>) => void;
  setImaging: (i: Partial<ImagingFindings>) => void;
  setDose: (d: DosePlan | null) => void;
  resetCase: () => void;
};

const CaseContext = createContext<CaseContextType | null>(null);

function makeId() {
  return `nihss_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}

export function CaseProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CaseState>(initialCaseState);

  const setPatient = useCallback((p: Partial<PatientInfo>) =>
    setState((s) => ({ ...s, patient: { ...s.patient, ...p } })), []);

  const setVitals = useCallback((v: Partial<Vitals>) =>
    setState((s) => ({ ...s, vitals: { ...s.vitals, ...v } })), []);

  const addNIHSSMeasurement = useCallback((timestamp: string) => {
    const entry: NIHSSMeasurement = {
      id: makeId(),
      timestamp,
      scores: { ...emptyNIHSSScores },
      finalized: false,
    };
    setState((s) => ({ ...s, nihssHistory: [...s.nihssHistory, entry] }));
  }, []);

  const updateNIHSSScores = useCallback((id: string, scores: Partial<NIHSSScores>) => {
    setState((s) => ({
      ...s,
      nihssHistory: s.nihssHistory.map((m) =>
        m.id === id && !m.finalized
          ? { ...m, scores: { ...m.scores, ...scores } }
          : m
      ),
    }));
  }, []);

  const finalizeNIHSS = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      nihssHistory: s.nihssHistory.map((m) =>
        m.id === id ? { ...m, finalized: true } : m
      ),
    }));
  }, []);

  const setContraindications = useCallback((c: Partial<ContraindicationFlags>) =>
    setState((s) => ({ ...s, contraindications: { ...s.contraindications, ...c } })), []);

  const setImaging = useCallback((i: Partial<ImagingFindings>) =>
    setState((s) => ({ ...s, imaging: { ...s.imaging, ...i } })), []);

  const setDose = useCallback((d: DosePlan | null) =>
    setState((s) => ({ ...s, dose: d })), []);

  const resetCase = useCallback(() => setState(initialCaseState), []);

  return (
    <CaseContext.Provider value={{
      state, setPatient, setVitals,
      addNIHSSMeasurement, updateNIHSSScores, finalizeNIHSS,
      setContraindications, setImaging, setDose, resetCase,
    }}>
      {children}
    </CaseContext.Provider>
  );
}

export function useCase() {
  const ctx = useContext(CaseContext);
  if (!ctx) throw new Error("useCase must be used within CaseProvider");
  return ctx;
}

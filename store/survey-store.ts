"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AnswerValue } from "@/types/questionnaire";

interface SurveyState {
  sessionId: string | null;
  responseId: string | null;
  questionnaireId: string;
  consentAcceptedAt: string | null;
  currentStepIndex: number;
  answers: Record<string, string>;
  isHydrated: boolean;
  isSaving: boolean;
  lastSavedAt: string | null;

  setSession: (sessionId: string, responseId: string) => void;
  setConsent: (timestamp: string) => void;
  setStepIndex: (index: number) => void;
  setAnswer: (questionId: string, value: string) => void;
  setAnswers: (answers: Record<string, string>) => void;
  setSaving: (saving: boolean) => void;
  setLastSaved: (at: string) => void;
  setHydrated: (v: boolean) => void;
  reset: () => void;
}

const initialState = {
  sessionId: null,
  responseId: null,
  questionnaireId: "flourishing-workplace",
  consentAcceptedAt: null,
  currentStepIndex: 0,
  answers: {} as Record<string, string>,
  isHydrated: false,
  isSaving: false,
  lastSavedAt: null,
};

export const useSurveyStore = create<SurveyState>()(
  persist(
    (set) => ({
      ...initialState,
      setSession: (sessionId, responseId) =>
        set({ sessionId, responseId }),
      setConsent: (timestamp) => set({ consentAcceptedAt: timestamp }),
      setStepIndex: (index) => set({ currentStepIndex: index }),
      setAnswer: (questionId, value) =>
        set((s) => ({
          answers: { ...s.answers, [questionId]: value },
        })),
      setAnswers: (answers) => set({ answers }),
      setSaving: (isSaving) => set({ isSaving }),
      setLastSaved: (lastSavedAt) => set({ lastSavedAt }),
      setHydrated: (isHydrated) => set({ isHydrated }),
      reset: () => set({ ...initialState, isHydrated: true }),
    }),
    {
      name: "flourishing-survey-v1",
      partialize: (s) => ({
        sessionId: s.sessionId,
        responseId: s.responseId,
        questionnaireId: s.questionnaireId,
        consentAcceptedAt: s.consentAcceptedAt,
        currentStepIndex: s.currentStepIndex,
        answers: s.answers,
        lastSavedAt: s.lastSavedAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated(true);
      },
    }
  )
);

export function toAnswerPayload(
  sectionId: string,
  questionId: string,
  value: string
): AnswerValue {
  return { questionId, sectionId, value };
}

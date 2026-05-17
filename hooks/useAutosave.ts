"use client";

import { useCallback } from "react";
import { useSurveyStore } from "@/store/survey-store";
import { sanitizeText } from "@/lib/validation";

export type PageAnswer = {
  questionId: string;
  sectionId: string;
  value: string;
};

export function useAutosave(preview = false) {
  const { responseId, sessionId, offlineMode, setSaving, setLastSaved } =
    useSurveyStore();

  const savePageAnswers = useCallback(
    async (items: PageAnswer[]) => {
      if (preview || offlineMode || !responseId || !sessionId || items.length === 0) {
        return;
      }

      setSaving(true);
      try {
        const results = await Promise.all(
          items.map(({ questionId, sectionId, value }) =>
            fetch(`/api/responses/${responseId}/answers`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                sessionId,
                questionId,
                sectionId,
                value: sanitizeText(value),
              }),
            })
          )
        );
        if (results.some((r) => !r.ok)) {
          throw new Error("Save failed");
        }
        setLastSaved(new Date().toISOString());
      } catch (e) {
        console.error("Autosave failed", e);
        throw e;
      } finally {
        setSaving(false);
      }
    },
    [preview, offlineMode, responseId, sessionId, setSaving, setLastSaved]
  );

  const syncProgress = useCallback(
    async (payload: {
      currentStepIndex: number;
      progressPercentage: number;
      lastSectionId?: string;
      lastQuestionId?: string;
    }) => {
      if (preview || offlineMode || !responseId || !sessionId) return;

      await fetch(`/api/responses/${responseId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, ...payload }),
      });
    },
    [preview, offlineMode, responseId, sessionId]
  );

  return { savePageAnswers, syncProgress };
}

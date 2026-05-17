"use client";

import { useCallback, useRef } from "react";
import { useSurveyStore } from "@/store/survey-store";
import { sanitizeText } from "@/lib/validation";

export function useAutosave(preview = false) {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { responseId, sessionId, offlineMode, setSaving, setLastSaved } =
    useSurveyStore();

  const saveAnswer = useCallback(
    async (questionId: string, sectionId: string, value: string) => {
      if (preview || offlineMode || !responseId || !sessionId) return;

      const clean = sanitizeText(value);

      if (debounceRef.current) clearTimeout(debounceRef.current);

      debounceRef.current = setTimeout(async () => {
        setSaving(true);
        try {
          await fetch(`/api/responses/${responseId}/answers`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              sessionId,
              questionId,
              sectionId,
              value: clean,
            }),
          });
          setLastSaved(new Date().toISOString());
        } catch (e) {
          console.error("Autosave failed", e);
        } finally {
          setSaving(false);
        }
      }, 400);
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

  return { saveAnswer, syncProgress };
}

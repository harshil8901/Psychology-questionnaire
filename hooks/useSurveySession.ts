"use client";

import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSurveyStore } from "@/store/survey-store";
import { DEFAULT_QUESTIONNAIRE_ID } from "@/lib/questionnaire";

export function useSurveySession() {
  const store = useSurveyStore();

  const ensureSession = useCallback(async () => {
    let sessionId = store.sessionId;
    if (!sessionId) {
      sessionId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : uuidv4();
    }

    if (store.responseId) {
      return { sessionId, responseId: store.responseId };
    }

    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        questionnaireId: store.questionnaireId || DEFAULT_QUESTIONNAIRE_ID,
      }),
    });

    if (!res.ok) throw new Error("Failed to create session");
    const data = (await res.json()) as {
      responseId: string;
      sessionId: string;
      answers?: Record<string, string>;
      currentStepIndex?: number;
      consentAcceptedAt?: string | null;
    };

    store.setSession(data.sessionId, data.responseId);
    if (data.answers) store.setAnswers(data.answers);
    if (data.currentStepIndex != null)
      store.setStepIndex(data.currentStepIndex);
    if (data.consentAcceptedAt) store.setConsent(data.consentAcceptedAt);

    return { sessionId: data.sessionId, responseId: data.responseId };
  }, [store]);

  const acceptConsent = useCallback(async () => {
    const { responseId, sessionId } = await ensureSession();
    const timestamp = new Date().toISOString();

    await fetch(`/api/responses/${responseId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        consentAcceptedAt: timestamp,
      }),
    });

    store.setConsent(timestamp);
    return timestamp;
  }, [ensureSession, store]);

  return { ensureSession, acceptConsent };
}

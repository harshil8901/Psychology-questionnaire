"use client";

import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSurveyStore } from "@/store/survey-store";
import { DEFAULT_QUESTIONNAIRE_ID } from "@/lib/questionnaire";

type SessionResponse = {
  responseId: string;
  sessionId: string;
  answers?: Record<string, string>;
  currentStepIndex?: number;
  consentAcceptedAt?: string | null;
  offline?: boolean;
};

async function saveConsentToServer(
  responseId: string,
  sessionId: string,
  timestamp: string
): Promise<boolean> {
  const res = await fetch(`/api/responses/${responseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      consentAcceptedAt: timestamp,
    }),
  });
  return res.ok;
}

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
      return {
        sessionId,
        responseId: store.responseId,
        offline: store.offlineMode,
      };
    }

    const res = await fetch("/api/responses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sessionId,
        questionnaireId: store.questionnaireId || DEFAULT_QUESTIONNAIRE_ID,
      }),
    });

    const data = (await res.json()) as SessionResponse & { error?: string };

    if (!res.ok) {
      console.warn("Session API error:", data.error ?? res.status);
      store.setSession(sessionId, sessionId, true);
      return { sessionId, responseId: sessionId, offline: true };
    }

    store.setSession(data.sessionId, data.responseId, Boolean(data.offline));
    if (data.answers) store.setAnswers(data.answers);
    if (data.currentStepIndex != null) store.setStepIndex(data.currentStepIndex);
    if (data.consentAcceptedAt) store.setConsent(data.consentAcceptedAt);

    return {
      sessionId: data.sessionId,
      responseId: data.responseId,
      offline: data.offline,
    };
  }, [store]);

  const acceptConsent = useCallback(async () => {
    const timestamp = new Date().toISOString();
    let { responseId, sessionId, offline } = await ensureSession();

    if (!offline) {
      let saved = await saveConsentToServer(responseId, sessionId, timestamp);

      if (!saved) {
        store.clearResponseId();
        const retry = await ensureSession();
        responseId = retry.responseId;
        sessionId = retry.sessionId;
        offline = retry.offline;
        if (!offline) {
          saved = await saveConsentToServer(responseId, sessionId, timestamp);
        }
      }

      if (!saved && !offline) {
        console.warn("Consent could not be synced to server; continuing locally.");
      }
    }

    store.setConsent(timestamp);
    return timestamp;
  }, [ensureSession, store]);

  return { ensureSession, acceptConsent };
}

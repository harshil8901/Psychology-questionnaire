"use client";

import { useCallback } from "react";
import { v4 as uuidv4 } from "uuid";
import { useSurveyStore } from "@/store/survey-store";

type SessionResponse = {
  responseId: string;
  sessionId: string;
  answers?: Record<string, string>;
  currentStepIndex?: number;
  consentAcceptedAt?: string | null;
  offline?: boolean;
  error?: string;
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

  const ensureSession = useCallback(
    async (questionnaireId: string) => {
      const priorQuestionnaireId = store.questionnaireId;
      store.setQuestionnaireId(questionnaireId);

      let sessionId = store.sessionId;
      if (!sessionId) {
        sessionId =
          typeof crypto !== "undefined" && crypto.randomUUID
            ? crypto.randomUUID()
            : uuidv4();
      }

      if (store.responseId && priorQuestionnaireId === questionnaireId) {
        return {
          sessionId,
          responseId: store.responseId,
          offline: store.offlineMode,
        };
      }

      if (store.responseId && priorQuestionnaireId !== questionnaireId) {
        store.clearProgress();
      }

      const res = await fetch("/api/responses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionnaireId,
        }),
      });

      let data: SessionResponse & { error?: string };
      try {
        data = (await res.json()) as SessionResponse & { error?: string };
      } catch {
        throw new Error(
          res.ok
            ? "Invalid server response"
            : "Could not reach the server. Check your connection."
        );
      }

      if (!res.ok) {
        throw new Error(
          data.error ??
            (res.status === 404
              ? "This questionnaire is not available."
              : "Could not start the survey. Please try again.")
        );
      }

      store.setSession(data.sessionId, data.responseId, Boolean(data.offline));
      if (data.answers) store.setAnswers(data.answers);
      if (data.currentStepIndex != null) store.setStepIndex(data.currentStepIndex);
      if (data.consentAcceptedAt) store.setConsent(data.consentAcceptedAt);

      return {
        sessionId: data.sessionId,
        responseId: data.responseId,
        offline: Boolean(data.offline),
      };
    },
    [store]
  );

  const acceptConsent = useCallback(
    async (questionnaireId: string) => {
      const timestamp = new Date().toISOString();
      const { responseId, sessionId, offline } = await ensureSession(questionnaireId);

      if (!offline) {
        let saved = await saveConsentToServer(responseId, sessionId, timestamp);

        if (!saved) {
          store.clearResponseId();
          const retry = await ensureSession(questionnaireId);
          if (!retry.offline) {
            saved = await saveConsentToServer(
              retry.responseId,
              retry.sessionId,
              timestamp
            );
          }
        }

        if (!saved) {
          throw new Error("Could not save consent. Please try again.");
        }
      }

      store.setConsent(timestamp);
      return timestamp;
    },
    [ensureSession, store]
  );

  return { ensureSession, acceptConsent };
}

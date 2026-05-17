import { randomUUID } from "crypto";

/** Local-only session when database is not configured (dev/demo). */
export function createOfflineSessionPayload(sessionId: string) {
  const responseId = sessionId.includes("-") ? sessionId : randomUUID();

  return {
    responseId,
    sessionId,
    answers: {} as Record<string, string>,
    currentStepIndex: 0,
    consentAcceptedAt: null as string | null,
    offline: true,
  };
}

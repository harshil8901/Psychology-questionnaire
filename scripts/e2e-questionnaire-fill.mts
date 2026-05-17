/**
 * End-to-end questionnaire fill test (API flow matching the web app).
 * Usage: BASE_URL=https://psychology-questionnaire.vercel.app npx tsx scripts/e2e-questionnaire-fill.mts
 */
import { questionnaire } from "../data/questionnaires/flourishing-workplace";
import { getAllQuestions, isQuestionVisible } from "../lib/questionnaire";
import type { Question } from "../types/questionnaire";

const BASE = process.env.BASE_URL ?? "https://psychology-questionnaire.vercel.app";

function answerForQuestion(q: Question): string {
  switch (q.type) {
    case "text":
      if (q.id === "age") return "28";
      if (q.id === "name") return `E2E Test ${Date.now().toString(36)}`;
      return "Test response";
    case "single_choice":
      return q.options[0]!;
    case "likert":
      return q.scale[Math.floor(q.scale.length / 2)]!;
    default:
      return "Test";
  }
}

function buildAnswers(): Record<string, string> {
  const answers: Record<string, string> = {};
  for (const q of getAllQuestions(questionnaire)) {
    if (!isQuestionVisible(q, answers)) continue;
    answers[q.id] = answerForQuestion(q);
  }
  return answers;
}

async function main() {
  const sessionId = `e2e-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const answers = buildAnswers();
  const questionCount = Object.keys(answers).length;

  console.log(`\n🧪 E2E questionnaire fill`);
  console.log(`   Base URL: ${BASE}`);
  console.log(`   Questions to answer: ${questionCount}\n`);

  const sessionRes = await fetch(`${BASE}/api/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      questionnaireId: questionnaire.id,
    }),
  });
  const session = (await sessionRes.json()) as {
    responseId?: string;
    error?: string;
  };
  if (!sessionRes.ok || !session.responseId) {
    console.error("❌ Session create failed:", sessionRes.status, session);
    process.exit(1);
  }
  console.log(`✓ Session created: ${session.responseId}`);

  const consentRes = await fetch(`${BASE}/api/responses/${session.responseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      consentAcceptedAt: new Date().toISOString(),
    }),
  });
  const consent = await consentRes.json();
  if (!consentRes.ok) {
    console.error("❌ Consent failed:", consentRes.status, consent);
    process.exit(1);
  }
  console.log("✓ Consent accepted");

  const submitRes = await fetch(`${BASE}/api/submit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      sessionId,
      responseId: session.responseId,
      honeypot: "",
      answers,
    }),
  });
  const submit = (await submitRes.json()) as {
    responseId?: string;
    completedAt?: string;
    error?: string;
    alreadyCompleted?: boolean;
  };

  if (!submitRes.ok) {
    console.error("❌ Submit failed:", submitRes.status, submit);
    process.exit(1);
  }

  console.log("✓ Survey submitted");
  console.log(`   Response ID: ${submit.responseId}`);
  console.log(`   Completed at: ${submit.completedAt ?? "(already completed)"}`);
  console.log("\n✅ E2E test passed — check Admin → Responses for the new entry.\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

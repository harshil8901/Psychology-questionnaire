/**
 * Full E2E: submit survey, verify in admin list, test export endpoints.
 * Usage: BASE_URL=http://localhost:3000 npx tsx scripts/e2e-full.mts
 *
 * Requires .env.local with Supabase + ADMIN_USERNAME + ADMIN_PASSWORD.
 */
import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";
import * as XLSX from "xlsx";
import { getAllQuestions, isQuestionVisible } from "../lib/questionnaire";
import { getActiveQuestionnaireId, loadQuestionnaire } from "../lib/questionnaire-loader";
import { questionnaireSchema } from "../lib/questionnaire-schema";
import type { Question, Questionnaire } from "../types/questionnaire";

const BASE = process.env.BASE_URL ?? "http://localhost:3000";

function loadEnvFile(name: string): void {
  const path = resolve(process.cwd(), name);
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(".env.local");
loadEnvFile(".env");

async function resolveQuestionnaireId(): Promise<string> {
  if (process.env.QUESTIONNAIRE_ID) return process.env.QUESTIONNAIRE_ID;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/questionnaire_configs?select=id&is_active=eq.true&limit=1`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ id: string }>;
        if (rows[0]?.id) return rows[0].id;
      }
    } catch {
      // fall through to loader
    }
  }

  return getActiveQuestionnaireId();
}

async function loadQuestionnaireForE2E(id: string): Promise<Questionnaire> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (url && key) {
    try {
      const res = await fetch(
        `${url}/rest/v1/questionnaire_configs?select=config&id=eq.${encodeURIComponent(id)}&limit=1`,
        {
          headers: {
            apikey: key,
            Authorization: `Bearer ${key}`,
          },
        }
      );
      if (res.ok) {
        const rows = (await res.json()) as Array<{ config: unknown }>;
        if (rows[0]?.config) {
          return questionnaireSchema.parse(rows[0].config) as Questionnaire;
        }
      }
    } catch {
      // fall through
    }
  }
  return loadQuestionnaire(id);
}

function assert(condition: unknown, message: string): never | void {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

function answerForQuestion(q: Question, index: number): string {
  switch (q.type) {
    case "text":
      if (q.id === "age") return "28";
      if (q.id === "name") return `E2E Full ${Date.now().toString(36)}`;
      if (q.id === "email") return `e2e-${Date.now()}@example.com`;
      if (q.id.includes("experience") || q.id === "years_of_experience") return "5";
      return "Test response";
    case "single_choice":
      if (q.id === "gender") {
        return ["Male", "Female", "Non-binary"][index % 3]!;
      }
      return q.options[0]!;
    case "likert":
      return q.scale[Math.floor(q.scale.length / 2)]!;
    default:
      return "Test";
  }
}

function buildAnswers(questionnaire: Awaited<ReturnType<typeof loadQuestionnaire>>) {
  const answers: Record<string, string> = {};
  let i = 0;
  for (const q of getAllQuestions(questionnaire)) {
    if (!isQuestionVisible(q, answers)) continue;
    answers[q.id] = answerForQuestion(q, i++);
  }
  return answers;
}

async function adminLogin(): Promise<string> {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  assert(Boolean(username && password), "ADMIN_USERNAME and ADMIN_PASSWORD required in .env.local");

  const res = await fetch(`${BASE}/api/admin/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  const setCookie = res.headers.get("set-cookie") ?? "";
  assert(res.ok && setCookie.includes("admin_session"), `admin login failed: ${res.status}`);
  return setCookie.split(";")[0]!;
}

function parseXlsxSheets(buffer: ArrayBuffer): { names: string[]; rowCounts: Record<string, number> } {
  const wb = XLSX.read(buffer, { type: "array" });
  const rowCounts: Record<string, number> = {};
  for (const name of wb.SheetNames) {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name]!) as unknown[];
    rowCounts[name] = rows.length;
  }
  return { names: wb.SheetNames, rowCounts };
}

async function main() {
  console.log(`\n🧪 Full E2E test`);
  console.log(`   Base URL: ${BASE}\n`);

  const questionnaireId = await resolveQuestionnaireId();
  const questionnaire = await loadQuestionnaireForE2E(questionnaireId);
  const answers = buildAnswers(questionnaire);
  const testName = answers.name ?? "";

  console.log(
    `   Questionnaire: ${questionnaireId} (config id: ${questionnaire.id}, ${Object.keys(answers).length} answers)`
  );

  const sessionId = `e2e-full-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const sessionRes = await fetch(`${BASE}/api/responses`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, questionnaireId }),
  });
  const session = (await sessionRes.json()) as { responseId?: string; error?: string };
  assert(sessionRes.ok && session.responseId, `session create: ${sessionRes.status} ${session.error ?? ""}`);
  console.log(`✓ Session: ${session.responseId}`);

  const consentRes = await fetch(`${BASE}/api/responses/${session.responseId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sessionId, consentAcceptedAt: new Date().toISOString() }),
  });
  assert(consentRes.ok, `consent: ${consentRes.status}`);
  console.log("✓ Consent saved");

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
  const submit = (await submitRes.json()) as { completedAt?: string; error?: string };
  assert(submitRes.ok && submit.completedAt, `submit: ${submitRes.status} ${submit.error ?? ""}`);
  console.log(`✓ Submitted at ${submit.completedAt}`);
  assert(answers.gender !== undefined, "gender answer present in payload");

  const cookie = await adminLogin();
  console.log("✓ Admin login");

  const listRes = await fetch(
    `${BASE}/api/admin/responses?status=completed&limit=50&sort=desc`,
    { headers: { Cookie: cookie } }
  );
  const list = (await listRes.json()) as {
    responses?: Array<{
      id: string;
      demographic_snapshot?: Record<string, string> | null;
    }>;
  };
  assert(listRes.ok, `admin list: ${listRes.status}`);
  const found = list.responses?.find((r) => r.id === session.responseId);
  assert(Boolean(found), "response appears in admin list");
  assert(
    found!.demographic_snapshot?.gender === answers.gender,
    `demographic_snapshot.gender matches (${found!.demographic_snapshot?.gender} vs ${answers.gender})`
  );
  assert(found!.demographic_snapshot?.name === testName, "demographic_snapshot.name matches");
  console.log(`✓ Response in admin (${found!.demographic_snapshot?.gender}, ${found!.demographic_snapshot?.name})`);

  for (const [label, split] of [
    ["combined", "combined"],
    ["gender segregated", "gender"],
  ] as const) {
    const exportRes = await fetch(`${BASE}/api/admin/export?format=xlsx&split=${split}`, {
      headers: { Cookie: cookie },
    });
    assert(exportRes.ok, `${label} export: ${exportRes.status}`);
    const buf = await exportRes.arrayBuffer();
    assert(buf.byteLength > 100, `${label} export not empty`);
    const { names, rowCounts } = parseXlsxSheets(buf);
    if (split === "combined") {
      assert(names.length === 1 && names[0] === "Responses", `combined sheets: ${names.join(", ")}`);
      assert((rowCounts.Responses ?? 0) >= 1, "combined has at least one row");
    } else {
      assert(names.length >= 1, "gender export has sheets");
      const genderSheet = names.find((n) => n === answers.gender);
      assert(Boolean(genderSheet), `gender sheet "${answers.gender}" in [${names.join(", ")}]`);
      assert((rowCounts[genderSheet!] ?? 0) >= 1, `gender sheet has our row`);
    }
    console.log(`✓ ${label} XLSX (${names.length} sheet(s): ${names.join(", ")})`);
  }

  console.log("\n✅ Full E2E passed\n");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

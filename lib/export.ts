import * as XLSX from "xlsx";
import { getAllQuestions } from "@/lib/questionnaire";
import { loadQuestionnaire } from "@/lib/questionnaire-loader";
import type { AnswerRow, ResponseRow } from "@/types/database";

export async function buildExportRows(
  responses: ResponseRow[],
  answersByResponse: Map<string, AnswerRow[]>
) {
  const questionnaireCache = new Map<string, Awaited<ReturnType<typeof loadQuestionnaire>>>();
  const allQuestionIds = new Set<string>();

  for (const r of responses) {
    if (!questionnaireCache.has(r.questionnaire_id)) {
      questionnaireCache.set(r.questionnaire_id, await loadQuestionnaire(r.questionnaire_id));
    }
    getAllQuestions(questionnaireCache.get(r.questionnaire_id)!).forEach((q) =>
      allQuestionIds.add(q.id)
    );
  }

  const questionIds = [...allQuestionIds];

  const headers = [
    "response_id",
    "session_id",
    "questionnaire_id",
    "created_at",
    "completed_at",
    "is_completed",
    "progress_percentage",
    ...questionIds,
  ];

  const rows = responses.map((r) => {
    const answers = answersByResponse.get(r.id) ?? [];
    const answerMap = Object.fromEntries(answers.map((a) => [a.question_id, a.answer]));

    return {
      response_id: r.id,
      session_id: r.session_id,
      questionnaire_id: r.questionnaire_id,
      created_at: r.created_at,
      completed_at: r.completed_at ?? "",
      is_completed: r.is_completed,
      progress_percentage: r.progress_percentage,
      ...Object.fromEntries(questionIds.map((id) => [id, answerMap[id] ?? ""])),
    };
  });

  return { headers, rows };
}

export function toCSV(headers: string[], rows: Record<string, unknown>[]): string {
  const lines = [
    headers.join(","),
    ...rows.map((row) =>
      headers
        .map((h) => {
          const val = String(row[h] ?? "");
          return `"${val.replace(/"/g, '""')}"`;
        })
        .join(",")
    ),
  ];
  return lines.join("\n");
}

const GENDER_SHEET_ORDER = ["Male", "Female", "Non-binary", "Prefer not to say"];

export function getResponseGender(
  response: ResponseRow,
  answersByResponse: Map<string, AnswerRow[]>
): string | null {
  const fromSnapshot = response.demographic_snapshot?.gender?.trim();
  if (fromSnapshot) return fromSnapshot;

  const genderAnswer = (answersByResponse.get(response.id) ?? []).find(
    (a) => a.question_id === "gender"
  )?.answer?.trim();
  if (genderAnswer) return genderAnswer;

  return null;
}

function sanitizeSheetName(name: string): string {
  const cleaned = name.replace(/[\\/?*[\]:]/g, "").trim().slice(0, 31);
  return cleaned || "Sheet";
}

function uniqueSheetName(base: string, used: Set<string>): string {
  const name = sanitizeSheetName(base);
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  let n = 2;
  while (n < 100) {
    const suffix = ` (${n})`;
    const candidate = sanitizeSheetName(
      base.slice(0, Math.max(1, 31 - suffix.length)) + suffix
    );
    if (!used.has(candidate)) {
      used.add(candidate);
      return candidate;
    }
    n++;
  }
  const fallback = sanitizeSheetName(`${base}-${Date.now()}`);
  used.add(fallback);
  return fallback;
}

function sortGenders(genders: string[]): string[] {
  return [...genders].sort((a, b) => {
    const ai = GENDER_SHEET_ORDER.indexOf(a);
    const bi = GENDER_SHEET_ORDER.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

export function toXLSXBuffer(headers: string[], rows: Record<string, unknown>[]): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Responses");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

export function toGenderSegregatedXLSXBuffer(
  headers: string[],
  rows: Record<string, unknown>[],
  responses: ResponseRow[],
  answersByResponse: Map<string, AnswerRow[]>
): ArrayBuffer {
  const genderByResponseId = new Map(
    responses.map((r) => [r.id, getResponseGender(r, answersByResponse)])
  );

  const groups = new Map<string, Record<string, unknown>[]>();
  for (const row of rows) {
    const responseId = String(row.response_id ?? "");
    const gender = genderByResponseId.get(responseId)?.trim();
    if (!gender) continue;

    const list = groups.get(gender) ?? [];
    list.push(row);
    groups.set(gender, list);
  }

  const wb = XLSX.utils.book_new();
  const usedNames = new Set<string>();

  for (const gender of sortGenders([...groups.keys()])) {
    const groupRows = groups.get(gender) ?? [];
    const sheetName = uniqueSheetName(gender, usedNames);
    const ws = XLSX.utils.json_to_sheet(groupRows, { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }

  if (groups.size === 0) {
    const ws = XLSX.utils.json_to_sheet([], { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
  }

  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

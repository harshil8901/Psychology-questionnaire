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

export function toXLSXBuffer(headers: string[], rows: Record<string, unknown>[]): ArrayBuffer {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Responses");
  return XLSX.write(wb, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
}

/**
 * Verifies combined and gender-segregated XLSX export logic.
 * Run: npx tsx scripts/test-export.mts
 */
import * as XLSX from "xlsx";
import {
  getResponseGender,
  toGenderSegregatedXLSXBuffer,
  toXLSXBuffer,
} from "../lib/export";
import type { AnswerRow, ResponseRow } from "../types/database";

function assert(condition: boolean, message: string): void {
  if (!condition) {
    console.error(`❌ ${message}`);
    process.exit(1);
  }
}

const mockResponses: ResponseRow[] = [
  {
    id: "r1",
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
    completed_at: "2026-01-01T00:00:00Z",
    progress_percentage: 100,
    is_completed: true,
    session_id: "s1",
    questionnaire_id: "flourishing-workplace",
    questionnaire_version: "1.0",
    consent_accepted_at: "2026-01-01T00:00:00Z",
    started_at: null,
    last_section_id: null,
    last_question_id: null,
    current_step_index: 0,
    demographic_snapshot: { gender: "Male", name: "Alice" },
  },
  {
    id: "r2",
    created_at: "2026-01-02T00:00:00Z",
    updated_at: "2026-01-02T00:00:00Z",
    completed_at: "2026-01-02T00:00:00Z",
    progress_percentage: 100,
    is_completed: true,
    session_id: "s2",
    questionnaire_id: "flourishing-workplace",
    questionnaire_version: "1.0",
    consent_accepted_at: "2026-01-02T00:00:00Z",
    started_at: null,
    last_section_id: null,
    last_question_id: null,
    current_step_index: 0,
    demographic_snapshot: { gender: "Female", name: "Bob" },
  },
  {
    id: "r3",
    created_at: "2026-01-03T00:00:00Z",
    updated_at: "2026-01-03T00:00:00Z",
    completed_at: "2026-01-03T00:00:00Z",
    progress_percentage: 100,
    is_completed: true,
    session_id: "s3",
    questionnaire_id: "flourishing-workplace",
    questionnaire_version: "1.0",
    consent_accepted_at: "2026-01-03T00:00:00Z",
    started_at: null,
    last_section_id: null,
    last_question_id: null,
    current_step_index: 0,
    demographic_snapshot: null,
  },
];

const answersByResponse = new Map<string, AnswerRow[]>([
  [
    "r3",
    [
      {
        id: "a1",
        response_id: "r3",
        question_id: "gender",
        section_id: "demographics",
        answer: "Non-binary",
        created_at: "2026-01-03T00:00:00Z",
        updated_at: "2026-01-03T00:00:00Z",
      },
    ],
  ],
]);

const headers = ["response_id", "gender", "name"];
const rows = [
  { response_id: "r1", gender: "Male", name: "Alice" },
  { response_id: "r2", gender: "Female", name: "Bob" },
  { response_id: "r3", gender: "Non-binary", name: "" },
];

function sheetRowCount(wb: XLSX.WorkBook, sheetName: string): number {
  const ws = wb.Sheets[sheetName];
  if (!ws) return -1;
  const data = XLSX.utils.sheet_to_json(ws) as unknown[];
  return data.length;
}

function main() {
  console.log("\n🧪 Export unit tests\n");

  assert(
    getResponseGender(mockResponses[0]!, answersByResponse) === "Male",
    "gender from demographic_snapshot"
  );
  assert(
    getResponseGender(mockResponses[2]!, answersByResponse) === "Non-binary",
    "gender fallback from answers when snapshot missing"
  );

  const combined = XLSX.read(toXLSXBuffer(headers, rows), { type: "array" });
  assert(combined.SheetNames.length === 1, "combined workbook has one sheet");
  assert(combined.SheetNames[0] === "Responses", "combined sheet named Responses");
  assert(sheetRowCount(combined, "Responses") === 3, "combined sheet has 3 data rows");

  const segregated = XLSX.read(
    toGenderSegregatedXLSXBuffer(headers, rows, mockResponses, answersByResponse),
    { type: "array" }
  );
  assert(
    segregated.SheetNames.length === 3,
    `gender segregated has 3 sheets, got ${segregated.SheetNames.join(", ")}`
  );
  assert(segregated.SheetNames.includes("Male"), "has Male sheet");
  assert(segregated.SheetNames.includes("Female"), "has Female sheet");
  assert(segregated.SheetNames.includes("Non-binary"), "has Non-binary sheet");
  assert(sheetRowCount(segregated, "Male") === 1, "Male sheet has 1 row");
  assert(sheetRowCount(segregated, "Female") === 1, "Female sheet has 1 row");
  assert(sheetRowCount(segregated, "Non-binary") === 1, "Non-binary sheet has 1 row");

  console.log("✓ getResponseGender (snapshot + answer fallback)");
  console.log("✓ combined XLSX (single Responses sheet, 3 rows)");
  console.log("✓ gender-segregated XLSX (Male, Female, Non-binary sheets)");
  console.log("\n✅ Export tests passed\n");
}

main();

import fs from "fs";
import * as XLSX from "xlsx";

// Minimal re-implementation of the export helpers for testing purposes
function toCSV(headers, rows) {
  const lines = [headers.join(","), ...rows.map((row) => headers.map((h) => {
    const val = String(row[h] ?? "");
    return `"${val.replace(/"/g, '""')}"`;
  }).join(","))];
  return "\uFEFF" + lines.join("\n");
}

function sanitizeSheetName(name) {
  const cleaned = name.replace(/[\\\/?*\[\]:]/g, "").trim().slice(0, 31);
  return cleaned || "Sheet";
}

function uniqueSheetName(base, used) {
  const name = sanitizeSheetName(base);
  if (!used.has(name)) {
    used.add(name);
    return name;
  }
  let n = 2;
  while (n < 100) {
    const suffix = ` (${n})`;
    const candidate = sanitizeSheetName(base.slice(0, Math.max(1, 31 - suffix.length)) + suffix);
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

function sortGenders(genders) {
  const order = ["Male", "Female", "Non-binary", "Prefer not to say"];
  return [...genders].sort((a, b) => {
    const ai = order.indexOf(a);
    const bi = order.indexOf(b);
    if (ai === -1 && bi === -1) return a.localeCompare(b);
    if (ai === -1) return 1;
    if (bi === -1) return -1;
    return ai - bi;
  });
}

function toXLSXBuffer(headers, rows) {
  const ws = XLSX.utils.json_to_sheet(rows, { header: headers });
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Responses");
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

function toGenderSegregatedXLSXBuffer(headers, rows, responses, answersByResponse) {
  const genderByResponseId = new Map(responses.map((r) => [r.id, (r.demographic_snapshot?.gender || ((answersByResponse.get(r.id) || []).find(a => a.question_id === 'gender') || {}).answer) || null]));

  const groups = new Map();
  for (const row of rows) {
    const responseId = String(row.response_id ?? "");
    const gender = (genderByResponseId.get(responseId) || "").trim();
    if (!gender) continue;
    const list = groups.get(gender) || [];
    list.push(row);
    groups.set(gender, list);
  }

  const wb = XLSX.utils.book_new();
  const usedNames = new Set();
  for (const gender of sortGenders([...groups.keys()])) {
    const groupRows = groups.get(gender) || [];
    const sheetName = uniqueSheetName(gender, usedNames);
    const ws = XLSX.utils.json_to_sheet(groupRows, { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
  }
  if (groups.size === 0) {
    const ws = XLSX.utils.json_to_sheet([], { header: headers });
    XLSX.utils.book_append_sheet(wb, ws, "Responses");
  }
  return XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
}

// Synthetic data (test user)
const responses = [
  { id: "r1", session_id: "s1", questionnaire_id: "q1", created_at: new Date().toISOString(), completed_at: new Date().toISOString(), is_completed: true, progress_percentage: 100, demographic_snapshot: { name: "José García", gender: "Male", location: "São Paulo" } },
  { id: "r2", session_id: "s2", questionnaire_id: "q1", created_at: new Date().toISOString(), completed_at: new Date().toISOString(), is_completed: true, progress_percentage: 100, demographic_snapshot: { name: "Zoë", gender: "Female" } },
  { id: "r3", session_id: "s3", questionnaire_id: "q1", created_at: new Date().toISOString(), completed_at: new Date().toISOString(), is_completed: true, progress_percentage: 100 }
];

const answersByResponse = new Map();
answersByResponse.set("r1", [ { response_id: "r1", question_id: "q_age", answer: "35" }, { response_id: "r1", question_id: "q_feedback", answer: "Great, thanks!" } ]);
answersByResponse.set("r2", [ { response_id: "r2", question_id: "q_age", answer: "28" }, { response_id: "r2", question_id: "q_feedback", answer: "Loved it" }, { response_id: "r2", question_id: "gender", answer: "Female" } ]);
answersByResponse.set("r3", [ { response_id: "r3", question_id: "q_age", answer: "" }, { response_id: "r3", question_id: "q_feedback", answer: "" }, { response_id: "r3", question_id: "gender", answer: "Non-binary" } ]);

// Build headers from questions seen
const allQuestionIds = new Set();
for (const arr of answersByResponse.values()) for (const a of arr) allQuestionIds.add(a.question_id);
const questionIds = [...allQuestionIds];
const headers = ["response_id","session_id","questionnaire_id","created_at","completed_at","is_completed","progress_percentage",...questionIds];

const rows = responses.map((r) => {
  const answers = answersByResponse.get(r.id) || [];
  const answerMap = Object.fromEntries(answers.map(a => [a.question_id, a.answer]));
  return {
    response_id: r.id,
    session_id: r.session_id,
    questionnaire_id: r.questionnaire_id,
    created_at: r.created_at,
    completed_at: r.completed_at || "",
    is_completed: r.is_completed,
    progress_percentage: r.progress_percentage,
    ...Object.fromEntries(questionIds.map(id => [id, answerMap[id] ?? ""]))
  };
});

// Write CSV
const csv = toCSV(headers, rows);
fs.writeFileSync("./scripts/export-test-output.csv", csv, "utf8");
console.log('Wrote ./scripts/export-test-output.csv (size:', Buffer.byteLength(csv), 'bytes)');

// Write combined XLSX
const xlsxBuf = toXLSXBuffer(headers, rows);
fs.writeFileSync("./scripts/export-test-output.xlsx", xlsxBuf);
console.log('Wrote ./scripts/export-test-output.xlsx (size:', xlsxBuf.length, 'bytes)');

// Write gender-segregated XLSX
const genderBuf = toGenderSegregatedXLSXBuffer(headers, rows, responses, answersByResponse);
fs.writeFileSync("./scripts/export-test-output-by-gender.xlsx", genderBuf);
console.log('Wrote ./scripts/export-test-output-by-gender.xlsx (size:', genderBuf.length, 'bytes)');

console.log('Test completed. Open the files to confirm CSV encoding and sheets.');

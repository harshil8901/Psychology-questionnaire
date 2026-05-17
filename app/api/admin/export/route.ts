import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { buildExportRows, toCSV, toXLSXBuffer } from "@/lib/export";
import type { AnswerRow, ResponseRow } from "@/types/database";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const completedOnly = searchParams.get("completed") === "true";

  const supabase = createAdminClient();

  let query = supabase.from("responses").select("*").order("created_at", { ascending: false });
  if (completedOnly) query = query.eq("is_completed", true);

  const { data: responses } = await query;
  const rows = (responses ?? []) as ResponseRow[];

  const { data: allAnswers } = await supabase
    .from("answers")
    .select("*")
    .in(
      "response_id",
      rows.length ? rows.map((r) => r.id) : ["00000000-0000-0000-0000-000000000000"]
    );

  const answersByResponse = new Map<string, AnswerRow[]>();
  (allAnswers ?? []).forEach((a) => {
    const list = answersByResponse.get(a.response_id) ?? [];
    list.push(a as AnswerRow);
    answersByResponse.set(a.response_id, list);
  });

  const { headers, rows: exportRows } = await buildExportRows(rows, answersByResponse);

  if (format === "xlsx") {
    const buffer = toXLSXBuffer(headers, exportRows);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="survey-responses.xlsx"`,
      },
    });
  }

  const csv = toCSV(headers, exportRows);
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": `attachment; filename="survey-responses.csv"`,
    },
  });
}

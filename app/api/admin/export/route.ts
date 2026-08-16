import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { fetchAllRows } from "@/lib/supabase/fetch-all";
import { isAdmin } from "@/lib/admin";
import {
  buildExportRows,
  toCSV,
  toGenderSegregatedXLSXBuffer,
  toXLSXBuffer,
} from "@/lib/export";
import type { AnswerRow, ResponseRow } from "@/types/database";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") ?? "csv";
  const split = searchParams.get("split") ?? "combined";

  try {
    const supabase = createAdminClient();

    const rows = (await fetchAllRows<ResponseRow>((from, to) =>
      supabase
        .from("responses")
        .select("*")
        .eq("is_completed", true)
        .order("created_at", { ascending: false })
        .range(from, to)
    )) as ResponseRow[];

    const responseIds = rows.map((r) => r.id);

    // Fetch answers in chunks when there are many response IDs to avoid very large
    // IN queries or URL length limits. Collect and sort afterwards to preserve order.
    let allAnswers: AnswerRow[] = [];
    if (responseIds.length > 0) {
      const CHUNK = 500;
      for (let i = 0; i < responseIds.length; i += CHUNK) {
        const chunk = responseIds.slice(i, i + CHUNK);
        const chunkAnswers = await fetchAllRows<AnswerRow>((from, to) =>
          supabase
            .from("answers")
            .select("*")
            .in("response_id", chunk)
            .order("response_id", { ascending: true })
            .order("question_id", { ascending: true })
            .range(from, to)
        );
        allAnswers.push(...chunkAnswers);
      }

      // Ensure deterministic ordering: first by response_id, then question_id
      allAnswers.sort((a, b) =>
        a.response_id === b.response_id
          ? a.question_id.localeCompare(b.question_id)
          : a.response_id.localeCompare(b.response_id)
      );
    } else {
      allAnswers = [];
    }

    const answersByResponse = new Map<string, AnswerRow[]>();
    allAnswers.forEach((a) => {
      const list = answersByResponse.get(a.response_id) ?? [];
      list.push(a);
      answersByResponse.set(a.response_id, list);
    });

    const { headers, rows: exportRows } = await buildExportRows(rows, answersByResponse);

    if (format === "xlsx") {
      const genderSegregated = split === "gender";
      const buffer = genderSegregated
        ? toGenderSegregatedXLSXBuffer(headers, exportRows, rows, answersByResponse)
        : toXLSXBuffer(headers, exportRows);
      const filename = genderSegregated
        ? "survey-responses-by-gender.xlsx"
        : "survey-responses.xlsx";

      return new NextResponse(buffer, {
        headers: {
          "Content-Type":
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${filename}"`,
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
  } catch (error) {
    console.error("Export failed:", error);
    const message =
      error instanceof Error ? error.message : "Export failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

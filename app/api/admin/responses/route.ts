import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function GET(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(50, Math.max(10, parseInt(searchParams.get("limit") ?? "20", 10)));
  const search = searchParams.get("search")?.trim() ?? "";
  const sort = searchParams.get("sort") ?? "desc";

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const supabase = createAdminClient();

  let countQuery = supabase.from("responses").select("*", { count: "exact", head: true });
  let query = supabase
    .from("responses")
    .select("*")
    .order("created_at", { ascending: sort === "asc" })
    .range(from, to);

  // Admin list shows completed submissions only
  query = query.eq("is_completed", true);
  countQuery = countQuery.eq("is_completed", true);
  if (search) {
    const filter = `id.ilike.%${search}%,session_id.ilike.%${search}%,questionnaire_id.ilike.%${search}%`;
    query = query.or(filter);
    countQuery = countQuery.or(filter);
  }

  const [{ data, error }, { count }, { count: totalAll }, { count: completedCount }] =
    await Promise.all([
      query,
      countQuery,
      supabase.from("responses").select("*", { count: "exact", head: true }),
      supabase
        .from("responses")
        .select("*", { count: "exact", head: true })
        .eq("is_completed", true),
    ]);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const rows = data ?? [];
  const filteredTotal = count ?? rows.length;
  const total = totalAll ?? 0;
  const completed = completedCount ?? 0;
  const incomplete = total - completed;

  return NextResponse.json({
    responses: rows,
    pagination: {
      page,
      limit,
      total: filteredTotal,
      totalPages: Math.max(1, Math.ceil(filteredTotal / limit)),
    },
    summary: {
      total,
      completed,
      incomplete,
    },
  });
}

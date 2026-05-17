import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { getFileQuestionnaire } from "@/lib/questionnaire-loader";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  await supabase
    .from("questionnaire_configs")
    .update({ is_active: false })
    .eq("is_active", true);

  const fileQ = getFileQuestionnaire(id);
  if (fileQ) {
    const { error } = await supabase.from("questionnaire_configs").upsert({
      id: fileQ.id,
      title: fileQ.title,
      version: fileQ.version,
      estimated_time: fileQ.estimatedTime,
      config: fileQ,
      is_active: true,
      source: "file",
      updated_at: new Date().toISOString(),
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ ok: true, activeId: id });
  }

  const { data, error } = await supabase
    .from("questionnaire_configs")
    .update({ is_active: true, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select("id")
    .single();

  if (error || !data) {
    return NextResponse.json({ error: "Questionnaire not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, activeId: data.id });
}

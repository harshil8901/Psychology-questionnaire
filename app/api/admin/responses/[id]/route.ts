import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { data: response, error } = await supabase
    .from("responses")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !response) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { data: answers } = await supabase
    .from("answers")
    .select("*")
    .eq("response_id", id)
    .order("created_at", { ascending: true });

  return NextResponse.json({ response, answers: answers ?? [] });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const supabase = createAdminClient();

  const { error } = await supabase.from("responses").delete().eq("id", id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}

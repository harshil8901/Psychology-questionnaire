import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import {
  countResponsesForQuestionnaire,
  getFileQuestionnaire,
  getHiddenQuestionnaireIds,
  removeQuestionnaire,
  serializeQuestionnaire,
} from "@/lib/questionnaire-loader";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { searchParams } = new URL(request.url);
  if (searchParams.get("impact") === "1") {
    try {
      const responseCount = await countResponsesForQuestionnaire(id);
      return NextResponse.json({ id, responseCount });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Could not load impact";
      return NextResponse.json({ error: message }, { status: 500 });
    }
  }

  const hidden = await getHiddenQuestionnaireIds();
  if (hidden.has(id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const file = getFileQuestionnaire(id);

  if (file) {
    return NextResponse.json({
      id,
      source: "file",
      editable: false,
      config: file,
      json: serializeQuestionnaire(file),
    });
  }

  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("questionnaire_configs")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json({
      id,
      source: "database",
      editable: true,
      isActive: data.is_active,
      config: data.config,
      json: JSON.stringify(data.config, null, 2),
    });
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const { deletedResponses } = await removeQuestionnaire(id);
    return NextResponse.json({ ok: true, deletedResponses });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Delete failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import {
  getFileQuestionnaire,
  listAllQuestionnaireMeta,
  serializeQuestionnaire,
} from "@/lib/questionnaire-loader";
import { validateQuestionnaireJson } from "@/lib/questionnaire-schema";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const list = await listAllQuestionnaireMeta();
  return NextResponse.json({ questionnaires: list });
}

export async function POST(request: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { config: rawConfig, activate } = body as {
    config?: unknown;
    activate?: boolean;
  };

  const validated = validateQuestionnaireJson(rawConfig);
  if (!validated.success) {
    return NextResponse.json({ error: validated.error }, { status: 400 });
  }

  const config = validated.data;
  const supabase = createAdminClient();

  if (activate) {
    await supabase
      .from("questionnaire_configs")
      .update({ is_active: false })
      .eq("is_active", true);
  }

  const { error } = await supabase.from("questionnaire_configs").upsert({
    id: config.id,
    title: config.title,
    version: config.version,
    estimated_time: config.estimatedTime,
    config,
    is_active: activate ?? false,
    source: "upload",
    updated_at: new Date().toISOString(),
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    id: config.id,
    previewUrl: `/welcome?q=${config.id}&preview=1`,
  });
}

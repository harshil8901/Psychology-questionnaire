import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { loadQuestionnaire } from "@/lib/questionnaire-loader";
import { rateLimit } from "@/lib/rate-limit";
import { sessionSchema } from "@/lib/validation";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`responses:${ip}`, 20, 60_000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = sessionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid session" }, { status: 400 });
  }

  const { sessionId, questionnaireId } = parsed.data;
  const questionnaire = await loadQuestionnaire(questionnaireId);

  try {
    const supabase = createAdminClient();

    const { data: existing } = await supabase
      .from("responses")
      .select("*")
      .eq("session_id", sessionId)
      .maybeSingle();

    if (existing) {
      const { data: answerRows } = await supabase
        .from("answers")
        .select("question_id, answer")
        .eq("response_id", existing.id);

      const answers: Record<string, string> = {};
      answerRows?.forEach((r) => {
        answers[r.question_id] = r.answer;
      });

      return NextResponse.json({
        responseId: existing.id,
        sessionId: existing.session_id,
        answers,
        currentStepIndex: existing.current_step_index ?? 0,
        consentAcceptedAt: existing.consent_accepted_at,
      });
    }

    const { data, error } = await supabase
      .from("responses")
      .insert({
        session_id: sessionId,
        questionnaire_id: questionnaire.id,
        questionnaire_version: questionnaire.version,
        started_at: new Date().toISOString(),
      })
      .select("id, session_id")
      .single();

    if (error) throw error;

    await supabase.from("analytics").insert({
      response_id: data.id,
      event_type: "session_started",
      metadata: { questionnaireId: questionnaire.id },
    });

    return NextResponse.json({
      responseId: data.id,
      sessionId: data.session_id,
      answers: {},
      currentStepIndex: 0,
      consentAcceptedAt: null,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Database unavailable. Check Supabase configuration." },
      { status: 503 }
    );
  }
}

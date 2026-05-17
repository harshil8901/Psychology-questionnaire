import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { getAllQuestions, isQuestionVisible } from "@/lib/questionnaire";
import { loadQuestionnaire } from "@/lib/questionnaire-loader";
import { rateLimit } from "@/lib/rate-limit";
import { submitSchema, sanitizeText, validateAnswerForQuestion } from "@/lib/validation";
import { headers } from "next/headers";

export async function POST(request: Request) {
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`submit:${ip}`, 15, 60_000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = submitSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid submission" }, { status: 400 });
  }

  const { responseId, sessionId, honeypot, answers: clientAnswers } = parsed.data;
  if (honeypot) {
    return NextResponse.json({ error: "Rejected" }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      responseId,
      completedAt: new Date().toISOString(),
      offline: true,
    });
  }

  try {
    const supabase = createAdminClient();
    const { data: response } = await supabase
      .from("responses")
      .select("*")
      .eq("id", responseId)
      .eq("session_id", sessionId)
      .single();

    if (!response) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (response.is_completed) {
      return NextResponse.json({ responseId, alreadyCompleted: true });
    }
    if (!response.consent_accepted_at) {
      return NextResponse.json({ error: "Consent required" }, { status: 400 });
    }

    const questionnaire = await loadQuestionnaire(response.questionnaire_id);
    const questions = getAllQuestions(questionnaire);

    // Sync client answers (ensures last page + any missed autosaves are stored)
    if (clientAnswers && Object.keys(clientAnswers).length > 0) {
      const upserts: Array<{
        response_id: string;
        question_id: string;
        section_id: string;
        answer: string;
        updated_at: string;
      }> = [];

      for (const section of questionnaire.sections) {
        for (const q of section.questions) {
          const raw = clientAnswers[q.id];
          if (raw === undefined) continue;
          upserts.push({
            response_id: responseId,
            question_id: q.id,
            section_id: section.id,
            answer: sanitizeText(raw),
            updated_at: new Date().toISOString(),
          });
        }
      }

      if (upserts.length > 0) {
        const { error: upsertError } = await supabase
          .from("answers")
          .upsert(upserts, { onConflict: "response_id,question_id" });
        if (upsertError) throw upsertError;
      }
    }

    const { data: answerRows } = await supabase
      .from("answers")
      .select("question_id, answer")
      .eq("response_id", responseId);

    const answers: Record<string, string> = {};
    answerRows?.forEach((r) => {
      answers[r.question_id] = r.answer;
    });

    for (const q of questions) {
      if (!q.required) continue;
      if (!isQuestionVisible(q, answers)) continue;
      const err = validateAnswerForQuestion(q, answers[q.id] ?? "");
      if (err) {
        return NextResponse.json(
          { error: `Please complete all required questions before submitting.` },
          { status: 400 }
        );
      }
    }

    const demographicKeys = [
      "name",
      "age",
      "gender",
      "education",
      "experience",
      "industry",
      "location",
      "work_mode",
    ];
    const demographic_snapshot: Record<string, string> = {};
    demographicKeys.forEach((k) => {
      if (answers[k]) demographic_snapshot[k] = answers[k];
    });

    const now = new Date().toISOString();
    const { error } = await supabase
      .from("responses")
      .update({
        is_completed: true,
        completed_at: now,
        progress_percentage: 100,
        updated_at: now,
        demographic_snapshot,
      })
      .eq("id", responseId);

    if (error) throw error;

    try {
      await supabase.from("analytics").insert({
        response_id: responseId,
        event_type: "survey_completed",
        metadata: { questionnaireId: questionnaire.id },
      });
    } catch {
      // Non-blocking
    }

    return NextResponse.json({ responseId, completedAt: now });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Submission failed" }, { status: 503 });
  }
}

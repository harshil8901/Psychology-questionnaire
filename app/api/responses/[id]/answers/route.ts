import { NextResponse } from "next/server";
import { z } from "zod";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimit } from "@/lib/rate-limit";
import { answerSchema, sanitizeText } from "@/lib/validation";
import { headers } from "next/headers";

const postSchema = answerSchema.extend({
  sessionId: z.string().min(8).max(64),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: responseId } = await params;
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`answers:${ip}`, 120, 60_000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = postSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid answer" }, { status: 400 });
  }

  const { sessionId, questionId, sectionId, value } = parsed.data;
  const clean = sanitizeText(value);

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, offline: true });
  }

  try {
    const supabase = createAdminClient();
    const { data: row } = await supabase
      .from("responses")
      .select("id, is_completed")
      .eq("id", responseId)
      .eq("session_id", sessionId)
      .single();

    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (row.is_completed) {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }

    const { error } = await supabase.from("answers").upsert(
      {
        response_id: responseId,
        question_id: questionId,
        section_id: sectionId,
        answer: clean,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "response_id,question_id" }
    );

    if (error) throw error;

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Save failed" }, { status: 503 });
  }
}

import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseConfigured } from "@/lib/supabase/config";
import { rateLimit } from "@/lib/rate-limit";
import { z } from "zod";
import { headers } from "next/headers";

const patchSchema = z.object({
  sessionId: z.string(),
  consentAcceptedAt: z.string().min(1).optional(),
  currentStepIndex: z.number().int().min(0).optional(),
  progressPercentage: z.number().min(0).max(100).optional(),
  lastSectionId: z.string().optional(),
  lastQuestionId: z.string().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const ip = (await headers()).get("x-forwarded-for") ?? "unknown";
  const limited = rateLimit(`patch:${ip}`, 60, 60_000);
  if (!limited.success) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429 });
  }

  const body = await request.json();
  const parsed = patchSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const { sessionId, ...updates } = parsed.data;

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ ok: true, offline: true });
  }

  try {
    const supabase = createAdminClient();
    const { data: row } = await supabase
      .from("responses")
      .select("id, session_id, is_completed")
      .eq("id", id)
      .eq("session_id", sessionId)
      .single();

    if (!row) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    if (row.is_completed) {
      return NextResponse.json({ error: "Already completed" }, { status: 400 });
    }

    const patch: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (updates.consentAcceptedAt)
      patch.consent_accepted_at = updates.consentAcceptedAt;
    if (updates.currentStepIndex != null)
      patch.current_step_index = updates.currentStepIndex;
    if (updates.progressPercentage != null)
      patch.progress_percentage = updates.progressPercentage;
    if (updates.lastSectionId) patch.last_section_id = updates.lastSectionId;
    if (updates.lastQuestionId) patch.last_question_id = updates.lastQuestionId;

    const { error } = await supabase.from("responses").update(patch).eq("id", id);
    if (error) throw error;

    if (updates.consentAcceptedAt) {
      try {
        await supabase.from("analytics").insert({
          response_id: id,
          event_type: "consent_accepted",
        });
      } catch {
        // Non-blocking — consent is already saved on responses row
      }
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Update failed" }, { status: 503 });
  }
}

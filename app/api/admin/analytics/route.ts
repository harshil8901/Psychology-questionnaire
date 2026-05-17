import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";
import { getQuestionnaire } from "@/lib/questionnaire";

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const questionnaire = getQuestionnaire();
  const supabase = createAdminClient();

  const { data: responses } = await supabase
    .from("responses")
    .select("*")
    .eq("questionnaire_id", questionnaire.id)
    .order("created_at", { ascending: false });

  const all = responses ?? [];
  const completed = all.filter((r) => r.is_completed);
  const incomplete = all.filter((r) => !r.is_completed);

  const completionRate =
    all.length > 0 ? Math.round((completed.length / all.length) * 100) : 0;

  const avgProgress =
    all.length > 0
      ? Math.round(
          all.reduce((s, r) => s + Number(r.progress_percentage), 0) / all.length
        )
      : 0;

  const completionTimes = completed
    .filter((r) => r.started_at && r.completed_at)
    .map((r) => {
      const start = new Date(r.started_at!).getTime();
      const end = new Date(r.completed_at!).getTime();
      return (end - start) / 60_000;
    });

  const avgCompletionMinutes =
    completionTimes.length > 0
      ? Math.round(
          completionTimes.reduce((a, b) => a + b, 0) / completionTimes.length
        )
      : 0;

  const sectionDropoff: Record<string, number> = {};
  incomplete.forEach((r) => {
    const sid = r.last_section_id ?? "unknown";
    sectionDropoff[sid] = (sectionDropoff[sid] ?? 0) + 1;
  });

  const dailyCounts: Record<string, number> = {};
  all.forEach((r) => {
    const day = r.created_at.slice(0, 10);
    dailyCounts[day] = (dailyCounts[day] ?? 0) + 1;
  });

  const timeline = Object.entries(dailyCounts)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, count]) => ({ date, count }));

  const sectionStats = questionnaire.sections.map((s) => ({
    id: s.id,
    title: s.title,
    dropoffs: sectionDropoff[s.id] ?? 0,
    questionCount: s.questions.length,
  }));

  return NextResponse.json({
    total: all.length,
    completed: completed.length,
    incomplete: incomplete.length,
    completionRate,
    avgProgress,
    avgCompletionMinutes,
    timeline,
    sectionStats,
    recent: all.slice(0, 20),
  });
}

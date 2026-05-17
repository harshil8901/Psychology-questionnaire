import { createAdminClient } from "@/lib/supabase/admin";
import { fileQuestionnaires, fileQuestionnaireIds } from "@/data/questionnaires/registry";
import { DEFAULT_QUESTIONNAIRE_ID } from "@/lib/questionnaire";
import type { Questionnaire } from "@/types/questionnaire";
import { questionnaireSchema } from "@/lib/questionnaire-schema";

export type QuestionnaireSource = "file" | "database";

export interface QuestionnaireMeta {
  id: string;
  title: string;
  version: string;
  estimatedTime: number;
  source: QuestionnaireSource;
  isActive: boolean;
  questionCount: number;
  sectionCount: number;
}

function metaFromQuestionnaire(
  q: Questionnaire,
  source: QuestionnaireSource,
  isActive: boolean
): QuestionnaireMeta {
  const questionCount = q.sections.reduce((n, s) => n + s.questions.length, 0);
  return {
    id: q.id,
    title: q.title,
    version: q.version,
    estimatedTime: q.estimatedTime,
    source,
    isActive,
    questionCount,
    sectionCount: q.sections.length,
  };
}

export function getFileQuestionnaire(id: string): Questionnaire | null {
  return fileQuestionnaires[id] ?? null;
}

export async function getHiddenQuestionnaireIds(): Promise<Set<string>> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("questionnaire_hidden").select("id");
    return new Set((data ?? []).map((row) => row.id));
  } catch {
    return new Set();
  }
}

async function isQuestionnaireHidden(id: string): Promise<boolean> {
  const hidden = await getHiddenQuestionnaireIds();
  return hidden.has(id);
}

export async function getActiveQuestionnaireId(): Promise<string> {
  const hidden = await getHiddenQuestionnaireIds();

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("questionnaire_configs")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();
    if (data?.id && !hidden.has(data.id)) return data.id;

    const { data: rows } = await supabase
      .from("questionnaire_configs")
      .select("id")
      .order("updated_at", { ascending: false });
    for (const row of rows ?? []) {
      if (!hidden.has(row.id)) return row.id;
    }
  } catch {
    // Supabase not configured — use file default
  }

  for (const id of fileQuestionnaireIds) {
    if (!hidden.has(id)) return id;
  }

  return DEFAULT_QUESTIONNAIRE_ID;
}

export async function loadQuestionnaire(id?: string): Promise<Questionnaire> {
  const targetId = id ?? (await getActiveQuestionnaireId());

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("questionnaire_configs")
      .select("config")
      .eq("id", targetId)
      .maybeSingle();

    if (data?.config) {
      const parsed = questionnaireSchema.parse(data.config);
      return parsed as Questionnaire;
    }
  } catch {
    // fall through to file
  }

  const hidden = await isQuestionnaireHidden(targetId);
  const file = hidden ? null : getFileQuestionnaire(targetId);
  if (file) return file;

  const fallbackHidden = await isQuestionnaireHidden(DEFAULT_QUESTIONNAIRE_ID);
  const fallback = fallbackHidden
    ? null
    : getFileQuestionnaire(DEFAULT_QUESTIONNAIRE_ID);
  if (fallback) return fallback;

  throw new Error(`Questionnaire not found: ${targetId}`);
}

export async function listAllQuestionnaireMeta(): Promise<QuestionnaireMeta[]> {
  const activeId = await getActiveQuestionnaireId();
  const hidden = await getHiddenQuestionnaireIds();
  const items: QuestionnaireMeta[] = [];

  for (const id of fileQuestionnaireIds) {
    if (hidden.has(id)) continue;
    const q = fileQuestionnaires[id];
    items.push(metaFromQuestionnaire(q, "file", id === activeId));
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("questionnaire_configs").select("*");
    for (const row of data ?? []) {
      if (hidden.has(row.id)) continue;
      if (fileQuestionnaires[row.id]) continue;
      const parsed = questionnaireSchema.safeParse(row.config);
      if (!parsed.success) continue;
      items.push(
        metaFromQuestionnaire(
          parsed.data as Questionnaire,
          "database",
          row.id === activeId
        )
      );
    }
  } catch {
    // ignore
  }

  return items;
}

export function serializeQuestionnaire(q: Questionnaire): string {
  return JSON.stringify(q, null, 2);
}

/** Remove a questionnaire from admin + participant use (hides built-ins; deletes DB rows). */
export async function removeQuestionnaire(id: string): Promise<void> {
  const supabase = createAdminClient();
  const { error: configError } = await supabase
    .from("questionnaire_configs")
    .delete()
    .eq("id", id);
  if (configError) throw new Error(configError.message);

  if (!getFileQuestionnaire(id)) return;

  const { error: hiddenError } = await supabase
    .from("questionnaire_hidden")
    .upsert({ id, hidden_at: new Date().toISOString() });
  if (hiddenError) throw new Error(hiddenError.message);
}

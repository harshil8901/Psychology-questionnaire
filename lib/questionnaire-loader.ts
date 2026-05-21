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
  const hidden = new Set<string>();
  try {
    const supabase = createAdminClient();

    const { data: hiddenRows, error: hiddenTableError } = await supabase
      .from("questionnaire_hidden")
      .select("id");
    if (!hiddenTableError) {
      for (const row of hiddenRows ?? []) hidden.add(row.id);
    }

    // Tombstones work even when migration 003 was not applied yet
    const { data: tombstones, error: tombstoneError } = await supabase
      .from("questionnaire_configs")
      .select("id")
      .eq("source", "hidden");
    if (!tombstoneError) {
      for (const row of tombstones ?? []) hidden.add(row.id);
    }
  } catch {
    // Supabase unavailable
  }
  return hidden;
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
      .select("id, source")
      .neq("source", "hidden")
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

async function loadQuestionnaireFromDatabase(
  targetId: string
): Promise<Questionnaire | null> {
  const supabase = createAdminClient();

  const { data: byRowId } = await supabase
    .from("questionnaire_configs")
    .select("config, source")
    .eq("id", targetId)
    .maybeSingle();

  if (byRowId?.config && byRowId.source !== "hidden") {
    return questionnaireSchema.parse(byRowId.config) as Questionnaire;
  }

  // Clients use config.id (e.g. flourishing-workplace), which may differ from the row id.
  const { data: byConfigId } = await supabase
    .from("questionnaire_configs")
    .select("config, source")
    .filter("config->>id", "eq", targetId)
    .neq("source", "hidden")
    .limit(1)
    .maybeSingle();

  if (byConfigId?.config) {
    return questionnaireSchema.parse(byConfigId.config) as Questionnaire;
  }

  return null;
}

export async function loadQuestionnaire(id?: string): Promise<Questionnaire> {
  const targetId = id ?? (await getActiveQuestionnaireId());

  try {
    const fromDb = await loadQuestionnaireFromDatabase(targetId);
    if (fromDb) return fromDb;
  } catch {
    // fall through to file
  }

  const hidden = await isQuestionnaireHidden(targetId);
  const file = hidden ? null : getFileQuestionnaire(targetId);
  if (file) return file;

  // Legacy ids (e.g. hidden file default) may still be stored client-side — use active DB config.
  try {
    const activeId = await getActiveQuestionnaireId();
    if (activeId !== targetId) {
      const activeFromDb = await loadQuestionnaireFromDatabase(activeId);
      if (activeFromDb) return activeFromDb;
    }
  } catch {
    // fall through
  }

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

async function hideBuiltInQuestionnaire(id: string): Promise<void> {
  const file = getFileQuestionnaire(id);
  if (!file) return;

  const supabase = createAdminClient();
  const { error: hiddenError } = await supabase
    .from("questionnaire_hidden")
    .upsert({ id, hidden_at: new Date().toISOString() });

  if (!hiddenError) return;

  // Fallback when questionnaire_hidden table is missing (migration 003 not run)
  const { error: tombstoneError } = await supabase.from("questionnaire_configs").upsert({
    id,
    title: file.title,
    version: file.version,
    estimated_time: file.estimatedTime,
    config: file,
    is_active: false,
    source: "hidden",
    updated_at: new Date().toISOString(),
  });
  if (tombstoneError) {
    throw new Error(
      hiddenError.message.includes("does not exist")
        ? `Could not hide built-in questionnaire. Run migration 003_questionnaire_hidden.sql in Supabase, or try again (${tombstoneError.message}).`
        : tombstoneError.message
    );
  }
}

export async function countResponsesForQuestionnaire(
  questionnaireId: string
): Promise<number> {
  const supabase = createAdminClient();
  const { count, error } = await supabase
    .from("responses")
    .select("*", { count: "exact", head: true })
    .eq("questionnaire_id", questionnaireId);
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/** Remove questionnaire, its config, and all participant responses for that id. */
export async function removeQuestionnaire(
  id: string
): Promise<{ deletedResponses: number }> {
  const supabase = createAdminClient();
  const deletedResponses = await countResponsesForQuestionnaire(id);

  const { error: responsesError } = await supabase
    .from("responses")
    .delete()
    .eq("questionnaire_id", id);
  if (responsesError) throw new Error(responsesError.message);

  const { error: configError } = await supabase
    .from("questionnaire_configs")
    .delete()
    .eq("id", id);
  if (configError) throw new Error(configError.message);

  await hideBuiltInQuestionnaire(id);

  return { deletedResponses };
}

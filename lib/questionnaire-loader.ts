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

export async function getActiveQuestionnaireId(): Promise<string> {
  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from("questionnaire_configs")
      .select("id")
      .eq("is_active", true)
      .maybeSingle();
    if (data?.id) return data.id;
  } catch {
    // Supabase not configured — use file default
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

  const file = getFileQuestionnaire(targetId);
  if (file) return file;

  const fallback = getFileQuestionnaire(DEFAULT_QUESTIONNAIRE_ID);
  if (fallback) return fallback;

  throw new Error(`Questionnaire not found: ${targetId}`);
}

export async function listAllQuestionnaireMeta(): Promise<QuestionnaireMeta[]> {
  const activeId = await getActiveQuestionnaireId();
  const items: QuestionnaireMeta[] = [];

  for (const id of fileQuestionnaireIds) {
    const q = fileQuestionnaires[id];
    items.push(metaFromQuestionnaire(q, "file", id === activeId));
  }

  try {
    const supabase = createAdminClient();
    const { data } = await supabase.from("questionnaire_configs").select("*");
    for (const row of data ?? []) {
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

import { questionnaire as flourishingWorkplace } from "./flourishing-workplace";
import type { Questionnaire } from "@/types/questionnaire";

/** Built-in questionnaires shipped with the app (edit in repo). */
export const fileQuestionnaires: Record<string, Questionnaire> = {
  "flourishing-workplace": flourishingWorkplace,
};

export const fileQuestionnaireIds = Object.keys(fileQuestionnaires);

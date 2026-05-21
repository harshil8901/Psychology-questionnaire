import type { Question, Questionnaire, SurveyStep } from "@/types/questionnaire";

export const DEFAULT_QUESTIONNAIRE_ID = "flourishing-workplace";

export function getAllQuestions(questionnaire: Questionnaire): Question[] {
  return questionnaire.sections.flatMap((s) =>
    [...s.questions].sort((a, b) => a.order - b.order)
  );
}

export function countTotalQuestions(questionnaire: Questionnaire): number {
  return getAllQuestions(questionnaire).length;
}

/** Build survey steps: section intro + question groups per screen */
export function buildSurveySteps(
  questionnaire: Questionnaire,
  questionsPerScreen = 4
): SurveyStep[] {
  const steps: SurveyStep[] = [];
  let globalQuestionIndex = 0;

  questionnaire.sections.forEach((section, sectionIndex) => {
    steps.push({
      kind: "section_intro",
      sectionId: section.id,
      sectionIndex,
    });

    const sorted = [...section.questions].sort((a, b) => a.order - b.order);
    for (let i = 0; i < sorted.length; i += questionsPerScreen) {
      const chunk = sorted.slice(i, i + questionsPerScreen);
      steps.push({
        kind: "questions",
        sectionId: section.id,
        sectionIndex,
        questions: chunk,
        questionStartIndex: globalQuestionIndex + i,
      });
    }
    globalQuestionIndex += sorted.length;
  });

  return steps;
}

export function getSectionById(questionnaire: Questionnaire, sectionId: string) {
  return questionnaire.sections.find((s) => s.id === sectionId);
}

export function calculateProgress(
  questionnaire: Questionnaire,
  answers: Record<string, string>
): { percentage: number; answeredCount: number; total: number; minutesLeft: number } {
  const visibleQuestions = getAllQuestions(questionnaire).filter((q) =>
    isQuestionVisible(q, answers)
  );
  const total = visibleQuestions.length;
  const answeredCount = visibleQuestions.filter((q) =>
    answers[q.id]?.trim()
  ).length;
  const percentage =
    total > 0
      ? Math.min(100, Math.round((answeredCount / total) * 1000) / 10)
      : 0;

  const remaining = Math.max(0, total - answeredCount);
  const minutesLeft = Math.max(
    1,
    Math.ceil((remaining / Math.max(total, 1)) * questionnaire.estimatedTime)
  );

  return { percentage, answeredCount, total, minutesLeft };
}

export function isQuestionVisible(
  question: Question,
  answers: Record<string, string>
): boolean {
  if (!question.showWhen) return true;
  const val = answers[question.showWhen.questionId];
  const target = question.showWhen.equals;
  if (Array.isArray(target)) return target.includes(val);
  return val === target;
}

export function getVisibleStepQuestions(
  step: SurveyStep,
  answers: Record<string, string>
): Question[] {
  if (step.kind === "section_intro") return [];
  return step.questions.filter((q) => isQuestionVisible(q, answers));
}

/** True when every visible question on the step has a valid answer */
export function isStepComplete(
  step: SurveyStep,
  answers: Record<string, string>,
  validate: (q: Question, value: string) => string | null
): boolean {
  const visible = getVisibleStepQuestions(step, answers);
  if (visible.length === 0) return true;
  return visible.every((q) => validate(q, answers[q.id] ?? "") === null);
}

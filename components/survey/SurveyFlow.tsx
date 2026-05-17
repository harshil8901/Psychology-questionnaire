"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { PageTransition } from "@/components/animations/PageTransition";
import { GlassCard } from "@/components/layout/GlassCard";
import { ProgressBar } from "./ProgressBar";
import { QuestionRenderer } from "./QuestionRenderer";
import { SectionIntro } from "./SectionIntro";
import { SurveyNavigation } from "./SurveyNavigation";
import { useAutosave } from "@/hooks/useAutosave";
import { useSurveyStore } from "@/store/survey-store";
import {
  buildSurveySteps,
  calculateProgress,
  getSectionById,
  isQuestionVisible,
  isStepComplete,
} from "@/lib/questionnaire";
import { cn } from "@/lib/utils";
import { validateAnswerForQuestion } from "@/lib/validation";
import type { Question, Questionnaire, SurveyStep } from "@/types/questionnaire";

const AUTO_ADVANCE_MS = 450;

export function SurveyFlow({
  questionnaire,
  preview = false,
}: {
  questionnaire: Questionnaire;
  preview?: boolean;
}) {
  const router = useRouter();
  const steps = useMemo(() => buildSurveySteps(questionnaire, 2), [questionnaire]);
  const {
    answers,
    currentStepIndex,
    setStepIndex,
    setAnswer,
    responseId,
    sessionId,
    isSaving,
    consentAcceptedAt,
    offlineMode,
    isHydrated,
  } = useSurveyStore();
  const { savePageAnswers, syncProgress } = useAutosave(preview);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advancingRef = useRef(false);

  const currentStep: SurveyStep | undefined = steps[currentStepIndex];
  const progress = calculateProgress(
    questionnaire,
    answers,
    currentStepIndex,
    steps
  );

  const sectionLabel = useMemo(() => {
    if (!currentStep) return undefined;
    const section = getSectionById(questionnaire, currentStep.sectionId);
    return section?.title;
  }, [currentStep, questionnaire]);

  useEffect(() => {
    if (preview || !isHydrated) return;
    if (!consentAcceptedAt) {
      router.replace("/welcome");
    }
  }, [consentAcceptedAt, preview, router, isHydrated]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    };
  }, []);

  const getPageAnswers = useCallback(
    (step: SurveyStep) => {
      if (step.kind === "section_intro") return [];
      return step.questions
        .filter((q) => isQuestionVisible(q, answers))
        .map((q) => ({
          questionId: q.id,
          sectionId: step.sectionId,
          value: answers[q.id] ?? "",
        }));
    },
    [answers]
  );

  const flushCurrentPage = useCallback(async () => {
    if (!currentStep || currentStep.kind === "section_intro") return;
    await savePageAnswers(getPageAnswers(currentStep));
  }, [currentStep, getPageAnswers, savePageAnswers]);

  const validateCurrentStep = useCallback(
    (answerMap: Record<string, string> = answers): boolean => {
      if (!currentStep || currentStep.kind === "section_intro") return true;

      const newErrors: Record<string, string> = {};
      for (const q of currentStep.questions) {
        if (!isQuestionVisible(q, answerMap)) continue;
        const err = validateAnswerForQuestion(q, answerMap[q.id] ?? "");
        if (err) newErrors[q.id] = err;
      }
      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [currentStep, answers]
  );

  const handleSubmit = useCallback(async () => {
    if (!responseId || !sessionId) return;
    setSubmitting(true);
    setErrors((e) => {
      const next = { ...e };
      delete next._form;
      return next;
    });
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId,
          sessionId,
          honeypot: "",
          answers,
        }),
      });
      const data = (await res.json()) as { responseId?: string; error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Submission failed");
      }
      router.push(`/complete?id=${data.responseId ?? responseId}`);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Submission failed. Please try again.";
      setErrors({ _form: message });
    } finally {
      setSubmitting(false);
    }
  }, [responseId, sessionId, answers, router]);

  const goNext = useCallback(async () => {
    if (advancingRef.current) return;
    if (!validateCurrentStep()) return;

    const isLast = currentStepIndex >= steps.length - 1;

    if (isLast) {
      if (preview) {
        router.push("/welcome");
        return;
      }
      if (currentStep?.kind !== "section_intro") {
        await flushCurrentPage();
      }
      await handleSubmit();
      return;
    }

    if (currentStep?.kind !== "section_intro") {
      await flushCurrentPage();
    }

    const nextIndex = currentStepIndex + 1;
    setStepIndex(nextIndex);
    await syncProgress({
      currentStepIndex: nextIndex,
      progressPercentage: calculateProgress(questionnaire, answers, nextIndex, steps)
        .percentage,
      lastSectionId: currentStep?.sectionId,
    });
  }, [
    validateCurrentStep,
    currentStepIndex,
    steps,
    currentStep,
    flushCurrentPage,
    preview,
    router,
    handleSubmit,
    setStepIndex,
    syncProgress,
    questionnaire,
    answers,
  ]);

  const scheduleAutoAdvance = useCallback(
    (answerMap: Record<string, string>) => {
      if (!currentStep || currentStep.kind !== "questions") return;
      if (currentStepIndex >= steps.length - 1) return;
      if (advancingRef.current) return;
      if (!isStepComplete(currentStep, answerMap, validateAnswerForQuestion)) return;

      if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = setTimeout(() => {
        advancingRef.current = true;
        void goNext().finally(() => {
          advancingRef.current = false;
        });
      }, AUTO_ADVANCE_MS);
    },
    [currentStep, currentStepIndex, steps.length, goNext]
  );

  const handleAnswerChange = useCallback(
    (question: Question, value: string) => {
      const nextAnswers = { ...answers, [question.id]: value };
      setAnswer(question.id, value);
      setErrors((e) => {
        const next = { ...e };
        delete next[question.id];
        delete next._form;
        return next;
      });

      scheduleAutoAdvance(nextAnswers);
    },
    [answers, setAnswer, scheduleAutoAdvance]
  );

  const handleAnswerBlur = useCallback(() => {
    scheduleAutoAdvance(useSurveyStore.getState().answers);
  }, [scheduleAutoAdvance]);

  const goBack = useCallback(async () => {
    if (currentStepIndex <= 0) return;
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);

    if (currentStep?.kind !== "section_intro") {
      await flushCurrentPage();
    }

    setStepIndex(currentStepIndex - 1);
  }, [currentStepIndex, currentStep, flushCurrentPage, setStepIndex]);

  if (!currentStep) return null;

  const isLastStep = currentStepIndex >= steps.length - 1;
  const isQuestionStep = currentStep.kind === "questions";

  return (
    <motion.div className={cn("min-h-screen", isQuestionStep ? "pb-36 sm:pb-32" : "pb-8")}>
      {preview && (
        <div className="bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
          Preview mode — responses are not saved
        </div>
      )}
      {!preview && offlineMode && (
        <div className="bg-slate-500/10 px-4 py-2 text-center text-sm text-slate-400">
          Local mode — progress saved in this browser only. Add Supabase keys in .env.local for
          cloud save.
        </div>
      )}
      <ProgressBar
        percentage={progress.percentage}
        sectionLabel={sectionLabel}
        minutesLeft={progress.minutesLeft}
        isSaving={preview ? false : isSaving}
      />

      <AnimatePresence mode="wait">
        {currentStep.kind === "section_intro" ? (
          <PageTransition key={`intro-${currentStep.sectionId}`}>
            <SectionIntro
              section={getSectionById(questionnaire, currentStep.sectionId)!}
              questionCount={
                getSectionById(questionnaire, currentStep.sectionId)!.questions.length
              }
              onContinue={goNext}
            />
          </PageTransition>
        ) : (
          <PageTransition key={`q-${currentStepIndex}`}>
            <div className="mx-auto w-full max-w-2xl px-4 py-5 sm:px-6 sm:py-8">
              <GlassCard className="space-y-8 p-5 sm:space-y-10 sm:p-8">
                {currentStep.questions.map((q) =>
                  isQuestionVisible(q, answers) ? (
                    <QuestionRenderer
                      key={q.id}
                      question={q}
                      value={answers[q.id]}
                      onChange={(v) => handleAnswerChange(q, v)}
                      onBlur={
                        q.type === "text" || q.type === "textarea"
                          ? handleAnswerBlur
                          : undefined
                      }
                      onContinue={goNext}
                      error={errors[q.id]}
                    />
                  ) : null
                )}
              </GlassCard>

              {errors._form && (
                <p className="mt-4 text-center text-sm text-rose-400">{errors._form}</p>
              )}
            </div>
          </PageTransition>
        )}
      </AnimatePresence>

      {isQuestionStep && (
        <SurveyNavigation
          canGoBack={currentStepIndex > 0}
          onBack={goBack}
          onContinue={goNext}
          continueLabel={
            isLastStep ? (preview ? "End preview" : "Submit Survey") : "Continue"
          }
          continueDisabled={!preview && (isLastStep ? submitting : false)}
          isLoading={(isLastStep && submitting) || isSaving}
        />
      )}
    </motion.div>
  );
}

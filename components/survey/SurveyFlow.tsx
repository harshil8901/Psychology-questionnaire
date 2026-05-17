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
  getVisibleStepQuestions,
  isQuestionVisible,
} from "@/lib/questionnaire";
import { cn } from "@/lib/utils";
import { validateAnswerForQuestion } from "@/lib/validation";
import type { Questionnaire, SurveyStep } from "@/types/questionnaire";

const QUESTIONS_PER_PAGE = 4;

export function SurveyFlow({
  questionnaire,
  preview = false,
}: {
  questionnaire: Questionnaire;
  preview?: boolean;
}) {
  const router = useRouter();
  const steps = useMemo(
    () => buildSurveySteps(questionnaire, QUESTIONS_PER_PAGE),
    [questionnaire]
  );
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
  const [navigating, setNavigating] = useState(false);
  const busyRef = useRef(false);

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
    if (busyRef.current) return;
    if (!validateCurrentStep()) return;

    busyRef.current = true;
    setNavigating(true);

    const isLast = currentStepIndex >= steps.length - 1;

    try {
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
    } finally {
      busyRef.current = false;
      setNavigating(false);
    }
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

  const handleAnswerChange = useCallback(
    (questionId: string, value: string) => {
      setAnswer(questionId, value);
      setErrors((e) => {
        const next = { ...e };
        delete next[questionId];
        delete next._form;
        return next;
      });
    },
    [setAnswer]
  );

  const goBack = useCallback(async () => {
    if (currentStepIndex <= 0 || busyRef.current) return;

    if (currentStep?.kind !== "section_intro") {
      await flushCurrentPage();
    }

    setStepIndex(currentStepIndex - 1);
  }, [currentStepIndex, currentStep, flushCurrentPage, setStepIndex]);

  if (!currentStep) return null;

  const isLastStep = currentStepIndex >= steps.length - 1;
  const isQuestionStep = currentStep.kind === "questions";

  const visibleOnPage = isQuestionStep
    ? getVisibleStepQuestions(currentStep, answers)
    : [];

  const compactLayout = visibleOnPage.length >= 3;

  const pageHint = isQuestionStep
    ? isLastStep
      ? "Review your answers, then submit when ready."
      : "Answer every question on this page, then select Continue."
    : undefined;

  return (
    <motion.div
      className={cn(
        "min-h-dvh",
        isQuestionStep && "pb-[max(7.5rem,calc(5.5rem+env(safe-area-inset-bottom)))]"
      )}
    >
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
            <motion.div className="mx-auto w-full max-w-3xl px-4 py-5 sm:px-8 sm:py-8 lg:max-w-4xl xl:max-w-5xl">
              <GlassCard className="overflow-hidden p-0">
                <motion.div className="divide-y divide-white/[0.06]">
                  {currentStep.questions.map((q, i) => {
                    if (!isQuestionVisible(q, answers)) return null;
                    return (
                      <motion.div
                        key={q.id}
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04, duration: 0.25 }}
                        className={cn(
                          "px-4 py-5 sm:px-8 sm:py-6",
                          compactLayout && "sm:py-5"
                        )}
                      >
                        <QuestionRenderer
                          question={q}
                          value={answers[q.id]}
                          onChange={(v) => handleAnswerChange(q.id, v)}
                          error={errors[q.id]}
                          compact={compactLayout}
                        />
                      </motion.div>
                    );
                  })}
                </motion.div>
              </GlassCard>

              {errors._form && (
                <p className="mt-4 text-center text-sm text-rose-400">{errors._form}</p>
              )}
            </motion.div>
          </PageTransition>
        )}
      </AnimatePresence>

      {isQuestionStep && (
        <SurveyNavigation
          canGoBack={currentStepIndex > 0}
          onBack={goBack}
          onContinue={goNext}
          variant={isLastStep ? "submit" : "continue"}
          continueLabel={
            isLastStep ? (preview ? "End preview" : "Submit Survey") : "Continue"
          }
          pageHint={pageHint}
          continueDisabled={!preview && isLastStep && submitting}
          isLoading={navigating || (isLastStep && submitting)}
        />
      )}
    </motion.div>
  );
}

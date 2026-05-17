"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
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
} from "@/lib/questionnaire";
import { validateAnswerForQuestion } from "@/lib/validation";
import type { Question, Questionnaire, SurveyStep } from "@/types/questionnaire";

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
  } = useSurveyStore();
  const { savePageAnswers, syncProgress } = useAutosave(preview);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

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
    if (preview) return;
    if (!consentAcceptedAt) {
      router.replace("/welcome");
    }
  }, [consentAcceptedAt, preview, router]);

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

  const handleAnswerChange = useCallback(
    (question: Question, value: string) => {
      setAnswer(question.id, value);
      setErrors((e) => {
        const next = { ...e };
        delete next[question.id];
        delete next._form;
        return next;
      });
    },
    [setAnswer]
  );

  const validateCurrentStep = useCallback((): boolean => {
    if (!currentStep || currentStep.kind === "section_intro") return true;

    const newErrors: Record<string, string> = {};
    for (const q of currentStep.questions) {
      if (!isQuestionVisible(q, answers)) continue;
      const err = validateAnswerForQuestion(q, answers[q.id] ?? "");
      if (err) newErrors[q.id] = err;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [currentStep, answers]);

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
        }),
      });
      if (!res.ok) throw new Error("Submit failed");
      const data = (await res.json()) as { responseId: string };
      router.push(`/complete?id=${data.responseId}`);
    } catch {
      setErrors({ _form: "Submission failed. Please try again." });
    } finally {
      setSubmitting(false);
    }
  }, [responseId, sessionId, router]);

  const goNext = useCallback(async () => {
    if (!validateCurrentStep()) return;

    const isLast = currentStepIndex >= steps.length - 1;

    if (currentStep?.kind !== "section_intro") {
      await flushCurrentPage();
    }

    if (isLast) {
      if (preview) {
        router.push("/welcome");
        return;
      }
      await handleSubmit();
      return;
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

  const goBack = useCallback(async () => {
    if (currentStepIndex <= 0) return;

    if (currentStep?.kind !== "section_intro") {
      await flushCurrentPage();
    }

    setStepIndex(currentStepIndex - 1);
  }, [currentStepIndex, currentStep, flushCurrentPage, setStepIndex]);

  if (!currentStep) return null;

  const isLastStep = currentStepIndex >= steps.length - 1;

  return (
    <div className="min-h-screen pb-28">
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
            <div className="mx-auto max-w-2xl px-4 py-6">
              <GlassCard className="space-y-8">
                {currentStep.questions.map((q) =>
                  isQuestionVisible(q, answers) ? (
                    <QuestionRenderer
                      key={q.id}
                      question={q}
                      value={answers[q.id]}
                      onChange={(v) => handleAnswerChange(q, v)}
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

      {currentStep.kind !== "section_intro" && (
        <SurveyNavigation
          canGoBack={currentStepIndex > 0}
          onBack={goBack}
          onNext={goNext}
          nextLabel={
            preview && isLastStep
              ? "End preview"
              : isLastStep
                ? submitting
                  ? "Submitting…"
                  : "Submit Survey"
                : "Continue"
          }
          isNextDisabled={!preview && isLastStep && submitting}
          isLoading={submitting || isSaving}
        />
      )}
    </div>
  );
}

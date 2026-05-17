"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { Turnstile } from "@marsidev/react-turnstile";
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
  } = useSurveyStore();
  const { saveAnswer, syncProgress } = useAutosave(preview);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
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

  const handleAnswerChange = useCallback(
    (question: Question, sectionId: string, value: string) => {
      setAnswer(question.id, value);
      setErrors((e) => {
        const next = { ...e };
        delete next[question.id];
        return next;
      });
      saveAnswer(question.id, sectionId, value);
    },
    [setAnswer, saveAnswer]
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

  const goNext = useCallback(async () => {
    if (!validateCurrentStep()) return;

    const isLast = currentStepIndex >= steps.length - 1;
    if (isLast) {
      if (preview) {
        router.push("/welcome");
        return;
      }
      setShowCaptcha(true);
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
    setStepIndex,
    syncProgress,
    questionnaire,
    answers,
    currentStep,
    preview,
    router,
  ]);

  const goBack = useCallback(() => {
    if (currentStepIndex > 0) {
      setStepIndex(currentStepIndex - 1);
    }
  }, [currentStepIndex, setStepIndex]);

  const handleSubmit = useCallback(async () => {
    if (!responseId || !sessionId) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responseId,
          sessionId,
          turnstileToken: turnstileToken ?? undefined,
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
  }, [responseId, sessionId, turnstileToken, router]);

  if (!currentStep) return null;

  const isLastStep = currentStepIndex >= steps.length - 1;

  return (
    <div className="min-h-screen pb-28">
      {preview && (
        <div className="bg-amber-500/10 px-4 py-2 text-center text-sm text-amber-200">
          Preview mode — responses are not saved
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
                getSectionById(questionnaire, currentStep.sectionId)!.questions
                  .length
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
                      onChange={(v) =>
                        handleAnswerChange(q, currentStep.sectionId, v)
                      }
                      error={errors[q.id]}
                    />
                  ) : null
                )}
              </GlassCard>

              {showCaptcha && isLastStep && (
                <div className="mt-6 flex flex-col items-center gap-4">
                  <p className="text-sm text-slate-400">
                    Please verify you are human to submit
                  </p>
                  {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? (
                    <Turnstile
                      siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                      onSuccess={setTurnstileToken}
                    />
                  ) : (
                    <p className="text-xs text-amber-400/80">
                      Captcha disabled in development
                    </p>
                  )}
                  {errors._form && (
                    <p className="text-sm text-rose-400">{errors._form}</p>
                  )}
                </div>
              )}
            </div>
          </PageTransition>
        )}
      </AnimatePresence>

      {currentStep.kind !== "section_intro" && (
        <SurveyNavigation
          canGoBack={currentStepIndex > 0}
          onBack={goBack}
          onNext={
            preview && isLastStep
              ? () => router.push("/welcome")
              : showCaptcha && isLastStep
                ? handleSubmit
                : goNext
          }
          nextLabel={
            preview && isLastStep
              ? "End preview"
              : showCaptcha && isLastStep
                ? submitting
                  ? "Submitting…"
                  : "Submit Survey"
                : isLastStep
                  ? "Review & Submit"
                  : "Continue"
          }
          isNextDisabled={
            !preview &&
            showCaptcha &&
            isLastStep &&
            (submitting ||
              (!!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !turnstileToken))
          }
          isLoading={submitting || isSaving}
        />
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Lock, Sparkles } from "lucide-react";
import { ConsentModal } from "@/components/survey/ConsentModal";
import { GlassCard } from "@/components/layout/GlassCard";
import { StaggerContainer, StaggerItem } from "@/components/animations/PageTransition";
import { surveyPrimaryBtn } from "@/components/survey/survey-ui";
import { useSurveySession } from "@/hooks/useSurveySession";
import { useSurveyStore } from "@/store/survey-store";
import { cn } from "@/lib/utils";
import type { Questionnaire } from "@/types/questionnaire";

export function WelcomeClient({
  questionnaire,
  preview = false,
}: {
  questionnaire: Questionnaire;
  preview?: boolean;
}) {
  const router = useRouter();
  const [consentOpen, setConsentOpen] = useState(false);
  const [accepting, setAccepting] = useState(false);
  const [consentError, setConsentError] = useState<string | null>(null);
  const { acceptConsent } = useSurveySession();
  const questionnaireId = questionnaire.id;

  useEffect(() => {
    const state = useSurveyStore.getState();
    if (state.questionnaireId !== questionnaireId) {
      state.clearProgress();
      state.setQuestionnaireId(questionnaireId);
    }
  }, [questionnaireId]);

  const handleAccept = async () => {
    if (preview) {
      router.push(`/survey?q=${questionnaire.id}&preview=1`);
      return;
    }

    setAccepting(true);
    setConsentError(null);
    try {
      await acceptConsent(questionnaireId);
      setConsentOpen(false);
      router.push(`/survey?q=${encodeURIComponent(questionnaireId)}`);
    } catch (err) {
      console.error("Consent failed", err);
      setConsentError(
        err instanceof Error
          ? err.message
          : "Could not start the survey. Please check your connection and try again."
      );
    } finally {
      setAccepting(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      {preview && (
        <div className="mb-6 rounded-lg border border-amber-500/25 bg-amber-500/8 px-4 py-2 text-center text-sm text-amber-100/90">
          Preview mode — responses are not saved
        </div>
      )}
      <StaggerContainer className="mx-auto w-full max-w-2xl space-y-8">
        <StaggerItem className="text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Workplace Wellbeing Research
          </p>
          <h1 className="font-heading bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl">
            {questionnaire.title}
          </h1>
          <p className="mx-auto mt-5 max-w-lg text-base leading-relaxed text-slate-400">
            A refined, confidential study for corporate professionals in Delhi NCR.
            Your reflections advance evidence on flourishing at work.
          </p>
        </StaggerItem>

        <StaggerItem>
          <GlassCard>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center">
                <Clock className="h-5 w-5 text-slate-300" />
                <span className="text-sm text-slate-300">
                  About {questionnaire.estimatedTime} min
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center">
                <Lock className="h-5 w-5 text-slate-300" />
                <span className="text-sm text-slate-300">Fully confidential</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl border border-white/[0.04] bg-white/[0.02] p-4 text-center">
                <Sparkles className="h-5 w-5 text-slate-300" />
                <span className="text-sm text-slate-300">Progress saved</span>
              </div>
            </div>
          </GlassCard>
        </StaggerItem>

        <StaggerItem className="flex flex-col items-center gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.01 }}
            whileTap={{ scale: 0.99 }}
            onClick={() => (preview ? handleAccept() : setConsentOpen(true))}
            className={cn(surveyPrimaryBtn, "w-full max-w-md")}
          >
            {preview ? "Preview survey" : "Begin study"}
          </motion.button>
          {!preview && (
            <p className="text-center text-xs text-slate-500">
              Voluntary participation. You may stop at any time.
            </p>
          )}
        </StaggerItem>
      </StaggerContainer>

      {!preview && (
        <ConsentModal
          open={consentOpen}
          onAccept={handleAccept}
          onDecline={() => {
            setConsentOpen(false);
            setConsentError(null);
          }}
          estimatedMinutes={questionnaire.estimatedTime}
          loading={accepting}
          error={consentError}
        />
      )}
    </main>
  );
}

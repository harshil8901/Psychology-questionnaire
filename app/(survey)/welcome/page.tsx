"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Clock, Lock, Sparkles } from "lucide-react";
import { ConsentModal } from "@/components/survey/ConsentModal";
import { GlassCard } from "@/components/layout/GlassCard";
import { StaggerContainer, StaggerItem } from "@/components/animations/PageTransition";
import { getQuestionnaire } from "@/lib/questionnaire";
import { useSurveySession } from "@/hooks/useSurveySession";

export default function WelcomePage() {
  const router = useRouter();
  const questionnaire = getQuestionnaire();
  const [consentOpen, setConsentOpen] = useState(false);
  const { acceptConsent } = useSurveySession();

  const handleAccept = async () => {
    await acceptConsent();
    setConsentOpen(false);
    router.push("/survey");
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <StaggerContainer className="mx-auto w-full max-w-2xl space-y-8">
        <StaggerItem className="text-center">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.2em] text-cyan-400/90">
            Psychology Research Study
          </p>
          <h1 className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-4xl font-bold tracking-tight text-transparent sm:text-5xl">
            {questionnaire.title}
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-lg text-slate-400">
            A premium research experience for corporate professionals in Delhi NCR.
            Your insights help advance workplace wellbeing science.
          </p>
        </StaggerItem>

        <StaggerItem>
          <GlassCard>
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.03] p-4 text-center">
                <Clock className="h-5 w-5 text-cyan-400" />
                <span className="text-sm text-slate-300">
                  ~{questionnaire.estimatedTime} minutes
                </span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.03] p-4 text-center">
                <Lock className="h-5 w-5 text-blue-400" />
                <span className="text-sm text-slate-300">Confidential</span>
              </div>
              <div className="flex flex-col items-center gap-2 rounded-xl bg-white/[0.03] p-4 text-center">
                <Sparkles className="h-5 w-5 text-purple-400" />
                <span className="text-sm text-slate-300">Auto-saved progress</span>
              </div>
            </div>
          </GlassCard>
        </StaggerItem>

        <StaggerItem className="flex flex-col items-center gap-4">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setConsentOpen(true)}
            className="w-full max-w-md rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-cyan-500/25"
          >
            Begin Survey
          </motion.button>
          <p className="text-center text-xs text-slate-500">
            Participation is voluntary. You may withdraw at any time.
          </p>
        </StaggerItem>
      </StaggerContainer>

      <ConsentModal
        open={consentOpen}
        onAccept={handleAccept}
        onDecline={() => setConsentOpen(false)}
        estimatedMinutes={questionnaire.estimatedTime}
      />
    </main>
  );
}

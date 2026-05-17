"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { Check, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { StaggerContainer, StaggerItem } from "@/components/animations/PageTransition";
import { GlassCard } from "@/components/layout/GlassCard";
import { surveyPrimaryBtn } from "@/components/survey/survey-ui";
import { useSurveyStore } from "@/store/survey-store";
import { cn } from "@/lib/utils";

function CompleteContent() {
  const params = useSearchParams();
  const responseId = params.get("id");
  const reset = useSurveyStore((s) => s.reset);

  return (
    <main className="flex min-h-dvh flex-col items-center justify-center px-4 py-12 sm:py-16">
      <StaggerContainer className="mx-auto w-full max-w-xl">
        <StaggerItem className="text-center">
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 22, delay: 0.05 }}
            className="relative mx-auto mb-8 inline-flex"
          >
            <span
              className="absolute inset-0 rounded-full bg-white/[0.06] blur-xl"
              aria-hidden
            />
            <span className="relative flex h-24 w-24 items-center justify-center rounded-full border border-white/15 bg-gradient-to-b from-white/[0.12] to-white/[0.04] shadow-[0_0_40px_rgba(255,255,255,0.06)]">
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 320, damping: 18 }}
                className="flex h-12 w-12 items-center justify-center rounded-full bg-white"
              >
                <Check className="h-7 w-7 text-[#020308]" strokeWidth={2.5} />
              </motion.span>
            </span>
          </motion.div>

          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-500">
            Submission received
          </p>
          <h1 className="font-heading mt-4 bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl">
            Thank you
          </h1>
          <p className="mx-auto mt-5 max-w-md text-base leading-relaxed text-slate-400 sm:text-lg">
            Your responses have been recorded securely. You&apos;ve made a meaningful
            contribution to research on flourishing at work.
          </p>
        </StaggerItem>

        <StaggerItem className="mt-8">
          <GlassCard className="overflow-hidden p-0">
            <motion.div className="divide-y divide-white/[0.06]">
              <div className="flex items-start gap-4 px-5 py-5 sm:px-7 sm:py-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                  <Lock className="h-4 w-4 text-slate-300" />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-200">
                    Confidential & secure
                  </p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    Your data are used only for academic research and are never shared
                    with employers or third parties.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-4 px-5 py-5 sm:px-7 sm:py-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04]">
                  <Sparkles className="h-4 w-4 text-slate-300" />
                </span>
                <div className="text-left">
                  <p className="text-sm font-medium text-slate-200">You may close this page</p>
                  <p className="mt-1 text-sm leading-relaxed text-slate-500">
                    No further action is needed. If you opened this in a private window,
                    you can close the tab safely.
                  </p>
                </div>
              </div>
            </motion.div>
          </GlassCard>
        </StaggerItem>

        {responseId && (
          <StaggerItem className="mt-6">
            <p className="text-center text-[11px] font-medium uppercase tracking-widest text-slate-600">
              Reference
            </p>
            <p className="mt-1.5 text-center font-mono text-xs text-slate-500">
              {responseId.slice(0, 8)}
              <span className="text-slate-600"> · · · </span>
              {responseId.slice(-4)}
            </p>
          </StaggerItem>
        )}

        <StaggerItem className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/welcome"
            onClick={() => reset()}
            className={cn(surveyPrimaryBtn, "w-full max-w-sm text-center")}
          >
            Return to home
          </Link>
          <p className="text-center text-xs text-slate-600">
            Predictors of Flourishing at Workplace · Delhi NCR
          </p>
        </StaggerItem>
      </StaggerContainer>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-dvh items-center justify-center text-slate-500">
          <motion.span
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="text-sm"
          >
            Loading…
          </motion.span>
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}

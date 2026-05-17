"use client";

import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { GlassCard } from "@/components/layout/GlassCard";
import { useSurveyStore } from "@/store/survey-store";

function CompleteContent() {
  const params = useSearchParams();
  const responseId = params.get("id");
  const reset = useSurveyStore((s) => s.reset);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-12">
      <GlassCard className="max-w-lg w-full text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.25 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04]"
        >
          <CheckCircle2 className="h-10 w-10 text-slate-200" />
        </motion.div>
        <h1 className="font-heading text-3xl font-semibold text-white">Thank you</h1>
        <p className="mt-4 leading-relaxed text-slate-400">
          Your responses are recorded securely. Thank you for contributing to research
          on flourishing at work.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          All data remain confidential and are used only for academic research.
        </p>
        {responseId && (
          <p className="mt-6 rounded-lg bg-white/[0.04] px-4 py-3 font-mono text-xs text-slate-400">
            Reference: {responseId.slice(0, 8)}…
          </p>
        )}
        <Link
          href="/welcome"
          onClick={() => reset()}
          className="mt-8 inline-block text-sm text-slate-300 hover:text-white"
        >
          Return to home
        </Link>
      </GlassCard>
    </main>
  );
}

export default function CompletePage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center text-slate-400">
          Loading…
        </div>
      }
    >
      <CompleteContent />
    </Suspense>
  );
}

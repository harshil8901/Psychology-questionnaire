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
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-cyan-500/30 to-purple-500/30"
        >
          <CheckCircle2 className="h-10 w-10 text-cyan-400" />
        </motion.div>
        <h1 className="text-3xl font-bold text-white">Thank You</h1>
        <p className="mt-4 text-slate-400 leading-relaxed">
          Your responses have been recorded securely. Your participation contributes
          meaningfully to research on workplace flourishing.
        </p>
        <p className="mt-3 text-sm text-slate-500">
          All data remains confidential and will be used only for academic research.
        </p>
        {responseId && (
          <p className="mt-6 rounded-lg bg-white/[0.04] px-4 py-3 font-mono text-xs text-slate-400">
            Reference: {responseId.slice(0, 8)}…
          </p>
        )}
        <Link
          href="/welcome"
          onClick={() => reset()}
          className="mt-8 inline-block text-sm text-cyan-400 hover:text-cyan-300"
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

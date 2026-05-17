"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  percentage: number;
  sectionLabel?: string;
  isSaving?: boolean;
}

export function ProgressBar({
  percentage,
  sectionLabel,
  isSaving,
}: ProgressBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#020308]/92 backdrop-blur-xl">
      <div
        className="h-0.5 bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Survey progress"
      >
        <motion.div
          className="h-full bg-white/80"
          initial={false}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 sm:px-8">
        <div className="min-w-0 flex-1">
          {sectionLabel && (
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {sectionLabel}
            </p>
          )}
          <p className="text-sm text-slate-400">
            <span className="font-semibold text-white">{Math.round(percentage)}%</span>
            <span className="text-slate-500"> complete</span>
          </p>
        </div>
        {isSaving && (
          <span className="shrink-0 text-xs text-slate-500" aria-live="polite">
            Saving…
          </span>
        )}
      </div>
    </header>
  );
}

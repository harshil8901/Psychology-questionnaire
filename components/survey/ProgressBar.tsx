"use client";

import { AnimatePresence, motion } from "framer-motion";

interface ProgressBarProps {
  percentage: number;
  sectionLabel?: string;
  minutesLeft?: number;
  isSaving?: boolean;
  autoAdvancing?: boolean;
}

export function ProgressBar({
  percentage,
  sectionLabel,
  minutesLeft,
  isSaving,
  autoAdvancing,
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
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0 flex-1">
          {sectionLabel && (
            <p className="truncate text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
              {sectionLabel}
            </p>
          )}
          <p className="text-sm text-slate-400">
            <span className="font-medium text-slate-200">{Math.round(percentage)}%</span>
            {" complete"}
            {minutesLeft != null && (
              <span className="text-slate-500"> · ~{minutesLeft} min left</span>
            )}
          </p>
        </div>
        <AnimatePresence mode="wait">
          {autoAdvancing ? (
            <motion.span
              key="advancing"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="shrink-0 text-xs font-medium text-slate-400"
              aria-live="polite"
            >
              Next page…
            </motion.span>
          ) : isSaving ? (
            <motion.span
              key="saving"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="shrink-0 text-xs text-slate-500"
              aria-live="polite"
            >
              Saving…
            </motion.span>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}

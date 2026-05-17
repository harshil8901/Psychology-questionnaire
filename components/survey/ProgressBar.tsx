"use client";

import { motion } from "framer-motion";

interface ProgressBarProps {
  percentage: number;
  sectionLabel?: string;
  minutesLeft?: number;
  isSaving?: boolean;
}

export function ProgressBar({
  percentage,
  sectionLabel,
  minutesLeft,
  isSaving,
}: ProgressBarProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#0B1020]/90 backdrop-blur-xl">
      <motion.div
        className="h-1 bg-white/[0.06]"
        role="progressbar"
        aria-valuenow={percentage}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Survey progress"
      >
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500"
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      </motion.div>
      <div className="mx-auto flex max-w-2xl items-center justify-between px-4 py-3">
        <motion.div
          key={sectionLabel}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="min-w-0 flex-1"
        >
          {sectionLabel && (
            <p className="truncate text-xs font-medium uppercase tracking-wider text-cyan-400/90">
              {sectionLabel}
            </p>
          )}
          <p className="text-sm text-slate-300">
            <span className="font-semibold text-white">{Math.round(percentage)}%</span>{" "}
            completed
            {minutesLeft != null && (
              <>
                {" "}
                · About {minutesLeft} min left
              </>
            )}
          </p>
        </motion.div>
        {isSaving && (
          <span className="text-xs text-slate-500" aria-live="polite">
            Saving…
          </span>
        )}
      </div>
    </header>
  );
}

"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { surveyPrimaryBtnCompact } from "@/components/survey/survey-ui";
import { cn } from "@/lib/utils";
import { X } from "lucide-react";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void | Promise<void>;
  onDecline: () => void;
  estimatedMinutes: number;
  loading?: boolean;
  error?: string | null;
}

export function ConsentModal({
  open,
  onAccept,
  onDecline,
  estimatedMinutes,
  loading = false,
  error = null,
}: ConsentModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="fixed inset-0 z-50 bg-[#020308]/85 backdrop-blur-sm"
            onClick={loading ? undefined : onDecline}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center pointer-events-none">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="consent-title"
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 12 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.06] bg-[#0a0d14]/95 shadow-2xl backdrop-blur-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/[0.05] px-5 py-4">
                <h2
                  id="consent-title"
                  className="font-heading text-lg font-semibold text-white"
                >
                  Informed consent
                </h2>
                <button
                  type="button"
                  onClick={onDecline}
                  disabled={loading}
                  className="rounded-lg p-1 text-slate-500 hover:bg-white/[0.06] hover:text-white disabled:opacity-50"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="max-h-[50vh] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-400">
                <p className="mb-4">
                  You are invited to take part in{" "}
                  <strong className="font-medium text-slate-200">
                    Predictors of Flourishing at Workplace
                  </strong>
                  , a psychology PhD research study.
                </p>
                <p className="mb-4">
                  <strong className="text-slate-200">Purpose:</strong> To understand
                  factors linked to flourishing among corporate employees in Delhi NCR.
                </p>
                <p className="mb-4">
                  <strong className="text-slate-200">Voluntary:</strong> Participation
                  is optional. You may stop at any time by closing this window.
                </p>
                <p className="mb-4">
                  <strong className="text-slate-200">Confidentiality:</strong> Responses
                  are handled confidentially and will not identify you in published work.
                </p>
                <p className="mb-4">
                  <strong className="text-slate-200">Duration:</strong> About{" "}
                  {estimatedMinutes} minutes.
                </p>
                <p>
                  <strong className="text-slate-200">Data use:</strong> Stored securely
                  for academic research and analysis only.
                </p>
              </div>
              {error && (
                <p className="px-5 pb-2 text-sm text-rose-400" role="alert">
                  {error}
                </p>
              )}
              <div className="flex flex-col gap-3 border-t border-white/[0.05] p-4 sm:flex-row-reverse">
                <Button
                  type="button"
                  onClick={() => void onAccept()}
                  disabled={loading}
                  className={cn(surveyPrimaryBtnCompact, "h-14 flex-1")}
                >
                  {loading ? "Starting…" : "Accept & begin"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={onDecline}
                  disabled={loading}
                  className="h-14 flex-1 border-white/[0.08] bg-transparent text-base text-slate-400 hover:bg-white/[0.04]"
                >
                  Decline
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

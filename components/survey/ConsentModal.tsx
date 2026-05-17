"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ConsentModalProps {
  open: boolean;
  onAccept: () => void;
  onDecline: () => void;
  estimatedMinutes: number;
}

export function ConsentModal({
  open,
  onAccept,
  onDecline,
  estimatedMinutes,
}: ConsentModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#0B1020]/80 backdrop-blur-md"
            onClick={onDecline}
            aria-hidden
          />
          <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center">
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-labelledby="consent-title"
              initial={{ opacity: 0, y: 40, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.98 }}
              transition={{ type: "spring", damping: 28, stiffness: 300 }}
              className="relative max-h-[85vh] w-full max-w-lg overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.06] shadow-2xl backdrop-blur-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
                <h2 id="consent-title" className="text-lg font-semibold text-white">
                  Informed Consent
                </h2>
                <button
                  type="button"
                  onClick={onDecline}
                  className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              <motion.div
                className="max-h-[50vh] overflow-y-auto px-5 py-4 text-sm leading-relaxed text-slate-300"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 }}
              >
                <p className="mb-4">
                  You are invited to participate in a research study titled{" "}
                  <strong className="text-white">
                    &ldquo;Predictors of Flourishing at Workplace&rdquo;
                  </strong>
                  , conducted as part of a psychology PhD research programme.
                </p>
                <p className="mb-4">
                  <strong className="text-white">Purpose:</strong> This study examines
                  factors associated with flourishing among corporate employees in Delhi
                  NCR.
                </p>
                <p className="mb-4">
                  <strong className="text-white">Voluntary participation:</strong> Your
                  participation is entirely voluntary. You may withdraw at any time
                  without penalty by closing this browser window.
                </p>
                <p className="mb-4">
                  <strong className="text-white">Anonymity:</strong> Responses are
                  collected confidentially for research purposes. Individual responses
                  will not be publicly identifiable in any published work.
                </p>
                <p className="mb-4">
                  <strong className="text-white">Time required:</strong> Approximately{" "}
                  {estimatedMinutes} minutes.
                </p>
                <p>
                  <strong className="text-white">Data use:</strong> Data will be stored
                  securely and used only for academic research and analysis.
                </p>
              </motion.div>
              <div className="flex flex-col gap-2 border-t border-white/[0.06] p-4 sm:flex-row-reverse">
                <Button
                  onClick={onAccept}
                  className="h-12 flex-1 bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 text-white hover:opacity-90"
                >
                  Accept & Begin
                </Button>
                <Button
                  variant="outline"
                  onClick={onDecline}
                  className="h-12 flex-1 border-white/10 bg-transparent text-slate-300 hover:bg-white/5"
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

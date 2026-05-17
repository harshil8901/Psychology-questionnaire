"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { surveyPrimaryBtnCompact } from "@/components/survey/survey-ui";
import { cn } from "@/lib/utils";

interface SurveyNavigationProps {
  canGoBack?: boolean;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  /** Disable only during save/submit — keep enabled so users can tap to see validation errors */
  continueDisabled?: boolean;
  isLoading?: boolean;
}

export function SurveyNavigation({
  canGoBack,
  onBack,
  onContinue,
  continueLabel = "Continue",
  continueDisabled = false,
  isLoading = false,
}: SurveyNavigationProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#020308]/95 px-4 pt-3 backdrop-blur-xl safe-area-pb"
      aria-label="Survey navigation"
    >
      <motion.div className="mx-auto flex w-full max-w-2xl gap-3">
        {canGoBack && onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="h-14 min-h-14 min-w-[56px] shrink-0 touch-manipulation border-white/10 bg-white/5 px-4 text-slate-300"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
            <span className="sr-only sm:not-sr-only sm:ml-1">Back</span>
          </Button>
        ) : null}
        <Button
          type="button"
          onClick={onContinue}
          disabled={continueDisabled || isLoading}
          className={cn(
            surveyPrimaryBtnCompact,
            "min-h-14 flex-1 touch-manipulation text-base sm:text-lg"
          )}
        >
          {isLoading ? "Please wait…" : continueLabel}
          {!isLoading && <ChevronRight className="ml-1 h-5 w-5 shrink-0" />}
        </Button>
      </motion.div>
    </motion.nav>
  );
}

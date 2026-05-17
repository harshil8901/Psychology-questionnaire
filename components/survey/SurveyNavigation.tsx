"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  surveyPrimaryBtnCompact,
  surveySecondaryBtn,
} from "@/components/survey/survey-ui";
import { cn } from "@/lib/utils";

interface SurveyNavigationProps {
  canGoBack?: boolean;
  onBack?: () => void;
  onContinue: () => void;
  continueLabel?: string;
  variant?: "continue" | "submit";
  continueDisabled?: boolean;
  isLoading?: boolean;
  pageHint?: string;
}

export function SurveyNavigation({
  canGoBack,
  onBack,
  onContinue,
  continueLabel = "Continue",
  variant = "continue",
  continueDisabled = false,
  isLoading = false,
  pageHint,
}: SurveyNavigationProps) {
  const isSubmit = variant === "submit";

  return (
    <motion.nav
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#020308]/97 backdrop-blur-xl safe-area-pb"
      aria-label="Survey navigation"
    >
      <div className="mx-auto w-full max-w-2xl px-4 pt-3 pb-1">
        {pageHint && (
          <p className="mb-2.5 text-center text-xs leading-relaxed text-slate-500">
            {pageHint}
          </p>
        )}
        <motion.div className="flex items-stretch gap-2.5 sm:gap-3">
          {canGoBack && onBack ? (
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              disabled={isLoading}
              className="h-12 min-h-12 w-12 shrink-0 touch-manipulation border-white/10 bg-white/[0.03] p-0 text-slate-400 hover:bg-white/[0.06] hover:text-slate-200 sm:w-auto sm:px-4"
              aria-label="Previous page"
            >
              <ChevronLeft className="h-5 w-5" />
              <span className="hidden sm:inline sm:ml-1 sm:text-sm">Back</span>
            </Button>
          ) : null}
          <Button
            type="button"
            onClick={onContinue}
            disabled={continueDisabled || isLoading}
            className={cn(
              "min-h-12 flex-1 touch-manipulation",
              isSubmit ? surveyPrimaryBtnCompact : surveySecondaryBtn
            )}
          >
            <span className="flex items-center justify-center gap-1.5">
              {isLoading ? "Please wait…" : continueLabel}
              {!isLoading && <ChevronRight className="h-4 w-4 shrink-0 opacity-70" />}
            </span>
          </Button>
        </motion.div>
      </div>
    </motion.nav>
  );
}

"use client";

import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { surveyPrimaryBtnCompact } from "@/components/survey/survey-ui";
import { cn } from "@/lib/utils";

interface SurveyNavigationProps {
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  canGoBack?: boolean;
  isNextDisabled?: boolean;
  isLoading?: boolean;
}

export function SurveyNavigation({
  onBack,
  onNext,
  nextLabel = "Continue",
  canGoBack = true,
  isNextDisabled,
  isLoading,
}: SurveyNavigationProps) {
  return (
    <motion.nav
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/[0.06] bg-[#020308]/95 px-4 py-4 backdrop-blur-xl safe-area-pb"
    >
      <div className="mx-auto flex max-w-2xl gap-3">
        {canGoBack && onBack ? (
          <Button
            type="button"
            variant="outline"
            onClick={onBack}
            disabled={isLoading}
            className="h-14 min-w-[56px] border-white/10 bg-white/5 px-4 text-slate-300"
            aria-label="Go back"
          >
            <ChevronLeft className="h-5 w-5" />
          </Button>
        ) : (
          <div className="w-[56px]" />
        )}
        <Button
          type="button"
          onClick={onNext}
          disabled={isNextDisabled || isLoading}
          className={cn(surveyPrimaryBtnCompact, "flex-1")}
        >
          {isLoading ? "Saving…" : nextLabel}
          {!isLoading && <ChevronRight className="ml-1 h-5 w-5" />}
        </Button>
      </div>
    </motion.nav>
  );
}

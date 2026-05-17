"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { SurveyFlow } from "@/components/survey/SurveyFlow";
import { useSurveyStore } from "@/store/survey-store";
import { useSurveySession } from "@/hooks/useSurveySession";

export default function SurveyPage() {
  const router = useRouter();
  const { consentAcceptedAt, isHydrated } = useSurveyStore();
  const { ensureSession } = useSurveySession();

  useEffect(() => {
    if (!isHydrated) return;
    if (!consentAcceptedAt) {
      router.replace("/welcome");
      return;
    }
    ensureSession().catch(() => router.replace("/welcome"));
  }, [isHydrated, consentAcceptedAt, ensureSession, router]);

  if (!isHydrated || !consentAcceptedAt) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
      </div>
    );
  }

  return <SurveyFlow />;
}

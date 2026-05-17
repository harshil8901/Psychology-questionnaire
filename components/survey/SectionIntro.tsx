"use client";

import {
  Activity,
  Building2,
  Heart,
  MessageCircle,
  Scale,
  Shield,
  Sparkles,
  Sun,
  Sunrise,
  User,
  Users,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { GlassCard } from "@/components/layout/GlassCard";
import type { SurveySection } from "@/types/questionnaire";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  user: User,
  heart: Heart,
  zap: Zap,
  sparkles: Sparkles,
  building: Building2,
  sun: Sun,
  activity: Activity,
  shield: Shield,
  users: Users,
  scale: Scale,
  sunrise: Sunrise,
  message: MessageCircle,
};

interface SectionIntroProps {
  section: SurveySection;
  questionCount: number;
  onContinue: () => void;
}

export function SectionIntro({ section, questionCount, onContinue }: SectionIntroProps) {
  const Icon = ICONS[section.icon ?? "sparkles"] ?? Sparkles;

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 py-8">
      <GlassCard className="max-w-lg w-full text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className={cn(
            "mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br",
            section.themeGradient ?? "from-cyan-500 to-blue-500"
          )}
        >
          <Icon className="h-8 w-8 text-white" aria-hidden />
        </motion.div>
        <h2 className="text-2xl font-semibold text-white">{section.title}</h2>
        <p className="mt-3 text-slate-400 leading-relaxed">{section.description}</p>
        <p className="mt-4 text-sm text-slate-500">
          {questionCount} questions · ~{section.estimatedTime ?? 3} min
        </p>
        <p className="mt-2 text-sm text-cyan-400/80">
          Take your time — there are no right or wrong answers.
        </p>
        <motion.button
          type="button"
          onClick={onContinue}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="mt-8 w-full rounded-xl bg-gradient-to-r from-cyan-500 via-blue-500 to-purple-500 px-6 py-3.5 text-sm font-semibold text-white shadow-lg shadow-cyan-500/20"
        >
          Continue
        </motion.button>
      </GlassCard>
    </div>
  );
}

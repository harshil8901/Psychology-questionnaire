"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LikertScaleProps {
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
  compact?: boolean;
}

export function LikertScale({
  options,
  value,
  onChange,
  name,
  disabled,
  compact = false,
}: LikertScaleProps) {
  const longLabels = options.some((o) => o.length > 10);

  return (
    <motion.div
      role="radiogroup"
      aria-label="Likert scale"
      className={cn(
        "gap-1.5",
        longLabels && !compact
          ? "grid grid-cols-1 gap-2 sm:grid-cols-2 lg:flex lg:flex-wrap"
          : compact
            ? "survey-likert-scroll flex gap-1.5 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible"
            : "survey-likert-scroll flex gap-2 overflow-x-auto pb-0.5 sm:flex-wrap sm:overflow-visible"
      )}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.04 } },
      }}
    >
      {options.map((option) => {
        const selected = value === option;
        const id = `${name}-${option.replace(/\s+/g, "-")}`;
        return (
          <motion.label
            key={option}
            htmlFor={id}
            variants={{
              hidden: { opacity: 0, y: 6 },
              visible: { opacity: 1, y: 0 },
            }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={cn(
              "relative flex shrink-0 cursor-pointer touch-manipulation items-center justify-center rounded-lg border text-center font-medium transition-colors",
              longLabels && !compact
                ? "min-h-[48px] w-full px-3 py-3 text-sm sm:min-w-[8rem] sm:flex-1"
                : compact
                  ? "min-h-[44px] min-w-[4.25rem] max-w-[7rem] flex-1 px-2 py-2 text-xs sm:min-w-[5rem] sm:max-w-none sm:text-sm"
                  : "min-h-[48px] min-w-[4.5rem] flex-1 px-2.5 py-2.5 text-sm sm:min-w-[5.5rem]",
              selected
                ? "border-white/25 bg-white/[0.12] text-white"
                : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06]",
              disabled && "pointer-events-none opacity-60"
            )}
          >
            <input
              type="radio"
              id={id}
              name={name}
              value={option}
              checked={selected}
              onChange={() => onChange(option)}
              disabled={disabled}
              className="sr-only"
            />
            <span className="leading-tight">{option}</span>
            {selected && (
              <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/30" />
            )}
          </motion.label>
        );
      })}
    </motion.div>
  );
}

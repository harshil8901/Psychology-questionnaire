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
        "grid w-full gap-2",
        longLabels
          ? "grid-cols-1 lg:flex lg:flex-wrap lg:gap-2"
          : compact
            ? "grid-cols-2 sm:flex sm:flex-wrap"
            : "grid-cols-2 md:flex md:flex-wrap"
      )}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.03 } },
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
              hidden: { opacity: 0, y: 4 },
              visible: { opacity: 1, y: 0 },
            }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={cn(
              "relative flex w-full cursor-pointer touch-manipulation items-center justify-center rounded-lg border px-3 py-3 text-center text-sm font-medium leading-snug transition-colors",
              longLabels && "lg:min-h-[44px] lg:min-w-[7.5rem] lg:flex-1 lg:py-2.5",
              !longLabels && compact && "min-h-[44px] py-2.5 text-xs sm:text-sm",
              !longLabels && !compact && "min-h-[48px]",
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
            <span>{option}</span>
            {selected && (
              <span className="pointer-events-none absolute inset-0 rounded-lg ring-1 ring-white/30" />
            )}
          </motion.label>
        );
      })}
    </motion.div>
  );
}

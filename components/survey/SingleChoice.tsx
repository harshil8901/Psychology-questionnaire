"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SingleChoiceProps {
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  name: string;
  compact?: boolean;
}

export function SingleChoice({
  options,
  value,
  onChange,
  name,
  compact = false,
}: SingleChoiceProps) {
  return (
    <motion.div
      role="radiogroup"
      className={cn(
        "grid gap-1.5",
        compact && "sm:grid-cols-2"
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
            variants={{ hidden: { opacity: 0, x: -8 }, visible: { opacity: 1, x: 0 } }}
            className={cn(
              "flex cursor-pointer touch-manipulation items-center gap-2.5 rounded-lg border px-3 transition-all active:scale-[0.99]",
              compact ? "min-h-[44px] py-2.5" : "min-h-[52px] rounded-xl px-4 py-3",
              selected
                ? "border-white/25 bg-white/[0.1] text-white"
                : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/15 hover:bg-white/[0.06]"
            )}
          >
            <input
              type="radio"
              id={id}
              name={name}
              value={option}
              checked={selected}
              onChange={() => onChange(option)}
              className="sr-only"
            />
            <span
              className={cn(
                "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2",
                selected ? "border-white bg-white" : "border-slate-500"
              )}
            >
              {selected && <span className="h-2 w-2 rounded-full bg-[#020308]" />}
            </span>
            <span
              className={cn(
                "font-medium leading-snug",
                compact ? "text-sm" : "text-base"
              )}
            >
              {option}
            </span>
          </motion.label>
        );
      })}
    </motion.div>
  );
}

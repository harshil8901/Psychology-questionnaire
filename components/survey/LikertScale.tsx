"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LikertScaleProps {
  options: string[];
  value?: string;
  onChange: (value: string) => void;
  name: string;
  disabled?: boolean;
}

/** Compact horizontal scale for survey sections (after demographics) */
export function LikertScale({
  options,
  value,
  onChange,
  name,
  disabled,
}: LikertScaleProps) {
  return (
    <motion.div
      role="radiogroup"
      aria-label="Response scale"
      className="grid w-full grid-cols-5 gap-1 sm:gap-1.5"
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
            variants={{ hidden: { opacity: 0, y: 4 }, visible: { opacity: 1, y: 0 } }}
            whileTap={{ scale: disabled ? 1 : 0.97 }}
            className={cn(
              "relative flex min-h-[3.5rem] cursor-pointer touch-manipulation flex-col items-center justify-center rounded-lg border px-0.5 py-1.5 text-center transition-colors sm:min-h-10 sm:px-1 sm:py-2",
              selected
                ? "border-white/30 bg-white/[0.12] text-white shadow-[0_0_12px_rgba(255,255,255,0.06)]"
                : "border-white/[0.08] bg-white/[0.03] text-slate-400 hover:border-white/15 hover:bg-white/[0.05]",
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
            <span className="block w-full px-0.5 text-[10px] font-medium leading-[1.15] sm:text-[11px] md:text-xs">
              {option}
            </span>
          </motion.label>
        );
      })}
    </motion.div>
  );
}

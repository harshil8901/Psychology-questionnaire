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
  return (
    <motion.div
      role="radiogroup"
      aria-label="Likert scale"
      className={cn(
        "gap-1.5",
        compact
          ? "flex flex-wrap"
          : "grid grid-cols-1 gap-2 sm:flex sm:flex-wrap sm:gap-2"
      )}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: 0.05 } },
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
              hidden: { opacity: 0, y: 8 },
              visible: { opacity: 1, y: 0 },
            }}
            whileHover={{ scale: disabled ? 1 : 1.02 }}
            whileTap={{ scale: disabled ? 1 : 0.98 }}
            className={cn(
              "relative flex cursor-pointer touch-manipulation items-center justify-center rounded-lg border text-center font-medium transition-all active:scale-[0.99]",
              compact
                ? "min-h-[40px] min-w-[4.5rem] flex-1 px-2 py-2 text-xs sm:min-w-[5.5rem] sm:text-sm"
                : "min-h-[48px] flex-1 rounded-xl px-3 py-3 text-sm sm:min-w-[5.5rem]",
              selected
                ? "border-white/25 bg-white/[0.12] text-white"
                : "border-white/[0.08] bg-white/[0.03] text-slate-300 hover:border-white/20 hover:bg-white/[0.06] hover:text-white",
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
              <motion.span
                layoutId={`glow-${name}`}
                className="pointer-events-none absolute inset-0 rounded-xl ring-1 ring-white/30"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </motion.label>
        );
      })}
    </motion.div>
  );
}

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
      aria-label="Likert scale"
      className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:flex xl:flex-wrap"
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
              "relative flex min-h-[52px] flex-1 cursor-pointer touch-manipulation items-center justify-center rounded-xl border px-3 py-3.5 text-center text-sm font-medium transition-all duration-300 active:scale-[0.99] sm:min-h-[48px] sm:min-w-[100px] sm:text-sm",
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

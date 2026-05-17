"use client";

import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.35 }}
      className={cn(
        "rounded-2xl border border-white/[0.08] bg-white/[0.05] p-6 shadow-xl backdrop-blur-xl",
        className
      )}
    >
      {children}
    </motion.div>
  );
}

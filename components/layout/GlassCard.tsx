import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

export function GlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-white/[0.06] bg-white/[0.03] p-6 shadow-2xl shadow-black/40 backdrop-blur-md",
        className
      )}
    >
      {children}
    </div>
  );
}

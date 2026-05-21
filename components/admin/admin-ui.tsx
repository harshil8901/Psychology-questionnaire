import { cn } from "@/lib/utils";

/** Matches welcome page typography */
export const adminEyebrow =
  "text-xs font-semibold uppercase tracking-[0.28em] text-slate-500";

export const adminHeroTitle =
  "font-heading bg-gradient-to-br from-white via-slate-100 to-slate-400 bg-clip-text text-4xl font-semibold leading-tight text-transparent sm:text-5xl";

export const adminHeroDescription =
  "mt-3 max-w-xl text-base leading-relaxed text-slate-400";

export const adminSectionTitle =
  "font-heading text-xl font-semibold leading-snug text-slate-100 sm:text-2xl";

export const adminSectionDescription = "mt-1 text-sm leading-relaxed text-slate-500";

export const adminItemTitle = "font-heading text-lg font-semibold text-slate-100";

export const adminCard =
  "rounded-xl border border-white/[0.06] bg-[#0a0d12]/90 shadow-sm shadow-black/20";

export const adminCardHeader = "border-b border-white/[0.05] px-4 py-3.5 sm:px-5 sm:py-4";

export const adminInput =
  "border-white/[0.08] bg-white/[0.03] text-white placeholder:text-slate-600 focus-visible:border-white/20 focus-visible:ring-white/10";

export const adminSelect =
  "h-9 rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 text-sm text-slate-200 outline-none focus:border-white/20";

export function adminBtn(variant: "primary" | "secondary" | "ghost" | "danger" = "secondary") {
  return cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-lg px-4 text-sm font-medium transition-colors touch-manipulation disabled:pointer-events-none disabled:opacity-40 sm:min-h-9",
    variant === "primary" &&
      "border border-white/10 bg-white text-[#020308] hover:bg-slate-100",
    variant === "secondary" &&
      "border border-white/[0.08] bg-white/[0.04] text-slate-200 hover:bg-white/[0.08] hover:text-white",
    variant === "ghost" &&
      "border border-transparent text-slate-400 hover:bg-white/[0.04] hover:text-white",
    variant === "danger" &&
      "border border-rose-500/20 bg-rose-500/5 text-rose-300 hover:bg-rose-500/10"
  );
}

export function adminBadge(
  variant: "default" | "active" | "success" | "warning" = "default"
) {
  return cn(
    "inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium",
    variant === "default" && "border-white/[0.08] bg-white/[0.04] text-slate-400",
    variant === "active" && "border-white/15 bg-white/[0.08] text-slate-200",
    variant === "success" && "border-emerald-500/20 bg-emerald-500/8 text-emerald-300",
    variant === "warning" && "border-amber-500/20 bg-amber-500/8 text-amber-300"
  );
}

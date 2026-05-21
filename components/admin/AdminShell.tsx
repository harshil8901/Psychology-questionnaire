"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { FileText, LogOut, Table2 } from "lucide-react";
import {
  adminEyebrow,
  adminHeroDescription,
  adminHeroTitle,
} from "@/components/admin/admin-ui";

const NAV = [
  { href: "/admin/responses", label: "Responses", icon: Table2, shortLabel: "Responses" },
  { href: "/admin", label: "Questionnaires", icon: FileText, shortLabel: "Forms" },
] as const;

function isNavActive(pathname: string, href: string): boolean {
  if (href === "/admin/responses") return pathname.startsWith("/admin/responses");
  if (href === "/admin") {
    return pathname === "/admin" || pathname.startsWith("/admin/questionnaires");
  }
  return pathname === href;
}

export function AdminShell({
  children,
  title,
  description,
}: {
  children: React.ReactNode;
  title: string;
  description?: string;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex min-h-dvh">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[0.05] bg-[#06080c] md:flex">
        <div className="border-b border-white/[0.05] px-5 py-6">
          <p className={adminEyebrow}>Research</p>
          <p className={cn(adminHeroTitle, "mt-2 text-2xl sm:text-3xl")}>Control panel</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isNavActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-white/[0.08] text-white"
                    : "text-slate-500 hover:bg-white/[0.04] hover:text-slate-200"
                )}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-white/[0.05] p-3">
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-slate-500 transition-colors hover:bg-white/[0.04] hover:text-slate-200"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 border-b border-white/[0.05] bg-[#020308]/95 backdrop-blur-md">
          <div className="flex items-start justify-between gap-3 px-4 py-3 sm:px-6 sm:py-4">
            <div className="min-w-0 flex-1">
              <p className={cn(adminEyebrow, "hidden sm:block")}>Research control panel</p>
              <p className={cn(adminEyebrow, "sm:hidden")}>Research</p>
              <h1 className={cn(adminHeroTitle, "text-2xl sm:text-4xl")}>{title}</h1>
              {description && (
                <p className={cn(adminHeroDescription, "mt-1 text-sm sm:mt-3 sm:text-base")}>
                  {description}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={signOut}
              className="mt-1 flex shrink-0 items-center gap-2 rounded-lg border border-white/[0.08] px-3 py-2 text-sm text-slate-400 transition-colors hover:bg-white/[0.04] hover:text-white md:hidden"
              aria-label="Sign out"
            >
              <LogOut className="h-4 w-4" />
              <span className="sr-only sm:not-sr-only sm:inline">Sign out</span>
            </button>
          </div>
        </header>

        <main className="flex-1 px-4 py-5 pb-[calc(5.5rem+env(safe-area-inset-bottom))] sm:px-6 sm:py-8 md:pb-8">
          {children}
        </main>

        <nav
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/[0.08] bg-[#06080c]/98 backdrop-blur-lg md:hidden"
          style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
          aria-label="Admin navigation"
        >
          <div className="mx-auto flex max-w-lg items-stretch justify-around gap-1 px-2 pt-1">
            {NAV.map(({ href, label, shortLabel, icon: Icon }) => {
              const active = isNavActive(pathname, href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-1 rounded-lg px-2 py-2 text-center transition-colors touch-manipulation",
                    active
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-500 active:bg-white/[0.04]"
                  )}
                >
                  <Icon className="h-5 w-5 shrink-0" aria-hidden />
                  <span className="w-full truncate text-[11px] font-medium leading-tight">
                    {shortLabel}
                  </span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>
    </div>
  );
}

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
  { href: "/admin", label: "Questionnaires", icon: FileText },
  { href: "/admin/responses", label: "Responses", icon: Table2 },
] as const;

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
    <div className="flex min-h-screen">
      <aside className="hidden w-56 shrink-0 flex-col border-r border-white/[0.05] bg-[#06080c] md:flex">
        <div className="border-b border-white/[0.05] px-5 py-6">
          <p className={adminEyebrow}>Research</p>
          <p className={cn(adminHeroTitle, "mt-2 text-2xl sm:text-3xl")}>Control panel</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
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
        <header className="border-b border-white/[0.05] bg-[#020308]/80 backdrop-blur-md">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div>
              <p className={adminEyebrow}>Research control panel</p>
              <h1 className={adminHeroTitle}>{title}</h1>
              {description && (
                <p className={adminHeroDescription}>{description}</p>
              )}
            </div>
            <nav className="flex gap-1 md:hidden">
              {NAV.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    "rounded-lg px-3 py-2 text-sm",
                    pathname === href
                      ? "bg-white/[0.08] text-white"
                      : "text-slate-500"
                  )}
                >
                  {label}
                </Link>
              ))}
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg px-3 py-2 text-sm text-slate-500"
              >
                Out
              </button>
            </nav>
          </div>
        </header>
        <main className="flex-1 px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

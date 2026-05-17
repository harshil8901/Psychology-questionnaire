"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { FileText, LogOut, Table2 } from "lucide-react";

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
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  };

  return (
    <div className="min-h-screen">
      <header className="border-b border-white/[0.06] bg-[#0B1020]/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-cyan-400/80">
              Research Control Panel
            </p>
            <h1 className="text-xl font-semibold text-white">{title}</h1>
            {description && (
              <p className="mt-0.5 text-sm text-slate-400">{description}</p>
            )}
          </div>
          <nav className="flex items-center gap-1 rounded-xl border border-white/[0.08] bg-white/[0.03] p-1">
            {NAV.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors",
                  pathname === href
                    ? "bg-white/10 text-white"
                    : "text-slate-400 hover:text-white"
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 rounded-lg border border-white/10 px-3 py-2 text-sm text-slate-400 hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
    </div>
  );
}

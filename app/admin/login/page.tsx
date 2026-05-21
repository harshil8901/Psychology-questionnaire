"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AdminLayout } from "@/components/admin/AdminLayout";
import {
  adminBtn,
  adminCard,
  adminEyebrow,
  adminHeroDescription,
  adminHeroTitle,
  adminInput,
} from "@/components/admin/admin-ui";
import { cn } from "@/lib/utils";

export default function AdminLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/admin/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password }),
    });

    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Invalid username or password");
      return;
    }

    router.push("/admin/responses");
    router.refresh();
  };

  return (
    <AdminLayout>
      <main className="flex min-h-screen items-center justify-center px-4 py-12">
        <div className={cn(adminCard, "w-full max-w-sm p-6 sm:p-8")}>
          <p className={adminEyebrow}>Research panel</p>
          <h1 className={cn(adminHeroTitle, "mt-3 text-3xl sm:text-4xl")}>Sign in</h1>
          <p className={adminHeroDescription}>
            Questionnaires and response exports
          </p>

          <form onSubmit={handleLogin} className="mt-8 space-y-5">
            <div>
              <Label htmlFor="username" className="text-xs text-slate-500">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                autoComplete="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={cn("mt-1.5 h-10", adminInput)}
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-xs text-slate-500">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={cn("mt-1.5 h-10", adminInput)}
              />
            </div>
            {error && (
              <p className="rounded-lg border border-rose-500/20 bg-rose-500/5 px-3 py-2 text-sm text-rose-300">
                {error}
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className={cn(adminBtn("primary"), "h-10 w-full")}
            >
              {loading ? "Signing in…" : "Sign in"}
            </button>
          </form>
        </div>
      </main>
    </AdminLayout>
  );
}

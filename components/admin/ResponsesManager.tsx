"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Download, ChevronLeft, ChevronRight, Trash2, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  adminBtn,
  adminCard,
  adminCardHeader,
  adminInput,
  adminSelect,
  adminSectionDescription,
  adminSectionTitle,
} from "@/components/admin/admin-ui";
import type { ResponseRow } from "@/types/database";

interface ListResponse {
  responses: ResponseRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: { total: number; completed: number; incomplete: number };
}

const DEMO_LABELS: Record<string, string> = {
  age: "Age",
  gender: "Gender",
  education: "Education",
  experience: "Experience",
  industry: "Industry",
  location: "Location",
  work_mode: "Work mode",
};

function respondentName(row: ResponseRow): string {
  const name = row.demographic_snapshot?.name?.trim();
  return name || "Unnamed respondent";
}

function demographicLines(snapshot: ResponseRow["demographic_snapshot"]): string[] {
  if (!snapshot) return [];
  const lines: string[] = [];
  for (const [key, label] of Object.entries(DEMO_LABELS)) {
    const value = snapshot[key]?.trim();
    if (value) lines.push(`${label}: ${value}`);
  }
  return lines;
}

function formatWhen(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ResponsesManager() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      page: String(page),
      limit: "20",
      status: "completed",
      sort,
    });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/responses?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search, sort]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!exportMenuOpen) return;

    const closeMenu = (event: MouseEvent) => {
      if (
        exportMenuRef.current &&
        !exportMenuRef.current.contains(event.target as Node)
      ) {
        setExportMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [exportMenuOpen]);

  const handleDelete = async (row: ResponseRow) => {
    const name = respondentName(row);
    if (
      !window.confirm(
        `Delete the response for "${name}"? This cannot be undone.`
      )
    ) {
      return;
    }

    setDeletingId(row.id);
    try {
      const res = await fetch(`/api/admin/responses/${row.id}`, {
        method: "DELETE",
      });
      const body = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(body.error ?? "Delete failed");
      }
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Delete failed";
      window.alert(message);
    } finally {
      setDeletingId(null);
    }
  };

  const exportUrl = (format: string, split?: "combined" | "gender") => {
    const params = new URLSearchParams({ format });
    if (split) params.set("split", split);
    return `/api/admin/export?${params}`;
  };

  const completedCount = data?.summary.completed ?? data?.pagination.total ?? 0;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Completed submissions</p>
          <p className="font-heading mt-1 text-3xl font-semibold text-white">{completedCount}</p>
        </div>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap">
          <a href={exportUrl("csv")} className={cn(adminBtn("ghost"), "w-full sm:w-auto")}>
            Export CSV
          </a>
          <div className="relative w-full sm:w-auto" ref={exportMenuRef}>
            <button
              type="button"
              className={cn(adminBtn("primary"), "w-full sm:w-auto")}
              aria-expanded={exportMenuOpen}
              aria-haspopup="menu"
              onClick={() => setExportMenuOpen((open) => !open)}
            >
              <Download className="h-3.5 w-3.5" />
              Export XLSX
            </button>
            {exportMenuOpen && (
              <div
                role="menu"
                className="absolute right-0 left-0 z-20 mt-2 w-full overflow-hidden rounded-lg border border-white/[0.08] bg-slate-900 py-1 shadow-xl sm:left-auto sm:w-64"
              >
                <a
                  role="menuitem"
                  href={exportUrl("xlsx", "combined")}
                  className="block px-4 py-2.5 text-sm text-slate-200 hover:bg-white/[0.06]"
                  onClick={() => setExportMenuOpen(false)}
                >
                  <span className="font-medium text-white">Combined</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    All responses in one sheet
                  </span>
                </a>
                <a
                  role="menuitem"
                  href={exportUrl("xlsx", "gender")}
                  className="block border-t border-white/[0.06] px-4 py-2.5 text-sm text-slate-200 hover:bg-white/[0.06]"
                  onClick={() => setExportMenuOpen(false)}
                >
                  <span className="font-medium text-white">Gender segregated</span>
                  <span className="mt-0.5 block text-xs text-slate-500">
                    Separate sheet per gender
                  </span>
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      <section className={adminCard}>
        <div
          className={cn(
            adminCardHeader,
            "flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between"
          )}
        >
          <div>
            <h2 className={adminSectionTitle}>Completed responses</h2>
            <p className={adminSectionDescription}>
              Participant name, demographics, and submission time
            </p>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Input
              placeholder="Search name, age, location…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn("h-11 w-full sm:h-9 sm:w-56", adminInput)}
            />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className={adminSelect}
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </div>

        <div className="p-2 sm:p-3 pb-1">
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Loading…</p>
          ) : !data || data.responses.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No completed responses yet.</p>
          ) : (
            <>
              <ul className="divide-y divide-white/[0.05]">
                {data.responses.map((r) => {
                  const details = demographicLines(r.demographic_snapshot);
                  return (
                    <li
                      key={r.id}
                      className="flex flex-col gap-4 px-3 py-4 sm:flex-row sm:items-start sm:justify-between sm:px-4"
                    >
                      <div className="flex min-w-0 flex-1 gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]"
                          aria-hidden
                        >
                          <User className="h-4 w-4 text-slate-400" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-base font-semibold text-slate-100">
                            {respondentName(r)}
                          </p>
                          {details.length > 0 ? (
                            <dl className="mt-2 grid gap-1 sm:grid-cols-2">
                              {details.map((line) => {
                                const [label, ...rest] = line.split(": ");
                                return (
                                  <div key={line} className="text-sm">
                                    <dt className="inline text-slate-500">{label}: </dt>
                                    <dd className="inline text-slate-300">{rest.join(": ")}</dd>
                                  </div>
                                );
                              })}
                            </dl>
                          ) : (
                            <p className="mt-1 text-sm text-slate-500">
                              No demographic details recorded
                            </p>
                          )}
                          <p className="mt-3 text-xs text-slate-500">
                            Completed {formatWhen(r.completed_at)}
                            {r.created_at !== r.completed_at && (
                              <span className="text-slate-600">
                                {" "}
                                · Started {formatWhen(r.created_at)}
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        className={cn(adminBtn("danger"), "w-full shrink-0 sm:w-auto")}
                        disabled={deletingId === r.id}
                        onClick={() => handleDelete(r)}
                        aria-label={`Delete response for ${respondentName(r)}`}
                      >
                        <Trash2 className="h-3.5 w-3.5 shrink-0" aria-hidden />
                        <span>{deletingId === r.id ? "Deleting…" : "Delete"}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>

              <div className="flex items-center justify-between border-t border-white/[0.05] px-3 py-3 sm:px-4">
                <button
                  type="button"
                  className={adminBtn("ghost")}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} of {data.pagination.totalPages}
                </span>
                <button
                  type="button"
                  className={adminBtn("ghost")}
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>
    </div>
  );
}

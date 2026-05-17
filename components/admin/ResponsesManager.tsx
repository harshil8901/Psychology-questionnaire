"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { ResponseRow } from "@/types/database";
import type { AnswerRow } from "@/types/database";

interface ListResponse {
  responses: ResponseRow[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
  summary: { total: number; completed: number; incomplete: number };
}

export function ResponsesManager() {
  const [data, setData] = useState<ListResponse | null>(null);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"desc" | "asc">("desc");
  const [selected, setSelected] = useState<{
    response: ResponseRow;
    answers: AnswerRow[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

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

  const openDetail = async (id: string) => {
    const res = await fetch(`/api/admin/responses/${id}`);
    const json = await res.json();
    if (res.ok) setSelected(json);
  };

  const deleteResponse = async (id: string) => {
    if (!confirm("Delete this response and all answers?")) return;
    await fetch(`/api/admin/responses/${id}`, { method: "DELETE" });
    setSelected(null);
    load();
  };

  const exportUrl = (format: string) => `/api/admin/export?format=${format}`;

  const completedCount = data?.summary.completed ?? data?.pagination.total ?? 0;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs text-slate-500">Completed submissions</p>
          <p className="font-heading mt-1 text-3xl font-semibold text-white">{completedCount}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href={exportUrl("csv")} className={adminBtn("ghost")}>
            Export CSV
          </a>
          <a href={exportUrl("xlsx")} className={adminBtn("primary")}>
            <Download className="h-3.5 w-3.5" />
            Export XLSX
          </a>
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
              Only finished surveys are listed and exported
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search ID or session…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className={cn("w-full sm:w-52", adminInput)}
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
        <div className="overflow-x-auto p-1">
          {loading ? (
            <p className="p-5 text-sm text-slate-500">Loading…</p>
          ) : data?.responses.length === 0 ? (
            <p className="p-5 text-sm text-slate-500">No completed responses yet.</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/[0.05] hover:bg-transparent">
                    <TableHead className="text-xs font-medium text-slate-500">ID</TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">
                      Questionnaire
                    </TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">
                      Completed
                    </TableHead>
                    <TableHead className="text-xs font-medium text-slate-500">Started</TableHead>
                    <TableHead className="w-16" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.responses.map((r) => (
                    <TableRow
                      key={r.id}
                      className="border-white/[0.04] hover:bg-white/[0.02]"
                    >
                      <TableCell className="font-mono text-xs text-slate-400">
                        {r.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {r.questionnaire_id}
                      </TableCell>
                      <TableCell className="text-sm text-slate-300">
                        {r.completed_at
                          ? new Date(r.completed_at).toLocaleString()
                          : "—"}
                      </TableCell>
                      <TableCell className="text-sm text-slate-500">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <button
                          type="button"
                          className={adminBtn("ghost")}
                          onClick={() => openDetail(r.id)}
                        >
                          View
                        </button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="flex items-center justify-between border-t border-white/[0.05] px-4 py-3">
                <button
                  type="button"
                  className={adminBtn("ghost")}
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-xs text-slate-500">
                  Page {page} of {data?.pagination.totalPages ?? 1}
                </span>
                <button
                  type="button"
                  className={adminBtn("ghost")}
                  disabled={page >= (data?.pagination.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </>
          )}
        </div>
      </section>

      {selected && (
        <section className={adminCard}>
          <div
            className={cn(
              adminCardHeader,
              "flex flex-row items-start justify-between gap-4"
            )}
          >
            <div>
              <h2 className={adminSectionTitle}>Response detail</h2>
              <p className="mt-1 font-mono text-xs text-slate-500">{selected.response.id}</p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                className={adminBtn("danger")}
                onClick={() => deleteResponse(selected.response.id)}
              >
                <Trash2 className="h-3.5 w-3.5" />
                Delete
              </button>
              <button
                type="button"
                className={adminBtn("ghost")}
                onClick={() => setSelected(null)}
              >
                Close
              </button>
            </div>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto p-5">
            {selected.answers.length === 0 ? (
              <p className="text-sm text-slate-500">No answers saved.</p>
            ) : (
              selected.answers.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-white/[0.05] bg-white/[0.02] px-3 py-2.5"
                >
                  <p className="text-xs text-slate-500">
                    {a.section_id} · {a.question_id}
                  </p>
                  <p className="mt-1 text-sm text-slate-200">{a.answer}</p>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

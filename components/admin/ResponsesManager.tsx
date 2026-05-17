"use client";

import { useCallback, useEffect, useState } from "react";
import { Download, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  const [status, setStatus] = useState<"all" | "completed" | "incomplete">("all");
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
      status,
      sort,
    });
    if (search) params.set("search", search);
    const res = await fetch(`/api/admin/responses?${params}`);
    const json = await res.json();
    setData(json);
    setLoading(false);
  }, [page, search, status, sort]);

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

  const exportUrl = (format: string) => {
    const p = new URLSearchParams({ format });
    if (status === "completed") p.set("completed", "true");
    return `/api/admin/export?${p}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-2 text-sm text-slate-400">
          <span>
            <strong className="text-white">{data?.summary.total ?? 0}</strong> total
          </span>
          <span>·</span>
          <span>
            <strong className="text-emerald-400">{data?.summary.completed ?? 0}</strong> complete
          </span>
          <span>·</span>
          <span>
            <strong className="text-amber-400">{data?.summary.incomplete ?? 0}</strong>{" "}
            incomplete
          </span>
        </div>
        <div className="flex gap-2">
          <a
            href={exportUrl("csv")}
            className="inline-flex h-9 items-center rounded-lg border border-white/10 px-4 text-sm text-slate-300 hover:bg-white/5"
          >
            Export CSV
          </a>
          <a
            href={exportUrl("xlsx")}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm text-white"
          >
            <Download className="h-4 w-4" />
            Export XLSX
          </a>
        </div>
      </div>

      <Card className="border-white/[0.08] bg-white/[0.04]">
        <CardHeader className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-white">Responses</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Input
              placeholder="Search ID or session…"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full max-w-xs border-white/10 bg-white/5 text-white sm:w-56"
            />
            <select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value as typeof status);
                setPage(1);
              }}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-300"
            >
              <option value="all">All</option>
              <option value="completed">Complete</option>
              <option value="incomplete">Incomplete</option>
            </select>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as typeof sort)}
              className="h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-slate-300"
            >
              <option value="desc">Newest first</option>
              <option value="asc">Oldest first</option>
            </select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400">Loading…</p>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">ID</TableHead>
                    <TableHead className="text-slate-400">Questionnaire</TableHead>
                    <TableHead className="text-slate-400">Progress</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                    <TableHead className="text-slate-400" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.responses.map((r) => (
                    <TableRow key={r.id} className="border-white/10">
                      <TableCell className="font-mono text-xs text-slate-300">
                        {r.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {r.questionnaire_id}
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {r.progress_percentage}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={
                            r.is_completed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }
                        >
                          {r.is_completed ? "Complete" : "Incomplete"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm text-slate-400">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-cyan-400"
                          onClick={() => openDetail(r.id)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <div className="mt-4 flex items-center justify-between">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-sm text-slate-400">
                  Page {page} of {data?.pagination.totalPages ?? 1}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-white/10"
                  disabled={page >= (data?.pagination.totalPages ?? 1)}
                  onClick={() => setPage((p) => p + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {selected && (
        <Card className="border-cyan-500/20 bg-white/[0.04]">
          <CardHeader className="flex flex-row items-start justify-between">
            <div>
              <CardTitle className="text-white">Response detail</CardTitle>
              <p className="mt-1 font-mono text-xs text-slate-500">{selected.response.id}</p>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                className="border-rose-500/30 text-rose-400"
                onClick={() => deleteResponse(selected.response.id)}
              >
                <Trash2 className="mr-1 h-3 w-3" />
                Delete
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setSelected(null)}
                className="text-slate-400"
              >
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent className="max-h-96 space-y-2 overflow-y-auto">
            {selected.answers.length === 0 ? (
              <p className="text-slate-500">No answers saved yet.</p>
            ) : (
              selected.answers.map((a) => (
                <div
                  key={a.id}
                  className="rounded-lg border border-white/[0.06] bg-black/20 px-3 py-2"
                >
                  <p className="text-xs text-cyan-400/80">
                    {a.section_id} · {a.question_id}
                  </p>
                  <p className="mt-1 text-sm text-slate-200">{a.answer}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

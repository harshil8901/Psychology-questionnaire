"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Upload, Eye, FileJson, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  adminBadge,
  adminBtn,
  adminCard,
  adminCardHeader,
  adminInput,
  adminItemTitle,
  adminSectionDescription,
  adminSectionTitle,
} from "@/components/admin/admin-ui";
import type { QuestionnaireMeta } from "@/lib/questionnaire-loader";

export function QuestionnaireManager() {
  const [list, setList] = useState<QuestionnaireMeta[]>([]);
  const [json, setJson] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/questionnaires");
    const data = await res.json();
    setList(data.questionnaires ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const validate = async () => {
    setMessage(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setMessage({ type: "err", text: "Invalid JSON syntax" });
      return;
    }
    const res = await fetch("/api/admin/questionnaires/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: parsed }),
    });
    const data = await res.json();
    if (!res.ok) {
      setMessage({ type: "err", text: data.error ?? "Validation failed" });
      return;
    }
    setMessage({
      type: "ok",
      text: `Valid — ${data.summary.sections} sections, ${data.summary.questions} questions`,
    });
  };

  const save = async (activate: boolean) => {
    setSaving(true);
    setMessage(null);
    let parsed: unknown;
    try {
      parsed = JSON.parse(json);
    } catch {
      setMessage({ type: "err", text: "Invalid JSON syntax" });
      setSaving(false);
      return;
    }
    const res = await fetch("/api/admin/questionnaires", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ config: parsed, activate }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setMessage({ type: "err", text: data.error ?? "Save failed" });
      return;
    }
    setMessage({ type: "ok", text: activate ? "Saved and activated" : "Saved as draft" });
    load();
  };

  const activate = async (id: string) => {
    const res = await fetch(`/api/admin/questionnaires/${id}/activate`, {
      method: "POST",
    });
    if (res.ok) load();
    else setMessage({ type: "err", text: "Activation failed" });
  };

  const loadForEdit = async (id: string) => {
    const res = await fetch(`/api/admin/questionnaires/${id}`);
    const data = await res.json();
    if (res.ok) setJson(data.json ?? JSON.stringify(data.config, null, 2));
  };

  const remove = async (q: QuestionnaireMeta) => {
    const builtInNote =
      q.source === "file"
        ? " This built-in questionnaire will be hidden from the admin list and participants. You can upload a new JSON version later to use it again."
        : "";
    const activeNote = q.isActive
      ? " It is currently active — another questionnaire will be used for new participants if one is available."
      : "";
    if (
      !window.confirm(
        `Delete "${q.title}"?${activeNote}${builtInNote} This cannot be undone from the dashboard.`
      )
    ) {
      return;
    }

    setDeletingId(q.id);
    setMessage(null);
    try {
      const res = await fetch(`/api/admin/questionnaires/${q.id}`, {
        method: "DELETE",
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        throw new Error(data.error ?? "Delete failed");
      }
      setMessage({ type: "ok", text: `"${q.title}" removed` });
      if (json.trim()) {
        try {
          const parsed = JSON.parse(json) as { id?: string };
          if (parsed.id === q.id) setJson("");
        } catch {
          // ignore invalid editor JSON
        }
      }
      await load();
    } catch (err) {
      const text = err instanceof Error ? err.message : "Delete failed";
      setMessage({ type: "err", text });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <section className={adminCard}>
        <div className={adminCardHeader}>
          <h2 className={adminSectionTitle}>Questionnaires</h2>
          <p className={adminSectionDescription}>
            Activate a version for participants or preview before publishing
          </p>
        </div>
        <div className="p-5">
          {loading ? (
            <p className="text-sm text-slate-500">Loading…</p>
          ) : list.length === 0 ? (
            <p className="text-sm text-slate-500">No questionnaires found.</p>
          ) : (
            <ul className="space-y-2">
              {list.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-white/[0.05] bg-white/[0.02] px-4 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={adminItemTitle}>{q.title}</span>
                      {q.isActive && (
                        <span className={adminBadge("active")}>Active</span>
                      )}
                      <span className={adminBadge("default")}>{q.source}</span>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {q.id} · v{q.version} · {q.sectionCount} sections ·{" "}
                      {q.questionCount} questions · ~{q.estimatedTime} min
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!q.isActive && (
                      <button
                        type="button"
                        className={adminBtn("secondary")}
                        onClick={() => activate(q.id)}
                      >
                        <Check className="h-3.5 w-3.5" />
                        Activate
                      </button>
                    )}
                    <button
                      type="button"
                      className={adminBtn("ghost")}
                      onClick={() => loadForEdit(q.id)}
                    >
                      {q.source === "file" ? "View" : "Edit"}
                    </button>
                    <a
                      href={`/welcome?q=${q.id}&preview=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={adminBtn("ghost")}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Preview
                    </a>
                    <button
                      type="button"
                      className={adminBtn("danger")}
                      disabled={deletingId === q.id}
                      onClick={() => remove(q)}
                      aria-label={`Delete ${q.title}`}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      {deletingId === q.id ? "Deleting…" : "Delete"}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className={adminCard}>
        <div className={cn(adminCardHeader, "flex items-start gap-3")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04]">
            <FileJson className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h2 className={adminSectionTitle}>Upload questionnaire</h2>
            <p className={adminSectionDescription}>
              Paste JSON that matches the schema — validate before saving
            </p>
          </div>
        </div>
        <div className="space-y-4 p-5">
          <Textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='{ "id": "...", "title": "...", "sections": [...] }'
            className={cn(
              "min-h-[260px] font-mono text-xs leading-relaxed",
              adminInput
            )}
          />
          {message && (
            <p
              className={cn(
                "text-sm",
                message.type === "ok" ? "text-emerald-400/90" : "text-rose-400/90"
              )}
            >
              {message.text}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className={adminBtn("ghost")}
              onClick={validate}
              disabled={!json.trim()}
            >
              Validate
            </button>
            <button
              type="button"
              className={adminBtn("secondary")}
              onClick={() => save(false)}
              disabled={saving || !json.trim()}
            >
              Save draft
            </button>
            <button
              type="button"
              className={adminBtn("primary")}
              onClick={() => save(true)}
              disabled={saving || !json.trim()}
            >
              <Upload className="h-3.5 w-3.5" />
              Save & activate
            </button>
          </div>
          <p className="text-xs text-slate-600">
            Built-in configs live in{" "}
            <code className="rounded bg-white/[0.04] px-1 py-0.5 text-slate-400">
              data/questionnaires/
            </code>
            . Upload here to change without redeploying.
          </p>
        </div>
      </section>
    </div>
  );
}

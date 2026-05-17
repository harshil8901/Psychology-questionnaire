"use client";

import { useCallback, useEffect, useState } from "react";
import { Check, Upload, Eye } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { QuestionnaireMeta } from "@/lib/questionnaire-loader";

export function QuestionnaireManager() {
  const [list, setList] = useState<QuestionnaireMeta[]>([]);
  const [json, setJson] = useState("");
  const [message, setMessage] = useState<{ type: "ok" | "err"; text: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
      text: `Valid: ${data.summary.sections} sections, ${data.summary.questions} questions`,
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
    setMessage({ type: "ok", text: activate ? "Saved and activated" : "Saved" });
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

  const remove = async (id: string, source: string) => {
    if (source === "file") return;
    if (!confirm("Delete this questionnaire config?")) return;
    await fetch(`/api/admin/questionnaires/${id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="space-y-8">
      <Card className="border-white/[0.08] bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="text-white">Active questionnaires</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-slate-400">Loading…</p>
          ) : (
            <ul className="space-y-3">
              {list.map((q) => (
                <li
                  key={q.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-white/[0.06] bg-white/[0.02] p-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-white">{q.title}</span>
                      {q.isActive && (
                        <Badge className="bg-cyan-500/20 text-cyan-300">Active</Badge>
                      )}
                      <Badge variant="secondary" className="bg-white/5 text-slate-400">
                        {q.source}
                      </Badge>
                    </div>
                    <p className="mt-1 text-xs text-slate-500">
                      {q.id} · v{q.version} · {q.sectionCount} sections · {q.questionCount}{" "}
                      questions · ~{q.estimatedTime} min
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {!q.isActive && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-white/10"
                        onClick={() => activate(q.id)}
                      >
                        <Check className="mr-1 h-3 w-3" />
                        Activate
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-white/10"
                      onClick={() => loadForEdit(q.id)}
                    >
                      {q.source === "file" ? "View JSON" : "Edit"}
                    </Button>
                    <a
                      href={`/welcome?q=${q.id}&preview=1`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex h-8 items-center gap-1 rounded-lg border border-white/10 px-3 text-xs text-slate-300 hover:bg-white/5"
                    >
                      <Eye className="h-3 w-3" />
                      Preview
                    </a>
                    {q.source === "database" && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="border-rose-500/30 text-rose-400"
                        onClick={() => remove(q.id, q.source)}
                      >
                        Delete
                      </Button>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <Card className="border-white/[0.08] bg-white/[0.04]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Upload className="h-5 w-5 text-cyan-400" />
            Upload or paste questionnaire JSON
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            value={json}
            onChange={(e) => setJson(e.target.value)}
            placeholder='Paste questionnaire JSON matching the schema (id, title, version, estimatedTime, sections…)'
            className="min-h-[280px] font-mono text-xs border-white/10 bg-black/20 text-slate-200"
          />
          {message && (
            <p
              className={
                message.type === "ok" ? "text-sm text-emerald-400" : "text-sm text-rose-400"
              }
            >
              {message.text}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              className="border-white/10"
              onClick={validate}
              disabled={!json.trim()}
            >
              Validate
            </Button>
            <Button
              className="bg-gradient-to-r from-cyan-500 to-blue-500"
              onClick={() => save(false)}
              disabled={saving || !json.trim()}
            >
              Save draft
            </Button>
            <Button
              className="bg-gradient-to-r from-blue-500 to-purple-500"
              onClick={() => save(true)}
              disabled={saving || !json.trim()}
            >
              Save & activate
            </Button>
          </div>
          <p className="text-xs text-slate-500">
            Built-in questionnaires live in{" "}
            <code className="text-slate-400">data/questionnaires/</code>. Upload custom configs
            here without redeploying.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

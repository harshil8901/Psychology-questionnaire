"use client";

import { useEffect, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, Users, CheckCircle, Clock, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

interface Analytics {
  total: number;
  completed: number;
  incomplete: number;
  completionRate: number;
  avgProgress: number;
  avgCompletionMinutes: number;
  timeline: { date: string; count: number }[];
  sectionStats: { id: string; title: string; dropoffs: number; questionCount: number }[];
  recent: {
    id: string;
    session_id: string;
    created_at: string;
    is_completed: boolean;
    progress_percentage: number;
  }[];
}

export function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  const filtered = data?.recent.filter(
    (r) =>
      r.id.includes(search) ||
      r.session_id.includes(search) ||
      (r.is_completed ? "completed" : "incomplete").includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center text-slate-400">
        Loading analytics…
      </div>
    );
  }

  if (!data) {
    return <p className="text-rose-400">Failed to load analytics.</p>;
  }

  const stats = [
    { label: "Total Responses", value: data.total, icon: Users },
    { label: "Completed", value: data.completed, icon: CheckCircle },
    { label: "Completion Rate", value: `${data.completionRate}%`, icon: TrendingUp },
    { label: "Avg. Time", value: `${data.avgCompletionMinutes} min`, icon: Clock },
  ];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Research Dashboard</h1>
          <p className="text-slate-400">Predictors of Flourishing at Workplace</p>
        </div>
        <div className="flex gap-2">
          <a
            href="/api/admin/export?format=csv"
            className="inline-flex h-9 items-center justify-center rounded-lg border border-white/10 px-4 text-sm text-slate-300 hover:bg-white/5"
          >
            CSV
          </a>
          <a
            href="/api/admin/export?format=xlsx"
            className="inline-flex h-9 items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-500 px-4 text-sm font-medium text-white"
          >
            <Download className="h-4 w-4" />
            XLSX
          </a>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="border-white/[0.08] bg-white/[0.04]">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-slate-400">
                {s.label}
              </CardTitle>
              <s.icon className="h-4 w-4 text-cyan-400" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="overview">
        <TabsList className="bg-white/[0.04]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="responses">Responses</TabsTrigger>
        </TabsList>
        <TabsContent value="overview" className="mt-4 space-y-6">
          <Card className="border-white/[0.08] bg-white/[0.04]">
            <CardHeader>
              <CardTitle className="text-white">Responses Over Time</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.timeline}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <Line type="monotone" dataKey="count" stroke="#22d3ee" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="border-white/[0.08] bg-white/[0.04]">
            <CardHeader>
              <CardTitle className="text-white">Drop-off by Section</CardTitle>
            </CardHeader>
            <CardContent className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.sectionStats}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
                  <XAxis dataKey="title" stroke="#94a3b8" fontSize={10} angle={-20} textAnchor="end" height={60} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: "#111827",
                      border: "1px solid rgba(255,255,255,0.1)",
                    }}
                  />
                  <Bar dataKey="dropoffs" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="responses" className="mt-4">
          <Card className="border-white/[0.08] bg-white/[0.04]">
            <CardHeader>
              <Input
                placeholder="Search by ID or session…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm border-white/10 bg-white/5 text-white"
              />
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="text-slate-400">ID</TableHead>
                    <TableHead className="text-slate-400">Progress</TableHead>
                    <TableHead className="text-slate-400">Status</TableHead>
                    <TableHead className="text-slate-400">Created</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered?.map((r) => (
                    <TableRow key={r.id} className="border-white/10">
                      <TableCell className="font-mono text-xs text-slate-300">
                        {r.id.slice(0, 8)}…
                      </TableCell>
                      <TableCell className="text-slate-300">
                        {r.progress_percentage}%
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={r.is_completed ? "default" : "secondary"}
                          className={
                            r.is_completed
                              ? "bg-emerald-500/20 text-emerald-400"
                              : "bg-amber-500/20 text-amber-400"
                          }
                        >
                          {r.is_completed ? "Complete" : "Incomplete"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-400 text-sm">
                        {new Date(r.created_at).toLocaleString()}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

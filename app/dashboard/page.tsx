"use client";

import useSWR from "swr";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { Dot } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

type Range = "daily" | "weekly" | "monthly" | "yearly" | "custom";

const fetcher = async (url: string, token: string | undefined | null) => {
  const res = await fetch(url, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const [range, setRange] = useState<Range>("monthly");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [idToken, setIdToken] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    user
      .getIdToken()
      .then(setIdToken)
      .catch(() => {
        toast.error("Failed to get auth token");
      });
  }, [user]);

  const params =
    range === "custom" && from && to
      ? `?range=custom&from=${from}&to=${to}`
      : `?range=${range}`;

  const { data, error, isLoading } = useSWR(
    user && idToken ? [`/api/dashboard${params}`, idToken] : null,
    ([url, token]) => fetcher(url, token),
    {
      shouldRetryOnError: false,
    },
  );

  const alerts =
    (data?.alerts as
      | Array<{
          product_id: string;
          godown_id: string;
          name: string;
          current_stock: number;
          alert_type: "EMPTY" | "LOW" | "OK";
        }>
      | undefined) ?? [];

  useEffect(() => {
    if (error) {
      console.error("Dashboard load error", error);
      toast.error("Dashboard data is temporarily unavailable.");
    }
  }, [error]);

  if (loading) {
    return (
      <div className="app-shell flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return (
    <AppShell
      title="Overview"
      subtitle="KPIs, stock trends and risk alerts"
    >
      <div className="space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Overview
            </h1>
            <p className="text-xs text-subtle">
              High-level KPIs, stock trends and risk alerts across all godowns.
            </p>
          </div>
        </header>

        <section className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex gap-2 text-xs">
            {(["daily", "weekly", "monthly", "yearly"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className={`rounded-full px-3 py-1 border text-xs ${
                  range === r
                    ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                    : "app-border text-subtle hover:bg-slate-200/60"
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
            <button
              onClick={() => setRange("custom")}
              className={`rounded-full px-3 py-1 border text-xs ${
                range === "custom"
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-300"
                  : "app-border text-subtle hover:bg-slate-200/60"
              }`}
            >
              CUSTOM
            </button>
          </div>

          {range === "custom" && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={from}
                onChange={(e) => setFrom(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
              />
              <span>to</span>
              <input
                type="date"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                className="rounded-md border border-slate-700 bg-slate-900 px-2 py-1"
              />
            </div>
          )}
        </section>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {[
            {
              label: "Total Godowns",
              value: data?.kpis?.godowns ?? 0,
              accent: "from-indigo-500/20 via-indigo-500/0 to-transparent",
            },
            {
              label: "Total Products",
              value: data?.kpis?.products ?? 0,
              accent: "from-sky-500/20 via-sky-500/0 to-transparent",
            },
            {
              label: "Stock IN (units)",
              value: data?.kpis?.stockIn ?? 0,
              accent: "from-emerald-500/20 via-emerald-500/0 to-transparent",
            },
            {
              label: "Stock OUT (units)",
              value: data?.kpis?.stockOut ?? 0,
              accent: "from-rose-500/20 via-rose-500/0 to-transparent",
            },
            {
              label: "Stock Value",
              value:
                data?.kpis?.stockValue != null
                  ? `₹${Number(data.kpis.stockValue).toFixed(2)}`
                  : "₹0.00",
              accent: "from-amber-500/20 via-amber-500/0 to-transparent",
            },
            {
              label: "Alerts",
              value: data?.kpis?.alerts ?? 0,
              accent: "from-violet-500/20 via-violet-500/0 to-transparent",
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="group relative overflow-hidden rounded-2xl border app-border app-surface p-5 transition will-change-transform hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="pointer-events-none absolute inset-0">
                <div className={`absolute -top-24 -right-24 h-56 w-56 rounded-full bg-gradient-to-br ${kpi.accent} blur-2xl`} />
                <div className="absolute inset-0 opacity-0 transition duration-200 group-hover:opacity-100">
                  <div className="absolute -bottom-24 -left-16 h-56 w-56 rounded-full bg-indigo-500/10 blur-2xl" />
                </div>
              </div>
              <p className="relative text-[11px] uppercase tracking-wide text-subtle">
                {kpi.label}
              </p>
              <p className="relative mt-2 text-3xl font-semibold tracking-tight">
                {kpi.value}
              </p>
            </div>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 rounded-2xl border app-border app-surface p-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">
                Stock IN vs OUT
              </h2>
              {isLoading && (
                <span className="text-[11px] text-subtle">Loading…</span>
              )}
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.series ?? []}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="date" stroke="#64748b" />
                  <YAxis stroke="#64748b" />
                  <Tooltip />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="in"
                    stackId="1"
                    stroke="#22c55e"
                    fill="#22c55e33"
                    name="IN"
                  />
                  <Area
                    type="monotone"
                    dataKey="out"
                    stackId="1"
                    stroke="#ef4444"
                    fill="#ef444433"
                    name="OUT"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="rounded-2xl border app-border app-surface p-4">
            <h2 className="text-sm font-semibold mb-3">
              Alerts
            </h2>
            <p className="text-xs text-subtle mb-2">
              Red = empty stock. Orange = low stock (&lt; 3). Green = OK.
            </p>
            <div className="space-y-2 text-xs">
              {alerts.length === 0 ? (
                <div className="rounded-lg border app-border app-surface px-3 py-2 text-subtle">
                  No products yet.
                </div>
              ) : (
                alerts.slice(0, 10).map((a) => {
                  const isEmpty = a.alert_type === "EMPTY";
                  const isLow = a.alert_type === "LOW";
                  const dotClass = isEmpty
                    ? "text-red-500"
                    : isLow
                      ? "text-orange-500"
                      : "text-emerald-500";
                  const badgeClass = isEmpty
                    ? "border-red-200 bg-red-50 text-red-700"
                    : isLow
                      ? "border-orange-200 bg-orange-50 text-orange-800"
                      : "border-emerald-200 bg-emerald-50 text-emerald-800";
                  const tileClass = isEmpty
                    ? "border-red-200 bg-red-50"
                    : "app-border app-surface";

                  return (
                    <Link
                      key={a.product_id}
                      href={`/godowns/${a.godown_id}`}
                      className={`flex items-center justify-between gap-3 rounded-lg px-3 py-2 border transition hover:bg-slate-200/40 ${tileClass}`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Dot className={`h-7 w-7 -ml-2 ${dotClass}`} />
                          <span className="font-medium truncate">{a.name}</span>
                        </div>
                        <div className="mt-0.5 text-[11px] text-subtle">
                          Stock: {Number(a.current_stock).toString()}
                        </div>
                      </div>
                      <span
                        className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-medium ${badgeClass}`}
                      >
                        {a.alert_type}
                      </span>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}


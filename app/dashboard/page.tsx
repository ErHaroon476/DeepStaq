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
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { LogoutButton } from "@/components/ui/logout-button";

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
    <div className="app-shell flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-60 flex-col border-r sidebar px-5 py-6">
        <div className="mb-8">
          <div className="text-xs font-semibold tracking-widest text-indigo-400 uppercase">
            DeepStaq
          </div>
          <div className="mt-1 text-[11px] text-slate-500">
            Inventory & Godown Suite
          </div>
        </div>
        <nav className="space-y-1 text-sm">
          <Link
            href="/dashboard"
            className="sidebar-link-active flex items-center justify-between rounded-lg px-3 py-2"
          >
            <span>Dashboard</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </Link>
          <Link
            href="/godowns"
            className="sidebar-link block rounded-lg px-3 py-2"
          >
            Godowns & Products
          </Link>
          <Link
            href="/reports"
            className="sidebar-link block rounded-lg px-3 py-2"
          >
            Reports & Exports
          </Link>
        </nav>
        <div className="mt-auto pt-4 border-t app-border">
          <div className="pb-2">
            <LogoutButton />
          </div>
          <div className="pt-3 text-[11px] text-subtle">
            Audit-safe stock, multi-godown ready.
          </div>
        </div>
      </aside>

      <main className="flex-1 px-4 md:px-8 py-6 space-y-6">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Overview
            </h1>
            <p className="text-xs text-subtle">
              High-level KPIs, stock trends and risk alerts across all godowns.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-subtle hidden sm:inline">
              Theme
            </span>
            <ThemeToggle />
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

        <section className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {[
            {
              label: "Total Godowns",
              value: data?.kpis?.godowns ?? 0,
            },
            {
              label: "Total Products",
              value: data?.kpis?.products ?? 0,
            },
            {
              label: "Stock IN (units)",
              value: data?.kpis?.stockIn ?? 0,
            },
            {
              label: "Stock OUT (units)",
              value: data?.kpis?.stockOut ?? 0,
            },
            {
              label: "Stock Value",
              value:
                data?.kpis?.stockValue != null
                  ? `₹${Number(data.kpis.stockValue).toFixed(2)}`
                  : "₹0.00",
            },
            {
              label: "Alerts",
              value: data?.kpis?.alerts ?? 0,
            },
          ].map((kpi) => (
            <div
              key={kpi.label}
              className="rounded-2xl border app-border app-surface px-4 py-3"
            >
              <p className="text-[11px] uppercase tracking-wide text-slate-400">
                {kpi.label}
              </p>
              <p className="mt-1 text-lg font-semibold">{kpi.value}</p>
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
              Detailed per-product alerts appear in the godown views.
            </p>
            <div className="space-y-2 text-xs">
              <div className="alert-critical-tile flex items-center justify-between rounded-lg px-3 py-2 border">
                <span className="font-medium">Critical / Empty</span>
                <span>
                  {data?.kpis?.alerts ?? 0}
                </span>
              </div>
              <p className="text-[11px] text-subtle">
                Configure thresholds per product in godown &gt; products.
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


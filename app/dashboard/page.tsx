"use client";

import useSWR from "swr";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useMemo, useState } from "react";
import appToast from "@/lib/toast";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Link from "next/link";
import { Package, Boxes, TrendingUp, TrendingDown, AlertTriangle, BarChart3, Building2, Settings, X } from "lucide-react";
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
  
  // Alert settings state - using localStorage
  const [alertSettingsOpen, setAlertSettingsOpen] = useState(false);
  const [alertSettings, setAlertSettings] = useState(() => {
    // Load from localStorage on initial render
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('alertThresholds');
      if (saved) {
        try {
          return JSON.parse(saved);
        } catch {
          // Fallback to defaults if JSON is invalid
        }
      }
    }
    // Default values
    return {
      emptyThreshold: 0,
      lowThreshold: 3
    };
  });

  // Alert view toggle state
  const [alertView, setAlertView] = useState<'all' | 'empty' | 'low' | 'optimal'>('all');

  useEffect(() => {
    if (!user) return;
    user
      .getIdToken()
      .then(setIdToken)
      .catch(() => {
        appToast.error(appToast.messages.auth.loginError);
      });
  }, [user]);


  const saveAlertSettings = () => {
    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('alertThresholds', JSON.stringify(alertSettings));
      appToast.success(appToast.messages.settings.alertThresholdsSaved);
      setAlertSettingsOpen(false);
    }
  };

  const params =
    range === "custom" && from && to
      ? `?range=custom&from=${from}&to=${to}`
      : range === "custom"
      ? null
      : `?range=${range}`;

  const { data, error, isLoading } = useSWR(
    user && idToken && params ? [`/api/dashboard${params}`, idToken] : null,
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

  // Calculate alert types client-side based on localStorage thresholds
  const calculatedAlerts = useMemo(() => {
    return alerts.map(alert => {
      const current = Number(alert.current_stock ?? 0);
      let alertType: "EMPTY" | "LOW" | "OK";
      
      if (current <= 0) {
        alertType = "EMPTY";
      } else if (current <= alertSettings.lowThreshold) {
        alertType = "LOW";
      } else {
        alertType = "OK";
      }
      
      return {
        ...alert,
        alert_type: alertType,
        current_stock: current
      };
    });
  }, [alerts, alertSettings.lowThreshold]);

  useEffect(() => {
    if (error) {
      console.error("Dashboard load error", error);
      appToast.error(appToast.messages.data.loadError);
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
    <AppShell>
      <div className="space-y-8">
        {/* Hero Section */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-600/10 to-emerald-600/10 rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl p-4 sm:p-8 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-2 h-12 lg:w-3 lg:h-16 bg-gradient-to-b from-blue-500 via-cyan-400 to-emerald-400 rounded-full"></div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Command Center
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base lg:text-lg mt-1 lg:mt-2">
                      Real-time inventory intelligence across all operations
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-400 text-xs sm:text-sm">System Operational</span>
                  </div>
                  <div className="hidden sm:block text-slate-500 text-sm">|</div>
                  <span className="text-slate-400 text-xs sm:text-sm">
                    Last sync: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3 lg:self-center">
                <div className="bg-gradient-to-r from-blue-500/20 to-cyan-500/20 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2 border border-blue-500/30">
                  <span className="text-blue-300 text-xs sm:text-sm font-medium">Live Monitoring</span>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Time Range Selector */}
        <section className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-2xl p-4 sm:p-6 border border-slate-600/30 backdrop-blur-sm">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
                <BarChart3 className="h-5 w-5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-sm sm:text-base">Analytics Period</h3>
                <p className="text-slate-400 text-xs sm:text-sm">Select time range for data visualization</p>
              </div>
            </div>
            
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:gap-3">
              <div className="flex flex-wrap gap-2 justify-center lg:justify-start">
                {(["daily", "weekly", "monthly", "yearly"] as Range[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRange(r)}
                    className={`group relative px-3 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                      range === r
                        ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                        : "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 hover:border-slate-500/50"
                    }`}
                  >
                    <span className="relative z-10">{r.toUpperCase()}</span>
                    {range === r && (
                      <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    )}
                  </button>
                ))}
                <button
                  onClick={() => setRange("custom")}
                  className={`group relative px-3 py-2 sm:px-4 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                    range === "custom"
                      ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25"
                      : "bg-slate-700/50 text-slate-300 border border-slate-600/50 hover:bg-slate-700/70 hover:border-slate-500/50"
                  }`}
                >
                  <span className="relative z-10">CUSTOM</span>
                  {range === "custom" && (
                    <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-pink-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  )}
                </button>
              </div>

              {range === "custom" && (
                <div className="flex items-center gap-2 sm:gap-3 bg-slate-800/50 rounded-xl px-3 py-2 sm:px-4 border border-slate-600/50 w-full lg:w-auto justify-center">
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:text-white min-w-0"
                  />
                  <span className="text-slate-400 text-sm font-medium">→</span>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:text-white min-w-0"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* KPI Cards */}
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {[
            {
              label: "Total Godowns",
              value: data?.kpis?.godowns ?? 0,
              accent: "from-indigo-500/20 via-indigo-500/0 to-transparent",
              icon: <Package className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-indigo-500 to-purple-600",
              iconColor: "text-white",
              glow: "shadow-indigo-500/25"
            },
            {
              label: "Total Companies",
              value: data?.kpis?.companies ?? 0,
              accent: "from-orange-500/20 via-orange-500/0 to-transparent",
              icon: <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-orange-500 to-amber-600",
              iconColor: "text-white",
              glow: "shadow-orange-500/25"
            },
            {
              label: "Total Products",
              value: data?.kpis?.products ?? 0,
              accent: "from-cyan-500/20 via-cyan-500/0 to-transparent",
              icon: <Boxes className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-cyan-500 to-blue-600",
              iconColor: "text-white",
              glow: "shadow-cyan-500/25"
            },
            {
              label: "Stock IN (units)",
              value: data?.kpis?.stockIn ?? 0,
              accent: "from-emerald-500/20 via-emerald-500/0 to-transparent",
              icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-emerald-500 to-green-600",
              iconColor: "text-white",
              glow: "shadow-emerald-500/25"
            },
            {
              label: "Stock OUT (units)",
              value: data?.kpis?.stockOut ?? 0,
              accent: "from-rose-500/20 via-rose-500/0 to-transparent",
              icon: <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-rose-500 to-red-600",
              iconColor: "text-white",
              glow: "shadow-rose-500/25"
            },
            {
              label: "Active Alerts",
              value: calculatedAlerts.filter(a => a.alert_type !== 'OK').length,
              accent: "from-violet-500/20 via-violet-500/0 to-transparent",
              icon: <AlertTriangle className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-violet-500 to-purple-600",
              iconColor: "text-white",
              glow: "shadow-violet-500/25"
            },
          ].map((kpi, index) => (
            <div
              key={kpi.label}
              className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-4 sm:p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-xl"
              style={{
                animationDelay: `${index * 100}ms`,
                animation: 'fadeInUp 0.6s ease-out forwards'
              }}
            >
              {/* Animated gradient background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${kpi.accent} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
              
              {/* Animated pattern overlay */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-700">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
              </div>
              
              {/* Floating particles effect */}
              <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-30 transition-opacity duration-1000">
                <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                <div className="absolute bottom-1/4 left-1/2 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '1s'}}></div>
              </div>
              
              <div className="relative flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 sm:gap-4 mb-3 sm:mb-4">
                    <div className={`relative p-2 sm:p-3 rounded-xl sm:rounded-2xl bg-gradient-to-br ${kpi.iconBg} shadow-lg ${kpi.glow} group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                      <div className="absolute inset-0 bg-white/20 rounded-xl sm:rounded-2xl animate-pulse"></div>
                      <div className={`relative ${kpi.iconColor} z-10`}>
                        {kpi.icon}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-slate-300 font-medium tracking-wide text-xs sm:text-sm uppercase truncate">{kpi.label}</p>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                        <span className="text-[10px] sm:text-[11px] text-slate-500">Live Data</span>
                      </div>
                    </div>
                  </div>
                  <p className="relative text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                    {kpi.value.toLocaleString()}
                  </p>
                  
                  {/* Trend indicator */}
                  <div className="mt-3 sm:mt-4 flex items-center gap-2">
                    <div className="h-px bg-gradient-to-r from-transparent via-slate-600 to-transparent flex-1"></div>
                    <div className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-slate-700/50 border border-slate-600/50">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[10px] text-slate-400 font-medium">ACTIVE</span>
                    </div>
                    <div className="h-px bg-gradient-to-r from-slate-600 to-transparent flex-1"></div>
                  </div>
                </div>
              </div>
              
              {/* Decorative corner elements */}
              <div className="absolute top-3 right-3 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{animationDelay: '0.2s'}}></div>
            </div>
          ))}
        </section>

        {/* Add fadeInUp animation */}
        <style jsx>{`
          @keyframes fadeInUp {
            from {
              opacity: 0;
              transform: translateY(20px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}</style>

        {/* Analytics and Alerts Section */}
        <section className="grid gap-6 lg:grid-cols-3">
          {/* Stock Analytics Chart */}
          <div className="lg:col-span-2 bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border border-slate-700/50 p-6 backdrop-blur-xl shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 shadow-lg shadow-emerald-500/25">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                  <BarChart3 className="h-6 w-6 text-emerald-400 relative z-10" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Stock Analytics</h2>
                  <p className="text-slate-400 text-sm">Real-time movement trends</p>
                </div>
              </div>
              {isLoading && (
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-700/50 border border-slate-600/50">
                  <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                  <span className="text-slate-300 text-sm">Loading…</span>
                </div>
              )}
            </div>
            
            <div className="relative h-80 bg-gradient-to-br from-slate-800/50 to-slate-900/50 rounded-2xl p-4 border border-slate-700/30">
              {/* Decorative grid pattern */}
              <div className="absolute inset-0 bg-grid-white/5 [mask-image:linear-gradient(0deg,white,transparent)] opacity-20"></div>
              
              <ResponsiveContainer width="100%" height="100%">
                <BarChart 
                  data={data?.series ?? []}
                  margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                >
                  <CartesianGrid 
                    strokeDasharray="3 3" 
                    stroke="rgba(148, 163, 184, 0.1)" 
                    strokeOpacity={0.3}
                  />
                  <XAxis 
                    dataKey="date" 
                    stroke="rgba(148, 163, 184, 0.6)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="rgba(148, 163, 184, 0.6)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'rgba(15, 23, 42, 0.9)',
                      border: '1px solid rgba(148, 163, 184, 0.2)',
                      borderRadius: '16px',
                      fontSize: '12px',
                      color: '#f1f5f9',
                      boxShadow: '0 10px 40px rgba(0,0,0,0.3)',
                      backdropFilter: 'blur(12px)',
                      padding: '16px'
                    }}
                    labelStyle={{ color: '#94a3b8', marginBottom: '6px', fontWeight: 'bold' }}
                  />
                  <Legend 
                    wrapperStyle={{
                      fontSize: '13px',
                      color: '#cbd5e1',
                      paddingTop: '24px'
                    }}
                    iconType="circle"
                  />
                  <Bar
                    dataKey="in"
                    fill="url(#emeraldGradient)"
                    name="Stock IN"
                    radius={[12, 12, 0, 0]}
                    animationBegin={0}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="out"
                    fill="url(#roseGradient)"
                    name="Stock OUT"
                    radius={[12, 12, 0, 0]}
                    animationBegin={200}
                    animationDuration={800}
                    animationEasing="ease-out"
                  />
                  <defs>
                    <linearGradient id="emeraldGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#059669" stopOpacity={0.7}/>
                    </linearGradient>
                    <linearGradient id="roseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#f43f5e" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#dc2626" stopOpacity={0.7}/>
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Critical Alerts */}
          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border border-slate-700/50 p-6 backdrop-blur-xl shadow-xl">
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative p-3 rounded-2xl bg-gradient-to-br from-red-500/20 to-orange-500/20 shadow-lg shadow-red-500/25">
                  <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                  <AlertTriangle className="h-6 w-6 text-red-400 relative z-10" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">Critical Alerts</h2>
                  <p className="text-slate-400 text-sm">Priority issues</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type !== 'OK').length > 0 && (
                  <div className="px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                    <span className="text-red-300 text-xs font-bold">
                      {calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type !== 'OK').length}
                    </span>
                  </div>
                )}
                <button
                  onClick={() => setAlertSettingsOpen(true)}
                  className="p-2 rounded-xl bg-gradient-to-br from-slate-700/50 to-slate-600/50 border border-slate-600/50 hover:from-slate-700/70 hover:to-slate-600/70 transition-all duration-300"
                  aria-label="Alert settings"
                >
                  <Settings className="h-4 w-4 text-slate-300" />
                </button>
              </div>
            </div>
            
            <div className="space-y-4 max-h-64 overflow-y-auto custom-scrollbar">
              {/* Filter alerts based on view */}
              {alertView === 'all' || alertView === 'empty' ? (
                calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'EMPTY').length > 0 && (
                  <div className="bg-gradient-to-br from-red-500/10 to-red-600/10 rounded-2xl p-4 border border-red-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20">
                        <AlertTriangle className="h-4 w-4 text-red-400" />
                      </div>
                      <div>
                        <h4 className="text-red-300 font-semibold text-sm">Empty Stock</h4>
                        <p className="text-red-400/70 text-xs">Products completely out of stock</p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                          <span className="text-red-300 text-xs font-bold">
                            {calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'EMPTY').length}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'EMPTY').map((a: { alert_type: "EMPTY" | "LOW" | "OK"; product_id: string; godown_id: string; name: string; current_stock: number }, index: number) => (
                        <Link
                          key={a.product_id}
                          href={`/godowns/${a.godown_id}`}
                          className="group block bg-red-500/5 rounded-xl p-3 border border-red-500/10 transition-all duration-300 hover:bg-red-500/10 hover:border-red-500/20 hover:scale-[1.01]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-red-400 animate-pulse"></div>
                                <span className="text-white font-medium text-sm truncate">{a.name}</span>
                              </div>
                              <div className="text-red-400 text-xs mt-1">
                                Stock: <span className="font-bold">0.000</span>
                              </div>
                            </div>
                            <div className="px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                              <span className="text-red-300 text-xs font-bold">EMPTY</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              ) : null}

              {/* Low Stock Section */}
              {alertView === 'all' || alertView === 'low' ? (
                calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'LOW').length > 0 && (
                  <div className="bg-gradient-to-br from-orange-500/10 to-orange-600/10 rounded-2xl p-4 border border-orange-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20">
                        <AlertTriangle className="h-4 w-4 text-orange-400" />
                      </div>
                      <div>
                        <h4 className="text-orange-300 font-semibold text-sm">Low Stock</h4>
                        <p className="text-orange-400/70 text-xs">Products running low on inventory</p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                          <span className="text-orange-300 text-xs font-bold">
                            {calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'LOW').length}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'LOW').map((a: { alert_type: "EMPTY" | "LOW" | "OK"; product_id: string; godown_id: string; name: string; current_stock: number }, index: number) => (
                        <Link
                          key={a.product_id}
                          href={`/godowns/${a.godown_id}`}
                          className="group block bg-orange-500/5 rounded-xl p-3 border border-orange-500/10 transition-all duration-300 hover:bg-orange-500/10 hover:border-orange-500/20 hover:scale-[1.01]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse"></div>
                                <span className="text-white font-medium text-sm truncate">{a.name}</span>
                              </div>
                              <div className="text-orange-400 text-xs mt-1">
                                Stock: <span className="font-bold">{Number(a.current_stock).toFixed(3)}</span>
                              </div>
                            </div>
                            <div className="px-2 py-1 rounded-full bg-orange-500/20 border border-orange-500/30">
                              <span className="text-orange-300 text-xs font-bold">LOW</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              ) : null}

              {/* Optimal Stock Section - Now included in All view */}
              {alertView === 'all' || alertView === 'optimal' ? (
                calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'OK').length > 0 && (
                  <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl p-4 border border-emerald-500/20">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                        <div className="w-4 h-4 bg-emerald-400 rounded-full"></div>
                      </div>
                      <div>
                        <h4 className="text-emerald-300 font-semibold text-sm">Optimal Stock</h4>
                        <p className="text-emerald-400/70 text-xs">Products above low stock threshold</p>
                      </div>
                      <div className="ml-auto">
                        <span className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                          <span className="text-emerald-300 text-xs font-bold">
                            {calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'OK').length}
                          </span>
                        </span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'OK').map((a: { alert_type: "EMPTY" | "LOW" | "OK"; product_id: string; godown_id: string; name: string; current_stock: number }, index: number) => (
                        <Link
                          key={a.product_id}
                          href={`/godowns/${a.godown_id}`}
                          className="group block bg-emerald-500/5 rounded-xl p-3 border border-emerald-500/10 transition-all duration-300 hover:bg-emerald-500/10 hover:border-emerald-500/20 hover:scale-[1.01]"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                                <span className="text-white font-medium text-sm truncate">{a.name}</span>
                              </div>
                              <div className="text-emerald-400 text-xs mt-1">
                                Stock: <span className="font-bold">{Number(a.current_stock).toFixed(3)}</span>
                              </div>
                            </div>
                            <div className="px-2 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30">
                              <span className="text-emerald-300 text-xs font-bold">OPTIMAL</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )
              ) : null}

              {/* No Alerts State */}
              {calculatedAlerts.length === 0 && (
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl p-6 border border-emerald-500/20 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                      <div className="w-6 h-6 bg-emerald-400 rounded-full"></div>
                    </div>
                  </div>
                  <div>
                    <p className="text-emerald-300 font-semibold">All Systems Optimal</p>
                    <p className="text-slate-400 text-sm mt-1">No critical issues detected</p>
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Buttons - Outside of card */}
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => setAlertView('all')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  alertView === 'all'
                    ? 'bg-slate-600 text-white border border-slate-500'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-slate-600/50'
                }`}
              >
                All ({calculatedAlerts.length})
              </button>
              <button
                onClick={() => setAlertView('empty')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  alertView === 'empty'
                    ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-red-500/10'
                }`}
              >
                Empty ({calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'EMPTY').length})
              </button>
              <button
                onClick={() => setAlertView('low')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  alertView === 'low'
                    ? 'bg-orange-500/20 text-orange-300 border border-orange-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-orange-500/10'
                }`}
              >
                Low ({calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'LOW').length})
              </button>
              <button
                onClick={() => setAlertView('optimal')}
                className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${
                  alertView === 'optimal'
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-700/50 text-slate-400 border border-slate-600/50 hover:bg-emerald-500/10'
                }`}
              >
                Optimal ({calculatedAlerts.filter((a: { alert_type: "EMPTY" | "LOW" | "OK" }) => a.alert_type === 'OK').length})
              </button>
            </div>
          </div>
        </section>

        {/* Alert Settings Modal */}
        {alertSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700/50 p-6 max-w-md w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <Settings className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Alert Settings</h3>
                    <p className="text-slate-400 text-sm">Configure alert thresholds</p>
                  </div>
                </div>
                <button
                  onClick={() => setAlertSettingsOpen(false)}
                  className="p-2 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700/70 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-300" />
                </button>
              </div>

              {/* Global Alert Thresholds */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Empty Stock Threshold
                  </label>
                  <div className="flex items-center gap-2 px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl">
                    <span className="text-white text-sm">Always 0</span>
                    <span className="text-xs text-slate-400">Stock of 0 is always considered empty</span>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Low Stock Threshold
                  </label>
                  <input
                    type="number"
                    value={alertSettings.lowThreshold}
                    onChange={(e) => setAlertSettings((prev: { emptyThreshold: number; lowThreshold: number }) => ({ 
                      ...prev, 
                      lowThreshold: Number(e.target.value) 
                    }))}
                    className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="3"
                  />
                  <p className="text-xs text-slate-400 mt-1">Alert when stock falls below this level (default: 3)</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end mt-6">
                <button
                  onClick={() => setAlertSettingsOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAlertSettings}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300"
                >
                  Save Settings
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}

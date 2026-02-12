"use client";

import useSWR from "swr";
import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
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
  
  // Alert settings state
  const [alertSettingsOpen, setAlertSettingsOpen] = useState(false);
  const [alertSettings, setAlertSettings] = useState({
    emptyThreshold: 0,
    lowThreshold: 3,
    unitTypes: [] as Array<{ id: string; name: string; emptyThreshold: number; lowThreshold: number }>
  });
  const [selectedGodownId, setSelectedGodownId] = useState<string | null>(null);
  const [godowns, setGodowns] = useState<any[]>([]);

  useEffect(() => {
    if (!user) return;
    user
      .getIdToken()
      .then(setIdToken)
      .catch(() => {
        toast.error("Failed to get auth token");
      });
  }, [user]);

  // Load godowns for alert settings
  useEffect(() => {
    if (!idToken) return;
    const loadGodowns = async () => {
      try {
        const res = await fetch("/api/godowns", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          console.log("[Dashboard] Loaded godowns:", data);
          setGodowns(data);
          if (data.length > 0 && !selectedGodownId) {
            // Default to your specific godown ID
            const targetGodownId = "1a5e6cf5-be13-4712-9195-46369e220df8";
            const godownExists = data.find((g: any) => g.id === targetGodownId);
            
            if (godownExists) {
              console.log("[Dashboard] Selecting your godown:", targetGodownId);
              setSelectedGodownId(targetGodownId);
            } else {
              console.log("[Dashboard] Your godown not found, selecting first:", data[0].id);
              setSelectedGodownId(data[0].id);
            }
          }
        }
      } catch (error) {
        console.error("Failed to load godowns:", error);
      }
    };
    loadGodowns();
  }, [idToken]);

  // Test unit types loading directly
  useEffect(() => {
    if (!idToken || !selectedGodownId) return;
    const testUnitTypes = async () => {
      try {
        console.log("[Dashboard] Testing unit types API for godown:", selectedGodownId);
        const res = await fetch(`/api/unit-types?godownId=${selectedGodownId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          console.log("[Dashboard] Unit types API response:", data);
        } else {
          console.error("[Dashboard] Unit types API failed:", res.status, await res.text());
        }
      } catch (error) {
        console.error("[Dashboard] Unit types API error:", error);
      }
    };
    testUnitTypes();
  }, [idToken, selectedGodownId]);

  // Load alert settings when godown is selected
  useEffect(() => {
    if (!idToken || !selectedGodownId) return;
    const loadAlertSettings = async () => {
      try {
        console.log("[Dashboard] Loading alert settings for godown:", selectedGodownId);
        console.log("[Dashboard] Available godowns:", godowns.map(g => ({ id: g.id, name: g.name })));
        const res = await fetch(`/api/alert-settings?godownId=${selectedGodownId}`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (res.ok) {
          const data = await res.json();
          console.log("[Dashboard] Loaded alert settings:", data);
          setAlertSettings({
            emptyThreshold: data.globalSettings.empty_threshold,
            lowThreshold: data.globalSettings.low_threshold,
            unitTypes: data.unitTypes
          });
        } else {
          console.error("[Dashboard] Failed to load alert settings:", res.status);
        }
      } catch (error) {
        console.error("[Dashboard] Failed to load alert settings:", error);
      }
    };
    loadAlertSettings();
  }, [idToken, selectedGodownId]);

  const saveAlertSettings = async () => {
    if (!idToken || !selectedGodownId) return;
    
    try {
      console.log("[Dashboard] Saving alert settings to database");
      
      const res = await fetch("/api/alert-settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          godownId: selectedGodownId,
          emptyThreshold: alertSettings.emptyThreshold,
          lowThreshold: alertSettings.lowThreshold,
          unitTypes: alertSettings.unitTypes
        }),
      });
      
      if (res.ok) {
        console.log("[Dashboard] Alert settings saved to database successfully");
        toast.success("Alert settings saved");
        setAlertSettingsOpen(false);
      } else {
        const errorText = await res.text();
        console.error("[Dashboard] Failed to save alert settings:", errorText);
        toast.error("Failed to save alert settings");
      }
    } catch (error) {
      console.error("[Dashboard] Failed to save alert settings:", error);
      toast.error("Failed to save alert settings");
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
              value: data?.kpis?.alerts ?? 0,
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
                {alerts.filter(a => a.alert_type !== 'OK').length > 0 && (
                  <div className="px-2 py-1 rounded-full bg-red-500/20 border border-red-500/30">
                    <span className="text-red-300 text-xs font-bold">
                      {alerts.filter(a => a.alert_type !== 'OK').length}
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
            
            <div className="space-y-3 max-h-80 overflow-y-auto custom-scrollbar">
              {alerts.filter(a => a.alert_type !== 'OK').length === 0 ? (
                <div className="bg-gradient-to-br from-emerald-500/10 to-green-500/10 rounded-2xl p-4 border border-emerald-500/20">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20">
                      <div className="w-4 h-4 bg-emerald-400 rounded-full"></div>
                    </div>
                    <div>
                      <p className="text-emerald-300 font-medium">All Systems Optimal</p>
                      <p className="text-slate-400 text-sm">No critical issues detected</p>
                    </div>
                  </div>
                </div>
              ) : (
                alerts.filter(a => a.alert_type !== 'OK').map((a, index) => {
                  const isEmpty = a.alert_type === "EMPTY";
                  const isLow = a.alert_type === "LOW";
                  const dotClass = isEmpty
                    ? "text-red-400"
                    : isLow
                      ? "text-orange-400"
                      : "text-emerald-400";
                  const bgClass = isEmpty
                    ? "from-red-500/10 to-red-600/10 border-red-500/20"
                    : isLow
                      ? "from-orange-500/10 to-orange-600/10 border-orange-500/20"
                      : "from-emerald-500/10 to-emerald-600/10 border-emerald-500/20";

                  return (
                    <Link
                      key={a.product_id}
                      href={`/godowns/${a.godown_id}`}
                      className={`group block bg-gradient-to-br ${bgClass} rounded-2xl p-4 border transition-all duration-300 hover:scale-[1.02] hover:shadow-lg backdrop-blur-sm`}
                      style={{
                        animationDelay: `${index * 50}ms`,
                        animationName: 'slideInRight',
                        animationDuration: '0.4s',
                        animationTimingFunction: 'ease-out',
                        animationFillMode: 'forwards'
                      }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <div className={`w-2 h-2 rounded-full ${dotClass} animate-pulse`}></div>
                            <span className="text-white font-medium truncate">{a.name}</span>
                          </div>
                          <div className="text-slate-400 text-sm">
                            Stock: <span className={`font-bold ${isEmpty ? 'text-red-400' : isLow ? 'text-orange-400' : 'text-emerald-400'}`}>
                              {Number(a.current_stock).toFixed(3)}
                            </span>
                          </div>
                        </div>
                        <div className={`px-3 py-1.5 rounded-full text-xs font-bold border ${
                          isEmpty 
                            ? 'bg-red-500/20 text-red-300 border-red-500/30' 
                            : isLow 
                              ? 'bg-orange-500/20 text-orange-300 border-orange-500/30'
                              : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                        }`}>
                          {a.alert_type}
                        </div>
                      </div>
                    </Link>
                  );
                })
              )}
            </div>
          </div>
        </section>

        {/* Add slideInRight animation */}
        <style jsx>{`
          @keyframes slideInRight {
            from {
              opacity: 0;
              transform: translateX(20px);
            }
            to {
              opacity: 1;
              transform: translateX(0);
            }
          }
          
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-track {
            background: rgba(148, 163, 184, 0.1);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 3px;
          }
          
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.5);
          }
        `}</style>

        {/* Alert Settings Modal */}
        {alertSettingsOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-slate-700/50 p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20">
                    <Settings className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-white">Alert Settings</h3>
                    <p className="text-slate-400 text-sm">Configure alert thresholds by unit type</p>
                  </div>
                </div>
                <button
                  onClick={() => setAlertSettingsOpen(false)}
                  className="p-2 rounded-xl bg-slate-700/50 border border-slate-600/50 hover:bg-slate-700/70 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-300" />
                </button>
              </div>

              {/* Godown Selection */}
              <div className="mb-6 p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Select Warehouse
                </label>
                <select
                  value={selectedGodownId || ""}
                  onChange={(e) => setSelectedGodownId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {godowns.map((godown) => (
                    <option key={godown.id} value={godown.id}>
                      {godown.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-400 mt-1">Configure alerts for specific warehouse</p>
              </div>

              {/* Unit Type Specific Settings */}
              <div className="mb-6">
                <h4 className="text-white font-semibold mb-4">Alert Thresholds by Unit Type</h4>
                <div className="space-y-3">
                  {alertSettings.unitTypes.map((unitType, index) => (
                    <div key={unitType.id} className="p-4 rounded-2xl bg-slate-800/50 border border-slate-700/50">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="text-white font-medium">{unitType.name}</h5>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                          <span className="text-xs text-slate-400">Active</span>
                        </div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Empty Threshold
                          </label>
                          <input
                            type="number"
                            value={unitType.emptyThreshold}
                            onChange={(e) => {
                              const newUnitTypes = [...alertSettings.unitTypes];
                              newUnitTypes[index].emptyThreshold = Number(e.target.value);
                              setAlertSettings(prev => ({ ...prev, unitTypes: newUnitTypes }));
                            }}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="0"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">
                            Low Threshold
                          </label>
                          <input
                            type="number"
                            value={unitType.lowThreshold}
                            onChange={(e) => {
                              const newUnitTypes = [...alertSettings.unitTypes];
                              newUnitTypes[index].lowThreshold = Number(e.target.value);
                              setAlertSettings(prev => ({ ...prev, unitTypes: newUnitTypes }));
                            }}
                            className="w-full px-3 py-2 bg-slate-700/50 border border-slate-600/50 rounded-xl text-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="3"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {alertSettings.unitTypes.length === 0 && (
                    <div className="p-4 rounded-2xl bg-slate-800/30 border border-slate-700/30 text-center">
                      <p className="text-slate-400 text-sm">No unit types found for this warehouse</p>
                      <p className="text-slate-500 text-xs mt-1">Add unit types to the warehouse first</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
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

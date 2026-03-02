"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { use, useEffect, useMemo, useState } from "react";
import appToast from "@/lib/toast";
import Link from "next/link";
import { Pencil, Plus, Trash2, Package, Building2, Boxes, TrendingUp, TrendingDown, BarChart3, Search, Calendar } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
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

type UnitType = {
  id: string;
  name: string;
  has_open_pieces: boolean;
};

type Company = {
  id: string;
  name: string;
};

type Product = {
  id: string;
  name: string;
  sku: string | null;
  opening_stock: number;
  company_id: string;
  unit_type_id: string;
};

type StockAnalytics = {
  total_opening_stock: number;
  total_current_stock: number;
  total_stock_in: number;
  total_stock_out: number;
  series: Array<{
    date: string;
    stock_in: number;
    stock_out: number;
  }>;
};

export default function GodownDetailPage({
  params,
}: {
  params: Promise<{ godownId: string }>;
}) {
  const { user } = useAuth();
  const { godownId } = use(params);
  const [idToken, setIdToken] = useState<string | null>(null);

  const [units, setUnits] = useState<UnitType[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [stockAnalytics, setStockAnalytics] = useState<StockAnalytics | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  const [activeTab, setActiveTab] = useState<
    "overview" | "units" | "companies" | "products"
  >("overview");

  // Date range for analytics
  const [range, setRange] = useState<"daily" | "weekly" | "monthly" | "yearly" | "custom">("monthly");
  const [from, setFrom] = useState<string>("");
  const [to, setTo] = useState<string>("");

  // create unit
  const [unitOpen, setUnitOpen] = useState(false);
  const [unitName, setUnitName] = useState("");
  const [unitLoose, setUnitLoose] = useState(false);

  // edit unit
  const [unitEditOpen, setUnitEditOpen] = useState(false);
  const [unitEditing, setUnitEditing] = useState<UnitType | null>(null);

  // create company
  const [companyOpen, setCompanyOpen] = useState(false);
  const [companyName, setCompanyName] = useState("");

  // edit company
  const [companyEditOpen, setCompanyEditOpen] = useState(false);
  const [companyEditing, setCompanyEditing] = useState<Company | null>(null);

  // create product
  const [productOpen, setProductOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [productSku, setProductSku] = useState("");
  const [productCompanyId, setProductCompanyId] = useState("");
  const [productUnitTypeId, setProductUnitTypeId] = useState("");
  const [productOpening, setProductOpening] = useState("0");

  // edit product
  const [productEditOpen, setProductEditOpen] = useState(false);
  const [productEditing, setProductEditing] = useState<Product | null>(null);

  // product filters
  const [productSearch, setProductSearch] = useState("");
  const [selectedCompany, setSelectedCompany] = useState<string>("all");

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(setIdToken).catch(() => {
      appToast.error(appToast.messages.auth.loginError);
    });
  }, [user]);

  const headers = useMemo(() => {
    if (!idToken) return undefined;
    return { Authorization: `Bearer ${idToken}` };
  }, [idToken]);

  const loadStockAnalytics = async () => {
    if (!headers) return;
    
    // Don't call API for custom range if dates aren't provided
    if (range === "custom" && (!from || !to)) {
      console.log("[DeepStaq] Skipping analytics call - custom range requires dates");
      return;
    }
    
    try {
      setAnalyticsLoading(true);
      const params = new URLSearchParams({ godownId, range });
      if (range === "custom" && from && to) {
        params.set("from", from);
        params.set("to", to);
      }
      const res = await fetch(`/api/stock-analytics?${params}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      setStockAnalytics(await res.json());
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.data.loadError);
    } finally {
      setAnalyticsLoading(false);
    }
  };

  const loadAll = async () => {
    if (!headers) return;
    try {
      const [unitsRes, compRes, prodRes] = await Promise.all([
        fetch(`/api/unit-types?godownId=${godownId}`, { headers }),
        fetch(`/api/companies?godownId=${godownId}`, { headers }),
        fetch(`/api/products?godownId=${godownId}`, { headers }),
      ]);

      if (!unitsRes.ok) throw new Error(await unitsRes.text());
      if (!compRes.ok) throw new Error(await compRes.text());
      if (!prodRes.ok) throw new Error(await prodRes.text());

      setUnits(await unitsRes.json());
      setCompanies(await compRes.json());
      setProducts(await prodRes.json());
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.data.loadError);
    }
  };

  const openEditUnit = (u: UnitType) => {
    setUnitEditing(u);
    setUnitName(u.name);
    setUnitLoose(u.has_open_pieces);
    setUnitEditOpen(true);
  };

  const updateUnit = async () => {
    if (!headers || !unitEditing || !unitName.trim()) return;
    try {
      const res = await fetch(`/api/unit-types/${unitEditing.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: unitName.trim(),
          has_open_pieces: unitLoose,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as UnitType;
      setUnits((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      setUnitEditing(null);
      setUnitName("");
      setUnitLoose(false);
      setUnitEditOpen(false);
      appToast.success(appToast.messages.unit.updated);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.unit.updateError);
    }
  };

  const deleteUnit = async (u: UnitType) => {
    if (!headers) return;
    const ok = window.confirm(`Delete unit type "${u.name}"?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/unit-types/${u.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      setUnits((p) => p.filter((x) => x.id !== u.id));
      appToast.success(appToast.messages.unit.deleted);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.unit.deleteError);
    }
  };

  useEffect(() => {
    if (!headers) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, godownId]);

  useEffect(() => {
    if (!headers) return;
    loadStockAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, godownId, range, from, to]);

  const createUnit = async () => {
    if (!headers || !unitName.trim()) return;
    try {
      const res = await fetch("/api/unit-types", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          godown_id: godownId,
          name: unitName.trim(),
          has_open_pieces: unitLoose,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = (await res.json()) as UnitType;
      setUnits((p) => [...p, created]);
      setUnitName("");
      setUnitLoose(false);
      setUnitOpen(false);
      appToast.success(appToast.messages.unit.created);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.unit.createError);
    }
  };

  const openEditCompany = (c: Company) => {
    setCompanyEditing(c);
    setCompanyName(c.name);
    setCompanyEditOpen(true);
  };

  const createCompany = async () => {
    if (!headers || !companyName.trim()) return;
    try {
      const res = await fetch("/api/companies", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ godown_id: godownId, name: companyName.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = (await res.json()) as Company;
      setCompanies((p) => [...p, created]);
      setCompanyName("");
      setCompanyOpen(false);
      appToast.success(appToast.messages.data.saveSuccess);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.data.saveError);
    }
  };

  const updateCompany = async () => {
    if (!headers || !companyEditing || !companyName.trim()) return;
    try {
      const res = await fetch(`/api/companies/${companyEditing.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ name: companyName.trim() }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as Company;
      setCompanies((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      setCompanyEditing(null);
      setCompanyName("");
      setCompanyEditOpen(false);
      appToast.success(appToast.messages.data.saveSuccess);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.data.saveError);
    }
  };

  const deleteCompany = async (c: Company) => {
    if (!headers) return;
    const ok = window.confirm(`Delete company "${c.name}"?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/companies/${c.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      setCompanies((p) => p.filter((x) => x.id !== c.id));
      appToast.success(appToast.messages.data.deleteSuccess);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.data.saveError);
    }
  };

  const openEditProduct = (p: Product) => {
    setProductEditing(p);
    setProductName(p.name);
    setProductSku(p.sku ?? "");
    setProductCompanyId(p.company_id);
    setProductUnitTypeId(p.unit_type_id);
    setProductOpening(String(p.opening_stock ?? 0));
    setProductEditOpen(true);
  };

  const createProduct = async () => {
    if (!headers || !productName.trim() || !productCompanyId || !productUnitTypeId)
      return;
    try {
      const res = await fetch("/api/products", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          godown_id: godownId,
          company_id: productCompanyId,
          name: productName.trim(),
          sku: productSku.trim() || null,
          unit_type_id: productUnitTypeId,
          opening_stock: Number(productOpening || 0),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = (await res.json()) as Product;
      setProducts((p) => [...p, created]);
      setProductName("");
      setProductSku("");
      setProductCompanyId("");
      setProductUnitTypeId("");
      setProductOpening("0");
      setProductOpen(false);
      await loadAll();
      await loadCurrentStock();
      appToast.success(appToast.messages.data.saveSuccess);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.data.saveError);
    }
  };

  const updateProduct = async () => {
    if (!headers || !productEditing || !productName.trim() || !productCompanyId || !productUnitTypeId)
      return;

    try {
      const res = await fetch(`/api/products/${productEditing.id}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName.trim(),
          sku: productSku.trim() || null,
          company_id: productCompanyId,
          unit_type_id: productUnitTypeId,
          opening_stock: Number(productOpening || 0),
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as Product;
      setProducts((p) => p.map((x) => (x.id === updated.id ? updated : x)));
      setProductEditing(null);
      setProductName("");
      setProductSku("");
      setProductCompanyId("");
      setProductUnitTypeId("");
      setProductOpening("0");
      setProductEditOpen(false);
      await loadAll();
      await loadCurrentStock();
      appToast.success(appToast.messages.product.updated);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.product.updateError);
    }
  };

  const deleteProduct = async (p: Product) => {
    if (!headers) return;
    const ok = window.confirm(`Delete product "${p.name}"?`);
    if (!ok) return;
    try {
      const res = await fetch(`/api/products/${p.id}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok && res.status !== 204) throw new Error(await res.text());
      setProducts((x) => x.filter((y) => y.id !== p.id));
      await loadCurrentStock();
      appToast.success(appToast.messages.product.deleted);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.product.deleteError);
    }
  };

  // Filter products based on search and company
  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
      const matchesSearch = product.name.toLowerCase().includes(productSearch.toLowerCase()) ||
                          (product.sku?.toLowerCase().includes(productSearch.toLowerCase()) ?? false);
      const matchesCompany = selectedCompany === "all" || product.company_id === selectedCompany;
      return matchesSearch && matchesCompany;
    });
  }, [products, productSearch, selectedCompany]);

  // Get current stock for products
  const [productStocks, setProductStocks] = useState<Record<string, number>>({});
  const [stockLoading, setStockLoading] = useState(false);

  const loadCurrentStock = async () => {
    if (!headers) return;
    try {
      setStockLoading(true);
      const res = await fetch(`/api/reports/current-stock?godownId=${godownId}`, { headers });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      
      // Convert array to object with product ID as key
      const stocks: Record<string, number> = {};
      data.rows.forEach((row: { productName: string; currentStock: number }) => {
        // Find product by name to get ID
        const product = products.find(p => p.name === row.productName);
        if (product) {
          stocks[product.id] = row.currentStock;
        }
      });
      
      setProductStocks(stocks);
    } catch (e) {
      appToast.error(e instanceof Error ? e.message : appToast.messages.data.loadError);
    } finally {
      setStockLoading(false);
    }
  };

  useEffect(() => {
    if (headers && products.length > 0) {
      loadCurrentStock();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, godownId, products.length]);

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-slate-700/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Godown workspace</h1>
              </div>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
                Manage units, companies and products — then track daily stock movements with advanced analytics.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href="/godowns" 
                className="px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700/70 transition-all duration-300 flex items-center gap-2"
              >
                <span className="text-lg">←</span>
                Back to Godowns
              </Link>
            </div>
          </div>
        </header>

        {/* Modern Tab Navigation */}
        <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl border border-slate-700/50 p-1 backdrop-blur-xl shadow-xl">
          <div className="flex gap-1 p-1">
            {(["overview", "units", "companies", "products"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-medium transition-all duration-300 ${
                  activeTab === t
                    ? "bg-gradient-to-r from-blue-600 to-cyan-600 text-white shadow-lg shadow-blue-500/25"
                    : "text-slate-400 hover:text-white hover:bg-slate-700/50"
                }`}
              >
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6 sm:space-y-8">
            {/* Modern KPI Cards */}
            <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {[
                {
                  label: "Total Units",
                  value: units.length,
                  accent: "from-indigo-500/20 via-indigo-500/0 to-transparent",
                  icon: <Package className="h-5 w-5 sm:h-6 sm:w-6" />,
                  iconBg: "from-indigo-500 to-purple-600",
                  iconColor: "text-white",
                  glow: "shadow-indigo-500/25"
                },
                {
                  label: "Total Companies", 
                  value: companies.length,
                  accent: "from-orange-500/20 via-orange-500/0 to-transparent",
                  icon: <Building2 className="h-5 w-5 sm:h-6 sm:w-6" />,
                  iconBg: "from-orange-500 to-amber-600",
                  iconColor: "text-white",
                  glow: "shadow-orange-500/25"
                },
                {
                  label: "Total Products",
                  value: products.length,
                  accent: "from-cyan-500/20 via-cyan-500/0 to-transparent",
                  icon: <Boxes className="h-5 w-5 sm:h-6 sm:w-6" />,
                  iconBg: "from-cyan-500 to-blue-600",
                  iconColor: "text-white",
                  glow: "shadow-cyan-500/25"
                }
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

            {/* Stock Analytics */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Stock KPIs */}
              <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl sm:rounded-3xl border border-slate-700/50 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-lg shadow-orange-500/25">
                      <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                      <BarChart3 className="h-6 w-6 text-orange-400 relative z-10" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Stock Analytics</h2>
                      <p className="text-slate-400 text-sm">Real-time stock movement insights</p>
                    </div>
                  </div>
                  {analyticsLoading && (
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      <span className="text-[11px] text-slate-400">Loading…</span>
                    </div>
                  )}
                </div>
                
                <div className="grid gap-4 sm:gap-6 grid-cols-2">
                  {[
                    {
                      label: "Total Opening Stock",
                      value: stockAnalytics?.total_opening_stock?.toFixed(3) || "0.000",
                      accent: "from-blue-500/20 via-blue-500/0 to-transparent",
                      icon: <Package className="h-5 w-5" />,
                      iconBg: "from-blue-500 to-indigo-600",
                      iconColor: "text-white",
                      glow: "shadow-blue-500/25",
                      description: "Starting inventory"
                    },
                    {
                      label: "Current Stock",
                      value: stockAnalytics?.total_current_stock?.toFixed(3) || "0.000",
                      accent: "from-emerald-500/20 via-emerald-500/0 to-transparent",
                      icon: <Boxes className="h-5 w-5" />,
                      iconBg: "from-emerald-500 to-green-600",
                      iconColor: "text-white",
                      glow: "shadow-emerald-500/25",
                      description: "Available inventory"
                    },
                    {
                      label: "Total Stock IN",
                      value: `+${stockAnalytics?.total_stock_in?.toFixed(3) || "0.000"}`,
                      accent: "from-green-500/20 via-green-500/0 to-transparent",
                      icon: <TrendingUp className="h-5 w-5" />,
                      iconBg: "from-green-500 to-emerald-600",
                      iconColor: "text-white",
                      glow: "shadow-green-500/25",
                      description: "Stock received"
                    },
                    {
                      label: "Total Stock OUT",
                      value: `-${stockAnalytics?.total_stock_out?.toFixed(3) || "0.000"}`,
                      accent: "from-rose-500/20 via-rose-500/0 to-transparent",
                      icon: <TrendingDown className="h-5 w-5" />,
                      iconBg: "from-rose-500 to-red-600",
                      iconColor: "text-white",
                      glow: "shadow-rose-500/25",
                      description: "Stock issued"
                    }
                  ].map((kpi, index) => (
                    <div
                      key={kpi.label}
                      className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 transition-all duration-500 hover:shadow-lg hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-sm"
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
                      
                      <div className="relative flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <div className={`relative p-2 rounded-xl bg-gradient-to-br ${kpi.iconBg} shadow-lg ${kpi.glow} group-hover:shadow-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}>
                            <div className="absolute inset-0 bg-white/20 rounded-xl animate-pulse"></div>
                            <div className={`relative ${kpi.iconColor} z-10`}>
                              {kpi.icon}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-slate-300 font-medium tracking-wide text-xs uppercase truncate">{kpi.label}</p>
                            <div className="mt-1 flex items-center gap-2">
                              <div className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse"></div>
                              <span className="text-[10px] text-slate-500">{kpi.description}</span>
                            </div>
                          </div>
                        </div>
                        <p className="relative text-xl sm:text-2xl font-black tracking-tight text-white bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                          {kpi.value}
                        </p>
                      </div>
                      
                      {/* Decorative corner elements */}
                      <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    </div>
                  ))}
                </div>
                
                {/* Show message when no data */}
                {stockAnalytics && stockAnalytics.total_stock_in === 0 && stockAnalytics.total_stock_out === 0 && (
                  <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 text-center backdrop-blur-sm">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-slate-600/50 to-slate-500/50 flex items-center justify-center">
                      <BarChart3 className="h-6 w-6 text-slate-400" />
                    </div>
                    <p className="text-sm text-slate-300">
                      {stockAnalytics.total_opening_stock === 0 
                        ? "No stock activity in this period" 
                        : "No stock movements in this period"}
                    </p>
                  </div>
                )}
              </section>

              {/* Stock Movement Graph - Modern Design */}
              <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl sm:rounded-3xl border border-slate-700/50 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
                <div className="mb-6 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative p-3 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 shadow-lg shadow-cyan-500/25">
                      <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                      <TrendingUp className="h-6 w-6 text-cyan-400 relative z-10" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-white">Stock Movement Trends</h2>
                      <p className="text-slate-400 text-sm">Visualize stock flow patterns</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <select
                      value={range}
                      onChange={(e) => setRange(e.target.value as "daily" | "weekly" | "monthly" | "yearly" | "custom")}
                      className="px-4 py-2 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-sm transition-all hover:bg-slate-800/70 text-sm"
                    >
                      <option value="daily" className="bg-slate-800">Daily</option>
                      <option value="weekly" className="bg-slate-800">Weekly</option>
                      <option value="monthly" className="bg-slate-800">Monthly</option>
                      <option value="yearly" className="bg-slate-800">Yearly</option>
                      <option value="custom" className="bg-slate-800">Custom</option>
                    </select>
                  </div>
                </div>

                {range === "custom" && (
                  <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-slate-800/50 to-slate-700/50 border border-slate-600/50 backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-slate-400" />
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="date"
                          value={from}
                          onChange={(e) => setFrom(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-sm transition-all hover:bg-slate-700/70 text-sm [&::-webkit-calendar-picker-indicator]:text-white"
                          placeholder="From date"
                        />
                        <span className="text-slate-400 text-sm">to</span>
                        <input
                          type="date"
                          value={to}
                          onChange={(e) => setTo(e.target.value)}
                          className="px-3 py-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 backdrop-blur-sm transition-all hover:bg-slate-700/70 text-sm [&::-webkit-calendar-picker-indicator]:text-white"
                          placeholder="To date"
                        />
                      </div>
                    </div>
                  </div>
                )}

                <div className="h-80 bg-gradient-to-br from-slate-800/30 to-slate-900/30 rounded-2xl p-4 backdrop-blur-sm">
                  {stockAnalytics?.series && stockAnalytics.series.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={stockAnalytics.series}
                        margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                      >
                        <defs>
                          <linearGradient id="stockInGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.3}/>
                          </linearGradient>
                          <linearGradient id="stockOutGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.3}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 3" 
                          stroke="rgba(148, 163, 184, 0.1)"
                          strokeOpacity={0.5}
                        />
                        <XAxis 
                          dataKey="date" 
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                        />
                        <YAxis 
                          tick={{ fontSize: 11, fill: '#94a3b8' }}
                          tickLine={false}
                          axisLine={{ stroke: 'rgba(148, 163, 184, 0.2)' }}
                        />
                        <Tooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              return (
                                <div style={{
                                  backgroundColor: 'rgba(15, 23, 42, 0.98)',
                                  border: '1px solid rgba(148, 163, 184, 0.3)',
                                  borderRadius: '8px',
                                  padding: '8px 12px',
                                  fontSize: '11px',
                                  color: '#f1f5f9',
                                  fontWeight: '500',
                                  boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
                                  backdropFilter: 'blur(8px)',
                                  minWidth: '120px'
                                }}>
                                  {payload.map((entry, index) => (
                                    <div key={index} style={{ 
                                      color: entry.color, 
                                      marginBottom: index < payload.length - 1 ? '4px' : '0',
                                      display: 'flex',
                                      justifyContent: 'space-between',
                                      alignItems: 'center'
                                    }}>
                                      <span>{entry.name}:</span>
                                      <span style={{ marginLeft: '8px', fontWeight: '600' }}>
                                        {entry.value}
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              );
                            }
                            return null;
                          }}
                          wrapperStyle={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '0',
                            margin: '0',
                            boxShadow: 'none'
                          }}
                          contentStyle={{
                            backgroundColor: 'transparent',
                            border: 'none',
                            padding: '0',
                            margin: '0',
                            boxShadow: 'none'
                          }}
                          isAnimationActive={false}
                          cursor={{ fill: 'rgba(148, 163, 184, 0.1)' }}
                        />
                        <Legend 
                          wrapperStyle={{ 
                            fontSize: "11px",
                            color: '#94a3b8'
                          }}
                          iconType="rect"
                        />
                        <Bar 
                          dataKey="stock_in" 
                          fill="url(#stockInGradient)" 
                          name="Stock IN"
                          radius={[4, 4, 0, 0]}
                          animationDuration={300}
                        />
                        <Bar 
                          dataKey="stock_out" 
                          fill="url(#stockOutGradient)" 
                          name="Stock OUT"
                          radius={[4, 4, 0, 0]}
                          animationDuration={300}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-600/50 flex items-center justify-center">
                          <TrendingUp className="h-8 w-8 text-slate-400" />
                        </div>
                        <p className="text-slate-300 text-sm">
                          {stockAnalytics?.total_stock_in === 0 && stockAnalytics?.total_stock_out === 0
                            ? "No stock movements in this period"
                            : "No data to display"}
                        </p>
                        <p className="text-slate-500 text-xs mt-1">Try adjusting the date range</p>
                      </div>
                    </div>
                  )}
                </div>
              </section>
            </div>
          </div>
        )}

        {activeTab === "units" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold">Unit types</h2>
              <button
                onClick={() => setUnitOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
              >
                <Plus className="h-3 w-3" /> Add unit
              </button>
            </div>
            <div className="rounded-2xl border app-border app-surface overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="border-b app-border">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-subtle">
                      Name
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-subtle">
                      Loose units
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-subtle">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {units.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-6 text-center text-subtle"
                      >
                        No unit types yet.
                      </td>
                    </tr>
                  ) : (
                    units.map((u) => (
                      <tr key={u.id} className="border-b app-border">
                        <td className="px-3 py-2">{u.name}</td>
                        <td className="px-3 py-2">
                          {u.has_open_pieces ? "Yes" : "No"}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openEditUnit(u)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60 sm:hidden"
                              aria-label="Edit unit"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteUnit(u)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60 sm:hidden"
                              aria-label="Delete unit"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => openEditUnit(u)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60"
                                aria-label="Edit unit"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteUnit(u)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60"
                                aria-label="Delete unit"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === "companies" && (
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold">Companies</h2>
              <button
                onClick={() => setCompanyOpen(true)}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
              >
                <Plus className="h-3 w-3" /> Add company
              </button>
            </div>
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {companies.length === 0 ? (
                <div className="rounded-2xl border app-border app-surface p-6 text-center text-sm text-subtle md:col-span-2 lg:col-span-3">
                  No companies yet.
                </div>
              ) : (
                companies.map((c) => (
                  <div
                    key={c.id}
                    className="rounded-2xl border app-border app-surface p-4 sm:p-6"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-semibold truncate">{c.name}</div>
                      </div>
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => openEditCompany(c)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60"
                          aria-label="Edit company"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCompany(c)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60"
                          aria-label="Delete company"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {activeTab === "products" && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-sm font-semibold">Products</h2>
              <button
                onClick={() => {
                  if (companies.length === 0 || units.length === 0) {
                    appToast.error('Add at least 1 company and 1 unit type first');
                    setActiveTab(companies.length === 0 ? "companies" : "units");
                    return;
                  }
                  setProductOpen(true);
                }}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
              >
                <Plus className="h-3 w-3" /> Add product
              </button>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3 p-4 rounded-2xl border app-border app-surface">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search products..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 text-sm border app-border app-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="sm:w-48">
                <select
                  value={selectedCompany}
                  onChange={(e) => setSelectedCompany(e.target.value)}
                  className="w-full px-4 py-2 text-sm border app-border app-surface rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="all">All Companies</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="rounded-2xl border app-border app-surface overflow-hidden">
              <table className="min-w-full text-xs">
                <thead className="border-b app-border">
                  <tr>
                    <th className="px-3 py-2 text-left font-semibold text-subtle">
                      Product
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-subtle">
                      SKU
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-subtle">
                      Current Stock
                    </th>
                    <th className="px-3 py-2 text-left font-semibold text-subtle">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.length === 0 ? (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-3 py-6 text-center text-subtle"
                      >
                        {products.length === 0 
                          ? "No products yet. Add units + company first, then create products."
                          : "No products match your filters."
                        }
                      </td>
                    </tr>
                  ) : (
                    filteredProducts.map((p) => (
                      <tr key={p.id} className="border-b app-border">
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2">{p.sku ?? "-"}</td>
                        <td className="px-3 py-2">
                          {stockLoading ? (
                            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-500/20 text-gray-300 border border-gray-500/30">
                              Loading...
                            </span>
                          ) : (
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              (productStocks[p.id] ?? 0) > 0 
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                                : "bg-red-500/20 text-red-300 border border-red-500/30"
                            }`}>
                              {(productStocks[p.id] ?? 0)?.toFixed(3) ?? "0.000"}
                            </span>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                            <Link
                              href={`/godowns/${godownId}/products/${p.id}`}
                              className="text-indigo-600 hover:underline sm:hidden"
                            >
                              Open
                            </Link>
                            <button
                              type="button"
                              onClick={() => openEditProduct(p)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60 sm:hidden"
                              aria-label="Edit product"
                            >
                              <Pencil className="h-4 w-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => deleteProduct(p)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60 sm:hidden"
                              aria-label="Delete product"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            <div className="hidden sm:flex items-center gap-2">
                              <Link
                                href={`/godowns/${godownId}/products/${p.id}`}
                                className="text-indigo-600 hover:underline"
                              >
                                Open
                              </Link>
                              <button
                                type="button"
                                onClick={() => openEditProduct(p)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60"
                                aria-label="Edit product"
                              >
                                <Pencil className="h-4 w-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => deleteProduct(p)}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60"
                                aria-label="Delete product"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Unit modal */}
      {unitOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border app-border app-surface p-6">
            <h3 className="text-sm font-semibold mb-4">Add unit type</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                  placeholder="Cartons, Boxes, PCS..."
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-subtle">
                <input
                  type="checkbox"
                  checked={unitLoose}
                  onChange={(e) => setUnitLoose(e.target.checked)}
                />
                Has loose/open pieces
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setUnitOpen(false)}
                className="rounded-lg border app-border app-surface px-3 py-1.5 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                onClick={createUnit}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unit edit modal */}
      {unitEditOpen && unitEditing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border app-border app-surface p-6">
            <h3 className="text-sm font-semibold mb-4">Edit unit type</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                />
              </div>
              <label className="flex items-center gap-2 text-xs text-subtle">
                <input
                  type="checkbox"
                  checked={unitLoose}
                  onChange={(e) => setUnitLoose(e.target.checked)}
                />
                Has loose/open pieces
              </label>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setUnitEditOpen(false);
                  setUnitEditing(null);
                  setUnitName("");
                  setUnitLoose(false);
                }}
                className="rounded-lg border app-border app-surface px-3 py-1.5 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                onClick={updateUnit}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company modal */}
      {companyOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border app-border app-surface p-6">
            <h3 className="text-sm font-semibold mb-4">Add company</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                  placeholder="Unilever, Nestle..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setCompanyOpen(false)}
                className="rounded-lg border app-border app-surface px-3 py-1.5 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                onClick={createCompany}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Company edit modal */}
      {companyEditOpen && companyEditing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border app-border app-surface p-6">
            <h3 className="text-sm font-semibold mb-4">Edit company</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">Name</label>
                <input
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setCompanyEditOpen(false);
                  setCompanyEditing(null);
                  setCompanyName("");
                }}
                className="rounded-lg border app-border app-surface px-3 py-1.5 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                onClick={updateCompany}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product modal */}
      {productOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border app-border app-surface p-6">
            <h3 className="text-sm font-semibold mb-4">Add product</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Product name
                </label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                  placeholder="Tea 250g"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  SKU (optional)
                </label>
                <input
                  value={productSku}
                  onChange={(e) => setProductSku(e.target.value)}
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                  placeholder="SKU-123"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Company
                  </label>
                  <select
                    value={productCompanyId}
                    onChange={(e) => setProductCompanyId(e.target.value)}
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Unit type
                  </label>
                  <select
                    value={productUnitTypeId}
                    onChange={(e) => setProductUnitTypeId(e.target.value)}
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Opening stock
                  </label>
                  <input
                    value={productOpening}
                    onChange={(e) => setProductOpening(e.target.value)}
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                    inputMode="decimal"
                  />
                </div>
              </div>
              <p className="text-[11px] text-subtle">
                Tip: create Unit Types and Companies first.
              </p>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setProductOpen(false)}
                className="rounded-lg border app-border app-surface px-3 py-1.5 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                onClick={createProduct}
                disabled={!productName.trim() || !productCompanyId || !productUnitTypeId}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Product edit modal */}
      {productEditOpen && productEditing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-md rounded-2xl border app-border app-surface p-6">
            <h3 className="text-sm font-semibold mb-4">Edit product</h3>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium mb-1">
                  Product name
                </label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1">
                  SKU (optional)
                </label>
                <input
                  value={productSku}
                  onChange={(e) => setProductSku(e.target.value)}
                  className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Company
                  </label>
                  <select
                    value={productCompanyId}
                    onChange={(e) => setProductCompanyId(e.target.value)}
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Unit type
                  </label>
                  <select
                    value={productUnitTypeId}
                    onChange={(e) => setProductUnitTypeId(e.target.value)}
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                  >
                    <option value="">Select</option>
                    {units.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium mb-1">
                    Opening stock
                  </label>
                  <input
                    value={productOpening}
                    onChange={(e) => setProductOpening(e.target.value)}
                    className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                    inputMode="decimal"
                  />
                </div>
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setProductEditOpen(false);
                  setProductEditing(null);
                  setProductName("");
                  setProductSku("");
                  setProductCompanyId("");
                  setProductUnitTypeId("");
                  setProductOpening("0");
                }}
                className="rounded-lg border app-border app-surface px-3 py-1.5 hover:bg-slate-200/60"
              >
                Cancel
              </button>
              <button
                onClick={updateProduct}
                disabled={!productName.trim() || !productCompanyId || !productUnitTypeId}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
      <style jsx global>{`
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
    </AppShell>
  );
}

"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { use, useEffect, useMemo, useCallback, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Trash2, Package, TrendingUp, TrendingDown, Boxes, Plus, Edit2, Calendar } from "lucide-react";

type Movement = {
  id: string;
  movement_date: string;
  type: "IN" | "OUT";
  quantity: number;
  note: string | null;
  created_at: string;
  product_id: string;
  product_name: string;
  current_stock: number;
};

type Product = {
  id: string;
  name: string;
  current_stock: number;
  opening_stock: number;
  sku: string | null;
  company_id: string;
  unit_type_id: string;
  company_name: string;
  unit_name: string;
};

export default function ProductDetailPage({
  params,
}: {
  params: Promise<{ godownId: string; productId: string }>;
}) {
  const { user } = useAuth();
  const { godownId, productId } = use(params);

  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [editingMovement, setEditingMovement] = useState<string | null>(null);

  const [type, setType] = useState<"IN" | "OUT">("IN");
  const [date, setDate] = useState<string>(() => {
    const d = new Date();
    return d.toISOString().slice(0, 10);
  });
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(setIdToken).catch(() => {
      toast.error("Failed to get auth token");
    });
  }, [user]);

  const headers = useMemo(() => {
    if (!idToken) return undefined;
    return { Authorization: `Bearer ${idToken}` };
  }, [idToken]);

  const load = useCallback(async () => {
    if (!headers) return;
    try {
      setLoading(true);
      
      // Load product details
      const productRes = await fetch(`/api/products/${productId}`, { headers });
      if (!productRes.ok) throw new Error(await productRes.text());
      const productData = await productRes.json() as Product;
      setProduct(productData);
      
      // Load movements
      const movementsRes = await fetch(`/api/stock-movements?productId=${productId}`, { headers });
      if (!movementsRes.ok) throw new Error(await movementsRes.text());
      setMovements(await movementsRes.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load product data");
    } finally {
      setLoading(false);
    }
  }, [headers, productId]);

  useEffect(() => {
    if (!headers) return;
    load();
  }, [headers, productId, load]);

  // Calculate today's stock summary
  const today = new Date().toISOString().slice(0, 10);
  const todayMovements = movements.filter(m => m.movement_date === today);
  const todayIn = todayMovements.filter(m => m.type === "IN").reduce((sum, m) => sum + Number(m.quantity), 0);
  const todayOut = todayMovements.filter(m => m.type === "OUT").reduce((sum, m) => sum + Number(m.quantity), 0);
  
  // Calculate today's opening stock (yesterday's closing stock)
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  
  const yesterdayMovements = movements.filter(m => m.movement_date <= yesterdayStr);
  const todayOpeningStock = yesterdayMovements.reduce((acc, m) => {
    const q = Number(m.quantity);
    return m.type === "IN" ? acc + q : acc - q;
  }, product?.opening_stock || 0);

  const createMovement = async () => {
    if (!headers) return;
    try {
      const res = await fetch("/api/stock-movements", {
        method: "POST",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: productId,
          movement_date: date,
          type,
          quantity: Number(qty),
          note: note || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Stock movement recorded");
      setQty("1");
      setNote("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create movement");
    }
  };

  const updateMovement = async (movementId: string) => {
    if (!headers) return;
    const movement = movements.find(m => m.id === movementId);
    if (!movement) return;

    try {
      const res = await fetch(`/api/stock-movements/${movementId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({
          movement_date: date,
          type,
          quantity: Number(qty),
          note: note || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Movement updated");
      setEditingMovement(null);
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update movement");
    }
  };

  const deleteMovement = async (movementId: string) => {
    if (!headers) return;
    const ok = window.confirm("Delete this movement? This action cannot be undone.");
    if (!ok) return;

    try {
      const res = await fetch(`/api/stock-movements/${movementId}`, {
        method: "DELETE",
        headers,
      });
      if (!res.ok) throw new Error(await res.text());
      toast.success("Movement deleted");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete movement");
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-subtle">Loading product details...</div>
        </div>
      </AppShell>
    );
  }

  if (!product) {
    return (
      <AppShell>
        <div className="flex items-center justify-center min-h-[50vh]">
          <div className="text-subtle">Product not found</div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-slate-700/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-emerald-500 to-green-400 rounded-full"></div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Product Management</h1>
              </div>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
                Track stock movements and manage inventory for <span className="text-emerald-400 font-semibold">{product.name}</span>
                {product.sku && <span className="text-slate-400"> (SKU: {product.sku})</span>}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Link 
                href={`/godowns/${godownId}`}
                className="px-4 py-2 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700/70 transition-all duration-300 flex items-center gap-2"
              >
                <span className="text-lg">←</span>
                Back to Godown
              </Link>
            </div>
          </div>
        </header>

        {/* Today's Stock Summary - Modern KPI Cards */}
        <section className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Today's Opening",
              value: todayOpeningStock.toFixed(3),
              accent: "from-blue-500/20 via-blue-500/0 to-transparent",
              icon: <Package className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-blue-500 to-indigo-600",
              iconColor: "text-white",
              glow: "shadow-blue-500/25",
              description: "Yesterday's closing stock"
            },
            {
              label: "Today's IN",
              value: `+${todayIn.toFixed(3)}`,
              accent: "from-emerald-500/20 via-emerald-500/0 to-transparent",
              icon: <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-emerald-500 to-green-600",
              iconColor: "text-white",
              glow: "shadow-emerald-500/25",
              description: "Stock received today"
            },
            {
              label: "Today's OUT",
              value: `-${todayOut.toFixed(3)}`,
              accent: "from-rose-500/20 via-rose-500/0 to-transparent",
              icon: <TrendingDown className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-rose-500 to-red-600",
              iconColor: "text-white",
              glow: "shadow-rose-500/25",
              description: "Stock issued today"
            },
            {
              label: "Current Stock",
              value: (todayOpeningStock + todayIn - todayOut).toFixed(3),
              accent: "from-purple-500/20 via-purple-500/0 to-transparent",
              icon: <Boxes className="h-5 w-5 sm:h-6 sm:w-6" />,
              iconBg: "from-purple-500 to-pink-600",
              iconColor: "text-white",
              glow: "shadow-purple-500/25",
              description: "Real-time remaining stock"
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
                    {kpi.value}
                  </p>
                  
                  {/* Description */}
                  <div className="mt-3 sm:mt-4">
                    <p className="text-[10px] sm:text-xs text-slate-400">{kpi.description}</p>
                  </div>
                </div>
              </div>
              
              {/* Decorative corner elements */}
              <div className="absolute top-3 right-3 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              <div className="absolute bottom-3 left-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{animationDelay: '0.2s'}}></div>
            </div>
          ))}
        </section>

        {/* Movement Form - Modern Design */}
        <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl sm:rounded-3xl border border-slate-700/50 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25">
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                <Edit2 className="h-6 w-6 text-blue-400 relative z-10" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingMovement ? "Edit Stock Movement" : "Record Stock Movement"}
                </h2>
                <p className="text-slate-400 text-sm">
                  {editingMovement ? "Update existing stock movement" : "Add new stock IN/OUT entry"}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 sm:gap-6 lg:grid-cols-5">
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "IN" | "OUT")}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all hover:bg-slate-800/70"
              >
                <option value="IN" className="bg-slate-800">Stock IN</option>
                <option value="OUT" className="bg-slate-800">Stock OUT</option>
              </select>
            </div>
            
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all hover:bg-slate-800/70 [&::-webkit-calendar-picker-indicator]:text-white"
              />
            </div>
            
            <div className="lg:col-span-1">
              <label className="block text-sm font-medium text-slate-300 mb-2">Quantity</label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="decimal"
                step="0.001"
                min="0.001"
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all hover:bg-slate-800/70"
                placeholder="0.000"
              />
            </div>
            
            <div className="lg:col-span-2">
              <label className="block text-sm font-medium text-slate-300 mb-2">Note (optional)</label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full px-4 py-3 rounded-xl bg-slate-800/50 border border-slate-600/50 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all hover:bg-slate-800/70 placeholder:text-slate-500"
                placeholder="Add notes about this movement..."
              />
            </div>
          </div>

          <div className="mt-6 flex justify-end gap-3">
            {editingMovement && (
              <button
                onClick={() => {
                  setEditingMovement(null);
                  setQty("1");
                  setNote("");
                  setDate(new Date().toISOString().slice(0, 10));
                }}
                className="px-6 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-slate-300 hover:bg-slate-700/70 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
            )}
            <button
              onClick={editingMovement ? () => updateMovement(editingMovement) : createMovement}
              disabled={!qty.trim() || Number(qty) <= 0}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg shadow-blue-500/25 hover:shadow-xl hover:shadow-blue-500/40 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              {editingMovement ? "Update Movement" : "Record Movement"}
            </button>
          </div>
        </section>

        {/* Movement History */}
        <section className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl sm:rounded-3xl border border-slate-700/50 p-6 sm:p-8 backdrop-blur-xl shadow-xl">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 shadow-lg shadow-orange-500/25">
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                <Calendar className="h-6 w-6 text-orange-400 relative z-10" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-white">Movement History</h2>
                <p className="text-slate-400 text-sm">Complete stock movement records</p>
              </div>
            </div>
          </div>

          <div className="space-y-3 max-h-96 overflow-y-auto scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-700/30 hover:scrollbar-thumb-slate-600/50">
            {movements.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-slate-700/50 to-slate-600/50 flex items-center justify-center">
                  <Calendar className="h-8 w-8 text-slate-400" />
                </div>
                <p className="text-slate-400">No movements recorded yet</p>
                <p className="text-slate-500 text-sm mt-1">Start by recording your first stock movement</p>
              </div>
            ) : (
              movements.map((movement) => (
                <div
                  key={movement.id}
                  className="group relative overflow-hidden rounded-2xl border border-slate-700/50 bg-gradient-to-br from-slate-800/50 to-slate-900/50 p-4 transition-all duration-300 hover:shadow-lg hover:border-slate-600/50"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-xl ${
                        movement.type === 'IN' 
                          ? 'bg-gradient-to-br from-emerald-500/20 to-green-500/20' 
                          : 'bg-gradient-to-br from-rose-500/20 to-red-500/20'
                      }`}>
                        {movement.type === 'IN' ? (
                          <TrendingUp className="h-4 w-4 text-emerald-400" />
                        ) : (
                          <TrendingDown className="h-4 w-4 text-rose-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`font-semibold ${
                            movement.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {movement.type === 'IN' ? '+' : '-'}{Number(movement.quantity).toFixed(3)}
                          </span>
                          <span className="text-slate-400 text-sm">
                            {new Date(movement.movement_date).toLocaleDateString()}
                          </span>
                        </div>
                        {movement.note && (
                          <p className="text-slate-500 text-sm mt-1">{movement.note}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingMovement(movement.id);
                          setType(movement.type);
                          setDate(movement.movement_date);
                          setQty(movement.quantity.toString());
                          setNote(movement.note || "");
                        }}
                        className="p-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-slate-700/70 hover:text-white transition-all duration-300"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => deleteMovement(movement.id)}
                        className="p-2 rounded-lg bg-slate-700/50 border border-slate-600/50 text-slate-400 hover:bg-rose-500/20 hover:border-rose-500/30 hover:text-rose-400 transition-all duration-300"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Add fadeInUp animation */}
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
          
          /* Thin invisible scrollbar */
          .scrollbar-thin::-webkit-scrollbar {
            width: 4px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-track {
            background: transparent;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb {
            background: rgba(148, 163, 184, 0.3);
            border-radius: 2px;
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb:hover {
            background: rgba(148, 163, 184, 0.5);
          }
          
          .scrollbar-thin::-webkit-scrollbar-thumb:active {
            background: rgba(148, 163, 184, 0.7);
          }
        `}</style>
      </div>
    </AppShell>
  );
}

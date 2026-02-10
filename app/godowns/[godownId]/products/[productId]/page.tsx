"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { use, useEffect, useMemo, useCallback, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";
import { Trash2 } from "lucide-react";

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
      <div className="space-y-6">
        {/* Today's Stock Summary */}
        <div className="rounded-2xl border app-border app-surface p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold">Today&apos;s Stock Summary</h2>
              <div className="text-xs text-subtle">
                {product.name} {product.sku ? `(SKU: ${product.sku})` : ""}
              </div>
            </div>
            <Link
              href={`/godowns/${godownId}`}
              className="text-xs text-subtle hover:underline"
            >
              ← Back to Godown
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <div className="text-xs font-medium text-subtle">Today&apos;s Opening</div>
              <div className="text-2xl font-bold text-blue-600">
                {todayOpeningStock.toFixed(3)}
              </div>
              <div className="text-xs text-subtle">
                Yesterday&apos;s closing stock
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-subtle">Today&apos;s IN</div>
              <div className="text-2xl font-bold text-green-600">
                +{todayIn.toFixed(3)}
              </div>
              <div className="text-xs text-subtle">
                Stock received today
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-subtle">Today&apos;s OUT</div>
              <div className="text-2xl font-bold text-red-600">
                -{todayOut.toFixed(3)}
              </div>
              <div className="text-xs text-subtle">
                Stock issued today
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="text-xs font-medium text-subtle">Current Stock</div>
              <div className="text-2xl font-bold text-foreground">
                {(todayOpeningStock + todayIn - todayOut).toFixed(3)}
              </div>
              <div className="text-xs text-subtle">
                Real-time remaining stock
              </div>
            </div>
          </div>
        </div>

        {/* Movement Form */}
        <div className="rounded-2xl border app-border app-surface p-6">
          <h2 className="text-lg font-semibold mb-4">
            {editingMovement ? "Edit Stock Movement" : "Record Stock Movement"}
          </h2>

          <div className="grid gap-4 md:grid-cols-5">
            <div>
              <label className="block text-xs font-medium mb-1">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as "IN" | "OUT")}
                className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
              >
                <option value="IN">Stock IN</option>
                <option value="OUT">Stock OUT</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Quantity</label>
              <input
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                inputMode="decimal"
                className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-medium mb-1">Note</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="w-full rounded-lg border app-border app-surface px-3 py-2 text-sm"
                placeholder="Optional note…"
              />
            </div>
          </div>
          
          <div className="mt-4 flex justify-end gap-2">
            {editingMovement && (
              <button
                onClick={() => setEditingMovement(null)}
                className="rounded-lg bg-gray-500 px-4 py-2 text-sm font-medium text-white hover:bg-gray-600"
              >
                Cancel
              </button>
            )}
            <button
              onClick={editingMovement ? () => updateMovement(editingMovement) : createMovement}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-600"
            >
              {editingMovement ? "Update Movement" : "Record Movement"}
            </button>
          </div>
        </div>

        {/* Movement History */}
        <div className="rounded-2xl border app-border app-surface overflow-hidden">
          <div className="px-4 py-3 border-b app-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Movement History</h2>
            <span className="text-[11px] text-subtle">
              {movements.length} entries
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/50">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium text-subtle">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-subtle">Type</th>
                  <th className="px-3 py-2 text-right text-xs font-medium text-subtle">Quantity</th>
                  <th className="px-3 py-2 text-left text-xs font-medium text-subtle">Note</th>
                  <th className="px-3 py-2 text-center text-xs font-medium text-subtle">Delete</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-subtle"
                    >
                      No movements recorded yet. Add your first movement above.
                    </td>
                  </tr>
                ) : (
                  movements
                    .slice()
                    .reverse()
                    .map((m) => (
                      <tr key={m.id} className="border-b app-border hover:bg-slate-200/40">
                        <td className="px-3 py-2">
                          {String(m.movement_date).slice(0, 10)}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`inline-flex rounded-full px-2 py-0.5 text-[11px] border ${
                              m.type === "IN"
                                ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                                : "border-rose-200 bg-rose-50 text-rose-700"
                            }`}
                          >
                            {m.type}
                          </span>
                        </td>
                        <td className="px-3 py-2 text-right">
                          {Number(m.quantity).toFixed(3)}
                        </td>
                        <td className="px-3 py-2 text-subtle">
                          {m.note || "-"}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => deleteMovement(m.id)}
                              className="p-1 rounded hover:bg-red-100"
                              title="Delete movement"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  );
}

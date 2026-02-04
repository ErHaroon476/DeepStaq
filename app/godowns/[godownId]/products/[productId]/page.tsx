"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";

type Movement = {
  id: string;
  movement_date: string;
  type: "IN" | "OUT";
  quantity: number;
  note: string | null;
  created_at: string;
};

export default function ProductDetailPage({
  params,
}: {
  params: { godownId: string; productId: string };
}) {
  const { user } = useAuth();
  const godownId = params.godownId;
  const productId = params.productId;

  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [movements, setMovements] = useState<Movement[]>([]);

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

  const load = async () => {
    if (!headers) return;
    try {
      setLoading(true);
      const res = await fetch(`/api/stock-movements?productId=${productId}`, {
        headers,
      });
      if (!res.ok) throw new Error(await res.text());
      setMovements(await res.json());
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to load movements");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!headers) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, productId]);

  const currentBalance = movements.reduce((acc, m) => {
    const q = Number(m.quantity);
    return m.type === "IN" ? acc + q : acc - q;
  }, 0);

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
      toast.success("Stock updated");
      setQty("1");
      setNote("");
      await load();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create movement");
    }
  };

  return (
    <div className="app-shell">
      <div className="px-4 md:px-8 py-6 space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <Link
              href={`/godowns/${godownId}`}
              className="text-xs text-subtle hover:underline"
            >
              ← Back to Godown
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Product stock operations
            </h1>
            <p className="text-xs text-subtle">
              Record IN/OUT on any date. System blocks negative stock.
            </p>
          </div>
          <div className="rounded-2xl border app-border app-surface px-4 py-3">
            <p className="text-[11px] uppercase tracking-wide text-subtle">
              Current balance
            </p>
            <p className="mt-1 text-lg font-semibold">
              {loading ? "…" : currentBalance.toFixed(3)}
            </p>
          </div>
        </div>

        <div className="rounded-2xl border app-border app-surface p-4">
          <div className="grid gap-3 md:grid-cols-5">
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
          <div className="mt-3 flex justify-end">
            <button
              onClick={createMovement}
              className="rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
            >
              Save entry
            </button>
          </div>
        </div>

        <div className="rounded-2xl border app-border app-surface overflow-hidden">
          <div className="px-4 py-3 border-b app-border flex items-center justify-between">
            <h2 className="text-sm font-semibold">Movement history</h2>
            <span className="text-[11px] text-subtle">
              {movements.length} entries
            </span>
          </div>
          <table className="min-w-full text-xs">
            <thead className="border-b app-border">
              <tr>
                <th className="px-3 py-2 text-left font-semibold text-subtle">
                  Date
                </th>
                <th className="px-3 py-2 text-left font-semibold text-subtle">
                  Type
                </th>
                <th className="px-3 py-2 text-right font-semibold text-subtle">
                  Qty
                </th>
                <th className="px-3 py-2 text-left font-semibold text-subtle">
                  Note
                </th>
              </tr>
            </thead>
            <tbody>
              {movements.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-3 py-6 text-center text-subtle"
                  >
                    No movements yet. Add your first IN/OUT entry above.
                  </td>
                </tr>
              ) : (
                movements
                  .slice()
                  .reverse()
                  .map((m) => (
                    <tr key={m.id} className="border-b app-border">
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
                        {m.note ?? "-"}
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}


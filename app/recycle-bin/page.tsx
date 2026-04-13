"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { RotateCcw, Trash2, Archive } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { useAuth } from "@/components/providers/auth-provider";

type DeletedProduct = {
  id: string;
  name: string;
  sku: string | null;
  deleted_at: string;
  companies?: { name: string } | null;
  unit_types?: { name: string } | null;
};

type DeletedInvoice = {
  id: string;
  invoice_no: string;
  type: "IN" | "OUT";
  invoice_date: string;
  note: string | null;
  deleted_at: string;
};

export default function RecycleBinPage() {
  const { user } = useAuth();
  const [idToken, setIdToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [products, setProducts] = useState<DeletedProduct[]>([]);
  const [invoices, setInvoices] = useState<DeletedInvoice[]>([]);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(setIdToken).catch(() => {
      toast.error("Failed to get auth token");
    });
  }, [user]);

  const loadRecycleBin = async () => {
    if (!idToken) return;
    try {
      setLoading(true);
      const res = await fetch("/api/recycle-bin", {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setProducts(data.products ?? []);
      setInvoices(data.invoices ?? []);
    } catch {
      toast.error("Failed to load recycle bin");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRecycleBin();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idToken]);

  const restoreProduct = async (id: string) => {
    if (!idToken) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/recycle-bin/products/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setProducts((prev) => prev.filter((x) => x.id !== id));
      toast.success("Product restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restore product");
    } finally {
      setBusyId(null);
    }
  };

  const removeProductForever = async (id: string) => {
    if (!idToken) return;
    const ok = window.confirm("Delete this product permanently? This cannot be undone.");
    if (!ok) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/recycle-bin/products/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setProducts((prev) => prev.filter((x) => x.id !== id));
      toast.success("Product permanently deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product permanently");
    } finally {
      setBusyId(null);
    }
  };

  const restoreInvoice = async (id: string) => {
    if (!idToken) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/recycle-bin/invoices/${id}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setInvoices((prev) => prev.filter((x) => x.id !== id));
      toast.success("Invoice restored");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to restore invoice");
    } finally {
      setBusyId(null);
    }
  };

  const removeInvoiceForever = async (id: string) => {
    if (!idToken) return;
    const ok = window.confirm("Delete this invoice permanently? This cannot be undone.");
    if (!ok) return;
    try {
      setBusyId(id);
      const res = await fetch(`/api/recycle-bin/invoices/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      setInvoices((prev) => prev.filter((x) => x.id !== id));
      toast.success("Invoice permanently deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete invoice permanently");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <AppShell>
      <div className="space-y-6">
        <header className="rounded-2xl border border-slate-700/50 bg-gradient-to-r from-slate-900 to-slate-800 p-5 sm:p-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">Recycle Bin</h1>
              <p className="text-sm text-slate-300 mt-1">
                Restore deleted products/invoices or remove them permanently.
              </p>
            </div>
            <button
              onClick={loadRecycleBin}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-600/50 bg-slate-800/60 px-4 py-2 text-sm text-slate-200 hover:bg-slate-700/60"
            >
              <Archive className="h-4 w-4" />
              Refresh
            </button>
          </div>
        </header>

        {loading ? (
          <div className="rounded-2xl border border-slate-700/50 bg-slate-900/70 p-8 text-center text-slate-300">
            Loading recycle bin...
          </div>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            <section className="rounded-2xl border border-slate-700/50 bg-slate-900/70">
              <div className="border-b border-slate-700/50 px-5 py-4">
                <h2 className="text-white font-semibold">Deleted Products ({products.length})</h2>
              </div>
              <div className="max-h-[60vh] overflow-auto divide-y divide-slate-700/40">
                {products.length === 0 ? (
                  <div className="p-5 text-sm text-slate-400">No deleted products.</div>
                ) : (
                  products.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="text-sm font-medium text-slate-100">{item.name}</div>
                      <div className="mt-1 text-xs text-slate-400">
                        {item.companies?.name ?? "Unknown company"} | {item.unit_types?.name ?? "-"} | SKU: {item.sku ?? "-"}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Deleted: {new Date(item.deleted_at).toLocaleString()}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => restoreProduct(item.id)}
                          disabled={busyId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                        <button
                          onClick={() => removeProductForever(item.id)}
                          disabled={busyId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete forever
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>

            <section className="rounded-2xl border border-slate-700/50 bg-slate-900/70">
              <div className="border-b border-slate-700/50 px-5 py-4">
                <h2 className="text-white font-semibold">Deleted Invoices ({invoices.length})</h2>
              </div>
              <div className="max-h-[60vh] overflow-auto divide-y divide-slate-700/40">
                {invoices.length === 0 ? (
                  <div className="p-5 text-sm text-slate-400">No deleted invoices.</div>
                ) : (
                  invoices.map((item) => (
                    <div key={item.id} className="p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-slate-100">
                        <span>{item.invoice_no}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                            item.type === "IN"
                              ? "bg-emerald-500/20 text-emerald-300"
                              : "bg-rose-500/20 text-rose-300"
                          }`}
                        >
                          {item.type}
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        Invoice date: {new Date(item.invoice_date).toLocaleDateString()}
                      </div>
                      <div className="mt-1 text-xs text-slate-500">
                        Deleted: {new Date(item.deleted_at).toLocaleString()}
                      </div>
                      <div className="mt-3 flex flex-wrap gap-2">
                        <button
                          onClick={() => restoreInvoice(item.id)}
                          disabled={busyId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/20 px-3 py-1.5 text-xs text-emerald-300 hover:bg-emerald-500/30 disabled:opacity-50"
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </button>
                        <button
                          onClick={() => removeInvoiceForever(item.id)}
                          disabled={busyId === item.id}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-rose-500/20 px-3 py-1.5 text-xs text-rose-300 hover:bg-rose-500/30 disabled:opacity-50"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          Delete forever
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </section>
          </div>
        )}
      </div>
    </AppShell>
  );
}

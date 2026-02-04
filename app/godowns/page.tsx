"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import toast from "react-hot-toast";
import { Pencil, Plus } from "lucide-react";
import { LogoutButton } from "@/components/ui/logout-button";
import Link from "next/link";

type Godown = {
  id: string;
  name: string;
  description: string | null;
  created_at: string;
};

export default function GodownsPage() {
  const { user } = useAuth();
  const [idToken, setIdToken] = useState<string | null>(null);
  const [items, setItems] = useState<Godown[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState<Godown | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(setIdToken).catch(() => {
      toast.error("Failed to get auth token");
    });
  }, [user]);

  useEffect(() => {
    if (!idToken) return;
    const load = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/godowns", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = await res.json();
        setItems(data);
      } catch (err) {
        toast.error("Failed to load godowns");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [idToken]);

  const handleCreate = async () => {
    if (!name.trim() || !idToken) return;
    try {
      const res = await fetch("/api/godowns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ name: name.trim(), description }),
      });
      if (!res.ok) throw new Error(await res.text());
      const created = await res.json();
      setItems((prev) => [...prev, created]);
      setName("");
      setDescription("");
      setOpen(false);
      toast.success("Godown created");
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to create godown",
      );
    }
  };

  const openEdit = (g: Godown) => {
    setEditing(g);
    setName(g.name);
    setDescription(g.description ?? "");
    setEditOpen(true);
  };

  const handleRename = async () => {
    if (!editing || !name.trim() || !idToken) return;
    try {
      const res = await fetch(`/api/godowns/${editing.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description || null,
        }),
      });
      if (!res.ok) throw new Error(await res.text());
      const updated = (await res.json()) as Godown;
      setItems((prev) => prev.map((x) => (x.id === updated.id ? updated : x)));
      setEditOpen(false);
      setEditing(null);
      setName("");
      setDescription("");
      toast.success("Godown updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to update godown");
    }
  };

  return (
    <div className="app-shell flex">
      {/* Sidebar for consistent SaaS layout */}
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
          <a
            href="/dashboard"
            className="sidebar-link block rounded-lg px-3 py-2"
          >
            Dashboard
          </a>
          <a
            href="/godowns"
            className="sidebar-link-active flex items-center justify-between rounded-lg px-3 py-2"
          >
            <span>Godowns & Products</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </a>
          <a
            href="/reports"
            className="sidebar-link block rounded-lg px-3 py-2"
          >
            Reports & Exports
          </a>
        </nav>
        <div className="mt-auto pt-4 border-t app-border">
          <div className="pb-2">
            <LogoutButton />
          </div>
          <div className="pt-3 text-[11px] text-subtle">
            Configure warehouses, units, and companies.
          </div>
        </div>
      </aside>

      <div className="flex-1 px-4 md:px-8 py-6">
        <header className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Godowns</h1>
            <p className="text-xs text-slate-400">
              Define all warehouse locations and their unit conventions.
            </p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-1 rounded-lg bg-indigo-500 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-600"
          >
            <Plus className="h-3 w-3" />
            Add Godown
          </button>
        </header>

        <main>
          {loading ? (
            <p className="text-sm text-slate-400">Loading...</p>
          ) : items.length === 0 ? (
            <div className="rounded-2xl border border-dashed app-border app-surface p-6 text-center text-sm text-subtle">
              No godowns yet. Create your first warehouse to start tracking
              inventory.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((g) => (
                <div
                  key={g.id}
                  className="rounded-2xl border app-border app-surface p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/godowns/${g.id}`}
                        className="block text-sm font-semibold truncate hover:underline"
                      >
                        {g.name}
                      </Link>
                      <p className="mt-1 text-[11px] text-subtle">
                        Open to manage companies, products, and stock movements.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => openEdit(g)}
                      className="inline-flex h-8 w-8 items-center justify-center rounded-full border app-border app-surface hover:bg-slate-200/60"
                      aria-label="Rename godown"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </div>
                  {g.description && (
                    <p className="mt-1 text-xs text-slate-400">
                      {g.description}
                    </p>
                  )}
                  <p className="mt-2 text-[11px] text-slate-500">
                    Created {new Date(g.created_at).toLocaleString()}
                  </p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-sm font-semibold text-slate-100 mb-3">
              New Godown
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  placeholder="Main Warehouse"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                  placeholder="Short note about this godown..."
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

      {editOpen && editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <h2 className="text-sm font-semibold text-slate-100 mb-3">
              Rename Godown
            </h2>
            <div className="space-y-3 text-sm">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
            </div>
            <div className="mt-4 flex justify-end gap-2 text-xs">
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                  setName("");
                  setDescription("");
                }}
                className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-200 hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                className="rounded-lg bg-indigo-500 px-3 py-1.5 font-medium text-white hover:bg-indigo-600"
              >
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


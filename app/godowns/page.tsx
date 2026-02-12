"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import toast from "react-hot-toast";
import { Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/layout/app-shell";

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
      } catch {
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

  const handleDelete = async (g: Godown) => {
    console.log("Delete button clicked for godown:", g.name, g.id);
    if (!idToken) return;
    const ok = window.confirm(`Delete godown "${g.name}"? This cannot be undone.`);
    if (!ok) return;

    try {
      const res = await fetch(`/api/godowns/${g.id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${idToken}`,
        },
      });
      
      if (!res.ok) {
        throw new Error(await res.text());
      }
      
      setItems((prev) => prev.filter((x) => x.id !== g.id));
      toast.success("Godown deleted");
    } catch (err) {
      console.error("Delete error:", err);
      toast.error(err instanceof Error ? err.message : "Failed to delete godown");
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
    <AppShell>
      <div className="space-y-8">
        {/* Hero Section */}
        <header className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-600/10 via-blue-600/10 to-cyan-600/10 rounded-3xl"></div>
          <div className="relative bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl p-4 sm:p-8 border border-slate-700/50 backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="space-y-3 lg:space-y-4">
                <div className="flex items-center gap-3 lg:gap-4">
                  <div className="w-2 h-12 lg:w-3 lg:h-16 bg-gradient-to-b from-purple-500 via-blue-400 to-cyan-400 rounded-full"></div>
                  <div>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">
                      Warehouse Hub
                    </h1>
                    <p className="text-slate-300 text-sm sm:text-base lg:text-lg mt-1 lg:mt-2">
                      Manage all warehouse locations, units, companies and inventory operations
                    </p>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                    <span className="text-slate-400 text-xs sm:text-sm">{items.length} Active Locations</span>
                  </div>
                  <div className="hidden sm:block text-slate-500 text-sm">|</div>
                  <span className="text-slate-400 text-xs sm:text-sm">
                    Total Capacity: Unlimited
                  </span>
                </div>
              </div>
              
              <button
                onClick={() => setOpen(true)}
                className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-4 py-2 sm:px-6 sm:py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 flex items-center gap-2 w-full sm:w-auto justify-center"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="h-4 w-4 sm:h-5 sm:w-5" />
                  Add Warehouse
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <div className="w-16 h-16 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin"></div>
              <p className="text-slate-400 mt-4">Loading warehouses...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-3xl border border-slate-700/50 p-12 text-center backdrop-blur-xl">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-purple-500/20 to-blue-500/20 flex items-center justify-center">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-500 animate-pulse"></div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">No Warehouses Yet</h3>
              <p className="text-slate-400 mb-6 max-w-md mx-auto">
                Create your first warehouse location to start organizing inventory, managing products, and tracking stock movements across your operations.
              </p>
              <button
                onClick={() => setOpen(true)}
                className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 inline-flex items-center gap-2"
              >
                <span className="relative z-10 flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create First Warehouse
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          ) : (
            <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
              {items.map((g, index) => (
                <div
                  key={g.id}
                  className="group relative overflow-hidden rounded-2xl sm:rounded-3xl border border-slate-700/50 bg-gradient-to-br from-slate-900/90 to-slate-800/90 p-4 sm:p-6 transition-all duration-500 hover:shadow-2xl hover:scale-[1.02] hover:-translate-y-1 backdrop-blur-xl"
                  style={{
                    animationDelay: `${index * 100}ms`,
                    animation: 'fadeInUp 0.6s ease-out forwards'
                  }}
                >
                  {/* Animated gradient background */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 via-blue-500/10 to-cyan-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  {/* Floating particles effect */}
                  <div className="absolute inset-0 overflow-hidden opacity-0 group-hover:opacity-20 transition-opacity duration-1000">
                    <div className="absolute top-1/4 left-1/4 w-1 h-1 bg-white rounded-full animate-ping"></div>
                    <div className="absolute top-3/4 right-1/4 w-1 h-1 bg-white rounded-full animate-ping" style={{animationDelay: '0.5s'}}></div>
                  </div>
                  
                  <div className="relative">
                    <div className="flex items-start justify-between gap-3 sm:gap-4 mb-4">
                      <div className="flex-1 min-w-0">
                        <Link
                          href={`/godowns/${g.id}`}
                          className="group/link block"
                        >
                          <h3 className="text-lg sm:text-xl font-bold text-white mb-2 truncate group-hover/link:text-blue-400 transition-colors duration-300">
                            {g.name}
                          </h3>
                        </Link>
                        <p className="text-slate-400 text-xs sm:text-sm leading-relaxed">
                          Central hub for managing companies, products, and all inventory operations.
                        </p>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity duration-300">
                        <button
                          type="button"
                          onClick={() => openEdit(g)}
                          className="group/btn relative p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300"
                          aria-label="Rename warehouse"
                        >
                          <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-blue-400" />
                          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"></div>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(g)}
                          className="group/btn relative p-1.5 sm:p-2 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 border border-red-500/30 hover:from-red-500/30 hover:to-orange-500/30 transition-all duration-300 z-10"
                          aria-label="Delete warehouse"
                          style={{ pointerEvents: 'auto' }}
                        >
                          <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-red-400" />
                          <div className="absolute inset-0 bg-gradient-to-br from-red-600 to-orange-600 rounded-xl opacity-0 group-hover/btn:opacity-20 transition-opacity duration-300"></div>
                        </button>
                      </div>
                    </div>
                    
                    {g.description && (
                      <div className="mb-4 p-3 rounded-xl bg-slate-800/50 border border-slate-700/50">
                        <p className="text-slate-300 text-xs sm:text-sm italic">
                          &quot;{g.description}&quot;
                        </p>
                      </div>
                    )}
                    
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></div>
                          <span className="text-slate-400 text-xs">Active</span>
                        </div>
                        <div className="hidden sm:block text-slate-600 text-sm">|</div>
                        <span className="text-slate-400 text-xs">
                          Created {new Date(g.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      <Link
                        href={`/godowns/${g.id}`}
                        className="group/link relative inline-flex items-center gap-2 px-3 py-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-blue-300 text-xs sm:text-sm font-medium hover:from-blue-500/30 hover:to-purple-500/30 transition-all duration-300 w-full sm:w-auto justify-center"
                      >
                        <span className="relative z-10">Manage</span>
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl opacity-0 group-hover/link:opacity-30 transition-opacity duration-300"></div>
                      </Link>
                    </div>
                  </div>
                  
                  {/* Decorative corner elements */}
                  <div className="absolute top-3 right-3 w-8 h-8 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="absolute bottom-3 left-3 w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-gradient-to-tl from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" style={{animationDelay: '0.2s'}}></div>
                </div>
              ))}
            </div>
          )}
        </main>

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
      </div>

      {/* Create Modal */}
      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-3xl border border-slate-700/50 p-8 shadow-2xl backdrop-blur-xl transform transition-all duration-300 scale-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 shadow-lg shadow-purple-500/25">
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                <Plus className="h-6 w-6 text-purple-400 relative z-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Create New Warehouse</h2>
                <p className="text-slate-400 text-sm">Add a new location to your inventory network</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Warehouse Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm transition-all duration-300"
                  placeholder="Main Warehouse"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-purple-500/50 focus:ring-2 focus:ring-purple-500/20 backdrop-blur-sm transition-all duration-300 resize-none"
                  rows={3}
                  placeholder="Short note about this warehouse location..."
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setOpen(false)}
                className="px-6 py-2.5 rounded-xl border border-slate-600/50 text-slate-300 hover:bg-slate-700/50 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={!name.trim()}
                className="group relative bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10">Create Warehouse</span>
                <div className="absolute inset-0 bg-gradient-to-r from-purple-700 to-blue-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editOpen && editing && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-gradient-to-br from-slate-900/95 to-slate-800/95 rounded-3xl border border-slate-700/50 p-8 shadow-2xl backdrop-blur-xl transform transition-all duration-300 scale-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="relative p-3 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 shadow-lg shadow-blue-500/25">
                <div className="absolute inset-0 bg-white/20 rounded-2xl animate-pulse"></div>
                <Pencil className="h-6 w-6 text-blue-400 relative z-10" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Update Warehouse</h2>
                <p className="text-slate-400 text-sm">Edit warehouse details and information</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Warehouse Name
                </label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-2">
                  Description (optional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full rounded-xl border border-slate-600/50 bg-slate-800/50 px-4 py-3 text-white placeholder-slate-500 outline-none focus:border-blue-500/50 focus:ring-2 focus:ring-blue-500/20 backdrop-blur-sm transition-all duration-300 resize-none"
                  rows={3}
                />
              </div>
            </div>
            
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => {
                  setEditOpen(false);
                  setEditing(null);
                  setName("");
                  setDescription("");
                }}
                className="px-6 py-2.5 rounded-xl border border-slate-600/50 text-slate-300 hover:bg-slate-700/50 transition-all duration-300 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRename}
                disabled={!name.trim()}
                className="group relative bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold px-6 py-2.5 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                <span className="relative z-10">Save Changes</span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-purple-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
              </button>
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}


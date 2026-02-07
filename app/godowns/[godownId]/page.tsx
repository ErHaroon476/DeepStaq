"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { use, useEffect, useMemo, useState } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";

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

  const [activeTab, setActiveTab] = useState<
    "overview" | "units" | "companies" | "products"
  >("overview");

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
      toast.error(e instanceof Error ? e.message : "Failed to load godown data");
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
      toast.success("Unit updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update unit");
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
      toast.success("Unit deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete unit");
    }
  };

  useEffect(() => {
    if (!headers) return;
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headers, godownId]);

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
      toast.success("Unit added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add unit");
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
      toast.success("Company added");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to add company");
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
      toast.success("Company updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update company");
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
      toast.success("Company deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete company");
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
      toast.success("Product created");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to create product");
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
      toast.success("Product updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to update product");
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
      toast.success("Product deleted");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Failed to delete product");
    }
  };

  return (
    <AppShell title="Godown" subtitle="Units, companies, products">
      <div>
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <Link href="/godowns" className="text-xs text-subtle hover:underline">
              ← Back to Godowns
            </Link>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">
              Godown workspace
            </h1>
            <p className="text-xs text-subtle">
              Add units, companies and products — then open a product to record
              daily stock IN/OUT.
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 text-xs mb-6">
          {(["overview", "units", "companies", "products"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`rounded-full px-3 py-1 border ${
                activeTab === t
                  ? "border-indigo-500 bg-indigo-500/10 text-indigo-600"
                  : "app-border text-subtle hover:bg-slate-200/60"
              }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-2xl border app-border app-surface p-4">
              <p className="text-[11px] uppercase tracking-wide text-subtle">
                Units
              </p>
              <p className="mt-1 text-xl font-semibold">{units.length}</p>
            </div>
            <div className="rounded-2xl border app-border app-surface p-4">
              <p className="text-[11px] uppercase tracking-wide text-subtle">
                Companies
              </p>
              <p className="mt-1 text-xl font-semibold">{companies.length}</p>
            </div>
            <div className="rounded-2xl border app-border app-surface p-4">
              <p className="text-[11px] uppercase tracking-wide text-subtle">
                Products
              </p>
              <p className="mt-1 text-xl font-semibold">{products.length}</p>
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
                          <div className="flex items-center gap-2">
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
                    className="rounded-2xl border app-border app-surface p-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm font-semibold">{c.name}</div>
                      <div className="flex items-center gap-2">
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
            <div className="flex justify-between items-center">
              <h2 className="text-sm font-semibold">Products</h2>
              <button
                onClick={() => {
                  if (companies.length === 0 || units.length === 0) {
                    toast.error("Add at least 1 company and 1 unit type first");
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
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.length === 0 ? (
                    <tr>
                      <td
                        colSpan={3}
                        className="px-3 py-6 text-center text-subtle"
                      >
                        No products yet. Add units + company first, then create
                        products.
                      </td>
                    </tr>
                  ) : (
                    products.map((p) => (
                      <tr key={p.id} className="border-b app-border">
                        <td className="px-3 py-2">{p.name}</td>
                        <td className="px-3 py-2">{p.sku ?? "-"}</td>
                        <td className="px-3 py-2">
                          <div className="flex items-center gap-3">
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
    </AppShell>
  );
}

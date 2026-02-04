"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { LogoutButton } from "@/components/ui/logout-button";

type ReportType = "daily" | "weekly" | "monthly" | "yearly";

type ReportRow = {
  key: string;
  opening: number;
  in: number;
  out: number;
  closing: number;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [idToken, setIdToken] = useState<string | null>(null);
  const [type, setType] = useState<ReportType>("daily");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(setIdToken).catch(() => {
      toast.error("Failed to get auth token");
    });
  }, [user]);

  const load = async () => {
    if (!idToken || !from || !to) return;
    try {
      setLoading(true);
      const url = `/api/reports?type=${type}&from=${from}&to=${to}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${idToken}` },
      });
      if (!res.ok) throw new Error(await res.text());
      const data = (await res.json()) as { rows: ReportRow[] };
      setRows(data.rows);
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    if (!rows.length) return;
    const header = "Period,Opening,In,Out,Closing\n";
    const body = rows
      .map(
        (r) =>
          `${r.key},${r.opening.toFixed(3)},${r.in.toFixed(
            3,
          )},${r.out.toFixed(3)},${r.closing.toFixed(3)}`,
      )
      .join("\n");
    const blob = new Blob([header + body], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `deepstaq-${type}-report.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportExcel = () => {
    if (!rows.length) return;
    const worksheet = XLSX.utils.json_to_sheet(
      rows.map((r) => ({
        Period: r.key,
        Opening: r.opening,
        In: r.in,
        Out: r.out,
        Closing: r.closing,
      })),
    );
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Report");
    XLSX.writeFile(workbook, `deepstaq-${type}-report.xlsx`);
  };

  const exportPDF = () => {
    if (!rows.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("DeepStaq Inventory Report", 14, 16);
    doc.setFontSize(10);
    doc.text(`Type: ${type.toUpperCase()}`, 14, 22);

    const headers = ["Period", "Opening", "In", "Out", "Closing"];
    let y = 30;
    doc.setFontSize(9);
    doc.text(headers.join("  "), 14, y);
    y += 4;
    rows.forEach((r) => {
      const line = `${r.key}  ${r.opening.toFixed(3)}  ${r.in.toFixed(
        3,
      )}  ${r.out.toFixed(3)}  ${r.closing.toFixed(3)}`;
      doc.text(line, 14, y);
      y += 4;
    });

    doc.save(`deepstaq-${type}-report.pdf`);
  };

  return (
    <div className="app-shell flex">
      {/* Sidebar (same structure as dashboard for consistency) */}
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
            className="sidebar-link block rounded-lg px-3 py-2"
          >
            Godowns & Products
          </a>
          <a
            href="/reports"
            className="sidebar-link-active flex items-center justify-between rounded-lg px-3 py-2"
          >
            <span>Reports & Exports</span>
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </a>
        </nav>
        <div className="mt-auto pt-4 border-t app-border">
          <div className="pb-2">
            <LogoutButton />
          </div>
          <div className="pt-3 text-[11px] text-subtle">
            Designed for auditors and finance teams.
          </div>
        </div>
      </aside>

      <div className="flex-1 px-4 md:px-8 py-6">
        <header className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Reporting workspace</h1>
            <p className="text-xs text-subtle">
              Slice stock movements by period and export professionally formatted
              files.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <select
              value={type}
              onChange={(e) => setType(e.target.value as ReportType)}
              className="rounded-md border app-border app-surface px-2 py-1"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="rounded-md border app-border app-surface px-2 py-1"
            />
            <span>to</span>
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="rounded-md border app-border app-surface px-2 py-1"
            />
            <button
              onClick={load}
              className="rounded-md bg-indigo-500 px-3 py-1 font-medium text-white hover:bg-indigo-600"
            >
              {loading ? "Loading..." : "Generate report"}
            </button>
          </div>
        </header>

        <main className="space-y-4">
          <div className="flex flex-wrap gap-2 text-xs">
            <button
              onClick={exportCSV}
              className="rounded-md border app-border app-surface px-3 py-1 hover:bg-slate-200/60"
            >
              Export CSV
            </button>
            <button
              onClick={exportExcel}
              className="rounded-md border app-border app-surface px-3 py-1 hover:bg-slate-200/60"
            >
              Export Excel
            </button>
            <button
              onClick={exportPDF}
              className="rounded-md border app-border app-surface px-3 py-1 hover:bg-slate-200/60"
            >
              Export PDF
            </button>
          </div>

          <div className="overflow-hidden rounded-2xl border app-border app-surface">
            <table className="min-w-full text-xs">
              <thead className="bg-slate-900/80 border-b border-slate-800">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold text-slate-300">
                    Period
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-300">
                    Opening
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-300">
                    In
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-300">
                    Out
                  </th>
                  <th className="px-3 py-2 text-right font-semibold text-slate-300">
                    Closing
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-6 text-center text-slate-500"
                    >
                      No data. Choose a period and generate a report.
                    </td>
                  </tr>
                ) : (
                  rows.map((r) => (
                    <tr
                      key={r.key}
                      className="border-b border-slate-800/80 hover:bg-slate-900"
                    >
                      <td className="px-3 py-2">{r.key}</td>
                      <td className="px-3 py-2 text-right">
                        {r.opening.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.in.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.out.toFixed(3)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {r.closing.toFixed(3)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </div>
  );
}


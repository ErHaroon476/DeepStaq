"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import { AppShell } from "@/components/layout/app-shell";

type Godown = {
  id: string;
  name: string;
};

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
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [godowns, setGodowns] = useState<Godown[]>([]);
  const [godownId, setGodownId] = useState<string>("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;
    user.getIdToken().then(setIdToken).catch(() => {
      toast.error("Failed to get auth token");
    });
  }, [user]);

  useEffect(() => {
    if (!idToken) return;
    const loadGodowns = async () => {
      try {
        const res = await fetch("/api/godowns", {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        setGodowns((await res.json()) as Godown[]);
      } catch {
        toast.error("Failed to load godowns");
      }
    };
    loadGodowns();
  }, [idToken]);

  const load = async () => {
    if (!idToken || !from || !to) return;
    try {
      setLoading(true);
      const url = `/api/reports?type=monthly&from=${from}&to=${to}${
        godownId ? `&godownId=${encodeURIComponent(godownId)}` : ""
      }`;
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
    a.download = "deepstaq-monthly-report.csv";
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
    XLSX.writeFile(workbook, "deepstaq-monthly-report.xlsx");
  };

  const exportPDF = () => {
    if (!rows.length) return;
    const doc = new jsPDF();
    doc.setFontSize(14);
    doc.text("DeepStaq Inventory Report", 14, 16);
    doc.setFontSize(10);
    doc.text("Type: MONTHLY", 14, 22);

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

    doc.save("deepstaq-monthly-report.pdf");
  };

  return (
    <AppShell title="Reports" subtitle="Generate and export reports">
      <div>
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
              value={godownId}
              onChange={(e) => setGodownId(e.target.value)}
              className="rounded-md border app-border app-surface px-2 py-1"
            >
              <option value="">All Godowns</option>
              {godowns.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                </option>
              ))}
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
    </AppShell>
  );
}


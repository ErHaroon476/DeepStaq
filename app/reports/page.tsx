"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import jsPDF from "jspdf";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/firebase";

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

type CurrentStockRow = {
  productName: string;
  currentStock: number;
};

type ClosingStockRow = {
  productName: string;
  openingStock: number;
  closingStock: number;
};

export default function ReportsPage() {
  const { user } = useAuth();
  const [godowns, setGodowns] = useState<Array<{ id: string; name: string }>>([]);
  const [godownId, setGodownId] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [closingStockRows, setClosingStockRows] = useState<ClosingStockRow[]>([]);
  const [currentStockRows, setCurrentStockRows] = useState<CurrentStockRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [reportType, setReportType] = useState<"summary" | "closing" | "current">("summary");
  const [idToken, setIdToken] = useState("");

  useEffect(() => {
    if (!user) return;
    auth.currentUser?.getIdToken().then((token) => {
      setIdToken(token || "");
    }).catch(() => {
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
    if (!idToken) return;
    try {
      setLoading(true);
      
      if (reportType === "current") {
        // Load current stock report
        const url = `/api/reports/current-stock${
          godownId ? `?godownId=${encodeURIComponent(godownId)}` : ""
        }`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { rows: CurrentStockRow[] };
        setCurrentStockRows(data.rows);
        setRows([]); // Clear summary rows
        setClosingStockRows([]); // Clear closing stock rows
      } else if (reportType === "closing") {
        // Load closing stock report
        const url = `/api/reports/closing-stock?from=${from}&to=${to}${
          godownId ? `&godownId=${encodeURIComponent(godownId)}` : ""
        }`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { rows: ClosingStockRow[] };
        setClosingStockRows(data.rows);
        setRows([]); // Clear summary rows
        setCurrentStockRows([]); // Clear current stock rows
      } else {
        // Load summary report (existing functionality)
        const url = `/api/reports?type=daily&from=${from}&to=${to}${
          godownId ? `&godownId=${encodeURIComponent(godownId)}` : ""
        }`;
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error(await res.text());
        const data = (await res.json()) as { rows: ReportRow[] };
        setRows(data.rows);
        setClosingStockRows([]); // Clear closing stock rows
        setCurrentStockRows([]); // Clear current stock rows
      }
    } catch {
      toast.error("Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  const exportPDF = async () => {
    if (!rows.length && !closingStockRows.length && !currentStockRows.length) return;
    
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    
    // Set up fonts
    doc.setFont("helvetica");
    
    // Add DeepStaq logo from public folder
    try {
      const response = await fetch('/deepstaq.jpg');
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onload = function() {
        const base64Image = reader.result as string;
        
        // Add logo to PDF (small size, centered)
        const logoSize = 16;
        const logoX = (pageWidth - logoSize) / 2;
        doc.addImage(base64Image, 'JPEG', logoX, 5, logoSize, logoSize);
        
        // DeepStaq Branding Header (below logo)
        doc.setFontSize(12);
        doc.setTextColor(0, 217, 255); // #00d9ff color
        doc.text("DeepStaq", pageWidth / 2, 25, { align: "center" });
        
        doc.setFontSize(7);
        doc.setTextColor(100, 100, 100);
        doc.text("Inventory & Godown Suite", pageWidth / 2, 30, { align: "center" });
        
        // Report Title
        doc.setFontSize(11);
        doc.setTextColor(0, 51, 102);
        const reportTitle = reportType === "current" ? "Current Stock Report" 
          : reportType === "closing" ? "Closing Stock Report" 
          : "Inventory Report";
        doc.text(reportTitle, pageWidth / 2, 36, { align: "center" });
        
        // Continue with the rest of PDF generation
        generatePDFContent(doc, pageWidth, pageHeight);
      };
      
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Error loading logo:', error);
      // Fallback without logo
      generatePDFContent(doc, pageWidth, pageHeight);
    }
  };
  
  const generatePDFContent = (doc: jsPDF, pageWidth: number, pageHeight: number) => {
    // Compact Report Info Section
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    
    // Report details - more compact
    const selectedGodown = godowns.find(g => g.id === godownId);
    const godownName = selectedGodown ? selectedGodown.name : "All Godowns";
    
    let reportDetails = [];
    if (reportType === "current") {
      reportDetails = [`Godown: ${godownName} | Generated: ${new Date().toLocaleString()}`];
    } else {
      reportDetails = [`Godown: ${godownName} | Date Range: ${from} to ${to} | Generated: ${new Date().toLocaleString()}`];
    }
    
    let yPos = 42;
    reportDetails.forEach(detail => {
      doc.text(detail, pageWidth / 2, yPos, { align: "center", maxWidth: pageWidth - 40 });
      yPos += 6;
    });
    
    // Compact line separator
    doc.setDrawColor(200, 200, 200);
    doc.line(15, yPos, pageWidth - 15, yPos);
    yPos += 8;
    
    // Compact Table Headers
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(0, 0, 0);
    
    const headers = reportType === "current" 
      ? ["Product Name", "Current Stock"]
      : reportType === "closing" 
      ? ["Product Name", "Opening Stock", "Closing Stock"]
      : ["Product Name", "Opening", "IN", "OUT", "Closing"];
    
    const columnWidths = reportType === "current" 
      ? [80, 60]
      : reportType === "closing" 
      ? [60, 40, 40]
      : [35, 32, 32, 32, 32];
    
    const tableStartX = 15;
    const tableStartY = yPos;
    
    // Compact header background
    doc.setFillColor(245, 245, 245);
    doc.rect(tableStartX, tableStartY - 5, pageWidth - 30, 8, "F");
    
    // Draw headers - centered within each column
    let currentX = tableStartX;
    headers.forEach((header, index) => {
      const headerWidth = doc.getTextWidth(header);
      const columnCenter = currentX + (columnWidths[index] / 2);
      const centeredX = columnCenter - (headerWidth / 2);
      doc.text(header, centeredX, tableStartY);
      currentX += columnWidths[index];
    });
    
    // Compact table grid lines
    doc.setDrawColor(200, 200, 200);
    
    // Horizontal line after header
    doc.line(tableStartX, tableStartY + 3, pageWidth - 15, tableStartY + 3);
    
    // Compact Table Data
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    yPos = tableStartY + 8;
    
    const dataRows = reportType === "current" 
      ? currentStockRows 
      : reportType === "closing" ? closingStockRows : rows;
    
    dataRows.forEach((row, index) => {
      // Check if we need a new page (more compact threshold)
      if (yPos > pageHeight - 20) {
        doc.addPage();
        yPos = 15;
        
        // Redraw headers on new page (compact)
        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        doc.setFillColor(245, 245, 245);
        doc.rect(tableStartX, yPos - 5, pageWidth - 30, 8, "F");
        
        currentX = tableStartX;
        headers.forEach((header, colIndex) => {
          const headerWidth = doc.getTextWidth(header);
          const columnCenter = currentX + (columnWidths[colIndex] / 2);
          const centeredX = columnCenter - (headerWidth / 2);
          doc.text(header, centeredX, yPos);
          currentX += columnWidths[colIndex];
        });
        
        doc.setDrawColor(200, 200, 200);
        doc.line(tableStartX, yPos + 3, pageWidth - 15, yPos + 3);
        
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        yPos += 8;
      }
      
      // Draw row data
      currentX = tableStartX;
      let rowData;
      if (reportType === "current") {
        const currentRow = row as CurrentStockRow;
        rowData = [currentRow.productName, currentRow.currentStock.toFixed(3)];
      } else if (reportType === "closing") {
        const closingRow = row as ClosingStockRow;
        rowData = [closingRow.productName, closingRow.openingStock.toFixed(3), closingRow.closingStock.toFixed(3)];
      } else {
        const summaryRow = row as ReportRow;
        rowData = [summaryRow.key, summaryRow.opening.toFixed(3), summaryRow.in.toFixed(3), summaryRow.out.toFixed(3), summaryRow.closing.toFixed(3)];
      }
      
      // Subtle alternating row colors
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(tableStartX, yPos - 4, pageWidth - 30, 7, "F");
      }
      
      rowData.forEach((data, colIndex) => {
        // Center align all columns
        const textWidth = doc.getTextWidth(data);
        const columnCenter = currentX + (columnWidths[colIndex] / 2);
        const centeredX = columnCenter - (textWidth / 2);
        doc.text(data, centeredX, yPos);
        currentX += columnWidths[colIndex];
      });
      
      // Compact horizontal line after row
      doc.setDrawColor(235, 235, 235);
      doc.line(tableStartX, yPos + 3, pageWidth - 15, yPos + 3);
      
      yPos += 7; // Reduced row height
    });
    
    // Compact outer border
    doc.setDrawColor(150, 150, 150);
    doc.rect(tableStartX, tableStartY - 5, pageWidth - 30, yPos - tableStartY + 5);
    
    // Compact Summary Section (if space allows)
    if (yPos < pageHeight - 35) {
      yPos += 10;
      doc.setFontSize(9);
      doc.setFont("helvetica", "bold");
      doc.setTextColor(0, 0, 0);
      doc.text("Summary", tableStartX, yPos);
      
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8);
      yPos += 6;
      
      if (reportType === "current") {
        // Summary for current stock report
        const totalCurrentStock = currentStockRows.reduce((sum, row) => sum + row.currentStock, 0);
        const summaryText = `Total Products: ${currentStockRows.length} | Total Current Stock: ${totalCurrentStock.toFixed(3)}`;
        doc.text(summaryText, tableStartX, yPos);
      } else if (reportType === "closing") {
        // Summary for closing stock report
        const totalOpeningStock = closingStockRows.reduce((sum, row) => sum + row.openingStock, 0);
        const totalClosingStock = closingStockRows.reduce((sum, row) => sum + row.closingStock, 0);
        const summaryText = `Total Products: ${closingStockRows.length} | Total Opening Stock: ${totalOpeningStock.toFixed(3)} | Total Closing Stock: ${totalClosingStock.toFixed(3)}`;
        doc.text(summaryText, tableStartX, yPos);
      } else {
        // Summary for summary report
        const totalIn = rows.reduce((sum, row) => sum + row.in, 0);
        const totalOut = rows.reduce((sum, row) => sum + row.out, 0);
        const totalOpening = rows[0]?.opening || 0;
        const totalClosing = rows[rows.length - 1]?.closing || 0;
        
        const summaryText = `Opening: ${totalOpening.toFixed(3)} | IN: ${totalIn.toFixed(3)} | OUT: ${totalOut.toFixed(3)} | Closing: ${totalClosing.toFixed(3)}`;
        doc.text(summaryText, tableStartX, yPos);
      }
    }
    
    // Branded Footer
    const footerY = pageHeight - 10;
    doc.setFontSize(7);
    doc.setTextColor(128, 128, 128);
    doc.text("Generated by DeepStaq Inventory Management", pageWidth / 2, footerY, { align: "center" });
    
    const filename = reportType === "current" 
      ? "deepstaq-current-stock-report.pdf"
      : reportType === "closing" 
      ? "deepstaq-closing-stock-report.pdf"
      : "deepstaq-inventory-report.pdf";
    doc.save(filename);
  };

  return (
    <AppShell>
      <div className="space-y-6 sm:space-y-8">
        <header className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-xl border border-slate-700/50">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="w-2 h-8 bg-gradient-to-b from-blue-500 to-cyan-400 rounded-full"></div>
                <h1 className="text-2xl sm:text-3xl font-bold text-white">Reporting workspace</h1>
              </div>
              <p className="text-slate-300 text-sm sm:text-base max-w-2xl">
                Slice stock movements by period and export professionally formatted files with advanced filtering options.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 sm:gap-3">
              <div className="relative">
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value as "summary" | "closing" | "current")}
                  className="appearance-none bg-slate-800/50 border border-slate-600/50 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 pr-8 sm:pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all hover:bg-slate-800/70"
                >
                  <option value="summary">Stock IN/OUT Summary</option>
                  <option value="closing">Closing Stock Report</option>
                  <option value="current">Current Stock Report</option>
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              <div className="relative">
                <select
                  value={godownId}
                  onChange={(e) => setGodownId(e.target.value)}
                  className="appearance-none bg-slate-800/50 border border-slate-600/50 text-white rounded-lg px-3 py-2 sm:px-4 sm:py-2.5 pr-8 sm:pr-10 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 backdrop-blur-sm transition-all hover:bg-slate-800/70"
                >
                  <option value="">All Godowns</option>
                  {godowns.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </select>
                <div className="absolute inset-y-0 right-0 flex items-center pr-2 sm:pr-3 pointer-events-none">
                  <svg className="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              
              {reportType !== "current" && (
                <div className="flex items-center gap-2 bg-slate-800/30 border border-slate-600/30 rounded-lg px-3 py-2 w-full sm:w-auto justify-center">
                  <div className="relative">
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:text-white [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 min-w-0"
                    />
                  </div>
                  <span className="text-slate-400 text-sm font-medium">to</span>
                  <div className="relative">
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:text-white [&::-webkit-calendar-picker-indicator]:opacity-70 hover:[&::-webkit-calendar-picker-indicator]:opacity-100 min-w-0"
                    />
                  </div>
                </div>
              )}
              
              <button
                onClick={load}
                disabled={loading}
                className="group relative bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium px-4 py-2 sm:px-6 sm:py-2.5 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none w-full sm:w-auto justify-center"
              >
                <span className="relative z-10 flex items-center gap-2">
                  {loading ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                      </svg>
                      Loading...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                      Generate Report
                    </>
                  )}
                </span>
                <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-cyan-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
              </button>
            </div>
          </div>
        </header>

        <main className="space-y-6">
          <div className="bg-gradient-to-r from-slate-800/50 to-slate-700/50 rounded-xl p-4 border border-slate-600/30 backdrop-blur-sm">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300 text-sm font-medium">Export Options</span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={exportPDF}
                  disabled={!rows.length && !closingStockRows.length && !currentStockRows.length}
                  className="group relative bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export PDF
                  <div className="absolute inset-0 bg-gradient-to-r from-emerald-700 to-teal-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
                {/* Temporarily disabled other exports
                <button
                  onClick={exportCSV}
                  className="group relative bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m3-2h6" />
                  </svg>
                  Export CSV
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-700 to-indigo-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
                <button
                  onClick={exportExcel}
                  className="group relative bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium px-4 py-2 rounded-lg shadow-md hover:shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-2 text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v1a1 1 0 001 1h4a1 1 0 001-1v-1m3-2V8a2 2 0 00-2-2H8a2 2 0 00-2 2v6m3-2h6" />
                  </svg>
                  Export Excel
                  <div className="absolute inset-0 bg-gradient-to-r from-green-700 to-emerald-700 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
                </button>
                */}
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-br from-slate-900/90 to-slate-800/90 rounded-2xl border border-slate-700/50 shadow-xl backdrop-blur-sm overflow-hidden">
            <div className="bg-gradient-to-r from-blue-600/20 to-cyan-600/20 px-6 py-4 border-b border-slate-700/50">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                <h2 className="text-lg font-semibold text-white">
                  {reportType === "current" ? "Current Stock Report" 
                    : reportType === "closing" ? "Closing Stock Report" 
                    : "Stock IN/OUT Summary Report"}
                </h2>
                {rows.length > 0 && reportType === "summary" && (
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                    {rows.length} products
                  </span>
                )}
                {currentStockRows.length > 0 && reportType === "current" && (
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                    {currentStockRows.length} products
                  </span>
                )}
                {closingStockRows.length > 0 && reportType === "closing" && (
                  <span className="bg-blue-500/20 text-blue-300 px-2 py-1 rounded-full text-xs font-medium">
                    {closingStockRows.length} products
                  </span>
                )}
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-900/60 border-b border-slate-700/50">
                  <tr>
                    {reportType === "current" ? (
                      <>
                        <th className="px-6 py-4 text-left font-semibold text-slate-300 text-sm">
                          Product Name
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-slate-300 text-sm">
                          Current Stock
                        </th>
                      </>
                    ) : reportType === "closing" ? (
                      <>
                        <th className="px-6 py-4 text-left font-semibold text-slate-300 text-sm">
                          Product Name
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-slate-300 text-sm">
                          Opening Stock
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-slate-300 text-sm">
                          Closing Stock
                        </th>
                      </>
                    ) : (
                      <>
                        <th className="px-6 py-4 text-left font-semibold text-slate-300 text-sm">
                          Product Name
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-slate-300 text-sm">
                          Opening
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-slate-300 text-sm">
                          In
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-slate-300 text-sm">
                          Out
                        </th>
                        <th className="px-6 py-4 text-right font-semibold text-slate-300 text-sm">
                          Closing
                        </th>
                      </>
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/30">
                  {reportType === "current" ? (
                    currentStockRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={2}
                          className="px-6 py-12 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm">No data available. Choose a godown and generate a report.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      currentStockRows.map((row, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-800/50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 text-slate-200 font-medium">{row.productName}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                              {row.currentStock.toFixed(3)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  ) : reportType === "closing" ? (
                    closingStockRows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={3}
                          className="px-6 py-12 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm">No data available. Choose a period and generate a report.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      closingStockRows.map((row, index) => (
                        <tr
                          key={index}
                          className="hover:bg-slate-800/50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 text-slate-200 font-medium">{row.productName}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-600/20 text-slate-300">
                              {row.openingStock.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                              {row.closingStock.toFixed(3)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  ) : (
                    rows.length === 0 ? (
                      <tr>
                        <td
                          colSpan={5}
                          className="px-6 py-12 text-center text-slate-400"
                        >
                          <div className="flex flex-col items-center gap-3">
                            <svg className="w-12 h-12 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            <p className="text-sm">No data available. Choose a period and generate a report.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      rows.map((r) => (
                        <tr
                          key={r.key}
                          className="hover:bg-slate-800/50 transition-colors duration-150"
                        >
                          <td className="px-6 py-4 text-slate-200 font-medium">{r.key}</td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-slate-600/20 text-slate-300">
                              {r.opening.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-500/20 text-emerald-300">
                              {r.in.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-500/20 text-red-300">
                              {r.out.toFixed(3)}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-500/20 text-blue-300">
                              {r.closing.toFixed(3)}
                            </span>
                          </td>
                        </tr>
                      ))
                    )
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </AppShell>
  );
}


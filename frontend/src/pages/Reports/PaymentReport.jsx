import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { paymentApi } from "../../Api/paymentApi";
import { fetchAllMasters } from "../../Api/masterApi";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Printer: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Wallet: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" /><path d="M20 12v0a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2v-4h-2z" /></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  TrendingUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  Rupee: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8 8M14 8c0 2.76-2.24 5-5 5H6" /></svg>,
  Hash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" /></svg>,
};

/* ================================================================
   HELPERS
   ================================================================ */
const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtINR = (n) => "₹ " + fmtNum(n);
// 🆕 Local date (timezone-safe) — UTC convert hone ki vajah se aaj ki date kal banti thi (IST)
const isoDate = (d) => {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day   = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPresetRange = (preset) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today), to = new Date(today);
  switch (preset) {
    case "today": break;
    case "yesterday":
      from.setDate(today.getDate() - 1); to.setDate(today.getDate() - 1); break;
    case "this_week": {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      from.setDate(today.getDate() - diff); break;
    }
    case "this_month": from.setDate(1); break;
    case "last_month":
      from.setMonth(today.getMonth() - 1, 1); to.setDate(0); break;
    case "this_year": from.setMonth(0, 1); break;
    default: return { fromDate: "", toDate: "" };                  // 🔧 fixed keys
  }
  return { fromDate: isoDate(from), toDate: isoDate(to) };          // 🔧 fixed keys
};

const DATE_PRESETS = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "this_week", label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year", label: "This Year" },
  { key: "custom", label: "Custom" },
];

const PAYMENT_STATUSES = ["", "Partial", "Full", "Advance"];

const EMPTY_FILTERS = {
  fromDate: "", toDate: "",
  customer: "", paymentMode: "", company: "", status: "",
  search: "",
};

/* ================================================================
   MAIN
   ================================================================ */
export default function PaymentReport() {
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [masters, setMasters] = useState({ customers: [], paymentModes: [], companies: [] });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...getPresetRange("this_month") });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS, ...getPresetRange("this_month") });
  const [activePreset, setActivePreset] = useState("this_month");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const setF = (k, v) => setFilters({ ...filters, [k]: v });

  /* ──────── LOAD ──────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [paymentsData, mastersData] = await Promise.all([
          paymentApi.getAll(),
          fetchAllMasters(),
        ]);
        setPayments(paymentsData);
        setMasters({
          customers:    mastersData.customers || [],
          paymentModes: mastersData.paymentModes || [],
          companies:    mastersData.companies || [],
        });
      } catch (err) {
        alert("Failed to load: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ──────── FILTER LOGIC ──────── */
  const filteredPayments = useMemo(() => {
    let list = [...payments];

    if (appliedFilters.fromDate) {
      const from = new Date(appliedFilters.fromDate);
      from.setHours(0, 0, 0, 0);
      list = list.filter((p) => new Date(p.paymentDate || p.createdAt) >= from);
    }
    if (appliedFilters.toDate) {
      const to = new Date(appliedFilters.toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((p) => new Date(p.paymentDate || p.createdAt) <= to);
    }
    if (appliedFilters.customer) {
      list = list.filter((p) => (p.customer?._id || p.customer) === appliedFilters.customer);
    }
    if (appliedFilters.paymentMode) {
      list = list.filter((p) => (p.paymentMode?._id || p.paymentMode) === appliedFilters.paymentMode);
    }
    if (appliedFilters.company) {
      list = list.filter((p) => (p.company?._id || p.company) === appliedFilters.company);
    }
    if (appliedFilters.status) {
      list = list.filter((p) => p.status === appliedFilters.status);
    }
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      list = list.filter((p) =>
        (p.paymentId || "").toLowerCase().includes(q) ||
        (p.customer?.name || "").toLowerCase().includes(q) ||
        (p.sale?.invoiceNo || "").toLowerCase().includes(q) ||
        (p.referenceNo || "").toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => new Date(b.paymentDate || b.createdAt) - new Date(a.paymentDate || a.createdAt));
  }, [payments, appliedFilters]);

  /* ──────── SUMMARY ──────── */
  const summary = useMemo(() => {
    const totalPayments = filteredPayments.length;
    const totalReceived = filteredPayments.reduce((s, p) => s + (p.amountReceived || 0), 0);
    const totalOutstandingAfter = filteredPayments.reduce((s, p) => s + (p.outstandingAfter || 0), 0);
    const fullPayments = filteredPayments.filter((p) => p.status === "Full").length;
    const partialPayments = filteredPayments.filter((p) => p.status === "Partial").length;
    const advancePayments = filteredPayments.filter((p) => p.status === "Advance").length;

    // Payment mode breakdown
    const modeBreakdown = {};
    filteredPayments.forEach((p) => {
      const mode = p.paymentMode?.name || "Unknown";
      modeBreakdown[mode] = (modeBreakdown[mode] || 0) + (p.amountReceived || 0);
    });

    // Unique customers
    const uniqueCustomers = new Set(filteredPayments.map((p) => p.customer?._id || p.customer)).size;

    return {
      totalPayments, totalReceived, totalOutstandingAfter,
      fullPayments, partialPayments, advancePayments,
      modeBreakdown, uniqueCustomers,
    };
  }, [filteredPayments]);

  /* ──────── HANDLERS ──────── */
  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === "custom") return;
    const range = getPresetRange(preset);
    const newFilters = { ...filters, ...range };
    setFilters(newFilters);
    setAppliedFilters(newFilters);
  };

  const handleGenerate = () => {
    setAppliedFilters(filters);
    setActivePreset("custom");
  };

  const handleReset = () => {
    const range = getPresetRange("this_month");
    const reset = { ...EMPTY_FILTERS, ...range };
    setFilters(reset);
    setAppliedFilters(reset);
    setActivePreset("this_month");
  };

  const exportCSV = () => {
    if (filteredPayments.length === 0) return alert("No data to export");

    const headers = [
      "SR No.", "Payment ID", "Date", "Customer", "Invoice No",
      "Payment Mode", "Reference No", "Total Invoice", "Outstanding Before",
      "Amount Received", "Outstanding After", "Status",
    ];

    const rows = filteredPayments.map((p, idx) => [
      idx + 1,
      p.paymentId || "",
      formatDate(p.paymentDate || p.createdAt),
      p.customer?.name || "",
      p.sale?.invoiceNo || "",
      p.paymentMode?.name || "",
      p.referenceNo || "",
      p.totalInvoiceAmount || 0,
      p.outstandingBefore || 0,
      p.amountReceived || 0,
      p.outstandingAfter || 0,
      p.status || "",
    ]);

    rows.push([
      "", "", "", "", "", "", "TOTAL:",
      "", "",
      summary.totalReceived.toFixed(2),
      summary.totalOutstandingAfter.toFixed(2),
      "",
    ]);

    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => {
          const str = String(cell ?? "");
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",")
      ).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `payment-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* PAGINATION (screen table only — exportCSV above keeps using filteredPayments) */
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / ITEMS_PER_PAGE));

  const paginatedPayments = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredPayments.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredPayments, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [appliedFilters]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const dateRangeLabel = useMemo(() => {
    if (!appliedFilters.fromDate && !appliedFilters.toDate) return "All Time";
    if (appliedFilters.fromDate === appliedFilters.toDate) return formatDate(appliedFilters.fromDate);
    return `${formatDate(appliedFilters.fromDate)} — ${formatDate(appliedFilters.toDate)}`;
  }, [appliedFilters]);

  // Top mode (highest collection)
  const topMode = useMemo(() => {
    const entries = Object.entries(summary.modeBreakdown);
    if (entries.length === 0) return null;
    return entries.sort((a, b) => b[1] - a[1])[0];
  }, [summary.modeBreakdown]);

  return (
    <div className="prpt-page">
      {/* HEADER */}
      <div className="prpt-page__header no-print">
        <div>
          <h1 className="prpt-page__title">Payment Report</h1>
          <div className="prpt-breadcrumb">
            <span>Home</span>
            <span className="prpt-breadcrumb__sep">/</span>
            <span>Reports</span>
            <span className="prpt-breadcrumb__sep">/</span>
            <span className="prpt-breadcrumb__current">Payment Report</span>
          </div>
        </div>
        <div className="prpt-page__actions">
          <button className="prpt-btn prpt-btn--ghost" onClick={() => navigate("/dashboard/reports")}>
            <Icon.ArrowLeft /><span>Back to Reports</span>
          </button>
          <button className="prpt-btn prpt-btn--ghost" onClick={exportCSV}>
            <Icon.Download /><span>Export CSV</span>
          </button>
          <button className="prpt-btn prpt-btn--primary" onClick={() => window.print()}>
            <Icon.Printer /><span>Print</span>
          </button>
        </div>
      </div>

      {/* DATE PRESETS */}
      <div className="prpt-presets no-print">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            className={`prpt-preset ${activePreset === p.key ? "prpt-preset--active" : ""}`}
            onClick={() => applyPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div className="prpt-card no-print">
        <div className="prpt-filters__row">
          <Field label="From Date">
            <div className="prpt-input-wrap">
              <input type="date" className="prpt-input" value={filters.fromDate} onChange={(e) => setF("fromDate", e.target.value)} />
              <span className="prpt-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="To Date">
            <div className="prpt-input-wrap">
              <input type="date" className="prpt-input" value={filters.toDate} onChange={(e) => setF("toDate", e.target.value)} />
              <span className="prpt-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="Customer">
            <select className="prpt-input" value={filters.customer} onChange={(e) => setF("customer", e.target.value)}>
              <option value="">All Customers</option>
              {masters.customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Payment Mode">
            <select className="prpt-input" value={filters.paymentMode} onChange={(e) => setF("paymentMode", e.target.value)}>
              <option value="">All Modes</option>
              {masters.paymentModes.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="prpt-filters__row">
          <Field label="Company">
            <select className="prpt-input" value={filters.company} onChange={(e) => setF("company", e.target.value)}>
              <option value="">All Companies</option>
              {masters.companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select className="prpt-input" value={filters.status} onChange={(e) => setF("status", e.target.value)}>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s || "All Status"}</option>)}
            </select>
          </Field>
          <Field label="Search" full>
            <div className="prpt-input-wrap">
              <span className="prpt-input__icon prpt-input__icon--left"><Icon.Search /></span>
              <input
                className="prpt-input prpt-input--with-left-icon"
                placeholder="Search payment ID, customer, invoice, reference..."
                value={filters.search}
                onChange={(e) => setF("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
          </Field>
          <div className="prpt-filters__actions">
            <button className="prpt-btn prpt-btn--ghost" onClick={handleReset}>
              <Icon.Refresh /><span>Reset</span>
            </button>
            <button className="prpt-btn prpt-btn--primary" onClick={handleGenerate}>
              <Icon.Search /><span>Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT AREA */}
      <div className="prpt-print-area">
        <div className="print-only prpt-print-header">
          <h1>Payment Report</h1>
          <div className="prpt-print-meta">
            <div><strong>Period:</strong> {dateRangeLabel}</div>
            <div><strong>Generated:</strong> {formatDate(new Date())}</div>
          </div>
        </div>

        <div className="prpt-period-banner no-print">
          <Icon.Calendar />
          <span>Report Period: <strong>{dateRangeLabel}</strong></span>
        </div>

        {/* SUMMARY STATS */}
        <div className="prpt-stats">
          <StatCard label="Total Payments"     value={fmtInt(summary.totalPayments)}        hint="Transactions"     tone="blue"   icon={<Icon.Hash />} />
          <StatCard label="Total Received"     value={fmtINR(summary.totalReceived)}        hint="Collection"       tone="green"  icon={<Icon.Wallet />} />
          <StatCard label="Unique Customers"   value={fmtInt(summary.uniqueCustomers)}      hint="Paying parties"   tone="purple" icon={<Icon.CheckCircle />} />
          <StatCard label="Outstanding (After)" value={fmtINR(summary.totalOutstandingAfter)} hint="Still pending"  tone="red"    icon={<Icon.Clock />} />
          <StatCard label="Top Payment Mode"
            value={topMode ? topMode[0] : "N/A"}
            hint={topMode ? fmtINR(topMode[1]) : "No data"}
            tone="amber"
            icon={<Icon.TrendingUp />}
          />
        </div>

        {/* PAYMENT MODE BREAKDOWN */}
        {Object.keys(summary.modeBreakdown).length > 0 && (
          <div className="prpt-card no-print">
            <h3 className="prpt-card__title prpt-mb-12">Payment Mode Breakdown</h3>
            <div className="prpt-modes">
              {Object.entries(summary.modeBreakdown)
                .sort((a, b) => b[1] - a[1])
                .map(([mode, amount]) => {
                  const pct = ((amount / summary.totalReceived) * 100).toFixed(1);
                  return (
                    <div key={mode} className="prpt-mode-row">
                      <div className="prpt-mode-row__head">
                        <span className="prpt-mode-row__name">{mode}</span>
                        <span className="prpt-mode-row__amt">{fmtINR(amount)} <span className="prpt-mode-row__pct">({pct}%)</span></span>
                      </div>
                      <div className="prpt-mode-bar">
                        <div className="prpt-mode-bar__fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}

        {/* TABLE */}
        <div className="prpt-card">
          <div className="prpt-table-head">
            <h2 className="prpt-card__title">Payment Records</h2>
            <span className="prpt-muted no-print">{filteredPayments.length} payments</span>
          </div>

          <div className="prpt-table-wrap no-print">
            <table className="prpt-table">
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Invoice No</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th className="prpt-th--right">Outstanding Before</th>
                  <th className="prpt-th--right">Received</th>
                  <th className="prpt-th--right">Outstanding After</th>
                  <th className="prpt-th--center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="11" className="prpt-td--empty">Loading...</td></tr>
                ) : filteredPayments.length === 0 ? (
                  <tr><td colSpan="11" className="prpt-td--empty">No payments in this period</td></tr>
                ) : (
                  paginatedPayments.map((p, idx) => (
                    <tr key={p._id}>
                      <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="prpt-mono">{p.paymentId || "-"}</td>
                      <td>{formatDate(p.paymentDate || p.createdAt)}</td>
                      <td className="prpt-td--strong">{p.customer?.name || "-"}</td>
                      <td className="prpt-mono">{p.sale?.invoiceNo || "-"}</td>
                      <td>
                        <span className="prpt-mode-chip">{p.paymentMode?.name || "-"}</span>
                      </td>
                      <td className="prpt-mono prpt-muted">{p.referenceNo || "-"}</td>
                      <td className="prpt-td--right">{fmtNum(p.outstandingBefore)}</td>
                      <td className="prpt-td--right prpt-received">{fmtNum(p.amountReceived)}</td>
                      <td className={`prpt-td--right ${(p.outstandingAfter || 0) > 0 ? "prpt-balance-due" : "prpt-balance-zero"}`}>
                        {fmtNum(p.outstandingAfter)}
                      </td>
                      <td className="prpt-td--center">
                        <span className={`prpt-badge prpt-badge--${(p.status || "partial").toLowerCase()}`}>
                          {p.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredPayments.length > 0 && (
                <tfoot>
                  <tr className="prpt-total-row">
                    <td colSpan="8" className="prpt-td--strong">TOTAL</td>
                    <td className="prpt-td--right prpt-td--strong prpt-received">{fmtNum(summary.totalReceived)}</td>
                    <td className="prpt-td--right prpt-td--strong prpt-balance-due">{fmtNum(summary.totalOutstandingAfter)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Print-only: full unpaginated table so printing always shows every filtered row */}
          <div className="prpt-table-wrap print-only">
            <table className="prpt-table">
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>Payment ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Invoice No</th>
                  <th>Mode</th>
                  <th>Reference</th>
                  <th className="prpt-th--right">Outstanding Before</th>
                  <th className="prpt-th--right">Received</th>
                  <th className="prpt-th--right">Outstanding After</th>
                  <th className="prpt-th--center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredPayments.length === 0 ? (
                  <tr><td colSpan="11" className="prpt-td--empty">No payments in this period</td></tr>
                ) : (
                  filteredPayments.map((p, idx) => (
                    <tr key={p._id}>
                      <td>{idx + 1}</td>
                      <td className="prpt-mono">{p.paymentId || "-"}</td>
                      <td>{formatDate(p.paymentDate || p.createdAt)}</td>
                      <td className="prpt-td--strong">{p.customer?.name || "-"}</td>
                      <td className="prpt-mono">{p.sale?.invoiceNo || "-"}</td>
                      <td>
                        <span className="prpt-mode-chip">{p.paymentMode?.name || "-"}</span>
                      </td>
                      <td className="prpt-mono prpt-muted">{p.referenceNo || "-"}</td>
                      <td className="prpt-td--right">{fmtNum(p.outstandingBefore)}</td>
                      <td className="prpt-td--right prpt-received">{fmtNum(p.amountReceived)}</td>
                      <td className={`prpt-td--right ${(p.outstandingAfter || 0) > 0 ? "prpt-balance-due" : "prpt-balance-zero"}`}>
                        {fmtNum(p.outstandingAfter)}
                      </td>
                      <td className="prpt-td--center">
                        <span className={`prpt-badge prpt-badge--${(p.status || "partial").toLowerCase()}`}>
                          {p.status || "-"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredPayments.length > 0 && (
                <tfoot>
                  <tr className="prpt-total-row">
                    <td colSpan="8" className="prpt-td--strong">TOTAL</td>
                    <td className="prpt-td--right prpt-td--strong prpt-received">{fmtNum(summary.totalReceived)}</td>
                    <td className="prpt-td--right prpt-td--strong prpt-balance-due">{fmtNum(summary.totalOutstandingAfter)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination — screen only, does not affect export/print (both use filteredPayments above) */}
          <div className="prpt-pagination no-print">
            <div className="prpt-pagination__info">
              Showing {filteredPayments.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredPayments.length)} of {filteredPayments.length} entries
            </div>
            <div className="prpt-pagination__controls">
              <button
                className="prpt-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`prpt-page-btn ${page === currentPage ? "prpt-page-btn--active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="prpt-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .prpt-page, .prpt-page * { box-sizing: border-box; }
        .prpt-page {
          --prpt-text: #0f172a; --prpt-muted: #64748b; --prpt-label: #475569;
          --prpt-card: #ffffff; --prpt-border: #e5e7eb;
          --prpt-primary: #2563eb; --prpt-primary-hover: #1d4ed8;
          --prpt-danger: #ef4444; --prpt-success: #10b981; --prpt-warning: #f59e0b;
          --prpt-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--prpt-text); font-size: 14px; line-height: 1.4;
          display: flex; flex-direction: column; gap: 16px;
        }
        .prpt-page svg { width: 16px; height: 16px; display: block; }
        .print-only { display: none; }
        .prpt-mb-12 { margin-bottom: 12px; }

        .prpt-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .prpt-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .prpt-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--prpt-muted); font-size: 13px; flex-wrap: wrap; }
        .prpt-breadcrumb__sep { color: #cbd5e1; }
        .prpt-breadcrumb__current { color: var(--prpt-primary); font-weight: 500; }
        .prpt-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .prpt-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .prpt-btn--ghost { background: #fff; border-color: var(--prpt-border); color: var(--prpt-text); }
        .prpt-btn--ghost:hover { background: #f8fafc; }
        .prpt-btn--primary { background: var(--prpt-primary); color: #fff; border-color: var(--prpt-primary); }
        .prpt-btn--primary:hover { background: var(--prpt-primary-hover); }

        .prpt-presets { display: flex; flex-wrap: wrap; gap: 8px; }
        .prpt-preset {
          padding: 7px 14px; border: 1px solid var(--prpt-border);
          background: #fff; border-radius: 20px;
          font-size: 13px; font-weight: 500;
          color: var(--prpt-label); cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .prpt-preset:hover { border-color: var(--prpt-primary); color: var(--prpt-primary); }
        .prpt-preset--active { background: var(--prpt-primary); color: #fff; border-color: var(--prpt-primary); }

        .prpt-card {
          background: var(--prpt-card); border: 1px solid var(--prpt-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--prpt-shadow);
          margin-bottom: 20px;
        }
        .prpt-card__title { font-size: 15px; font-weight: 600; margin: 0; }

        .prpt-filters__row {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px; margin-bottom: 12px;
        }
        .prpt-filters__row:last-child { margin-bottom: 0; grid-template-columns: 1fr 1fr 2fr auto; }
        .prpt-filters__actions { display: flex; gap: 8px; align-items: flex-end; }

        .prpt-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .prpt-field--full { grid-column: span 1; }
        .prpt-field__label { font-size: 12px; font-weight: 500; color: var(--prpt-label); }

        .prpt-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--prpt-border);
          border-radius: 8px; background: #fff;
          font-size: 13px; color: var(--prpt-text);
          font-family: inherit;
        }
        .prpt-input:focus {
          outline: none; border-color: var(--prpt-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .prpt-input--with-left-icon { padding-left: 36px; }
        .prpt-input-wrap { position: relative; }
        .prpt-input-wrap .prpt-input:not(.prpt-input--with-left-icon) { padding-right: 34px; }
        .prpt-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--prpt-muted); pointer-events: none;
        }
        .prpt-input__icon--left { left: 10px; right: auto; }

        .prpt-period-banner {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 12px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #1e40af;
          margin-bottom: 20px;
        }
        .prpt-period-banner svg { color: var(--prpt-primary); }

        .prpt-stats {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .prpt-stat {
          background: var(--prpt-card); border: 1px solid var(--prpt-border);
          border-radius: 12px; padding: 14px;
          box-shadow: var(--prpt-shadow);
          display: flex; align-items: center; gap: 10px;
          // margin-bottom: 20px;
        }
        .prpt-stat__icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .prpt-stat__icon svg { width: 20px; height: 20px; }
        .prpt-stat__icon--blue   { background: #dbeafe; color: #2563eb; }
        .prpt-stat__icon--green  { background: #d1fae5; color: #059669; }
        .prpt-stat__icon--purple { background: #f3e8ff; color: #9333ea; }
        .prpt-stat__icon--amber  { background: #fef3c7; color: #d97706; }
        .prpt-stat__icon--red    { background: #fee2e2; color: #dc2626; }
        .prpt-stat__label { font-size: 11px; color: var(--prpt-muted); }
        .prpt-stat__value { font-size: 17px; font-weight: 700; line-height: 1.2; word-break: break-word; }
        .prpt-stat__hint { font-size: 10px; color: var(--prpt-muted); margin-top: 2px; }

        /* MODE BREAKDOWN */
        .prpt-modes { display: flex; flex-direction: column; gap: 12px; }
        .prpt-mode-row { display: flex; flex-direction: column; gap: 6px; }
        .prpt-mode-row__head {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px;
        }
        .prpt-mode-row__name { font-weight: 500; }
        .prpt-mode-row__amt { font-weight: 600; color: var(--prpt-success); }
        .prpt-mode-row__pct { color: var(--prpt-muted); font-weight: 400; font-size: 12px; }
        .prpt-mode-bar {
          width: 100%; height: 8px;
          background: #f1f5f9; border-radius: 4px; overflow: hidden;
        }
        .prpt-mode-bar__fill {
          height: 100%; background: var(--prpt-success);
          border-radius: 4px; transition: width 0.3s;
        }

        .prpt-table-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .prpt-muted { color: var(--prpt-muted); font-size: 13px; }

        .prpt-table-wrap { overflow-x: auto; }
        .prpt-table { width: 100%; border-collapse: collapse; min-width: 1200px; }
        .prpt-table th {
          background: #f8fafc; padding: 11px 12px;
          font-size: 11px; font-weight: 600;
          color: var(--prpt-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--prpt-border);
          white-space: nowrap;
        }
        .prpt-th--right { text-align: right; }
        .prpt-th--center { text-align: center; }
        .prpt-table td {
          padding: 12px; font-size: 13px;
          border-bottom: 1px solid var(--prpt-border);
          white-space: nowrap;
        }
        .prpt-table tbody tr:hover { background: #fafbfc; }
        .prpt-table tbody tr:last-child td { border-bottom: none; }
        .prpt-td--right { text-align: right; }
        .prpt-td--center { text-align: center; }
        .prpt-td--strong { font-weight: 600; }
        .prpt-td--empty { text-align: center; color: var(--prpt-muted); padding: 40px !important; }
        .prpt-mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: var(--prpt-primary); }
        .prpt-received { color: var(--prpt-success); font-weight: 600; }
        .prpt-balance-due { color: var(--prpt-danger); font-weight: 600; }
        .prpt-balance-zero { color: var(--prpt-success); font-weight: 600; }

        .prpt-mode-chip {
          display: inline-block; padding: 3px 10px;
          border-radius: 12px; font-size: 11px; font-weight: 600;
          background: #e0e7ff; color: #4338ca;
        }

        .prpt-badge {
          display: inline-block; padding: 3px 10px;
          border-radius: 12px; font-size: 11px; font-weight: 600;
        }
        .prpt-badge--full    { background: #d1fae5; color: #047857; }
        .prpt-badge--partial { background: #ffedd5; color: #c2410c; }
        .prpt-badge--advance { background: #dbeafe; color: #1e40af; }

        .prpt-total-row td {
          background: #f8fafc; padding: 14px 12px;
          font-size: 13px;
          border-top: 2px solid var(--prpt-border);
          border-bottom: none;
        }

        .prpt-pagination {
          padding: 12px 4px 0;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--prpt-border);
          margin-top: 14px;
        }
        .prpt-pagination__info { font-size: 13px; color: var(--prpt-muted); }
        .prpt-pagination__controls { display: flex; gap: 6px; flex-wrap: wrap; }
        .prpt-page-btn {
          min-width: 32px; padding: 6px 12px;
          border: 1px solid var(--prpt-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--prpt-text); font-family: inherit;
        }
        .prpt-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .prpt-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .prpt-page-btn--active { background: var(--prpt-primary); color: #fff; border-color: var(--prpt-primary); }

        @media (max-width: 1400px) {
          .prpt-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1100px) {
          .prpt-filters__row { grid-template-columns: repeat(2, 1fr); }
          .prpt-filters__row:last-child { grid-template-columns: 1fr; }
          .prpt-filters__actions { justify-content: flex-end; }
        }
        @media (max-width: 768px) {
          .prpt-page__title { font-size: 20px; }
          .prpt-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .prpt-stats { grid-template-columns: 1fr; }
          .prpt-filters__row { grid-template-columns: 1fr; }
          .prpt-page__actions { width: 100%; }
          .prpt-page__actions .prpt-btn { flex: 1; justify-content: center; }
          .prpt-preset { padding: 6px 12px; font-size: 12px; }
        }

        /* ════════════════════════════════
           PRINT STYLES
           ════════════════════════════════ */
        @media print {
          body * { visibility: hidden; }
          .prpt-print-area, .prpt-print-area * { visibility: visible; }
          .prpt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }

          .prpt-print-header {
            text-align: center; margin-bottom: 20px;
            padding-bottom: 14px; border-bottom: 2px solid #000;
          }
          .prpt-print-header h1 { font-size: 22px; margin: 0 0 8px 0; }
          .prpt-print-meta { display: flex; justify-content: center; gap: 30px; font-size: 12px; }

          .prpt-stats { grid-template-columns: repeat(5, 1fr); margin-bottom: 16px; gap: 8px; }
          .prpt-stat { padding: 8px; border: 1px solid #ccc; box-shadow: none; }
          .prpt-stat__value { font-size: 13px; }
          .prpt-stat__label { font-size: 10px; }
          .prpt-stat__hint { font-size: 9px; }

          .prpt-card { border: 1px solid #ccc; box-shadow: none; }
          .prpt-table { min-width: 0; font-size: 10px; }
          .prpt-table th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .prpt-table th, .prpt-table td { padding: 5px 6px; border: 1px solid #ddd; }
          .prpt-table tbody tr { page-break-inside: avoid; }
          .prpt-badge, .prpt-mode-chip { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .prpt-total-row td { background: #f8f8f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }
        }
      `}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
function Field({ label, full, children }) {
  return (
    <div className={`prpt-field ${full ? "prpt-field--full" : ""}`}>
      <label className="prpt-field__label">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, hint, icon, tone }) {
  return (
    <div className="prpt-stat">
      <div className={`prpt-stat__icon prpt-stat__icon--${tone}`}>{icon}</div>
      <div>
        <div className="prpt-stat__label">{label}</div>
        <div className="prpt-stat__value">{value}</div>
        <div className="prpt-stat__hint">{hint}</div>
      </div>
    </div>
  );
}
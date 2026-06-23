import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { salesApi } from "../../Api/sales";
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
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  Cart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>,
  Rupee: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8 8M14 8c0 2.76-2.24 5-5 5H6" /></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
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
// 🆕 Local date (timezone-safe) — IST me UTC convert hone ki vajah se aaj ki date kal banti thi
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
    default: return { fromDate: "", toDate: "" };               // 🔧 fixed keys
  }
  return { fromDate: isoDate(from), toDate: isoDate(to) };       // 🔧 fixed keys
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

const PAYMENT_STATUSES = ["", "Unpaid", "Partial", "Paid"];

const EMPTY_FILTERS = {
  fromDate: "", toDate: "",
  customer: "", salesPerson: "", paymentStatus: "",
  baleNo: "",                    // 🆕
  search: "",
};

/* ================================================================
   MAIN
   ================================================================ */
export default function SalesReport() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [masters, setMasters] = useState({ customers: [], salesPersons: [] });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...getPresetRange("this_month") });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS, ...getPresetRange("this_month") });
  const [activePreset, setActivePreset] = useState("this_month");
  const [viewSaleModal, setViewSaleModal] = useState(null);

  const setF = (k, v) => setFilters({ ...filters, [k]: v });

  /* ──────── LOAD ──────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [salesData, mastersData] = await Promise.all([
          salesApi.getAll(),
          fetchAllMasters(),
        ]);
        setSales(salesData);
        setMasters({
          customers: mastersData.customers || [],
          salesPersons: mastersData.salespersons || [],
        });
      } catch (err) {
        alert("Failed to load: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ──────── FILTER LOGIC ──────── */
  const filteredSales = useMemo(() => {
    let list = [...sales];

    if (appliedFilters.fromDate) {
      const from = new Date(appliedFilters.fromDate);
      from.setHours(0, 0, 0, 0);
      list = list.filter((s) => new Date(s.saleDate || s.createdAt) >= from);
    }
    if (appliedFilters.toDate) {
      const to = new Date(appliedFilters.toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((s) => new Date(s.saleDate || s.createdAt) <= to);
    }
    if (appliedFilters.customer) {
      list = list.filter((s) => (s.customer?._id || s.customer) === appliedFilters.customer);
    }
    if (appliedFilters.salesPerson) {
      list = list.filter((s) => (s.salesPerson?._id || s.salesPerson) === appliedFilters.salesPerson);
    }
    if (appliedFilters.paymentStatus) {
      list = list.filter((s) => s.paymentStatus === appliedFilters.paymentStatus);
    }
    
  // 🆕 Multi-bale comma filter — check ANY item me ANY bale match ho
    if (appliedFilters.baleNo) {
      const baleList = appliedFilters.baleNo
        .split(",")
        .map((b) => b.trim().toUpperCase())
        .filter(Boolean);

      if (baleList.length > 0) {
        list = list.filter((s) =>
          (s.items || []).some((it) => {
            const bn = (it.baleNo || "").toUpperCase();
            return baleList.some((b) => bn.includes(b));      // ANY match
          })
        );
      }
    }
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      list = list.filter((s) =>
        (s.invoiceNo || "").toLowerCase().includes(q) ||
        (s.customer?.name || "").toLowerCase().includes(q) ||
        (s.gstNo || "").toLowerCase().includes(q) ||
        (s.lrNo || "").toLowerCase().includes(q) ||
        (s.items || []).some((it) => (it.baleNo || "").toLowerCase().includes(q))   // 🆕 search me baleNo
      );
    }

    return list.sort((a, b) => new Date(b.saleDate || b.createdAt) - new Date(a.saleDate || a.createdAt));
  }, [sales, appliedFilters]);

  /* ──────── SUMMARY ──────── */
  const summary = useMemo(() => {
    const totalSales = filteredSales.length;
    const totalPcs   = filteredSales.reduce((s, x) => s + (x.totalPcs || 0), 0);
    const totalMeter = filteredSales.reduce((s, x) => s + (x.totalMeter || 0), 0);
    const totalAmount = filteredSales.reduce((s, x) => s + (x.netAmount || 0), 0);
    const totalPaid = filteredSales.reduce((s, x) => s + (x.paidAmount || 0), 0);
    const totalOutstanding = filteredSales.reduce((s, x) => s + (x.balanceDue || 0), 0);
    return { totalSales, totalPcs, totalMeter, totalAmount, totalPaid, totalOutstanding };
  }, [filteredSales]);

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
    if (filteredSales.length === 0) return alert("No data to export");

    const headers = [
      "SR No.", "Date", "Invoice No", "Bales", "Customer", "Sales Person",
      "Total PCS", "Total Meter", "Gross Amount", "Discount", "Net Amount",
      "Paid", "Balance Due", "Payment Status",
    ];

    const rows = filteredSales.map((s, idx) => {
      const bales = [...new Set((s.items || []).map((it) => it.baleNo).filter(Boolean))].join("; ");
      return [
        idx + 1,
        formatDate(s.saleDate || s.createdAt),
        s.invoiceNo || "",
        bales || "",                       // 🆕
        s.customer?.name || "",
        s.salesPerson?.name || "",
        s.totalPcs || 0,
        s.totalMeter || 0,
        s.grossAmount || 0,
        s.discountTotal || 0,
        s.netAmount || 0,
        s.paidAmount || 0,
        s.balanceDue || 0,
        s.paymentStatus || "",
      ];
    });

    rows.push([
      "", "", "", "", "", "TOTAL:",        // 🆕 1 extra blank
      summary.totalPcs, summary.totalMeter.toFixed(2),
      "", "", summary.totalAmount.toFixed(2),
      summary.totalPaid.toFixed(2), summary.totalOutstanding.toFixed(2), "",
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
    link.download = `sales-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const dateRangeLabel = useMemo(() => {
    if (!appliedFilters.fromDate && !appliedFilters.toDate) return "All Time";
    if (appliedFilters.fromDate === appliedFilters.toDate) return formatDate(appliedFilters.fromDate);
    return `${formatDate(appliedFilters.fromDate)} — ${formatDate(appliedFilters.toDate)}`;
  }, [appliedFilters]);

  return (
    <div className="srpt-page">
      {/* HEADER */}
      <div className="srpt-page__header no-print">
        <div>
          <h1 className="srpt-page__title">Sales Report</h1>
          <div className="srpt-breadcrumb">
            <span>Home</span>
            <span className="srpt-breadcrumb__sep">/</span>
            <span>Reports</span>
            <span className="srpt-breadcrumb__sep">/</span>
            <span className="srpt-breadcrumb__current">Sales Report</span>
          </div>
        </div>
        <div className="srpt-page__actions">
          <button className="srpt-btn srpt-btn--ghost" onClick={() => navigate("/dashboard/reports")}>
            <Icon.ArrowLeft /><span>Back to Reports</span>
          </button>
          <button className="srpt-btn srpt-btn--ghost" onClick={exportCSV}>
            <Icon.Download /><span>Export CSV</span>
          </button>
          <button className="srpt-btn srpt-btn--primary" onClick={() => window.print()}>
            <Icon.Printer /><span>Print</span>
          </button>
        </div>
      </div>

      {/* DATE PRESETS */}
      <div className="srpt-presets no-print">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            className={`srpt-preset ${activePreset === p.key ? "srpt-preset--active" : ""}`}
            onClick={() => applyPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div className="srpt-card no-print">
        <div className="srpt-filters__row">
          <Field label="From Date">
            <div className="srpt-input-wrap">
              <input type="date" className="srpt-input" value={filters.fromDate} onChange={(e) => setF("fromDate", e.target.value)} />
              <span className="srpt-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="To Date">
            <div className="srpt-input-wrap">
              <input type="date" className="srpt-input" value={filters.toDate} onChange={(e) => setF("toDate", e.target.value)} />
              <span className="srpt-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="Customer">
            <select className="srpt-input" value={filters.customer} onChange={(e) => setF("customer", e.target.value)}>
              <option value="">All Customers</option>
              {masters.customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Sales Person">
            <select className="srpt-input" value={filters.salesPerson} onChange={(e) => setF("salesPerson", e.target.value)}>
              <option value="">All Sales Persons</option>
              {masters.salesPersons.map((sp) => <option key={sp._id} value={sp._id}>{sp.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="srpt-filters__row">
          <Field label="Payment Status">
            <select className="srpt-input" value={filters.paymentStatus} onChange={(e) => setF("paymentStatus", e.target.value)}>
              {PAYMENT_STATUSES.map((s) => <option key={s} value={s}>{s || "All Status"}</option>)}
            </select>
          </Field>
          {/* 🆕 Bale No filter */}
          <Field label="Bale No">
            <input
              className="srpt-input srpt-bale-input"
              placeholder="e.g. A35, 1224"
              value={filters.baleNo}
              onChange={(e) => setF("baleNo", e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </Field>
          <Field label="Search" full>
            <div className="srpt-input-wrap">
              <span className="srpt-input__icon srpt-input__icon--left"><Icon.Search /></span>
              <input
                className="srpt-input srpt-input--with-left-icon"
                placeholder="Search invoice, customer, GST, LR no..."
                value={filters.search}
                onChange={(e) => setF("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
          </Field>
          <div className="srpt-filters__actions">
            <button className="srpt-btn srpt-btn--ghost" onClick={handleReset}>
              <Icon.Refresh /><span>Reset</span>
            </button>
            <button className="srpt-btn srpt-btn--primary" onClick={handleGenerate}>
              <Icon.Search /><span>Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT AREA */}
      <div className="srpt-print-area">
        <div className="print-only srpt-print-header">
          <h1>Sales Report</h1>
          <div className="srpt-print-meta">
            <div><strong>Period:</strong> {dateRangeLabel}</div>
            <div><strong>Generated:</strong> {formatDate(new Date())}</div>
          </div>
        </div>

        <div className="srpt-period-banner no-print">
          <Icon.Calendar />
          <span>Report Period: <strong>{dateRangeLabel}</strong></span>
        </div>

        {/* SUMMARY STATS */}
        <div className="srpt-stats">
          <StatCard label="Total Sales"      value={fmtInt(summary.totalSales)}     hint="Invoices"        tone="blue"   icon={<Icon.Cart />} />
          <StatCard label="Total PCS"        value={fmtInt(summary.totalPcs)}       hint="Taka sold"        tone="purple" icon={<Icon.Cart />} />
          <StatCard label="Total Amount"     value={fmtINR(summary.totalAmount)}    hint="Net revenue"      tone="amber"  icon={<Icon.Rupee />} />
          <StatCard label="Total Received"   value={fmtINR(summary.totalPaid)}      hint="Collected"        tone="green"  icon={<Icon.CheckCircle />} />
          <StatCard label="Outstanding"      value={fmtINR(summary.totalOutstanding)} hint="Pending dues"  tone="red"    icon={<Icon.Clock />} />
        </div>

        {/* TABLE */}
        <div className="srpt-card">
          <div className="srpt-table-head">
            <h2 className="srpt-card__title">Sales Records</h2>
            <span className="srpt-muted no-print">{filteredSales.length} sales</span>
          </div>

          <div className="srpt-table-wrap">
            <table className="srpt-table">
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>Date</th>
                  <th>Invoice No</th>
                  <th>Bales</th>{/* 🆕 */}
                  <th>Customer</th>
                  <th>Sales Person</th>
                  <th className="srpt-th--right">PCS</th>
                  <th className="srpt-th--right">Meter</th>
                  <th className="srpt-th--right">Net Amount</th>
                  <th className="srpt-th--right">Paid</th>
                  <th className="srpt-th--right">Balance</th>
                  <th className="srpt-th--center">Status</th>
                  <th className="srpt-th--center no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="13" className="srpt-td--empty">Loading...</td></tr>
                ) : filteredSales.length === 0 ? (
                  <tr><td colSpan="13" className="srpt-td--empty">No sales in this period</td></tr>
                ) : (
                  filteredSales.map((s, idx) => (
                    <tr key={s._id}>
                      <td>{idx + 1}</td>
                      <td>{formatDate(s.saleDate || s.createdAt)}</td>
                      <td className="srpt-mono">{s.invoiceNo || "-"}</td>
                      {/* 🆕 Bales cell — multiple chips */}
                      <td>
                        {(() => {
                          const bales = [...new Set((s.items || []).map((it) => it.baleNo).filter(Boolean))];
                          if (bales.length === 0) return <span className="srpt-muted">-</span>;
                          return (
                            <div className="srpt-bales-list">
                              {bales.slice(0, 3).map((b) => (
                                <span key={b} className="srpt-bale-chip">{b}</span>
                              ))}
                              {bales.length > 3 && (
                                <span className="srpt-bale-more" title={bales.slice(3).join(", ")}>
                                  +{bales.length - 3}
                                </span>
                              )}
                            </div>
                          );
                        })()}
                      </td>
                      <td className="srpt-td--strong">{s.customer?.name || "-"}</td>
                      <td>{s.salesPerson?.name || "-"}</td>
                      <td className="srpt-td--right">{fmtInt(s.totalPcs)}</td>
                      <td className="srpt-td--right">{fmtNum(s.totalMeter)}</td>
                      <td className="srpt-td--right srpt-td--strong">{fmtNum(s.netAmount)}</td>
                      <td className="srpt-td--right srpt-paid">{fmtNum(s.paidAmount)}</td>
                      <td className={`srpt-td--right ${(s.balanceDue || 0) > 0 ? "srpt-balance-due" : "srpt-balance-zero"}`}>
                        {fmtNum(s.balanceDue)}
                      </td>
                      <td className="srpt-td--center">
                        <span className={`srpt-badge srpt-badge--${(s.paymentStatus || "unpaid").toLowerCase()}`}>
                          {s.paymentStatus || "Unpaid"}
                        </span>
                      </td>
                      <td className="srpt-td--center no-print">
                        <button
                          className="srpt-icon-btn"
                          title="View"
                    onClick={() => setViewSaleModal(s)}
                        >
                          <Icon.Eye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredSales.length > 0 && (
                <tfoot>
                  <tr className="srpt-total-row">
                    <td colSpan="6" className="srpt-td--strong">TOTAL</td>{/* 🆕 5→6 */}
                    <td className="srpt-td--right srpt-td--strong">{fmtInt(summary.totalPcs)}</td>
                    <td className="srpt-td--right srpt-td--strong">{fmtNum(summary.totalMeter)}</td>
                    <td className="srpt-td--right srpt-td--strong">{fmtNum(summary.totalAmount)}</td>
                    <td className="srpt-td--right srpt-td--strong srpt-paid">{fmtNum(summary.totalPaid)}</td>
                    <td className="srpt-td--right srpt-td--strong srpt-balance-due">{fmtNum(summary.totalOutstanding)}</td>
                    <td></td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      {viewSaleModal && (
        <div className="srpt-modal-overlay no-print" onClick={() => setViewSaleModal(null)}>
          <div className="srpt-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="srpt-modal__header">
              <div className="srpt-modal__title-wrap">
                <div className="srpt-modal__icon"><Icon.Cart /></div>
                <div>
                  <div className="srpt-modal__label">Sale Invoice</div>
                  <div className="srpt-modal__invoice">
                    {viewSaleModal.invoiceNo || "—"}
                    <span className={`srpt-modal__status-pill srpt-modal__status-pill--${(viewSaleModal.paymentStatus || "unpaid").toLowerCase()}`}>
                      {viewSaleModal.paymentStatus || "Unpaid"}
                    </span>
                  </div>
                </div>
              </div>
              <button className="srpt-modal__close" onClick={() => setViewSaleModal(null)}>×</button>
            </div>

            {/* Body */}
            <div className="srpt-modal__body">
              {/* Section 1: Customer & Sale Info */}
              <div className="srpt-modal__section">
                <h3 className="srpt-modal__section-title">Sale Information</h3>
                <div className="srpt-modal__grid">
                  <ModalCell label="Sale Date" value={formatDate(viewSaleModal.saleDate)} />
                  <ModalCell label="Invoice No" value={viewSaleModal.invoiceNo} mono />
                  <ModalCell label="Customer" value={viewSaleModal.customer?.name} strong />
                  <ModalCell label="Sales Person" value={viewSaleModal.salesPerson?.name} />
                  <ModalCell label="Payment Type" value={viewSaleModal.paymentType} />
                  <ModalCell label="Due Date" value={viewSaleModal.dueDate ? formatDate(viewSaleModal.dueDate) : "—"} />
                </div>
              </div>

              {/* Section 2: Financial Stats */}
              <div className="srpt-modal__section">
                <h3 className="srpt-modal__section-title">Financial Summary</h3>
                <div className="srpt-modal__stats">
                  <ModalStat label="Gross Amount" value={fmtINR(viewSaleModal.grossAmount)} color="#64748b" />
                  <ModalStat label="Discount" value={fmtINR(viewSaleModal.discountTotal)} color="#f59e0b" />
                  <ModalStat label="Net Amount" value={fmtINR(viewSaleModal.netAmount)} color="#2563eb" highlight />
                  <ModalStat label="Paid" value={fmtINR(viewSaleModal.paidAmount)} color="#10b981" />
                  <ModalStat
                    label="Balance Due"
                    value={fmtINR(viewSaleModal.balanceDue)}
                    color={(viewSaleModal.balanceDue || 0) > 0 ? "#ef4444" : "#10b981"}
                    highlight
                  />
                </div>
              </div>

              {/* Section 3: Items (Bale-wise) */}
              {Array.isArray(viewSaleModal.items) && viewSaleModal.items.length > 0 && (
                <div className="srpt-modal__section">
                  <h3 className="srpt-modal__section-title">
                    Items Sold ({viewSaleModal.items.length} bale{viewSaleModal.items.length > 1 ? "s" : ""})
                  </h3>
                  <div className="srpt-modal-table-wrap">
                    <table className="srpt-modal-table">
                      <thead>
                        <tr>
                          <th>Bale No</th>
                          <th>Fabric</th>
                          <th className="srpt-th--right">PCS</th>
                          <th className="srpt-th--right">Meter</th>
                          <th className="srpt-th--right">Rate</th>
                          <th className="srpt-th--right">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewSaleModal.items.map((it, idx) => (
                          <tr key={it._id || idx}>
                            <td>
                              {it.baleNo ? <span className="srpt-bale-chip">{it.baleNo}</span> : "—"}
                            </td>
                            <td>{it.fabric?.name || "—"}</td>
                            <td className="srpt-td--right">{fmtInt(it.pcs)}</td>
                            <td className="srpt-td--right">{fmtNum(it.totalMeter)}</td>
                            <td className="srpt-td--right">{fmtNum(it.rate)}</td>
                            <td className="srpt-td--right srpt-td--strong">{fmtNum(it.amount)}</td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colSpan="2" className="srpt-td--strong">TOTAL</td>
                          <td className="srpt-td--right srpt-td--strong">{fmtInt(viewSaleModal.totalPcs)}</td>
                          <td className="srpt-td--right srpt-td--strong">{fmtNum(viewSaleModal.totalMeter)}</td>
                          <td></td>
                          <td className="srpt-td--right srpt-td--strong">{fmtNum(viewSaleModal.netAmount)}</td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* Per-piece breakdown — if any item has pcsDetails */}
                  {viewSaleModal.items.some((it) => Array.isArray(it.pcsDetails) && it.pcsDetails.length > 0) && (
                    <div className="srpt-modal-pcs-wrap">
                      <h4 className="srpt-modal-pcs-title">Per-Piece Breakdown</h4>
                      {viewSaleModal.items.map((it, idx) => (
                        Array.isArray(it.pcsDetails) && it.pcsDetails.length > 0 && (
                          <div key={it._id || idx} className="srpt-modal-pcs-group">
                            <div className="srpt-modal-pcs-group-head">
                              <span className="srpt-bale-chip">{it.baleNo || "—"}</span>
                              <span className="srpt-muted">{it.pcsDetails.length} pieces</span>
                            </div>
                            <div className="srpt-modal-pcs-pieces">
                              {it.pcsDetails.map((p, i) => (
                                <div key={i} className="srpt-modal-pcs-pill">
                                  <span className="srpt-modal-pcs-pill__no">PCS {p.pcsNo}</span>
                                  <span className="srpt-modal-pcs-pill__meter">{fmtNum(p.meter)}m</span>
                                  {p.color?.name && (
                                    <span className="srpt-modal-pcs-pill__color">{p.color.name}</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Section 4: Extra Info */}
              {(viewSaleModal.gstNo || viewSaleModal.lrNo || viewSaleModal.remarks) && (
                <div className="srpt-modal__section">
                  <h3 className="srpt-modal__section-title">Additional Info</h3>
                  <div className="srpt-modal__grid">
                    {viewSaleModal.gstNo && <ModalCell label="GST No" value={viewSaleModal.gstNo} mono />}
                    {viewSaleModal.lrNo && <ModalCell label="LR No" value={viewSaleModal.lrNo} mono />}
                    {viewSaleModal.transport?.name && <ModalCell label="Transport" value={viewSaleModal.transport.name} />}
                    {viewSaleModal.paymentMode?.name && <ModalCell label="Payment Mode" value={viewSaleModal.paymentMode.name} />}
                  </div>
                  {viewSaleModal.remarks && (
                    <div className="srpt-modal__remarks">{viewSaleModal.remarks}</div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="srpt-modal__footer">
              <button className="srpt-btn srpt-btn--ghost" onClick={() => setViewSaleModal(null)}>
                Close
              </button>
              {/* <button
                className="srpt-btn srpt-btn--primary"
                onClick={() => {
                  const id = viewSaleModal._id;
                  setViewSaleModal(null);
                  navigate(`/dashboard/sales/${id}`);
                }}
              >
                <Icon.Eye /><span>Edit Sale</span>
              </button> */}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .srpt-page, .srpt-page * { box-sizing: border-box; }
        .srpt-page {
          --srpt-text: #0f172a; --srpt-muted: #64748b; --srpt-label: #475569;
          --srpt-card: #ffffff; --srpt-border: #e5e7eb;
          --srpt-primary: #2563eb; --srpt-primary-hover: #1d4ed8;
          --srpt-danger: #ef4444; --srpt-success: #10b981; --srpt-warning: #f59e0b;
          --srpt-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--srpt-text); font-size: 14px; line-height: 1.4;
          display: flex; flex-direction: column; gap: 16px;
        }
        .srpt-page svg { width: 16px; height: 16px; display: block; }
        .print-only { display: none; }

        .srpt-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .srpt-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .srpt-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--srpt-muted); font-size: 13px; flex-wrap: wrap; }
        .srpt-breadcrumb__sep { color: #cbd5e1; }
        .srpt-breadcrumb__current { color: var(--srpt-primary); font-weight: 500; }
        .srpt-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .srpt-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .srpt-btn--ghost { background: #fff; border-color: var(--srpt-border); color: var(--srpt-text); }
        .srpt-btn--ghost:hover { background: #f8fafc; }
        .srpt-btn--primary { background: var(--srpt-primary); color: #fff; border-color: var(--srpt-primary); }
        .srpt-btn--primary:hover { background: var(--srpt-primary-hover); }
        .srpt-icon-btn {
          background: #eff6ff; border: none;
          width: 30px; height: 30px;
          border-radius: 6px; cursor: pointer;
          color: var(--srpt-primary);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .srpt-icon-btn:hover { background: #dbeafe; }
        .srpt-icon-btn svg { width: 14px; height: 14px; }

        .srpt-presets { display: flex; flex-wrap: wrap; gap: 8px; }
        .srpt-preset {
          padding: 7px 14px; border: 1px solid var(--srpt-border);
          background: #fff; border-radius: 20px;
          font-size: 13px; font-weight: 500;
          color: var(--srpt-label); cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .srpt-preset:hover { border-color: var(--srpt-primary); color: var(--srpt-primary); }
        .srpt-preset--active { background: var(--srpt-primary); color: #fff; border-color: var(--srpt-primary); }

        .srpt-card {
          background: var(--srpt-card); border: 1px solid var(--srpt-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--srpt-shadow);
        }
        .srpt-card__title { font-size: 15px; font-weight: 600; margin: 0; }

        .srpt-filters__row {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px; margin-bottom: 12px;
        }
        .srpt-filters__row:last-child { margin-bottom: 0; grid-template-columns: 1fr 1fr 2fr auto; }
        .srpt-filters__actions { display: flex; gap: 8px; align-items: flex-end; }

        .srpt-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .srpt-field--full { grid-column: span 1; }
        .srpt-field__label { font-size: 12px; font-weight: 500; color: var(--srpt-label); }

        .srpt-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--srpt-border);
          border-radius: 8px; background: #fff;
          font-size: 13px; color: var(--srpt-text);
          font-family: inherit;
        }
        .srpt-input:focus {
          outline: none; border-color: var(--srpt-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .srpt-input--with-left-icon { padding-left: 36px; }
        .srpt-input-wrap { position: relative; }
        .srpt-input-wrap .srpt-input:not(.srpt-input--with-left-icon) { padding-right: 34px; }
        .srpt-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--srpt-muted); pointer-events: none;
        }
        .srpt-input__icon--left { left: 10px; right: auto; }

        .srpt-period-banner {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 12px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #1e40af;
          margin-bottom: 20px;
        }
        .srpt-period-banner svg { color: var(--srpt-primary); }

        .srpt-stats {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .srpt-stat {
          background: var(--srpt-card); border: 1px solid var(--srpt-border);
          border-radius: 12px; padding: 14px;
          box-shadow: var(--srpt-shadow);
          display: flex; align-items: center; gap: 10px;
        }
        .srpt-stat__icon {
          width: 40px; height: 40px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .srpt-stat__icon svg { width: 20px; height: 20px; }
        .srpt-stat__icon--blue   { background: #dbeafe; color: #2563eb; }
        .srpt-stat__icon--green  { background: #d1fae5; color: #059669; }
        .srpt-stat__icon--purple { background: #f3e8ff; color: #9333ea; }
        .srpt-stat__icon--amber  { background: #fef3c7; color: #d97706; }
        .srpt-stat__icon--red    { background: #fee2e2; color: #dc2626; }
        .srpt-stat__label { font-size: 11px; color: var(--srpt-muted); }
        .srpt-stat__value { font-size: 17px; font-weight: 700; line-height: 1.2; }
        .srpt-stat__hint { font-size: 10px; color: var(--srpt-muted); margin-top: 2px; }

        .srpt-table-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .srpt-muted { color: var(--srpt-muted); font-size: 13px; }

        .srpt-table-wrap { overflow-x: auto; }
        .srpt-table { width: 100%; border-collapse: collapse; min-width: 1200px; }
        .srpt-table th {
          background: #f8fafc; padding: 11px 12px;
          font-size: 11px; font-weight: 600;
          color: var(--srpt-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--srpt-border);
          white-space: nowrap;
        }
        .srpt-th--right { text-align: right; }
        .srpt-th--center { text-align: center; }
        .srpt-table td {
          padding: 12px; font-size: 13px;
          border-bottom: 1px solid var(--srpt-border);
          white-space: nowrap;
        }
        .srpt-table tbody tr:hover { background: #fafbfc; }
        .srpt-table tbody tr:last-child td { border-bottom: none; }
        .srpt-td--right { text-align: right; }
        .srpt-td--center { text-align: center; }
        .srpt-td--strong { font-weight: 600; }
        .srpt-td--empty { text-align: center; color: var(--srpt-muted); padding: 40px !important; }
        .srpt-mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: var(--srpt-primary); }
        .srpt-paid { color: var(--srpt-success); font-weight: 600; }
        .srpt-balance-due { color: var(--srpt-danger); font-weight: 600; }
        .srpt-balance-zero { color: var(--srpt-success); font-weight: 600; }

        /* 🆕 Bale chip + bale list */
        .srpt-bales-list {
          display: flex; flex-wrap: wrap; gap: 4px;
          align-items: center;
        }
        .srpt-bale-chip {
          display: inline-block;
          padding: 2px 7px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 5px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .srpt-bale-more {
          display: inline-block;
          padding: 2px 7px;
          background: #f1f5f9;
          color: var(--srpt-muted);
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          cursor: help;
        }
        .srpt-bale-input {
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .srpt-badge {
          display: inline-block; padding: 3px 10px;
          border-radius: 12px; font-size: 11px; font-weight: 600;
        }
        .srpt-badge--paid    { background: #d1fae5; color: #047857; }
        .srpt-badge--partial { background: #ffedd5; color: #c2410c; }
        .srpt-badge--unpaid  { background: #fee2e2; color: #b91c1c; }

        .srpt-total-row td {
          background: #f8fafc; padding: 14px 12px;
          font-size: 13px;
          border-top: 2px solid var(--srpt-border);
          border-bottom: none;
        }

        /* 🆕 MODAL */
.srpt-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: srptFadeIn 0.15s ease-out;
}
@keyframes srptFadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.srpt-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 880px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: srptSlideUp 0.2s ease-out;
}
@keyframes srptSlideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Header */
.srpt-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #065f46 0%, #10b981 100%);
  color: #fff;
  border-radius: 16px 16px 0 0;
}
.srpt-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}
.srpt-modal__icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.srpt-modal__icon svg { width: 20px; height: 20px; }
.srpt-modal__label {
  font-size: 12px;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.srpt-modal__invoice {
  font-size: 20px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, monospace;
  letter-spacing: 0.5px;
  margin-top: 2px;
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.srpt-modal__status-pill {
  padding: 3px 10px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.3px;
  font-family: inherit;
}
.srpt-modal__status-pill--paid    { background: rgba(255,255,255,0.95); color: #047857; }
.srpt-modal__status-pill--partial { background: rgba(254,243,199,0.95); color: #92400e; }
.srpt-modal__status-pill--unpaid  { background: rgba(254,226,226,0.95); color: #991b1b; }
.srpt-modal__close {
  background: rgba(255,255,255,0.15);
  border: none;
  width: 36px;
  height: 36px;
  border-radius: 8px;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s;
  line-height: 1;
}
.srpt-modal__close:hover { background: rgba(255,255,255,0.25); }

/* Body */
.srpt-modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.srpt-modal__section {
  margin-bottom: 24px;
}
.srpt-modal__section:last-child {
  margin-bottom: 0;
}
.srpt-modal__section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--srpt-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--srpt-border);
}

/* Grid info cells */
.srpt-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.srpt-modal-cell {
  background: #f8fafc;
  border: 1px solid var(--srpt-border);
  border-radius: 10px;
  padding: 12px 14px;
}
.srpt-modal-cell__label {
  font-size: 11px;
  color: var(--srpt-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 4px;
}
.srpt-modal-cell__value {
  font-size: 14px;
  color: var(--srpt-text);
  font-weight: 500;
}
.srpt-modal-cell__value--strong { font-weight: 700; color: var(--srpt-primary); }
.srpt-modal-cell__value--mono { font-family: ui-monospace, SFMono-Regular, monospace; }

/* Financial stats */
.srpt-modal__stats {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 10px;
}
.srpt-modal-stat {
  background: #f8fafc;
  border: 1px solid var(--srpt-border);
  border-radius: 10px;
  padding: 12px;
  text-align: center;
}
.srpt-modal-stat--highlight {
  background: #ecfdf5;
  border-color: #a7f3d0;
}
.srpt-modal-stat__label {
  font-size: 10px;
  color: var(--srpt-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 6px;
}
.srpt-modal-stat__value {
  font-size: 15px;
  font-weight: 700;
}

/* Items mini table */
.srpt-modal-table-wrap {
  border: 1px solid var(--srpt-border);
  border-radius: 8px;
  overflow: hidden;
  overflow-x: auto;
}
.srpt-modal-table {
  width: 100%;
  border-collapse: collapse;
}
.srpt-modal-table th {
  background: #f1f5f9;
  padding: 8px 12px;
  font-size: 11px;
  font-weight: 700;
  color: var(--srpt-muted);
  text-align: left;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  border-bottom: 1px solid var(--srpt-border);
  white-space: nowrap;
}
.srpt-modal-table td {
  padding: 8px 12px;
  font-size: 13px;
  border-bottom: 1px solid #f1f5f9;
  white-space: nowrap;
}
.srpt-modal-table tfoot td {
  background: #f8fafc;
  border-top: 2px solid var(--srpt-border);
  border-bottom: none;
  font-weight: 700;
}

/* Per-piece breakdown */
.srpt-modal-pcs-wrap {
  margin-top: 16px;
  padding: 14px;
  background: #f0fdf4;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
}
.srpt-modal-pcs-title {
  font-size: 12px;
  font-weight: 700;
  color: #065f46;
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin: 0 0 10px 0;
}
.srpt-modal-pcs-group {
  margin-bottom: 12px;
}
.srpt-modal-pcs-group:last-child { margin-bottom: 0; }
.srpt-modal-pcs-group-head {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 8px;
}
.srpt-modal-pcs-pieces {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}
.srpt-modal-pcs-pill {
  background: #fff;
  border: 1px solid #a7f3d0;
  border-radius: 6px;
  padding: 4px 8px;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.srpt-modal-pcs-pill__no {
  font-family: ui-monospace, SFMono-Regular, monospace;
  font-weight: 700;
  color: #065f46;
}
.srpt-modal-pcs-pill__meter {
  color: var(--srpt-text);
  font-weight: 500;
}
.srpt-modal-pcs-pill__color {
  background: #e0f2fe;
  color: #075985;
  padding: 1px 6px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 600;
}

/* Remarks */
.srpt-modal__remarks {
  background: #fffbeb;
  border: 1px solid #fde68a;
  border-radius: 10px;
  padding: 12px 14px;
  font-size: 13px;
  color: #92400e;
  font-style: italic;
  margin-top: 12px;
}

/* Footer */
.srpt-modal__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--srpt-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

/* Mobile modal */
@media (max-width: 700px) {
  .srpt-modal__body { padding: 16px; }
  .srpt-modal__grid { grid-template-columns: 1fr; }
  .srpt-modal__stats { grid-template-columns: repeat(2, 1fr); }
  .srpt-modal__invoice { font-size: 16px; }
  .srpt-modal__header { padding: 16px 20px; }
}

@media (max-width: 1400px) {
  .srpt-stats { grid-template-columns: repeat(3, 1fr); }
}

        @media (max-width: 1400px) {
          .srpt-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1100px) {
          .srpt-filters__row { grid-template-columns: repeat(2, 1fr); }
          .srpt-filters__row:last-child { grid-template-columns: 1fr; }
          .srpt-filters__actions { justify-content: flex-end; }
        }
        @media (max-width: 768px) {
          .srpt-page__title { font-size: 20px; }
          .srpt-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .srpt-stats { grid-template-columns: 1fr; }
          .srpt-filters__row { grid-template-columns: 1fr; }
          .srpt-page__actions { width: 100%; }
          .srpt-page__actions .srpt-btn { flex: 1; justify-content: center; }
          .srpt-preset { padding: 6px 12px; font-size: 12px; }
        }

        /* ════════════════════════════════
           PRINT STYLES
           ════════════════════════════════ */
        @media print {
          body * { visibility: hidden; }
          .srpt-print-area, .srpt-print-area * { visibility: visible; }
          .srpt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }

          .srpt-print-header {
            text-align: center; margin-bottom: 20px;
            padding-bottom: 14px; border-bottom: 2px solid #000;
          }
          .srpt-print-header h1 { font-size: 22px; margin: 0 0 8px 0; }
          .srpt-print-meta { display: flex; justify-content: center; gap: 30px; font-size: 12px; }

          .srpt-stats { grid-template-columns: repeat(5, 1fr); margin-bottom: 16px; gap: 8px; }
          .srpt-stat { padding: 8px; border: 1px solid #ccc; box-shadow: none; }
          .srpt-stat__value { font-size: 13px; }
          .srpt-stat__label { font-size: 10px; }
          .srpt-stat__hint { font-size: 9px; }

          .srpt-card { border: 1px solid #ccc; box-shadow: none; }
          .srpt-table { min-width: 0; font-size: 10px; }
          .srpt-table th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .srpt-table th, .srpt-table td { padding: 5px 6px; border: 1px solid #ddd; }
          .srpt-table tbody tr { page-break-inside: avoid; }
          .srpt-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .srpt-total-row td { background: #f8f8f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }
        }
      `}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
function Field({ label, full, children }) {
  return (
    <div className={`srpt-field ${full ? "srpt-field--full" : ""}`}>
      <label className="srpt-field__label">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, hint, icon, tone }) {
  return (
    <div className="srpt-stat">
      <div className={`srpt-stat__icon srpt-stat__icon--${tone}`}>{icon}</div>
      <div>
        <div className="srpt-stat__label">{label}</div>
        <div className="srpt-stat__value">{value}</div>
        <div className="srpt-stat__hint">{hint}</div>
      </div>
    </div>
  );
}

/* 🆕 Modal helpers */
function ModalCell({ label, value, strong, mono }) {
  return (
    <div className="srpt-modal-cell">
      <div className="srpt-modal-cell__label">{label}</div>
      <div className={`srpt-modal-cell__value ${strong ? "srpt-modal-cell__value--strong" : ""} ${mono ? "srpt-modal-cell__value--mono" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function ModalStat({ label, value, color, highlight }) {
  return (
    <div className={`srpt-modal-stat ${highlight ? "srpt-modal-stat--highlight" : ""}`}>
      <div className="srpt-modal-stat__label">{label}</div>
      <div className="srpt-modal-stat__value" style={{ color }}>{value}</div>
    </div>
  );
}
        
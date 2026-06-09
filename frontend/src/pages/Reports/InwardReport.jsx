import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { inwardApi } from "../../Api/inwardApi";
import { fetchAllMasters } from "../../Api/masterApi";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Printer: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 6 2 18 2 18 9" />
      <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
      <rect x="6" y="14" width="12" height="8" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Box: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  ),
  Ruler: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20M5 12V8M9 12v-2M13 12V8M17 12v-2M21 12V8" />
    </svg>
  ),
  Rupee: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12M6 8h12M6 13l8 8M14 8c0 2.76-2.24 5-5 5H6" />
    </svg>
  ),
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

const isoDate = (d) => d.toISOString().slice(0, 10);

/* Date preset calculator — returns { from, to } in YYYY-MM-DD */
const getPresetRange = (preset) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today), to = new Date(today);

  switch (preset) {
    case "today":
      break;
    case "yesterday":
      from.setDate(today.getDate() - 1);
      to.setDate(today.getDate() - 1);
      break;
    case "this_week": {
      const day = today.getDay();           // 0=Sun
      const diff = day === 0 ? 6 : day - 1; // Monday start
      from.setDate(today.getDate() - diff);
      break;
    }
    case "this_month":
      from.setDate(1);
      break;
    case "last_month":
      from.setMonth(today.getMonth() - 1, 1);
      to.setDate(0); // last day of prev month
      break;
    case "this_year":
      from.setMonth(0, 1);
      break;
    default:
      return { from: "", to: "" };
  }
  return { from: isoDate(from), to: isoDate(to) };
};

const DATE_PRESETS = [
  { key: "today",      label: "Today" },
  { key: "yesterday",  label: "Yesterday" },
  { key: "this_week",  label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year",  label: "This Year" },
  { key: "custom",     label: "Custom" },
];

const EMPTY_FILTERS = {
  fromDate: "", toDate: "",
  supplier: "", fabric: "", company: "",
  baleNo:"",    // bale No
  search: "",
};

/* ================================================================
   MAIN
   ================================================================ */
export default function InwardReport() {
  const navigate = useNavigate();

  const [inwards, setInwards] = useState([]);
  const [masters, setMasters] = useState({ suppliers: [], fabrics: [], companies: [] });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ ...EMPTY_FILTERS, ...getPresetRange("this_month") });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS, ...getPresetRange("this_month") });
  const [activePreset, setActivePreset] = useState("this_month");

  const setF = (k, v) => setFilters({ ...filters, [k]: v });

  /* ──────── LOAD DATA ──────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [inwardsData, mastersData] = await Promise.all([
          inwardApi.getAll(),
          fetchAllMasters(),
        ]);
        setInwards(inwardsData);
        setMasters({
          suppliers: mastersData.suppliers || [],
          fabrics:   mastersData.fabrics || [],
          companies: mastersData.companies || [],
        });
      } catch (err) {
        alert("Failed to load: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ──────── FILTER LOGIC ──────── */
  const filteredInwards = useMemo(() => {
    let list = [...inwards];

    if (appliedFilters.fromDate) {
      const from = new Date(appliedFilters.fromDate);
      from.setHours(0, 0, 0, 0);
      list = list.filter((i) => new Date(i.entryDate || i.createdAt) >= from);
    }
    if (appliedFilters.toDate) {
      const to = new Date(appliedFilters.toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((i) => new Date(i.entryDate || i.createdAt) <= to);
    }
    if (appliedFilters.supplier) {
      list = list.filter((i) => (i.supplier?._id || i.supplier) === appliedFilters.supplier);
    }
    if (appliedFilters.fabric) {
      list = list.filter((i) => (i.fabric?._id || i.fabric) === appliedFilters.fabric);
    }
    if (appliedFilters.company) {
      list = list.filter((i) => (i.company?._id || i.company) === appliedFilters.company);
    }
    if(appliedFilters.baleNo){
      const bale=appliedFilters.baleNo.toUpperCase().trim();
      list = list.filter((i) => (i.baleNo || "").toUpperCase().includes(bale));
    }
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      list = list.filter((i) =>
        (i.voucherNo || "").toLowerCase().includes(q) ||
        (i.invoiceNo || "").toLowerCase().includes(q) ||
        (i.baleNo || "").toLowerCase().includes(q) ||               // bale No search
        (i.supplier?.name || "").toLowerCase().includes(q) ||
        (i.fabric?.name || "").toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) =>
      new Date(b.entryDate || b.createdAt) - new Date(a.entryDate || a.createdAt)
    );
  }, [inwards, appliedFilters]);

  /* ──────── SUMMARY ──────── */
  const summary = useMemo(() => {
    const totalEntries = filteredInwards.length;
    const totalPcs    = filteredInwards.reduce((s, i) => s + (i.totalPcs || 0), 0);
    const totalMeter  = filteredInwards.reduce((s, i) => s + (i.totalMeter || 0), 0);
    const totalAmount = filteredInwards.reduce(
      (s, i) => s + (i.baseCurrencyTotal || (i.totalMeter || 0) * (i.rate || 0) || 0), 0
    );
    return { totalEntries, totalPcs, totalMeter, totalAmount };
  }, [filteredInwards]);

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

  /* ──────── CSV EXPORT ──────── */
  const exportCSV = () => {
    if (filteredInwards.length === 0) return alert("No data to export");

    const headers = [
      "SR No.", "Date", "Voucher No", "Bale No", "Supplier", "Invoice No",
      "Fabric", "Quality", "Total PCS", "Total Meter", "Rate (Per Mtr)", "Total Amount (INR)",
    ];

    const rows = filteredInwards.map((i, idx) => [
      idx + 1,
      formatDate(i.entryDate || i.createdAt),
      i.voucherNo || "",
      i.baleNo || "",                                  // 🆕
      i.supplier?.name || "",
      i.invoiceNo || "",
      i.fabric?.name || "",
      i.fabricQuality?.name || "",
      i.totalPcs || 0,
      i.totalMeter || 0,
      i.rate || 0,
      i.baseCurrencyTotal || ((i.totalMeter || 0) * (i.rate || 0)),
    ]);

    // Totals row
    rows.push([
      "", "", "", "", "", "", "", "Total:",            // 🆕 1 extra blank
      summary.totalPcs, summary.totalMeter.toFixed(2), "", summary.totalAmount.toFixed(2),
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
    link.download = `inward-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ──────── PRINT ──────── */
  const handlePrint = () => {
    window.print();
  };

  const dateRangeLabel = useMemo(() => {
    if (!appliedFilters.fromDate && !appliedFilters.toDate) return "All Time";
    if (appliedFilters.fromDate === appliedFilters.toDate) return formatDate(appliedFilters.fromDate);
    return `${formatDate(appliedFilters.fromDate)} — ${formatDate(appliedFilters.toDate)}`;
  }, [appliedFilters]);

  return (
    <div className="irpt-page">
      {/* HEADER */}
      <div className="irpt-page__header no-print">
        <div>
          <h1 className="irpt-page__title">Inward Report</h1>
          <div className="irpt-breadcrumb">
            <span>Home</span>
            <span className="irpt-breadcrumb__sep">/</span>
            <span>Reports</span>
            <span className="irpt-breadcrumb__sep">/</span>
            <span className="irpt-breadcrumb__current">Inward Report</span>
          </div>
        </div>
        <div className="irpt-page__actions">
          <button className="irpt-btn irpt-btn--ghost" onClick={() => navigate("/dashboard/reports")}>
            <Icon.ArrowLeft /><span>Back to Reports</span>
          </button>
          <button className="irpt-btn irpt-btn--ghost" onClick={exportCSV}>
            <Icon.Download /><span>Export CSV</span>
          </button>
          <button className="irpt-btn irpt-btn--primary" onClick={handlePrint}>
            <Icon.Printer /><span>Print</span>
          </button>
        </div>
      </div>

      {/* DATE PRESETS */}
      <div className="irpt-presets no-print">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            className={`irpt-preset ${activePreset === p.key ? "irpt-preset--active" : ""}`}
            onClick={() => applyPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div className="irpt-card no-print">
        <div className="irpt-filters__row">
          <Field label="From Date">
            <div className="irpt-input-wrap">
              <input type="date" className="irpt-input" value={filters.fromDate} onChange={(e) => setF("fromDate", e.target.value)} />
              <span className="irpt-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="To Date">
            <div className="irpt-input-wrap">
              <input type="date" className="irpt-input" value={filters.toDate} onChange={(e) => setF("toDate", e.target.value)} />
              <span className="irpt-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="Supplier">
            <select className="irpt-input" value={filters.supplier} onChange={(e) => setF("supplier", e.target.value)}>
              <option value="">All Suppliers</option>
              {masters.suppliers.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
          </Field>
          <Field label="Fabric / Item">
            <select className="irpt-input" value={filters.fabric} onChange={(e) => setF("fabric", e.target.value)}>
              <option value="">All Fabrics</option>
              {masters.fabrics.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="irpt-filters__row">
          <Field label="Company">
            <select className="irpt-input" value={filters.company} onChange={(e) => setF("company", e.target.value)}>
              <option value="">All Companies</option>
              {masters.companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          {/* 🆕 BALE NO FILTER */}
          <Field label="Bale No">
            <input
              className="irpt-input irpt-bale-input"
              placeholder="e.g. A35, 1224"
              value={filters.baleNo}
              onChange={(e) => setF("baleNo", e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </Field>
          <Field label="Search">
            <div className="irpt-input-wrap">
              <span className="irpt-input__icon irpt-input__icon--left"><Icon.Search /></span>
              <input
                className="irpt-input irpt-input--with-left-icon"
                placeholder="Search voucher no, invoice no, supplier, fabric..."
                value={filters.search}
                onChange={(e) => setF("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
          </Field>
          <div className="irpt-filters__actions">
            <button className="irpt-btn irpt-btn--ghost" onClick={handleReset}>
              <Icon.Refresh /><span>Reset</span>
            </button>
            <button className="irpt-btn irpt-btn--primary" onClick={handleGenerate}>
              <Icon.Search /><span>Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* ====== PRINT AREA (Header + Summary + Table) ====== */}
      <div className="irpt-print-area">
        {/* Print-only title */}
        <div className="print-only irpt-print-header">
          <h1>Inward Report</h1>
          <div className="irpt-print-meta">
            <div><strong>Period:</strong> {dateRangeLabel}</div>
            <div><strong>Generated:</strong> {formatDate(new Date())}</div>
          </div>
        </div>

        {/* Period banner */}
        <div className="irpt-period-banner no-print">
          <Icon.Calendar />
          <span>Report Period: <strong>{dateRangeLabel}</strong></span>
        </div>

        {/* SUMMARY STATS */}
        <div className="irpt-stats">
          <StatCard label="Total Entries"   value={fmtInt(summary.totalEntries)}            hint="Inward records"   tone="blue"   icon={<Icon.Box />} />
          <StatCard label="Total PCS"       value={fmtInt(summary.totalPcs)}                hint="Taka purchased"   tone="green"  icon={<Icon.Box />} />
          <StatCard label="Total Meter"     value={fmtNum(summary.totalMeter)}              hint="Total fabric"     tone="purple" icon={<Icon.Ruler />} />
          <StatCard label="Total Amount"    value={fmtINR(summary.totalAmount)}             hint="Purchase value"   tone="amber"  icon={<Icon.Rupee />} />
        </div>

        {/* TABLE */}
        <div className="irpt-card">
          <div className="irpt-table-head">
            <h2 className="irpt-card__title">Inward Records</h2>
            <span className="irpt-muted no-print">{filteredInwards.length} entries</span>
          </div>

          <div className="irpt-table-wrap">
            <table className="irpt-table">
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>Date</th>
                  <th>Voucher No</th>
                  <th>Bale No</th>
                  <th>Supplier</th>
                  <th>Invoice No</th>
                  <th>Fabric / Item</th>
                  <th>Quality</th>
                  <th className="irpt-th--right">PCS</th>
                  <th className="irpt-th--right">Meter</th>
                  <th className="irpt-th--right">Rate</th>
                  <th className="irpt-th--right">Amount (INR)</th>
                  <th className="irpt-th--center no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="13" className="irpt-td--empty">Loading...</td></tr>
                ) : filteredInwards.length === 0 ? (
                  <tr><td colSpan="13" className="irpt-td--empty">No inward entries in this period</td></tr>
                ) : (
                  filteredInwards.map((i, idx) => {
                    const amount = i.baseCurrencyTotal || ((i.totalMeter || 0) * (i.rate || 0));
                    return (
                      <tr key={i._id}>
                        <td>{idx + 1}</td>
                        <td>{formatDate(i.entryDate || i.createdAt)}</td>
                        <td className="irpt-mono">{i.voucherNo || "-"}</td>
                        <td>{i.baleNo ? <span className="irpt-bale-chip">{i.baleNo}</span> : "-"}</td>{/* 🆕 */}
                        <td>{i.supplier?.name || "-"}</td>
                        <td className="irpt-mono">{i.invoiceNo || "-"}</td>
                        <td className="irpt-td--strong">{i.fabric?.name || "-"}</td>
                        <td>{i.fabricQuality?.name || "-"}</td>
                        <td className="irpt-td--right">{fmtInt(i.totalPcs)}</td>
                        <td className="irpt-td--right">{fmtNum(i.totalMeter)}</td>
                        <td className="irpt-td--right">{fmtNum(i.rate)}</td>
                        <td className="irpt-td--right irpt-td--strong">{fmtNum(amount)}</td>
                        <td className="irpt-td--center no-print">
                          <button
                            className="irpt-icon-btn"
                            title="View Details"
                            onClick={() => navigate(`/dashboard/inward/${i._id}`)}
                          >
                            <Icon.Eye />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredInwards.length > 0 && (
                <tfoot>
                  <tr className="irpt-total-row">
                    <td colSpan="8" className="irpt-td--strong">TOTAL</td>
                    <td className="irpt-td--right irpt-td--strong">{fmtInt(summary.totalPcs)}</td>
                    <td className="irpt-td--right irpt-td--strong">{fmtNum(summary.totalMeter)}</td>
                    <td></td>
                    <td className="irpt-td--right irpt-td--strong">{fmtNum(summary.totalAmount)}</td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .irpt-page, .irpt-page * { box-sizing: border-box; }
        .irpt-page {
          --irpt-text: #0f172a;
          --irpt-muted: #64748b;
          --irpt-label: #475569;
          --irpt-card: #ffffff;
          --irpt-border: #e5e7eb;
          --irpt-primary: #2563eb;
          --irpt-primary-hover: #1d4ed8;
          --irpt-danger: #ef4444;
          --irpt-success: #10b981;
          --irpt-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--irpt-text);
          font-size: 14px; line-height: 1.4;
          display: flex; flex-direction: column; gap: 16px;
        }
        .irpt-page svg { width: 16px; height: 16px; display: block; }

        .print-only { display: none; }

        /* HEADER */
        .irpt-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .irpt-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .irpt-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--irpt-muted); font-size: 13px; flex-wrap: wrap; }
        .irpt-breadcrumb__sep { color: #cbd5e1; }
        .irpt-breadcrumb__current { color: var(--irpt-primary); font-weight: 500; }
        .irpt-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* BUTTONS */
        .irpt-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .irpt-btn--ghost { background: #fff; border-color: var(--irpt-border); color: var(--irpt-text); }
        .irpt-btn--ghost:hover { background: #f8fafc; }
        .irpt-btn--primary { background: var(--irpt-primary); color: #fff; border-color: var(--irpt-primary); }
        .irpt-btn--primary:hover { background: var(--irpt-primary-hover); }
        .irpt-icon-btn {
          background: #eff6ff; border: none;
          width: 30px; height: 30px;
          border-radius: 6px;
          cursor: pointer; color: var(--irpt-primary);
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .irpt-icon-btn:hover { background: #dbeafe; }
        .irpt-icon-btn svg { width: 14px; height: 14px; }

        /* DATE PRESETS */
        .irpt-presets {
          display: flex; flex-wrap: wrap; gap: 8px;
        }
        .irpt-preset {
          padding: 7px 14px;
          border: 1px solid var(--irpt-border);
          background: #fff;
          border-radius: 20px;
          font-size: 13px; font-weight: 500;
          color: var(--irpt-label);
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
        }
        .irpt-preset:hover { border-color: var(--irpt-primary); color: var(--irpt-primary); }
        .irpt-preset--active {
          background: var(--irpt-primary); color: #fff;
          border-color: var(--irpt-primary);
        }

        /* CARD */
        .irpt-card {
          background: var(--irpt-card);
          border: 1px solid var(--irpt-border);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--irpt-shadow);
        }
        .irpt-card__title { font-size: 15px; font-weight: 600; margin: 0; }

        /* FILTERS */
        .irpt-filters__row {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px; margin-bottom: 12px;
        }
        .irpt-filters__row:last-child { margin-bottom: 0; }
        .irpt-filters__actions { display: flex; gap: 8px; align-items: flex-end; }

        /* FIELDS */
        .irpt-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .irpt-field--full { grid-column: span 2; }
        .irpt-field__label { font-size: 12px; font-weight: 500; color: var(--irpt-label); }

        .irpt-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--irpt-border);
          border-radius: 8px; background: #fff;
          font-size: 13px; color: var(--irpt-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .irpt-input:focus {
          outline: none; border-color: var(--irpt-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .irpt-input::placeholder { color: #94a3b8; }
        .irpt-input--with-left-icon { padding-left: 36px; }
        .irpt-input-wrap { position: relative; }
        .irpt-input-wrap .irpt-input:not(.irpt-input--with-left-icon) { padding-right: 34px; }
        .irpt-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--irpt-muted); pointer-events: none;
        }
        .irpt-input__icon--left { left: 10px; right: auto; }

        /* PERIOD BANNER */
        .irpt-period-banner {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 12px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px;
          color: #1e40af;
          margin-bottom: 20px;
        }
        .irpt-period-banner svg { color: var(--irpt-primary); }

        /* STATS */
        .irpt-stats {
          display: grid; grid-template-columns: repeat(4, 1fr);
          gap: 14px;
          margin-bottom: 20px;
        }
        .irpt-stat {
          background: var(--irpt-card); border: 1px solid var(--irpt-border);
          border-radius: 12px; padding: 16px;
          box-shadow: var(--irpt-shadow);
          display: flex; align-items: center; gap: 12px;
        }
        .irpt-stat__icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .irpt-stat__icon svg { width: 22px; height: 22px; }
        .irpt-stat__icon--blue   { background: #dbeafe; color: #2563eb; }
        .irpt-stat__icon--green  { background: #d1fae5; color: #059669; }
        .irpt-stat__icon--purple { background: #f3e8ff; color: #9333ea; }
        .irpt-stat__icon--amber  { background: #fef3c7; color: #d97706; }
        .irpt-stat__label { font-size: 12px; color: var(--irpt-muted); margin-bottom: 4px; }
        .irpt-stat__value { font-size: 20px; font-weight: 700; line-height: 1.2; }
        .irpt-stat__hint { font-size: 11px; color: var(--irpt-muted); margin-top: 2px; }

        /* TABLE */
        .irpt-table-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .irpt-muted { color: var(--irpt-muted); font-size: 13px; }

        .irpt-table-wrap { overflow-x: auto; }
        .irpt-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        .irpt-table th {
          background: #f8fafc; padding: 11px 12px;
          font-size: 11px; font-weight: 600;
          color: var(--irpt-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--irpt-border);
          white-space: nowrap;
        }
        .irpt-th--right { text-align: right; }
        .irpt-th--center { text-align: center; }
        .irpt-table td {
          padding: 12px; font-size: 13px;
          border-bottom: 1px solid var(--irpt-border);
          white-space: nowrap;
        }
        .irpt-table tbody tr:hover { background: #fafbfc; }
        .irpt-table tbody tr:last-child td { border-bottom: none; }
        .irpt-td--right { text-align: right; }
        .irpt-td--center { text-align: center; }
        .irpt-td--strong { font-weight: 600; }
        .irpt-td--empty { text-align: center; color: var(--irpt-muted); padding: 40px !important; }
        .irpt-mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: var(--irpt-primary); }

        /* 🆕 Bale No chip & input */
        .irpt-bale-chip {
          display: inline-block;
          padding: 3px 9px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }
        .irpt-bale-input {
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .irpt-total-row td {
          background: #f8fafc;
          padding: 14px 12px;
          font-size: 13px;
          border-top: 2px solid var(--irpt-border);
          border-bottom: none;
        }

        /* RESPONSIVE */
        @media (max-width: 1200px) {
          .irpt-stats { grid-template-columns: repeat(2, 1fr); }
          .irpt-filters__row { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .irpt-page__title { font-size: 20px; }
          .irpt-filters__actions { grid-column: 1 / -1; justify-content: flex-end; }
        }
        @media (max-width: 560px) {
          .irpt-stats { grid-template-columns: 1fr; }
          .irpt-filters__row { grid-template-columns: 1fr; }
          .irpt-page__actions { width: 100%; }
          .irpt-page__actions .irpt-btn { flex: 1; justify-content: center; }
          .irpt-preset { padding: 6px 12px; font-size: 12px; }
        }

        /* ════════════════════════════════
           PRINT STYLES
           ════════════════════════════════ */
        @media print {
          body * { visibility: hidden; }
          .irpt-print-area, .irpt-print-area * { visibility: visible; }
          .irpt-print-area {
            position: absolute; left: 0; top: 0; width: 100%;
          }
          .no-print { display: none !important; }
          .print-only { display: block !important; }

          .irpt-print-header {
            text-align: center;
            margin-bottom: 24px;
            padding-bottom: 16px;
            border-bottom: 2px solid #000;
          }
          .irpt-print-header h1 {
            font-size: 24px;
            margin: 0 0 8px 0;
          }
          .irpt-print-meta {
            display: flex;
            justify-content: center;
            gap: 30px;
            font-size: 12px;
          }
          .irpt-stats {
            grid-template-columns: repeat(4, 1fr);
            margin-bottom: 20px;
            gap: 10px;
          }
          .irpt-stat {
            padding: 10px;
            border: 1px solid #ccc;
            box-shadow: none;
          }
          .irpt-stat__value { font-size: 16px; }
          .irpt-card {
            border: 1px solid #ccc;
            box-shadow: none;
            page-break-inside: auto;
          }
          .irpt-table {
            min-width: 0;
            font-size: 11px;
          }
          .irpt-table th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .irpt-table th, .irpt-table td {
            padding: 6px 8px;
            border: 1px solid #ddd;
          }
          .irpt-table tbody tr { page-break-inside: avoid; }
          .irpt-total-row td { background: #f8f8f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }
        }
      `}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
function Field({ label, full, children }) {
  return (
    <div className={`irpt-field ${full ? "irpt-field--full" : ""}`}>
      <label className="irpt-field__label">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, hint, icon, tone }) {
  return (
    <div className="irpt-stat">
      <div className={`irpt-stat__icon irpt-stat__icon--${tone}`}>{icon}</div>
      <div>
        <div className="irpt-stat__label">{label}</div>
        <div className="irpt-stat__value">{value}</div>
        <div className="irpt-stat__hint">{hint}</div>
      </div>
    </div>
  );
}
import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryApi } from "../../Api/inventoryApi";
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
  Box: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  Ruler: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h20M5 12V8M9 12v-2M13 12V8M17 12v-2M21 12V8" /></svg>,
  Rupee: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8 8M14 8c0 2.76-2.24 5-5 5H6" /></svg>,
  Alert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
};

/* ================================================================
   HELPERS
   ================================================================ */
const formatDate = (d) => new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtINR = (n) => "₹ " + fmtNum(n);

const STATUS_CHIPS = [
  { key: "all", label: "All Items" },
  { key: "in", label: "In Stock" },
  { key: "low", label: "Partial Stock" },     // 🔧 renamed
  { key: "out", label: "Out of Stock" },
];

const EMPTY_FILTERS = {
  fabric: "", fabricQuality: "", color: "", location: "",
  baleNo: "",                    // 🆕
  search: "",
};

const getStatus = (inv) => {
  const avail = inv.availablePcs ?? inv.totalPcs ?? 0;
  if (avail <= 0) return "Out of Stock";
  if (avail <= (inv.minStockPcs || 2)) return "Partial Stock";    // 🔧 renamed
  return "In Stock";
};

/* ================================================================
   MAIN
   ================================================================ */
export default function InvReport() {
  const navigate = useNavigate();

  const [inventory, setInventory] = useState([]);
  const [masters, setMasters] = useState({ fabrics: [], qualities: [], colors: [], locations: [] });
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);
  const [statusChip, setStatusChip] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const setF = (k, v) => setFilters({ ...filters, [k]: v });

  /* ──────── LOAD ──────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [invData, mastersData] = await Promise.all([
          inventoryApi.getAll(),
          fetchAllMasters(),
        ]);
        setInventory(invData);
        setMasters({
          fabrics:   mastersData.fabrics || [],
          qualities: mastersData.qualities || [],
          colors:    mastersData.colors || [],
          locations: mastersData.locations || [],
        });
      } catch (err) {
        alert("Failed to load: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ──────── FILTER LOGIC ──────── */
  const filteredInventory = useMemo(() => {
    let list = [...inventory];

    // Status chip filter
    if (statusChip === "in")  list = list.filter((i) => getStatus(i) === "In Stock");
    if (statusChip === "low") list = list.filter((i) => getStatus(i) === "Partial Stock");   // 🔧
    if (statusChip === "out") list = list.filter((i) => getStatus(i) === "Out of Stock");

    if (appliedFilters.fabric)        list = list.filter((i) => (i.fabric?._id || i.fabric) === appliedFilters.fabric);
    if (appliedFilters.fabricQuality) list = list.filter((i) => (i.fabricQuality?._id || i.fabricQuality) === appliedFilters.fabricQuality);
    if (appliedFilters.color)         list = list.filter((i) => (i.color?._id || i.color) === appliedFilters.color);
    if (appliedFilters.location)      list = list.filter((i) => (i.location?._id || i.location) === appliedFilters.location);
   // 🆕 Multi-bale comma filter
    if (appliedFilters.baleNo) {
      const baleList = appliedFilters.baleNo
        .split(",")
        .map((b) => b.trim().toUpperCase())
        .filter(Boolean);

      if (baleList.length > 0) {
        list = list.filter((i) => {
          const bn = (i.baleNo || "").toUpperCase();
          return baleList.some((b) => bn.includes(b));    // ANY match
        });
      }
    }

    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      list = list.filter((i) =>
        (i.baleNo || "").toLowerCase().includes(q) ||                     // 🆕 baleNo in search
        (i.fabric?.name || "").toLowerCase().includes(q) ||
        (i.fabricQuality?.name || "").toLowerCase().includes(q) ||
        (i.color?.name || "").toLowerCase().includes(q) ||
        (i.location?.name || "").toLowerCase().includes(q)
      );
    }

    return list.sort((a, b) => (b.availablePcs || 0) - (a.availablePcs || 0));  // 🆕 sort by available
  }, [inventory, appliedFilters, statusChip]);

  /* ──────── SUMMARY ──────── */
  const summary = useMemo(() => {
    const totalItems = filteredInventory.length;
    const totalPcs   = filteredInventory.reduce((s, i) => s + (i.availablePcs || 0), 0);    // 🆕
    const totalMeter = filteredInventory.reduce((s, i) => s + (i.availableMeter || 0), 0);  // 🆕
    const totalValue = filteredInventory.reduce((s, i) => s + (i.totalValue || 0), 0);
    const lowStock   = filteredInventory.filter((i) => getStatus(i) === "Partial Stock").length;   // 🔧
    const outStock   = filteredInventory.filter((i) => getStatus(i) === "Out of Stock").length;
    return { totalItems, totalPcs, totalMeter, totalValue, lowStock, outStock };
  }, [filteredInventory]);

  /* ──────── HANDLERS ──────── */
  const handleGenerate = () => setAppliedFilters(filters);

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
    setStatusChip("all");
  };

  const exportCSV = () => {
    if (filteredInventory.length === 0) return alert("No data to export");

    const headers = [
      "SR No.", "Bale No", "Fabric / Item", "Quality", "Color", "Location",
      "Available PCS", "Total PCS", "Sold PCS",
      "Available Meter", "Rate", "Total Value (INR)", "Min Stock", "Status",
    ];

    const rows = filteredInventory.map((i, idx) => {
      const avail = i.availablePcs ?? 0;
      const total = i.totalPcs ?? 0;
      const sold = Math.max(total - avail, 0);
      return [
        idx + 1,
        i.baleNo || "",                   // 🆕
        i.fabric?.name || "",
        i.fabricQuality?.name || "",
        i.color?.name || "",
        i.location?.name || "",
        avail,                            // 🆕 Available PCS
        total,                            // 🆕 Total PCS
        sold,                             // 🆕 Sold PCS
        i.availableMeter || 0,            // 🆕
        i.rate || 0,                      // 🆕 rate not avgRate
        i.totalValue || 0,
        i.minStockPcs || 2,
        getStatus(i),
      ];
    });

    rows.push([
      "", "", "", "", "", "TOTAL:",
      summary.totalPcs, "", "",
      summary.totalMeter.toFixed(2), "", summary.totalValue.toFixed(2), "", "",
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
    link.download = `inventory-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* ──────── PAGINATION (screen table only — exportCSV/print above keep using filteredInventory) ──────── */
  const totalPages = Math.max(1, Math.ceil(filteredInventory.length / ITEMS_PER_PAGE));

  const paginatedInventory = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredInventory.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredInventory, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [appliedFilters, statusChip]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <div className="invrpt-page">
      {/* HEADER */}
      <div className="invrpt-page__header no-print">
        <div>
          <h1 className="invrpt-page__title">Inventory Report</h1>
          <div className="invrpt-breadcrumb">
            <span>Home</span>
            <span className="invrpt-breadcrumb__sep">/</span>
            <span>Reports</span>
            <span className="invrpt-breadcrumb__sep">/</span>
            <span className="invrpt-breadcrumb__current">Inventory Report</span>
          </div>
        </div>
        <div className="invrpt-page__actions">
          <button className="invrpt-btn invrpt-btn--ghost" onClick={() => navigate("/dashboard/reports")}>
            <Icon.ArrowLeft /><span>Back to Reports</span>
          </button>
          <button className="invrpt-btn invrpt-btn--ghost" onClick={exportCSV}>
            <Icon.Download /><span>Export CSV</span>
          </button>
          <button className="invrpt-btn invrpt-btn--primary" onClick={() => window.print()}>
            <Icon.Printer /><span>Print</span>
          </button>
        </div>
      </div>

      {/* STATUS CHIPS */}
      <div className="invrpt-chips no-print">
        {STATUS_CHIPS.map((c) => (
          <button
            key={c.key}
            className={`invrpt-chip ${statusChip === c.key ? "invrpt-chip--active" : ""}`}
            onClick={() => setStatusChip(c.key)}
          >
            {c.label}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div className="invrpt-card no-print">
        <div className="invrpt-filters__row">
          <Field label="Fabric / Item">
            <select className="invrpt-input" value={filters.fabric} onChange={(e) => setF("fabric", e.target.value)}>
              <option value="">All Fabrics</option>
              {masters.fabrics.map((f) => <option key={f._id} value={f._id}>{f.name}</option>)}
            </select>
          </Field>
          <Field label="Quality">
            <select className="invrpt-input" value={filters.fabricQuality} onChange={(e) => setF("fabricQuality", e.target.value)}>
              <option value="">All Quality</option>
              {masters.qualities.map((q) => <option key={q._id} value={q._id}>{q.name}</option>)}
            </select>
          </Field>
          <Field label="Color">
            <select className="invrpt-input" value={filters.color} onChange={(e) => setF("color", e.target.value)}>
              <option value="">All Colors</option>
              {masters.colors.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Location">
            <select className="invrpt-input" value={filters.location} onChange={(e) => setF("location", e.target.value)}>
              <option value="">All Locations</option>
              {masters.locations.map((l) => <option key={l._id} value={l._id}>{l.name}</option>)}
            </select>
          </Field>
        </div>

        <div className="invrpt-filters__row">
          {/* 🆕 Bale No filter */}
          <Field label="Bale No">
            <input
              className="invrpt-input invrpt-bale-input"
              placeholder="e.g. A35, 1224"
              value={filters.baleNo}
              onChange={(e) => setF("baleNo", e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </Field>
          <Field label="Search" full>
            <div className="invrpt-input-wrap">
              <span className="invrpt-input__icon invrpt-input__icon--left"><Icon.Search /></span>
              <input
                className="invrpt-input invrpt-input--with-left-icon"
                placeholder="Search fabric, quality, color, location..."
                value={filters.search}
                onChange={(e) => setF("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
          </Field>
          <div className="invrpt-filters__actions">
            <button className="invrpt-btn invrpt-btn--ghost" onClick={handleReset}>
              <Icon.Refresh /><span>Reset</span>
            </button>
            <button className="invrpt-btn invrpt-btn--primary" onClick={handleGenerate}>
              <Icon.Search /><span>Generate</span>
            </button>
          </div>
        </div>
      </div>

      {/* PRINT AREA */}
      <div className="invrpt-print-area">
        <div className="print-only invrpt-print-header">
          <h1>Inventory Report</h1>
          <div className="invrpt-print-meta">
            <div><strong>Stock as of:</strong> {formatDate(new Date())}</div>
            <div><strong>Status Filter:</strong> {STATUS_CHIPS.find((c) => c.key === statusChip)?.label}</div>
          </div>
        </div>

        <div className="invrpt-period-banner no-print">
          <Icon.Box />
          <span>Stock snapshot as of <strong>{formatDate(new Date())}</strong></span>
        </div>

        {/* SUMMARY */}
        <div className="invrpt-stats">
          <StatCard label="Total Items"   value={fmtInt(summary.totalItems)} hint="Unique combos" tone="blue"   icon={<Icon.Box />} />
          <StatCard label="Total PCS"     value={fmtInt(summary.totalPcs)}   hint="Available"     tone="green"  icon={<Icon.Box />} />
          <StatCard label="Total Meter"   value={fmtNum(summary.totalMeter)} hint="In stock"      tone="purple" icon={<Icon.Ruler />} />
          <StatCard label="Total Value"   value={fmtINR(summary.totalValue)} hint="Stock value"   tone="amber"  icon={<Icon.Rupee />} />
          <StatCard label="Partial Stock" value={fmtInt(summary.lowStock)}   hint="Below minimum" tone="orange" icon={<Icon.Alert />} />
          <StatCard label="Out of Stock"  value={fmtInt(summary.outStock)}   hint="No stock"      tone="red"    icon={<Icon.Alert />} />
        </div>

        {/* TABLE */}
        <div className="invrpt-card">
          <div className="invrpt-table-head">
            <h2 className="invrpt-card__title">Stock Details</h2>
            <span className="invrpt-muted no-print">{filteredInventory.length} items</span>
          </div>

          <div className="invrpt-table-wrap no-print">
            <table className="invrpt-table">
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>Bale No</th>{/* 🆕 */}
                  <th>Fabric / Item</th>
                  <th>Quality</th>
                  <th>Color</th>
                  <th>Location</th>
                  <th className="invrpt-th--right">PCS (Avail/Total)</th>{/* 🆕 label */}
                  <th className="invrpt-th--right">Avail. Meter</th>{/* 🆕 label */}
                  <th className="invrpt-th--right">Rate</th>{/* 🆕 was "Avg Rate" */}
                  <th className="invrpt-th--right">Total Value</th>
                  <th className="invrpt-th--center">Status</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="11" className="invrpt-td--empty">Loading...</td></tr>
                ) : filteredInventory.length === 0 ? (
                  <tr><td colSpan="11" className="invrpt-td--empty">No inventory matches these filters</td></tr>
                ) : (
                  paginatedInventory.map((i, idx) => {
                    const status = getStatus(i);
                    const statusClass = status.toLowerCase().replace(/ /g, "-");
                    const avail = i.availablePcs ?? 0;
                    const total = i.totalPcs ?? 0;
                    const sold = Math.max(total - avail, 0);
                    return (
                      <tr key={i._id}>
                        <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                        <td>{i.baleNo ? <span className="invrpt-bale-chip">{i.baleNo}</span> : "-"}</td>{/* 🆕 */}
                        <td className="invrpt-td--strong">{i.fabric?.name || "-"}</td>
                        <td>{i.fabricQuality?.name || "-"}</td>
                        <td>{i.color?.name || "-"}</td>
                        <td>{i.location?.name || "-"}</td>
                        <td className="invrpt-td--right">
                          <span className="invrpt-pcs-avail">{fmtInt(avail)}</span>
                          <span className="invrpt-pcs-sep"> / </span>
                          <span className="invrpt-pcs-total">{fmtInt(total)}</span>
                          {sold > 0 && <div className="invrpt-pcs-sold">{sold} sold</div>}
                        </td>
                        <td className="invrpt-td--right">{fmtNum(i.availableMeter)}</td>{/* 🆕 */}
                        <td className="invrpt-td--right">{fmtNum(i.rate)}</td>{/* 🆕 rate not avgRate */}
                        <td className="invrpt-td--right invrpt-td--strong">{fmtNum(i.totalValue)}</td>
                        <td className="invrpt-td--center">
                          <span className={`invrpt-badge invrpt-badge--${statusClass}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredInventory.length > 0 && (
                <tfoot>
                  <tr className="invrpt-total-row">
                    <td colSpan="6" className="invrpt-td--strong">TOTAL</td>{/* 🆕 5→6 */}
                    <td className="invrpt-td--right invrpt-td--strong">{fmtInt(summary.totalPcs)}</td>
                    <td className="invrpt-td--right invrpt-td--strong">{fmtNum(summary.totalMeter)}</td>
                    <td></td>
                    <td className="invrpt-td--right invrpt-td--strong">{fmtNum(summary.totalValue)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Print-only: full unpaginated table so printing always shows every filtered row */}
          <div className="invrpt-table-wrap print-only">
            <table className="invrpt-table">
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>Bale No</th>
                  <th>Fabric / Item</th>
                  <th>Quality</th>
                  <th>Color</th>
                  <th>Location</th>
                  <th className="invrpt-th--right">PCS (Avail/Total)</th>
                  <th className="invrpt-th--right">Avail. Meter</th>
                  <th className="invrpt-th--right">Rate</th>
                  <th className="invrpt-th--right">Total Value</th>
                  <th className="invrpt-th--center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr><td colSpan="11" className="invrpt-td--empty">No inventory matches these filters</td></tr>
                ) : (
                  filteredInventory.map((i, idx) => {
                    const status = getStatus(i);
                    const statusClass = status.toLowerCase().replace(/ /g, "-");
                    const avail = i.availablePcs ?? 0;
                    const total = i.totalPcs ?? 0;
                    const sold = Math.max(total - avail, 0);
                    return (
                      <tr key={i._id}>
                        <td>{idx + 1}</td>
                        <td>{i.baleNo ? <span className="invrpt-bale-chip">{i.baleNo}</span> : "-"}</td>
                        <td className="invrpt-td--strong">{i.fabric?.name || "-"}</td>
                        <td>{i.fabricQuality?.name || "-"}</td>
                        <td>{i.color?.name || "-"}</td>
                        <td>{i.location?.name || "-"}</td>
                        <td className="invrpt-td--right">
                          <span className="invrpt-pcs-avail">{fmtInt(avail)}</span>
                          <span className="invrpt-pcs-sep"> / </span>
                          <span className="invrpt-pcs-total">{fmtInt(total)}</span>
                          {sold > 0 && <div className="invrpt-pcs-sold">{sold} sold</div>}
                        </td>
                        <td className="invrpt-td--right">{fmtNum(i.availableMeter)}</td>
                        <td className="invrpt-td--right">{fmtNum(i.rate)}</td>
                        <td className="invrpt-td--right invrpt-td--strong">{fmtNum(i.totalValue)}</td>
                        <td className="invrpt-td--center">
                          <span className={`invrpt-badge invrpt-badge--${statusClass}`}>{status}</span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
              {filteredInventory.length > 0 && (
                <tfoot>
                  <tr className="invrpt-total-row">
                    <td colSpan="6" className="invrpt-td--strong">TOTAL</td>
                    <td className="invrpt-td--right invrpt-td--strong">{fmtInt(summary.totalPcs)}</td>
                    <td className="invrpt-td--right invrpt-td--strong">{fmtNum(summary.totalMeter)}</td>
                    <td></td>
                    <td className="invrpt-td--right invrpt-td--strong">{fmtNum(summary.totalValue)}</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination — screen only, does not affect export/print (both use filteredInventory above) */}
          <div className="invrpt-pagination no-print">
            <div className="invrpt-pagination__info">
              Showing {filteredInventory.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredInventory.length)} of {filteredInventory.length} entries
            </div>
            <div className="invrpt-pagination__controls">
              <button
                className="invrpt-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`invrpt-page-btn ${page === currentPage ? "invrpt-page-btn--active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="invrpt-page-btn"
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
        .invrpt-page, .invrpt-page * { box-sizing: border-box; }
        .invrpt-page {
          --invrpt-text: #0f172a; --invrpt-muted: #64748b; --invrpt-label: #475569;
          --invrpt-card: #ffffff; --invrpt-border: #e5e7eb;
          --invrpt-primary: #2563eb; --invrpt-primary-hover: #1d4ed8;
          --invrpt-danger: #ef4444; --invrpt-success: #10b981; --invrpt-warning: #f59e0b;
          --invrpt-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--invrpt-text); font-size: 14px; line-height: 1.4;
          display: flex; flex-direction: column; gap: 16px;
        }
        .invrpt-page svg { width: 16px; height: 16px; display: block; }
        .print-only { display: none; }

        .invrpt-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .invrpt-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .invrpt-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--invrpt-muted); font-size: 13px; flex-wrap: wrap; }
        .invrpt-breadcrumb__sep { color: #cbd5e1; }
        .invrpt-breadcrumb__current { color: var(--invrpt-primary); font-weight: 500; }
        .invrpt-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .invrpt-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .invrpt-btn--ghost { background: #fff; border-color: var(--invrpt-border); color: var(--invrpt-text); }
        .invrpt-btn--ghost:hover { background: #f8fafc; }
        .invrpt-btn--primary { background: var(--invrpt-primary); color: #fff; border-color: var(--invrpt-primary); }
        .invrpt-btn--primary:hover { background: var(--invrpt-primary-hover); }

        .invrpt-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .invrpt-chip {
          padding: 7px 14px;
          border: 1px solid var(--invrpt-border);
          background: #fff;
          border-radius: 20px;
          font-size: 13px; font-weight: 500;
          color: var(--invrpt-label);
          cursor: pointer; transition: all 0.15s;
          font-family: inherit;
        }
        .invrpt-chip:hover { border-color: var(--invrpt-primary); color: var(--invrpt-primary); }
        .invrpt-chip--active { background: var(--invrpt-primary); color: #fff; border-color: var(--invrpt-primary); }

        .invrpt-card {
          background: var(--invrpt-card); border: 1px solid var(--invrpt-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--invrpt-shadow);
        }
        .invrpt-card__title { font-size: 15px; font-weight: 600; margin: 0; }

        .invrpt-filters__row {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 12px; margin-bottom: 12px;
        }
        .invrpt-filters__row:last-child { margin-bottom: 0; grid-template-columns: 1fr 2fr auto; }
        .invrpt-filters__actions { display: flex; gap: 8px; align-items: flex-end; }

        .invrpt-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .invrpt-field--full { grid-column: span 3; }
        .invrpt-field__label { font-size: 12px; font-weight: 500; color: var(--invrpt-label); }

        .invrpt-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--invrpt-border);
          border-radius: 8px; background: #fff;
          font-size: 13px; color: var(--invrpt-text);
          font-family: inherit;
        }
        .invrpt-input:focus {
          outline: none; border-color: var(--invrpt-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .invrpt-input--with-left-icon { padding-left: 36px; }
        .invrpt-input-wrap { position: relative; }
        .invrpt-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--invrpt-muted); pointer-events: none;
        }
        .invrpt-input__icon--left { left: 10px; right: auto; }

        .invrpt-period-banner {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 12px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #1e40af;
          margin-bottom: 20px;
        }
        .invrpt-period-banner svg { color: var(--invrpt-primary); }

        .invrpt-stats {
          display: grid; grid-template-columns: repeat(6, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .invrpt-stat {
          background: var(--invrpt-card); border: 1px solid var(--invrpt-border);
          border-radius: 12px; padding: 14px;
          box-shadow: var(--invrpt-shadow);
          display: flex; align-items: center; gap: 10px;
        }
        .invrpt-stat__icon {
          width: 38px; height: 38px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .invrpt-stat__icon svg { width: 18px; height: 18px; }
        .invrpt-stat__icon--blue   { background: #dbeafe; color: #2563eb; }
        .invrpt-stat__icon--green  { background: #d1fae5; color: #059669; }
        .invrpt-stat__icon--purple { background: #f3e8ff; color: #9333ea; }
        .invrpt-stat__icon--amber  { background: #fef3c7; color: #d97706; }
        .invrpt-stat__icon--orange { background: #ffedd5; color: #ea580c; }
        .invrpt-stat__icon--red    { background: #fee2e2; color: #dc2626; }
        .invrpt-stat__label { font-size: 11px; color: var(--invrpt-muted); }
        .invrpt-stat__value { font-size: 17px; font-weight: 700; line-height: 1.2; }
        .invrpt-stat__hint { font-size: 10px; color: var(--invrpt-muted); margin-top: 2px; }

        .invrpt-table-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .invrpt-muted { color: var(--invrpt-muted); font-size: 13px; }

        .invrpt-table-wrap { overflow-x: auto; }
        .invrpt-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        .invrpt-table th {
          background: #f8fafc; padding: 11px 12px;
          font-size: 11px; font-weight: 600;
          color: var(--invrpt-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--invrpt-border);
          white-space: nowrap;
        }
        .invrpt-th--right { text-align: right; }
        .invrpt-th--center { text-align: center; }
        .invrpt-table td {
          padding: 12px; font-size: 13px;
          border-bottom: 1px solid var(--invrpt-border);
          white-space: nowrap;
        }
        .invrpt-table tbody tr:hover { background: #fafbfc; }
        .invrpt-table tbody tr:last-child td { border-bottom: none; }
        .invrpt-td--right { text-align: right; }
        .invrpt-td--center { text-align: center; }
        .invrpt-td--strong { font-weight: 600; }
        .invrpt-td--empty { text-align: center; color: var(--invrpt-muted); padding: 40px !important; }

        .invrpt-badge {
          display: inline-block; padding: 3px 10px;
          border-radius: 12px; font-size: 11px; font-weight: 600;
        }
        .invrpt-badge--in-stock       { background: #d1fae5; color: #047857; }
        .invrpt-badge--partial-stock  { background: #ffedd5; color: #c2410c; }     /* 🔧 renamed */
        .invrpt-badge--out-of-stock   { background: #fee2e2; color: #b91c1c; }

        /* 🆕 Bale chip + input */
        .invrpt-bale-chip {
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
        .invrpt-bale-input {
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        /* 🆕 PCS available/total display */
        .invrpt-pcs-avail { font-weight: 700; color: #0f172a; }
        .invrpt-pcs-sep   { color: #cbd5e1; }
        .invrpt-pcs-total { color: var(--invrpt-muted); font-size: 12px; }
        .invrpt-pcs-sold {
          font-size: 10px;
          color: var(--invrpt-muted);
          margin-top: 2px;
          font-style: italic;
        }

        .invrpt-total-row td {
          background: #f8fafc; padding: 14px 12px;
          font-size: 13px;
          border-top: 2px solid var(--invrpt-border);
          border-bottom: none;
        }

        .invrpt-pagination {
          padding: 12px 4px 0;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--invrpt-border);
          margin-top: 14px;
        }
        .invrpt-pagination__info { font-size: 13px; color: var(--invrpt-muted); }
        .invrpt-pagination__controls { display: flex; gap: 6px; flex-wrap: wrap; }
        .invrpt-page-btn {
          min-width: 32px; padding: 6px 12px;
          border: 1px solid var(--invrpt-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--invrpt-text); font-family: inherit;
        }
        .invrpt-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .invrpt-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .invrpt-page-btn--active { background: var(--invrpt-primary); color: #fff; border-color: var(--invrpt-primary); }

        @media (max-width: 1400px) {
          .invrpt-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1100px) {
          .invrpt-filters__row { grid-template-columns: repeat(2, 1fr); }
          .invrpt-filters__row:last-child { grid-template-columns: 1fr 1fr auto; }
        }
        @media (max-width: 768px) {
          .invrpt-page__title { font-size: 20px; }
          .invrpt-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .invrpt-stats { grid-template-columns: 1fr; }
          .invrpt-filters__row { grid-template-columns: 1fr; }
          .invrpt-filters__row:last-child { grid-template-columns: 1fr; }
          .invrpt-page__actions { width: 100%; }
          .invrpt-page__actions .invrpt-btn { flex: 1; justify-content: center; }
        }

        /* PRINT */
        @media print {
          body * { visibility: hidden; }
          .invrpt-print-area, .invrpt-print-area * { visibility: visible; }
          .invrpt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }
          .invrpt-print-header {
            text-align: center; margin-bottom: 20px;
            padding-bottom: 14px; border-bottom: 2px solid #000;
          }
          .invrpt-print-header h1 { font-size: 22px; margin: 0 0 8px 0; }
          .invrpt-print-meta { display: flex; justify-content: center; gap: 30px; font-size: 12px; }
          .invrpt-stats { grid-template-columns: repeat(6, 1fr); margin-bottom: 16px; gap: 8px; }
          .invrpt-stat { padding: 8px; border: 1px solid #ccc; box-shadow: none; }
          .invrpt-stat__value { font-size: 14px; }
          .invrpt-card { border: 1px solid #ccc; box-shadow: none; }
          .invrpt-table { min-width: 0; font-size: 11px; }
          .invrpt-table th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .invrpt-table th, .invrpt-table td { padding: 6px 8px; border: 1px solid #ddd; }
          .invrpt-badge { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .invrpt-total-row td { background: #f8f8f8 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; font-weight: bold; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, full, children }) {
  return (
    <div className={`invrpt-field ${full ? "invrpt-field--full" : ""}`}>
      <label className="invrpt-field__label">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, hint, icon, tone }) {
  return (
    <div className="invrpt-stat">
      <div className={`invrpt-stat__icon invrpt-stat__icon--${tone}`}>{icon}</div>
      <div>
        <div className="invrpt-stat__label">{label}</div>
        <div className="invrpt-stat__value">{value}</div>
        <div className="invrpt-stat__hint">{hint}</div>
      </div>
    </div>
  );
}
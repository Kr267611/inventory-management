import React, { useState, useMemo } from "react";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  Book: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
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
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Filter: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

/* ================================================================
   MOCK DATA — baad me API se replace karna
   ================================================================ */
const STATS = [
  { label: "Total Items",       value: "128",            hint: "Unique Items",        tone: "default" },
  { label: "Total Stock (Mtr)", value: "15,240.75",      hint: "In Stock",            tone: "default" },
  { label: "Total Value (INR)", value: "₹ 18,75,320.50", hint: "Stock Value",         tone: "default" },
  { label: "Low Stock Items",   value: "12",             hint: "Below Minimum Level", tone: "warning" },
  { label: "Out of Stock Items",value: "3",              hint: "No Stock Available",  tone: "danger"  },
];

const INVENTORY = [
  { id: 1, item: "GREY FABRIC",   quality: "POLY KNIT BIG", color: "GREY",   pcs: 8, meter: 25.59, totalMeter: 204.72, rate: 95.00,  totalValue: 19449.60, location: "Godown A", status: "In Stock" },
  { id: 2, item: "BLUE FABRIC",   quality: "POLY KNIT BIG", color: "BLUE",   pcs: 5, meter: 25.65, totalMeter: 128.25, rate: 92.00,  totalValue: 11801.00, location: "Godown A", status: "In Stock" },
  { id: 3, item: "BLACK FABRIC",  quality: "POLY KNIT BIG", color: "BLACK",  pcs: 6, meter: 25.62, totalMeter: 153.72, rate: 98.00,  totalValue: 15066.56, location: "Godown B", status: "In Stock" },
  { id: 4, item: "WHITE FABRIC",  quality: "POLY KNIT BIG", color: "WHITE",  pcs: 4, meter: 25.92, totalMeter: 103.68, rate: 90.00,  totalValue: 9331.20,  location: "Godown B", status: "Low Stock" },
  { id: 5, item: "NAVY FABRIC",   quality: "POLY KNIT BIG", color: "NAVY",   pcs: 3, meter: 25.94, totalMeter: 77.82,  rate: 97.00,  totalValue: 7547.54,  location: "Godown A", status: "Low Stock" },
  { id: 6, item: "RED FABRIC",    quality: "POLY KNIT BIG", color: "RED",    pcs: 2, meter: 25.17, totalMeter: 50.34,  rate: 100.00, totalValue: 5034.00,  location: "Godown B", status: "Low Stock" },
  { id: 7, item: "GREEN FABRIC",  quality: "POLY KNIT BIG", color: "GREEN",  pcs: 0, meter: 0,     totalMeter: 0,      rate: null,   totalValue: 0,        location: "Godown A", status: "Out of Stock" },
  { id: 8, item: "YELLOW FABRIC", quality: "POLY KNIT BIG", color: "YELLOW", pcs: 0, meter: 0,     totalMeter: 0,      rate: null,   totalValue: 0,        location: "Godown B", status: "Out of Stock" },
];

const FABRICS  = ["All Fabrics", "GREY FABRIC", "BLUE FABRIC", "BLACK FABRIC", "WHITE FABRIC", "NAVY FABRIC", "RED FABRIC", "GREEN FABRIC", "YELLOW FABRIC"];
const QUALITIES = ["All Quality", "POLY KNIT BIG", "COTTON", "SILK"];
const COLORS    = ["All Color", "GREY", "BLUE", "BLACK", "WHITE", "NAVY", "RED", "GREEN", "YELLOW"];
const LOCATIONS = ["All Locations", "Godown A", "Godown B"];
const STOCK_TYPES = ["All Stock", "In Stock", "Low Stock", "Out of Stock"];

const EMPTY_FILTERS = {
  search: "",
  fabric: "All Fabrics",
  quality: "All Quality",
  color: "All Color",
  location: "All Locations",
  stockType: "All Stock",
  fromDate: "",
  toDate: "",
};

const fmtNum = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/* ================================================================
   MAIN
   ================================================================ */
const Inventory = () => {
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const setF = (k, v) => setFilters({ ...filters, [k]: v });

  const filteredRows = useMemo(() => {
    return INVENTORY.filter((row) => {
      const q = filters.search.trim().toLowerCase();
      if (q && !(
        row.item.toLowerCase().includes(q) ||
        row.quality.toLowerCase().includes(q) ||
        row.color.toLowerCase().includes(q)
      )) return false;
      if (filters.fabric !== "All Fabrics" && row.item !== filters.fabric) return false;
      if (filters.quality !== "All Quality" && row.quality !== filters.quality) return false;
      if (filters.color !== "All Color" && row.color !== filters.color) return false;
      if (filters.location !== "All Locations" && row.location !== filters.location) return false;
      if (filters.stockType !== "All Stock" && row.status !== filters.stockType) return false;
      return true;
    });
  }, [filters]);

  const resetFilters = () => setFilters(EMPTY_FILTERS);

  return (
    <div className="inv-page">
      {/* HEADER */}
      <div className="inv-page__header">
        <div>
          <h1 className="inv-page__title">Inventory / Stock Summary</h1>
          <div className="inv-breadcrumb">
            <span>Home</span>
            <span className="inv-breadcrumb__sep">/</span>
            <span className="inv-breadcrumb__current">Inventory</span>
          </div>
        </div>
        <div className="inv-page__actions">
          <button className="inv-btn inv-btn--ghost" onClick={() => alert("Stock Ledger (mock)")}>
            <Icon.Book /><span>Stock Ledger</span>
          </button>
          <button className="inv-btn inv-btn--ghost" onClick={resetFilters}>
            <Icon.Refresh /><span>Reset</span>
          </button>
          <button className="inv-btn inv-btn--primary" onClick={() => alert("Export (mock)")}>
            <Icon.Download /><span>Export</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="inv-stats">
        {STATS.map((s) => (
          <div key={s.label} className="inv-stat">
            <div className="inv-stat__label">{s.label}</div>
            <div className={`inv-stat__value inv-stat__value--${s.tone}`}>{s.value}</div>
            <div className="inv-stat__hint">{s.hint}</div>
          </div>
        ))}
      </div>

      {/* FILTERS */}
      <div className="inv-card inv-filters">
        <div className="inv-filters__row">
          <Field label="Search Item">
            <div className="inv-input-wrap">
              <input
                className="inv-input inv-input--with-icon"
                placeholder="Search by fabric, quality, color..."
                value={filters.search}
                onChange={(e) => setF("search", e.target.value)}
              />
              <span className="inv-input__icon"><Icon.Search /></span>
            </div>
          </Field>
          <Field label="Fabric / Item">
            <select className="inv-input" value={filters.fabric} onChange={(e) => setF("fabric", e.target.value)}>
              {FABRICS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Quality">
            <select className="inv-input" value={filters.quality} onChange={(e) => setF("quality", e.target.value)}>
              {QUALITIES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Color">
            <select className="inv-input" value={filters.color} onChange={(e) => setF("color", e.target.value)}>
              {COLORS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="Location">
            <select className="inv-input" value={filters.location} onChange={(e) => setF("location", e.target.value)}>
              {LOCATIONS.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
        </div>

        <div className="inv-filters__row inv-filters__row--bottom">
          <Field label="Stock Type">
            <select className="inv-input" value={filters.stockType} onChange={(e) => setF("stockType", e.target.value)}>
              {STOCK_TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="From Date">
            <div className="inv-input-wrap">
              <input type="date" className="inv-input" value={filters.fromDate} onChange={(e) => setF("fromDate", e.target.value)} placeholder="DD/MM/YYYY" />
            </div>
          </Field>
          <Field label="To Date">
            <div className="inv-input-wrap">
              <input type="date" className="inv-input" value={filters.toDate} onChange={(e) => setF("toDate", e.target.value)} placeholder="DD/MM/YYYY" />
            </div>
          </Field>
          <div className="inv-filters__actions">
            <button className="inv-btn inv-btn--ghost" onClick={resetFilters}>
              <Icon.Refresh /><span>Reset</span>
            </button>
            <button className="inv-btn inv-btn--primary" onClick={() => alert("Filter applied (mock)")}>
              <Icon.Filter /><span>Apply Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="inv-card">
        <h2 className="inv-card__title">Inventory List</h2>

        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Item / Fabric</th>
                <th>Quality</th>
                <th>Color</th>
                <th className="inv-th--right">PCS (Taka)</th>
                <th className="inv-th--right">Meter</th>
                <th className="inv-th--right">Total Meter</th>
                <th className="inv-th--right">Rate (Per Mtr)</th>
                <th className="inv-th--right">Total Value (INR)</th>
                <th>Location</th>
                <th className="inv-th--center">Available Stock</th>
                <th className="inv-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredRows.length === 0 ? (
                <tr>
                  <td colSpan="12" className="inv-td--empty">No inventory items match the filters</td>
                </tr>
              ) : (
                filteredRows.map((r, idx) => (
                  <tr key={r.id} className="inv-tr">
                    <td>{idx + 1}</td>
                    <td className="inv-td--strong">{r.item}</td>
                    <td>{r.quality}</td>
                    <td>{r.color}</td>
                    <td className="inv-td--right">{r.pcs}</td>
                    <td className="inv-td--right">{fmtNum(r.meter)}</td>
                    <td className="inv-td--right">{fmtNum(r.totalMeter)}</td>
                    <td className="inv-td--right">{r.rate == null ? "-" : fmtNum(r.rate)}</td>
                    <td className="inv-td--right">{fmtNum(r.totalValue)}</td>
                    <td>{r.location}</td>
                    <td className="inv-td--center">
                      <span className={`inv-badge inv-badge--${r.status.toLowerCase().replace(/ /g, "-")}`}>{r.status}</span>
                    </td>
                    <td className="inv-td--center">
                      <button className="inv-icon-btn inv-icon-btn--view" title="View" onClick={() => alert(`View ${r.item}`)}>
                        <Icon.Eye />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="inv-pagination">
          <div className="inv-pagination__info">
            Showing {filteredRows.length === 0 ? 0 : 1} to {filteredRows.length} of {filteredRows.length} entries
          </div>
          <div className="inv-pagination__controls">
            <button className="inv-page-btn" disabled>Previous</button>
            <button className="inv-page-btn inv-page-btn--active">1</button>
            <button className="inv-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* Flow note */}
      <div className="inv-flow">
        <Icon.Info />
        <span>
          <strong>Flow:</strong> Inward Entry → Stock added in Inventory → Sales → Stock reduced automatically
        </span>
      </div>

      <style>{`
        .inv-page, .inv-page * { box-sizing: border-box; }
        .inv-page {
          --iv-text: #0f172a;
          --iv-muted: #64748b;
          --iv-label: #475569;
          --iv-card: #ffffff;
          --iv-border: #e5e7eb;
          --iv-primary: #2563eb;
          --iv-primary-hover: #1d4ed8;
          --iv-danger: #ef4444;
          --iv-success: #10b981;
          --iv-warning: #f59e0b;
          --iv-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--iv-text);
          font-size: 14px;
          line-height: 1.4;
          // padding: 24px;
        }
        .inv-page svg { width: 16px; height: 16px; display: block; }

        /* HEADER */
        .inv-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .inv-page__title { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
        .inv-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--iv-muted); font-size: 13px; }
        .inv-breadcrumb__sep { color: #cbd5e1; }
        .inv-breadcrumb__current { color: var(--iv-primary); font-weight: 500; }
        .inv-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* BUTTONS */
        .inv-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px;
          border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
          background: #fff;
          font-family: inherit;
          white-space: nowrap;
        }
        .inv-btn--ghost { background: #fff; border-color: var(--iv-border); color: var(--iv-text); }
        .inv-btn--ghost:hover { background: #f8fafc; }
        .inv-btn--primary { background: var(--iv-primary); color: #fff; border-color: var(--iv-primary); }
        .inv-btn--primary:hover { background: var(--iv-primary-hover); }
        .inv-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 6px;
          transition: all 0.15s;
        }
        .inv-icon-btn--view { background: #eff6ff; color: var(--iv-primary); }
        .inv-icon-btn--view:hover { background: #dbeafe; }

        /* STAT CARDS */
        .inv-stats {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 18px;
        }
        .inv-stat {
          background: var(--iv-card);
          border: 1px solid var(--iv-border);
          border-radius: 12px;
          padding: 16px 18px;
          box-shadow: var(--iv-shadow);
        }
        .inv-stat__label { font-size: 13px; color: var(--iv-muted); margin-bottom: 8px; }
        .inv-stat__value {
          font-size: 22px;
          font-weight: 700;
          color: var(--iv-text);
          margin-bottom: 6px;
          line-height: 1.2;
        }
        .inv-stat__value--warning { color: var(--iv-danger); }
        .inv-stat__value--danger  { color: var(--iv-danger); }
        .inv-stat__hint { font-size: 12px; color: var(--iv-muted); }

        /* CARD */
        .inv-card {
          background: var(--iv-card);
          border: 1px solid var(--iv-border);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--iv-shadow);
          margin-bottom: 18px;
        }
        .inv-card__title { font-size: 15px; font-weight: 600; margin: 0 0 16px 0; }

        /* FILTERS */
        .inv-filters__row {
          display: grid;
          grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px;
          margin-bottom: 14px;
        }
        .inv-filters__row:last-child { margin-bottom: 0; }
        .inv-filters__row--bottom {
          grid-template-columns: repeat(3, minmax(0, 1fr)) auto;
          align-items: end;
        }
        .inv-filters__actions {
          display: flex; gap: 8px;
        }

        /* FIELDS */
        .inv-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .inv-field__label {
          font-size: 13px;
          font-weight: 500;
          color: var(--iv-label);
        }

        /* INPUTS */
        .inv-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--iv-border);
          border-radius: 8px;
          background: #fff;
          font-size: 13px;
          color: var(--iv-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .inv-input:focus {
          outline: none;
          border-color: var(--iv-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .inv-input::placeholder { color: #94a3b8; }
        .inv-input-wrap { position: relative; }
        .inv-input--with-icon { padding-right: 36px; }
        .inv-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--iv-muted); pointer-events: none;
        }

        /* TABLE */
        .inv-table-wrap { overflow-x: auto; }
        .inv-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        .inv-table th {
          background: #f8fafc;
          padding: 12px 14px;
          font-size: 11px; font-weight: 600;
          color: var(--iv-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid var(--iv-border);
          white-space: nowrap;
        }
        .inv-th--right { text-align: right; }
        .inv-th--center { text-align: center; }
        .inv-table td {
          padding: 14px;
          font-size: 13px;
          border-bottom: 1px solid var(--iv-border);
          white-space: nowrap;
        }
        .inv-tr:hover { background: #fafbfc; }
        .inv-tr:last-child td { border-bottom: none; }
        .inv-td--right { text-align: right; }
        .inv-td--center { text-align: center; }
        .inv-td--strong { font-weight: 600; }
        .inv-td--empty { text-align: center; color: var(--iv-muted); padding: 40px !important; }

        /* STATUS BADGES */
        .inv-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .inv-badge--in-stock     { background: #d1fae5; color: #047857; }
        .inv-badge--low-stock    { background: #ffedd5; color: #c2410c; }
        .inv-badge--out-of-stock { background: #fee2e2; color: #b91c1c; }

        /* PAGINATION */
        .inv-pagination {
          padding-top: 16px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .inv-pagination__info { font-size: 13px; color: var(--iv-muted); }
        .inv-pagination__controls { display: flex; gap: 6px; }
        .inv-page-btn {
          min-width: 36px;
          padding: 7px 14px;
          border: 1px solid var(--iv-border);
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          color: var(--iv-text);
          font-family: inherit;
        }
        .inv-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .inv-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .inv-page-btn--active { background: var(--iv-primary); color: #fff; border-color: var(--iv-primary); }

        /* FLOW NOTE */
        .inv-flow {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 14px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px;
          color: #1e40af;
        }
        .inv-flow svg { color: var(--iv-primary); flex-shrink: 0; }

        /* RESPONSIVE */
        @media (max-width: 1400px) {
          .inv-stats { grid-template-columns: repeat(3, 1fr); }
          .inv-filters__row { grid-template-columns: repeat(3, 1fr); }
          .inv-filters__row--bottom {
            grid-template-columns: repeat(3, 1fr);
          }
          .inv-filters__actions { grid-column: 1 / -1; justify-content: flex-end; }
        }
        @media (max-width: 900px) {
          .inv-stats { grid-template-columns: repeat(2, 1fr); }
          .inv-filters__row { grid-template-columns: repeat(2, 1fr); }
          .inv-filters__row--bottom { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .inv-page { padding: 16px; }
          .inv-page__title { font-size: 18px; }
          .inv-stats { grid-template-columns: 1fr; }
          .inv-filters__row { grid-template-columns: 1fr; }
          .inv-filters__row--bottom { grid-template-columns: 1fr; }
          .inv-filters__actions { width: 100%; }
          .inv-filters__actions .inv-btn { flex: 1; justify-content: center; }
          .inv-page__actions { width: 100%; }
          .inv-page__actions .inv-btn { flex: 1; justify-content: center; }
          .inv-pagination { justify-content: center; }
        }
      `}</style>
    </div>
  );
};

/* ================================================================
   HELPER
   ================================================================ */
function Field({ label, children }) {
  return (
    <div className="inv-field">
      <label className="inv-field__label">{label}</label>
      {children}
    </div>
  );
}

export default Inventory;
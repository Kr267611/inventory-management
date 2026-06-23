import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { inventoryApi } from "../../Api/inventoryApi";
import { fetchAllMasters } from "../../Api/masterApi";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
   ArrowLeft: () => (                                                              // 🆕
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
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
  Tag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
};

const STOCK_TYPES = ["All Stock", "In Stock", "Low Stock", "Out of Stock"];

const EMPTY_FILTERS = {
  search: "",
  baleNo: "",                       // 🆕 Bale No search
  fabric: "All Fabrics",
  fabricQuality: "All Quality",
  color: "All Color",
  location: "All Locations",
  stockType: "All Stock",
  fromDate: "",
  toDate: "",
};

const fmtNum = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString("en-IN");

/* Clean filter values before API call — remove "All X" placeholders */
const cleanFilters = (f) => {
  const out = {};
  if (f.search) out.search = f.search;
  if (f.baleNo) out.baleNo = f.baleNo.toUpperCase().trim();
  if (f.fabric && f.fabric !== "All Fabrics") out.fabric = f.fabric;
  if (f.fabricQuality && f.fabricQuality !== "All Quality") out.fabricQuality = f.fabricQuality;
  if (f.color && f.color !== "All Color") out.color = f.color;
  if (f.location && f.location !== "All Locations") out.location = f.location;
  if (f.stockType && f.stockType !== "All Stock") out.stockType = f.stockType;
  return out;
};

/* ================================================================
   MAIN
   ================================================================ */
const Inventory = () => {
  const navigate= useNavigate();
  const [filters, setFilters] = useState(EMPTY_FILTERS);

  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(false);

 const [stats, setStats] = useState({
  totalItems: 0,
  totalStockPcs: 0,
  totalStockMtr: 0,
  totalValue: 0,
  lowStockItems: 0,
  outOfStockItems: 0,
});

const [viewBaleModal, setViewBaleModal] = useState(null);   // 🆕 selected bale for modal
  const [masters, setMasters] = useState({
    fabrics: [], qualities: [], colors: [], locations: [],
  });

  const setF = (k, v) => setFilters({ ...filters, [k]: v });

  /* ──────── LOAD MASTERS + INITIAL INVENTORY ──────── */
  useEffect(() => {
    loadMasters();
    loadInventory(EMPTY_FILTERS);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadMasters = async () => {
    try {
      const m = await fetchAllMasters();
      setMasters({
        fabrics: m.fabrics || [],
        qualities: m.qualities || [],
        colors: m.colors || [],
        locations: m.locations || [],
      });
    } catch (err) {
      console.error("Masters load failed:", err.message);
    }
  };

  const loadInventory = async (filterObj = filters) => {
    try {
      setLoading(true);
      const cleaned = cleanFilters(filterObj);
      const [inventoryData, statsData] = await Promise.all([
        inventoryApi.getAll(cleaned),
        inventoryApi.getStats(),
      ]);
      setInventory(inventoryData);
      setStats(statsData);
    } catch (err) {
      alert("Inventory load failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => loadInventory(filters);

  const resetFilters = () => {
    setFilters(EMPTY_FILTERS);
    loadInventory(EMPTY_FILTERS);
  };

  /* ──────── VIEW BALE DETAILS ──────── */
/* ──────── VIEW BALE DETAILS — opens modal ──────── */
const viewBale = (r) => {
  setViewBaleModal(r);
};
const closeBaleModal = () => setViewBaleModal(null);
  /* ──────── STAT CARDS ──────── */
  const STAT_CARDS = [
    { label: "Total Bales",        value: String(stats.totalItems),              hint: "Unique Bales",        tone: "default" },
    { label: "Available PCS",      value: fmtInt(stats.totalStockPcs || 0),      hint: "Current Stock",       tone: "default" },
    { label: "Available Meter",    value: fmtNum(stats.totalStockMtr),           hint: "In Stock",            tone: "default" },
    { label: "Total Value (INR)",  value: "₹ " + fmtNum(stats.totalValue),       hint: "Stock Value",         tone: "default" },
    { label: "Low Stock",          value: String(stats.lowStockItems),           hint: "Below Minimum",       tone: "warning" },
    { label: "Out of Stock",       value: String(stats.outOfStockItems),         hint: "Zero Stock",          tone: "danger"  },
  ];

  return (
    <div className="inv-page">
      {/* HEADER */}
      <div className="inv-page__header">
        <div>
          <h1 className="inv-page__title">Inventory / Bale-wise Stock</h1>
          <div className="inv-breadcrumb">
            <span>Home</span>
            <span className="inv-breadcrumb__sep">/</span>
            <span className="inv-breadcrumb__current">Inventory</span>
          </div>
        </div>
        <div className="inv-page__actions">
           <button className="inv-btn inv-btn--ghost" onClick={() => navigate(-1)}>     {/* 🆕 */}
    <Icon.ArrowLeft /><span>Back</span>
  </button>
          <button className="inv-btn inv-btn--ghost" onClick={() => alert("Stock Ledger (coming soon)")}>
            <Icon.Book /><span>Stock Ledger</span>
          </button>
          <button className="inv-btn inv-btn--ghost" onClick={resetFilters}>
            <Icon.Refresh /><span>Reset</span>
          </button>
          <button className="inv-btn inv-btn--primary" onClick={() => alert("Export (use Reports → Inventory Report)")}>
            <Icon.Download /><span>Export</span>
          </button>
        </div>
      </div>

      {/* STAT CARDS */}
      <div className="inv-stats">
        {STAT_CARDS.map((s) => (
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
          {/* 🆕 BALE NO SEARCH - prominent first field */}
          <Field label="Bale No">
            <div className="inv-input-wrap">
              <span className="inv-input__icon inv-input__icon--left"><Icon.Tag /></span>
              <input
                className="inv-input inv-input--with-left-icon inv-bale-search"
                placeholder="e.g. A35, 1224..."
                value={filters.baleNo}
                onChange={(e) => setF("baleNo", e.target.value.toUpperCase())}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
            </div>
          </Field>

          <Field label="Search Item">
            <div className="inv-input-wrap">
              <input
                className="inv-input inv-input--with-icon"
                placeholder="Fabric, quality, color..."
                value={filters.search}
                onChange={(e) => setF("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && applyFilters()}
              />
              <span className="inv-input__icon"><Icon.Search /></span>
            </div>
          </Field>

          <Field label="Fabric / Item">
            <select className="inv-input" value={filters.fabric} onChange={(e) => setF("fabric", e.target.value)}>
              <option value="All Fabrics">All Fabrics</option>
              {masters.fabrics.map((f) => (
                <option key={f._id} value={f._id}>{f.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Quality">
            <select className="inv-input" value={filters.fabricQuality} onChange={(e) => setF("fabricQuality", e.target.value)}>
              <option value="All Quality">All Quality</option>
              {masters.qualities.map((q) => (
                <option key={q._id} value={q._id}>{q.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Color">
            <select className="inv-input" value={filters.color} onChange={(e) => setF("color", e.target.value)}>
              <option value="All Color">All Color</option>
              {masters.colors.map((c) => (
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </Field>
        </div>

        <div className="inv-filters__row inv-filters__row--bottom">
          <Field label="Location">
            <select className="inv-input" value={filters.location} onChange={(e) => setF("location", e.target.value)}>
              <option value="All Locations">All Locations</option>
              {masters.locations.map((l) => (
                <option key={l._id} value={l._id}>{l.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Stock Type">
            <select className="inv-input" value={filters.stockType} onChange={(e) => setF("stockType", e.target.value)}>
              {STOCK_TYPES.map((o) => <option key={o}>{o}</option>)}
            </select>
          </Field>
          <Field label="From Date">
            <input type="date" className="inv-input" value={filters.fromDate} onChange={(e) => setF("fromDate", e.target.value)} />
          </Field>
          <Field label="To Date">
            <input type="date" className="inv-input" value={filters.toDate} onChange={(e) => setF("toDate", e.target.value)} />
          </Field>
          <div className="inv-filters__actions">
            <button className="inv-btn inv-btn--ghost" onClick={resetFilters}>
              <Icon.Refresh /><span>Reset</span>
            </button>
            <button className="inv-btn inv-btn--primary" onClick={applyFilters}>
              <Icon.Filter /><span>Apply Filter</span>
            </button>
          </div>
        </div>
      </div>

      {/* TABLE */}
      <div className="inv-card">
        <div className="inv-card__head">
          <h2 className="inv-card__title">Bale-wise Inventory</h2>
          <span className="inv-card__count">{inventory.length} bales</span>
        </div>

        <div className="inv-table-wrap">
          <table className="inv-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Bale No</th>
                <th>Item / Fabric</th>
                <th>Quality</th>
                <th>Color</th>
                <th className="inv-th--right">PCS (Avail / Total)</th>
                <th className="inv-th--right">Meter (Avg/PCS)</th>
                <th className="inv-th--right">Available Meter</th>
                <th className="inv-th--right">Rate (Per Mtr)</th>
                <th className="inv-th--right">Total Value (INR)</th>
                <th>Location</th>
                <th className="inv-th--center">Stock Status</th>
                <th className="inv-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="13" className="inv-td--empty">Loading...</td></tr>
              ) : inventory.length === 0 ? (
                <tr><td colSpan="13" className="inv-td--empty">No bales found</td></tr>
              ) : (
                inventory.map((r, idx) => {
                  // Status compute karo (availablePcs ke base pe)
                  const minStock = r.minStockPcs || 2;
                  const status =
                    r.availablePcs <= 0 ? "Out of Stock" :
                    r.availablePcs <= minStock ? "Low Stock" :
                    "In Stock";

                  const soldPcs = (r.totalPcs || 0) - (r.availablePcs || 0);

                  return (
                    <tr key={r._id} className="inv-tr">
                      <td>{idx + 1}</td>
                      <td>
                        <span className="inv-bale-chip">{r.baleNo}</span>
                      </td>
                      <td className="inv-td--strong">{r.fabric?.name || "-"}</td>
                      <td>{r.fabricQuality?.name || "-"}</td>
                      <td>{r.color?.name || "-"}</td>
                      <td className="inv-td--right">
                        <span className={`inv-pcs-display ${r.availablePcs <= 0 ? "inv-pcs-display--out" : r.availablePcs <= minStock ? "inv-pcs-display--low" : ""}`}>
                          {r.availablePcs} <span className="inv-pcs-display__sep">/</span> <span className="inv-pcs-display__total">{r.totalPcs}</span>
                        </span>
                        {soldPcs > 0 && (
                          <div className="inv-pcs-sold">{soldPcs} sold</div>
                        )}
                      </td>
                      <td className="inv-td--right">{fmtNum(r.avgMeterPerPcs)}</td>
                      <td className="inv-td--right">{fmtNum(r.availableMeter)}</td>
                      <td className="inv-td--right">{r.rate ? fmtNum(r.rate) : "-"}</td>
                      <td className="inv-td--right inv-td--strong">{fmtNum(r.totalValue)}</td>
                      <td>{r.location?.name || "-"}</td>
                      <td className="inv-td--center">
                        <span className={`inv-badge inv-badge--${status.toLowerCase().replace(/ /g, "-")}`}>
                          {status}
                        </span>
                      </td>
                      <td className="inv-td--center">
                        <button
                          className="inv-icon-btn inv-icon-btn--view"
                          title="View bale details"
                          onClick={() => viewBale(r)}
                        >
                          <Icon.Eye />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="inv-pagination">
          <div className="inv-pagination__info">
            Showing {inventory.length === 0 ? 0 : 1} to {inventory.length} of {inventory.length} bales
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
          <strong>Flow:</strong> Inward (with Bale No) → Bale created in Inventory → Sales by Bale No → Available PCS reduces automatically
        </span>
      </div>

       {viewBaleModal && (
        <div className="inv-modal-overlay" onClick={closeBaleModal}>
          <div className="inv-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="inv-modal__header">
              <div className="inv-modal__title-wrap">
                <div className="inv-modal__icon"><Icon.Tag /></div>
                <div>
                  <div className="inv-modal__label">Bale Details</div>
                  <div className="inv-modal__bale">{viewBaleModal.baleNo}</div>
                </div>
              </div>
              <button className="inv-modal__close" onClick={closeBaleModal}>×</button>
            </div>

            {/* Body */}
            <div className="inv-modal__body">
              {/* Section 1: Basic Info */}
              <div className="inv-modal__section">
                <h3 className="inv-modal__section-title">Item Information</h3>
                <div className="inv-modal__grid">
                  <InfoCell label="Fabric" value={viewBaleModal.fabric?.name} />
                  <InfoCell label="Quality" value={viewBaleModal.fabricQuality?.name} />
                  <InfoCell label="Color" value={viewBaleModal.color?.name} />
                  <InfoCell label="Location" value={viewBaleModal.location?.name} />
                </div>
              </div>

              {/* Section 2: PCS Stats */}
              <div className="inv-modal__section">
                <h3 className="inv-modal__section-title">PCS Tracking</h3>
                <div className="inv-modal__stats">
                  <StatCard
                    label="Initial PCS"
                    value={viewBaleModal.totalPcs}
                    color="#64748b"
                  />
                  <StatCard
                    label="Available"
                    value={viewBaleModal.availablePcs}
                    color={viewBaleModal.availablePcs <= 0 ? "#ef4444" : "#10b981"}
                    highlight
                  />
                  <StatCard
                    label="Sold"
                    value={(viewBaleModal.totalPcs || 0) - (viewBaleModal.availablePcs || 0)}
                    color="#f59e0b"
                  />
                </div>
              </div>

              {/* Section 3: Meter Stats */}
              <div className="inv-modal__section">
                <h3 className="inv-modal__section-title">Meter Tracking</h3>
                <div className="inv-modal__stats">
                  <StatCard
                    label="Initial Meter"
                    value={fmtNum(viewBaleModal.totalMeter)}
                    color="#64748b"
                  />
                  <StatCard
                    label="Available"
                    value={fmtNum(viewBaleModal.availableMeter)}
                    color="#10b981"
                    highlight
                  />
                  <StatCard
                    label="Sold"
                    value={fmtNum((viewBaleModal.totalMeter || 0) - (viewBaleModal.availableMeter || 0))}
                    color="#f59e0b"
                  />
                </div>
              </div>

              {/* Section 4: Value */}
              <div className="inv-modal__section">
                <h3 className="inv-modal__section-title">Pricing & Value</h3>
                <div className="inv-modal__grid">
                  <InfoCell label="Rate (Per Mtr)" value={viewBaleModal.rate ? `₹ ${fmtNum(viewBaleModal.rate)}` : "—"} strong />
                  <InfoCell label="Avg Meter/PCS" value={fmtNum(viewBaleModal.avgMeterPerPcs)} />
                  <InfoCell
                    label="Total Stock Value"
                    value={`₹ ${fmtNum(viewBaleModal.totalValue)}`}
                    strong
                    big
                  />
                  <InfoCell
                    label="Source Voucher"
                    value={viewBaleModal.inward?.voucherNo || "—"}
                  />
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="inv-modal__footer">
              <button className="inv-btn inv-btn--ghost" onClick={closeBaleModal}>
                Close
              </button>
              {/* <button
                className="inv-btn inv-btn--primary"
                onClick={() => {
                  closeBaleModal();
                  if (viewBaleModal.inward?._id) {
                    navigate(`/dashboard/inward/${viewBaleModal.inward._id}`);
                  } else {
                    alert("Source inward not found");
                  }
                }}
              >
                <Icon.Eye /><span>View Source Inward</span>
              </button> */}
            </div>
          </div>
        </div>
      )}

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
        }
        .inv-page svg { width: 16px; height: 16px; display: block; }

        .inv-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .inv-page__title { font-size: 22px; font-weight: 700; margin: 0 0 4px 0; }
        .inv-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--iv-muted); font-size: 13px; }
        .inv-breadcrumb__sep { color: #cbd5e1; }
        .inv-breadcrumb__current { color: var(--iv-primary); font-weight: 500; }
        .inv-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .inv-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .inv-btn--ghost { background: #fff; border-color: var(--iv-border); color: var(--iv-text); }
        .inv-btn--ghost:hover { background: #f8fafc; }
        .inv-btn--primary { background: var(--iv-primary); color: #fff; border-color: var(--iv-primary); }
        .inv-btn--primary:hover { background: var(--iv-primary-hover); }
        .inv-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 6px; transition: all 0.15s;
        }
        .inv-icon-btn--view { background: #eff6ff; color: var(--iv-primary); }
        .inv-icon-btn--view:hover { background: #dbeafe; }

        .inv-stats {
          display: grid; grid-template-columns: repeat(6, minmax(0, 1fr));
          gap: 12px; margin-bottom: 18px;
        }
        .inv-stat {
          background: var(--iv-card); border: 1px solid var(--iv-border);
          border-radius: 12px; padding: 14px 16px;
          box-shadow: var(--iv-shadow);
        }
        .inv-stat__label { font-size: 12px; color: var(--iv-muted); margin-bottom: 6px; }
        .inv-stat__value {
          font-size: 20px; font-weight: 700; color: var(--iv-text);
          margin-bottom: 4px; line-height: 1.2;
        }
        .inv-stat__value--warning { color: var(--iv-warning); }
        .inv-stat__value--danger  { color: var(--iv-danger); }
        .inv-stat__hint { font-size: 11px; color: var(--iv-muted); }

        .inv-card {
          background: var(--iv-card); border: 1px solid var(--iv-border);
          border-radius: 12px; padding: 20px;
          box-shadow: var(--iv-shadow); margin-bottom: 18px;
        }
        .inv-card__head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px;
        }
        .inv-card__title { font-size: 15px; font-weight: 600; margin: 0; }
        .inv-card__count { font-size: 13px; color: var(--iv-muted); }

        .inv-filters__row {
          display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 14px; margin-bottom: 14px;
        }
        .inv-filters__row:last-child { margin-bottom: 0; }
        .inv-filters__row--bottom {
          grid-template-columns: repeat(4, minmax(0, 1fr)) auto;
          align-items: end;
        }
        .inv-filters__actions { display: flex; gap: 8px; }

        .inv-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .inv-field__label { font-size: 13px; font-weight: 500; color: var(--iv-label); }

        .inv-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--iv-border);
          border-radius: 8px; background: #fff;
          font-size: 13px; color: var(--iv-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .inv-input:focus {
          outline: none; border-color: var(--iv-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .inv-input::placeholder { color: #94a3b8; }
        .inv-input-wrap { position: relative; }
        .inv-input--with-icon { padding-right: 36px; }
        .inv-input--with-left-icon { padding-left: 36px; }
        .inv-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--iv-muted); pointer-events: none;
        }
        .inv-input__icon--left { left: 10px; right: auto; }

        /* 🆕 Bale search field — slightly highlighted */
        .inv-bale-search {
          text-transform: uppercase;
          font-weight: 600;
          letter-spacing: 0.5px;
          border-color: #bfdbfe !important;
          background: #f8faff !important;
        }
        .inv-bale-search:focus {
          background: #fff !important;
          border-color: var(--iv-primary) !important;
        }

        .inv-table-wrap { overflow-x: auto; }
        .inv-table { width: 100%; border-collapse: collapse; min-width: 1300px; }
        .inv-table th {
          background: #f8fafc; padding: 12px 14px;
          font-size: 11px; font-weight: 600;
          color: var(--iv-muted);
          text-align: left; text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid var(--iv-border);
          white-space: nowrap;
        }
        .inv-th--right { text-align: right; }
        .inv-th--center { text-align: center; }
        .inv-table td {
          padding: 14px; font-size: 13px;
          border-bottom: 1px solid var(--iv-border);
          white-space: nowrap;
        }
        .inv-tr:hover { background: #fafbfc; }
        .inv-tr:last-child td { border-bottom: none; }
        .inv-td--right { text-align: right; }
        .inv-td--center { text-align: center; }
        .inv-td--strong { font-weight: 600; }
        .inv-td--empty { text-align: center; color: var(--iv-muted); padding: 40px !important; }

        /* 🆕 Bale chip in table */
        .inv-bale-chip {
          display: inline-block;
          padding: 4px 10px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        /* 🆕 PCS display — "available / total" */
        .inv-pcs-display {
          font-weight: 600;
          color: var(--iv-success);
        }
        .inv-pcs-display--low { color: var(--iv-warning); }
        .inv-pcs-display--out { color: var(--iv-danger); }
        .inv-pcs-display__sep { color: #cbd5e1; font-weight: 400; margin: 0 2px; }
        .inv-pcs-display__total {
          color: var(--iv-muted);
          font-weight: 500;
          font-size: 12px;
        }
        .inv-pcs-sold {
          font-size: 10px;
          color: var(--iv-muted);
          margin-top: 2px;
          font-style: italic;
        }

        .inv-badge {
          display: inline-block; padding: 4px 12px;
          border-radius: 12px; font-size: 11px; font-weight: 600;
        }
        .inv-badge--in-stock     { background: #d1fae5; color: #047857; }
        .inv-badge--low-stock    { background: #ffedd5; color: #c2410c; }
        .inv-badge--out-of-stock { background: #fee2e2; color: #b91c1c; }

        .inv-pagination {
          padding-top: 16px;
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .inv-pagination__info { font-size: 13px; color: var(--iv-muted); }
        .inv-pagination__controls { display: flex; gap: 6px; }
        .inv-page-btn {
          min-width: 36px; padding: 7px 14px;
          border: 1px solid var(--iv-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--iv-text); font-family: inherit;
        }
        .inv-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .inv-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .inv-page-btn--active { background: var(--iv-primary); color: #fff; border-color: var(--iv-primary); }

        .inv-flow {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 14px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #1e40af;
        }
        .inv-flow svg { color: var(--iv-primary); flex-shrink: 0; }

        /* 🆕 MODAL */
.inv-modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.5);
  backdrop-filter: blur(4px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 20px;
  animation: fadeIn 0.15s ease-out;
}
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}
.inv-modal {
  background: #fff;
  border-radius: 16px;
  width: 100%;
  max-width: 720px;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0,0,0,0.3);
  animation: slideUp 0.2s ease-out;
}
@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

/* Header */
.inv-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%);
  color: #fff;
  border-radius: 16px 16px 0 0;
}
.inv-modal__title-wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}
.inv-modal__icon {
  width: 44px;
  height: 44px;
  background: rgba(255,255,255,0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}
.inv-modal__icon svg { width: 20px; height: 20px; }
.inv-modal__label {
  font-size: 12px;
  opacity: 0.85;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}
.inv-modal__bale {
  font-size: 22px;
  font-weight: 700;
  font-family: ui-monospace, SFMono-Regular, monospace;
  letter-spacing: 1px;
  margin-top: 2px;
}
.inv-modal__close {
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
.inv-modal__close:hover { background: rgba(255,255,255,0.25); }

/* Body */
.inv-modal__body {
  padding: 24px;
  overflow-y: auto;
  flex: 1;
}
.inv-modal__section {
  margin-bottom: 24px;
}
.inv-modal__section:last-child {
  margin-bottom: 0;
}
.inv-modal__section-title {
  font-size: 12px;
  font-weight: 700;
  color: var(--iv-muted);
  text-transform: uppercase;
  letter-spacing: 0.6px;
  margin: 0 0 12px 0;
  padding-bottom: 6px;
  border-bottom: 1px solid var(--iv-border);
}

/* Grid for info cells */
.inv-modal__grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}
.inv-info-cell {
  background: #f8fafc;
  border: 1px solid var(--iv-border);
  border-radius: 10px;
  padding: 12px 14px;
}
.inv-info-cell__label {
  font-size: 11px;
  color: var(--iv-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 4px;
}
.inv-info-cell__value {
  font-size: 14px;
  color: var(--iv-text);
  font-weight: 500;
}
.inv-info-cell__value--strong { font-weight: 700; color: var(--iv-primary); }
.inv-info-cell__value--big { font-size: 18px; }

/* Stats row (PCS / Meter trackers) */
.inv-modal__stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}
.inv-stat-card {
  background: #f8fafc;
  border: 1px solid var(--iv-border);
  border-radius: 10px;
  padding: 14px;
  text-align: center;
}
.inv-stat-card--highlight {
  background: #ecfdf5;
  border-color: #a7f3d0;
}
.inv-stat-card__label {
  font-size: 11px;
  color: var(--iv-muted);
  text-transform: uppercase;
  letter-spacing: 0.4px;
  margin-bottom: 8px;
}
.inv-stat-card__value {
  font-size: 22px;
  font-weight: 700;
}

/* Footer */
.inv-modal__footer {
  padding: 16px 24px;
  border-top: 1px solid var(--iv-border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  background: #f8fafc;
  border-radius: 0 0 16px 16px;
}

/* Mobile modal */
@media (max-width: 600px) {
  .inv-modal__body { padding: 16px; }
  .inv-modal__grid { grid-template-columns: 1fr; }
  .inv-modal__stats { grid-template-columns: 1fr; }
  .inv-modal__bale { font-size: 18px; }
  .inv-modal__header { padding: 16px 20px; }
}

        @media (max-width: 1400px) {
          .inv-stats { grid-template-columns: repeat(3, 1fr); }
          .inv-filters__row { grid-template-columns: repeat(3, 1fr); }
          .inv-filters__row--bottom { grid-template-columns: repeat(3, 1fr); }
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

/* 🆕 Modal helpers */
function InfoCell({ label, value, strong, big }) {
  return (
    <div className="inv-info-cell">
      <div className="inv-info-cell__label">{label}</div>
      <div className={`inv-info-cell__value ${strong ? "inv-info-cell__value--strong" : ""} ${big ? "inv-info-cell__value--big" : ""}`}>
        {value || "—"}
      </div>
    </div>
  );
}

function StatCard({ label, value, color, highlight }) {
  return (
    <div className={`inv-stat-card ${highlight ? "inv-stat-card--highlight" : ""}`}>
      <div className="inv-stat-card__label">{label}</div>
      <div className="inv-stat-card__value" style={{ color }}>{value}</div>
    </div>
  );
}

export default Inventory;
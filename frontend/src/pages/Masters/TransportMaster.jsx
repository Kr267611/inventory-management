import React, { useState, useMemo, useEffect } from "react";
import { transportApi } from "../../Api/transport";

/* ------------------------------------------------------------------
   ICONS
   ------------------------------------------------------------------ */
const Icon = {
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
  Eye: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Edit: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  RotateCcw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
  Truck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" />
      <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
};

const EMPTY_FORM = {
  name: "",
  code: "",
  vehicleNo: "",
  phone: "",
  email: "",
  gstNo: "",
  address: "",
  remarks: "",
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ------------------------------------------------------------------
   MAIN
   ------------------------------------------------------------------ */
export default function TransportMaster() {
  const [transports, setTransports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  /* ──────── LOAD ──────── */
  const loadData = async () => {
    try {
      setLoading(true);
      const data = await transportApi.getAll();
      setTransports(data);
    } catch (err) {
      alert("Failed to load: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ──────── FILTER ──────── */
  const filtered = useMemo(() => {
    let list = [...transports];
    if (statusFilter === "active") list = list.filter((t) => t.isActive);
    else if (statusFilter === "inactive") list = list.filter((t) => !t.isActive);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((t) =>
        t.name?.toLowerCase().includes(q) ||
        (t.code || "").toLowerCase().includes(q) ||
        (t.phone || "").toLowerCase().includes(q) ||
        (t.gstNo || "").toLowerCase().includes(q) ||
        (t.vehicleNo || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [transports, search, statusFilter]);

  /* ──────── STATS ──────── */
  const stats = useMemo(() => {
    const active = transports.filter((t) => t.isActive).length;
    return { total: transports.length, active, inactive: transports.length - active };
  }, [transports]);

  /* ──────── BODY SCROLL LOCK + ESC ──────── */
  useEffect(() => {
    if (!drawerOpen) return;
    document.body.style.overflow = "hidden";
    const handler = (e) => { if (e.key === "Escape") setDrawerOpen(false); };
    window.addEventListener("keydown", handler);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handler);
    };
  }, [drawerOpen]);

  /* ──────── DRAWER HANDLERS ──────── */
  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDrawerOpen(true);
  };

  const openEdit = (t) => {
    setEditingId(t._id);
    setForm({
      name: t.name || "",
      code: t.code || "",
      vehicleNo: t.vehicleNo || "",
      phone: t.phone || "",
      email: t.email || "",
      gstNo: t.gstNo || "",
      address: t.address || "",
      remarks: t.remarks || "",
    });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  /* ──────── SAVE / DELETE / REACTIVATE ──────── */
  const handleSave = async () => {
    if (!form.name.trim()) return alert("Transporter Name required hai");
    try {
      setSaving(true);
      if (editingId) await transportApi.update(editingId, form);
      else await transportApi.create(form);
      setDrawerOpen(false);
      await loadData();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (t) => {
    if (!window.confirm(`"${t.name}" ko deactivate karna hai?\n(Past sales/dispatch records intact rahenge)`)) return;
    try {
      await transportApi.remove(t._id);
      await loadData();
    } catch (err) { alert("Delete failed: " + err.message); }
  };

  const handleReactivate = async (t) => {
    if (!window.confirm(`"${t.name}" ko reactivate karna hai?`)) return;
    try {
      await transportApi.reactivate(t._id);
      await loadData();
    } catch (err) { alert("Reactivate failed: " + err.message); }
  };

  return (
    <div className="trn-page">
      {/* Header */}
      <div className="trn-page__header">
        <div className="trn-page__title-wrap">
          <h1 className="trn-page__title">Transport</h1>
          <div className="trn-breadcrumb">
            <span>Home</span><span className="trn-breadcrumb__sep">/</span>
            <span>Masters</span><span className="trn-breadcrumb__sep">/</span>
            <span className="trn-breadcrumb__current">Transport</span>
          </div>
        </div>
        <button className="trn-btn trn-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Transport</span>
        </button>
      </div>

      {/* Stats */}
      <div className="trn-stats">
        <StatCard label="Total Transporters" value={stats.total}    hint="All Records"      tone="amber" />
        <StatCard label="Active"             value={stats.active}   hint="Currently Active" tone="green" />
        <StatCard label="Inactive"           value={stats.inactive} hint="Deactivated"      tone="gray"  />
      </div>

      {/* Toolbar */}
      <div className="trn-card">
        <div className="trn-toolbar">
          <div className="trn-search">
            <span className="trn-search__icon"><Icon.Search /></span>
            <input
              className="trn-search__input"
              placeholder="Search by name, code, phone, GST or vehicle no..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="trn-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button className="trn-btn trn-btn--ghost" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="trn-table-wrap">
          <table className="trn-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Code</th>
                <th>Transporter Name</th>
                <th>Vehicle No</th>
                <th>Phone</th>
                <th>GST No</th>
                <th>Created At</th>
                <th className="trn-th--center">Status</th>
                <th className="trn-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="trn-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="trn-td--empty">No transporters found</td></tr>
              ) : (
                filtered.map((t, idx) => (
                  <tr key={t._id} className="trn-tr">
                    <td>{idx + 1}</td>
                    <td className="trn-td--code">{t.code || "-"}</td>
                    <td className="trn-td--name">{t.name}</td>
                    <td>{t.vehicleNo ? <span className="trn-vehicle-chip">{t.vehicleNo}</span> : "-"}</td>
                    <td>{t.phone || "-"}</td>
                    <td>{t.gstNo || "-"}</td>
                    <td>{formatDate(t.createdAt)}</td>
                    <td className="trn-td--center">
                      <span className={`trn-badge trn-badge--${t.isActive ? "active" : "inactive"}`}>
                        {t.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="trn-actions">
                        <button className="trn-icon-action trn-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="trn-icon-action trn-icon-action--edit" title="Edit" onClick={() => openEdit(t)}><Icon.Edit /></button>
                        {t.isActive ? (
                          <button className="trn-icon-action trn-icon-action--delete" title="Deactivate" onClick={() => handleDelete(t)}><Icon.Trash /></button>
                        ) : (
                          <button className="trn-icon-action trn-icon-action--reactivate" title="Reactivate" onClick={() => handleReactivate(t)}><Icon.RotateCcw /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="trn-pagination">
          <div className="trn-pagination__info">
            Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="trn-pagination__controls">
            <button className="trn-page-btn" disabled>Previous</button>
            <button className="trn-page-btn trn-page-btn--active">1</button>
            <button className="trn-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="trn-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`trn-drawer ${drawerOpen ? "trn-drawer--open" : ""}`}>
        <div className="trn-drawer__header">
          <h2 className="trn-drawer__title">{editingId ? "Edit Transport" : "Add New Transport"}</h2>
          <button className="trn-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="trn-drawer__body">
          {/* Basic Info */}
          <section className="trn-form-section">
            <h3 className="trn-form-section__title">Transporter Information</h3>
            <Field label="Transporter Name" required>
              <input className="trn-input" placeholder="e.g., VRL Logistics, TCI Express" value={form.name} onChange={(e) => handleField("name", e.target.value)} autoFocus />
            </Field>
            <div className="trn-row-2">
              <Field label="Code" hint="e.g., TRN-001">
                <input className="trn-input" placeholder="Internal code" value={form.code} onChange={(e) => handleField("code", e.target.value.toUpperCase())} />
              </Field>
              <Field label="Vehicle No" hint="Default vehicle">
                <input className="trn-input" placeholder="e.g., GJ-05-AB-1234" value={form.vehicleNo} onChange={(e) => handleField("vehicleNo", e.target.value.toUpperCase())} />
              </Field>
            </div>
          </section>

          {/* Contact & Tax */}
          <section className="trn-form-section">
            <h3 className="trn-form-section__title">Contact &amp; Tax</h3>
            <div className="trn-row-2">
              <Field label="Phone">
                <input className="trn-input" placeholder="e.g., 9876543210" value={form.phone} onChange={(e) => handleField("phone", e.target.value)} />
              </Field>
              <Field label="Email">
                <input className="trn-input" type="email" placeholder="e.g., info@vrl.com" value={form.email} onChange={(e) => handleField("email", e.target.value)} />
              </Field>
            </div>
            <Field label="GST No" hint="For freight bill GST tracking">
              <input className="trn-input" placeholder="e.g., 24AAPPA7421C2Z6" value={form.gstNo} onChange={(e) => handleField("gstNo", e.target.value.toUpperCase())} />
            </Field>
          </section>

          {/* Additional */}
          <section className="trn-form-section">
            <h3 className="trn-form-section__title">Additional Details</h3>
            <Field label="Address">
              <textarea className="trn-input trn-input--textarea" rows="2" placeholder="Enter transporter's office address" value={form.address} onChange={(e) => handleField("address", e.target.value)} />
            </Field>
            <Field label="Remarks" hint="Internal notes (optional)">
              <textarea className="trn-input trn-input--textarea" rows="2" placeholder="e.g., Preferred for Mumbai route" value={form.remarks} onChange={(e) => handleField("remarks", e.target.value)} />
            </Field>
          </section>
        </div>

        <div className="trn-drawer__footer">
          <button className="trn-btn trn-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="trn-btn trn-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : (editingId ? "Update" : "Save")}
          </button>
        </div>
      </aside>

      <style>{`
        .trn-page, .trn-page * { box-sizing: border-box; }
        .trn-page {
          --trn-text: #0f172a;
          --trn-muted: #64748b;
          --trn-label: #475569;
          --trn-card: #ffffff;
          --trn-border: #e5e7eb;
          --trn-primary: #2563eb;
          --trn-primary-hover: #1d4ed8;
          --trn-danger: #ef4444;
          --trn-success: #10b981;
          --trn-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--trn-text);
          padding: 24px; font-size: 14px; line-height: 1.4;
        }
        .trn-page svg { width: 18px; height: 18px; display: block; }

        .trn-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .trn-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .trn-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--trn-muted); font-size: 13px; flex-wrap: wrap; }
        .trn-breadcrumb__sep { color: #cbd5e1; }
        .trn-breadcrumb__current { color: var(--trn-primary); font-weight: 500; }

        .trn-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .trn-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .trn-btn--ghost { background: #fff; border-color: var(--trn-border); color: var(--trn-text); }
        .trn-btn--ghost:hover { background: #f8fafc; }
        .trn-btn--primary { background: var(--trn-primary); color: #fff; border-color: var(--trn-primary); }
        .trn-btn--primary:hover:not(:disabled) { background: var(--trn-primary-hover); }
        .trn-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; color: var(--trn-muted);
        }
        .trn-icon-btn:hover { background: #f1f5f9; color: var(--trn-text); }

        .trn-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; margin-bottom: 20px;
        }
        .trn-stat {
          background: var(--trn-card); border: 1px solid var(--trn-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--trn-shadow);
          display: flex; align-items: center; gap: 14px;
        }
        .trn-stat__icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .trn-stat__icon svg { width: 22px; height: 22px; }
        .trn-stat__icon--amber { background: #fef3c7; color: #d97706; }
        .trn-stat__icon--green { background: #d1fae5; color: #059669; }
        .trn-stat__icon--gray  { background: #f1f5f9; color: #64748b; }
        .trn-stat__label { font-size: 12px; color: var(--trn-muted); }
        .trn-stat__value { font-size: 22px; font-weight: 700; line-height: 1.2; }
        .trn-stat__hint { font-size: 11px; color: var(--trn-muted); }

        .trn-card {
          background: var(--trn-card); border: 1px solid var(--trn-border);
          border-radius: 12px; box-shadow: var(--trn-shadow);
          overflow: hidden;
        }
        .trn-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--trn-border);
        }
        .trn-search { flex: 1; min-width: 220px; position: relative; }
        .trn-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: var(--trn-muted);
        }
        .trn-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--trn-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--trn-text);
          font-family: inherit;
        }
        .trn-search__input:focus {
          outline: none; border-color: var(--trn-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .trn-status-filter {
          padding: 9px 12px;
          border: 1px solid var(--trn-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--trn-text);
          font-family: inherit; cursor: pointer; min-width: 140px;
        }

        .trn-table-wrap { overflow-x: auto; }
        .trn-table { width: 100%; border-collapse: collapse; min-width: 1000px; }
        .trn-table th {
          background: #f8fafc; padding: 12px 14px;
          font-size: 11px; font-weight: 600;
          color: var(--trn-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--trn-border);
          white-space: nowrap;
        }
        .trn-th--center { text-align: center; }
        .trn-table td {
          padding: 14px; font-size: 13px;
          border-bottom: 1px solid var(--trn-border);
          white-space: nowrap;
        }
        .trn-tr:hover { background: #fafbfc; }
        .trn-tr:last-child td { border-bottom: none; }
        .trn-td--code { font-weight: 500; color: var(--trn-primary); }
        .trn-td--name { font-weight: 500; }
        .trn-td--center { text-align: center; }
        .trn-td--empty { text-align: center; color: var(--trn-muted); padding: 40px; }

        .trn-vehicle-chip {
          display: inline-block;
          padding: 3px 10px;
          background: #fff7ed;
          color: #c2410c;
          border: 1px solid #fed7aa;
          border-radius: 6px;
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.5px;
        }

        .trn-badge {
          display: inline-block;
          padding: 3px 10px; border-radius: 12px;
          font-size: 11px; font-weight: 600;
        }
        .trn-badge--active   { background: #d1fae5; color: #047857; }
        .trn-badge--inactive { background: #f1f5f9; color: #64748b; }

        .trn-actions { display: inline-flex; gap: 6px; }
        .trn-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px; border: 1px solid transparent;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .trn-icon-action svg { width: 14px; height: 14px; }
        .trn-icon-action--view { background: #eff6ff; color: var(--trn-primary); }
        .trn-icon-action--view:hover { background: #dbeafe; }
        .trn-icon-action--edit { background: #eff6ff; color: var(--trn-primary); }
        .trn-icon-action--edit:hover { background: #dbeafe; }
        .trn-icon-action--delete { background: #fee2e2; color: var(--trn-danger); }
        .trn-icon-action--delete:hover { background: #fecaca; }
        .trn-icon-action--reactivate { background: #d1fae5; color: var(--trn-success); }
        .trn-icon-action--reactivate:hover { background: #a7f3d0; }

        .trn-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--trn-border);
        }
        .trn-pagination__info { font-size: 13px; color: var(--trn-muted); }
        .trn-pagination__controls { display: flex; gap: 6px; }
        .trn-page-btn {
          min-width: 32px; padding: 6px 12px;
          border: 1px solid var(--trn-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--trn-text); font-family: inherit;
        }
        .trn-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .trn-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .trn-page-btn--active { background: var(--trn-primary); color: #fff; border-color: var(--trn-primary); }

        /* DRAWER */
        .trn-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: trnFade 0.2s ease;
        }
        @keyframes trnFade { from { opacity: 0; } to { opacity: 1; } }
        .trn-drawer {
          position: fixed; top: 0; right: 0;
          width: 460px; max-width: 100vw;
          height: 100vh; background: #fff;
          box-shadow: -10px 0 30px rgba(0,0,0,0.15);
          z-index: 100; display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s ease;
        }
        .trn-drawer--open { transform: translateX(0); }
        .trn-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--trn-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .trn-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .trn-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .trn-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--trn-border);
          display: flex; gap: 10px; background: #fff;
        }
        .trn-drawer__footer .trn-btn { flex: 1; justify-content: center; }

        .trn-form-section { margin-bottom: 24px; }
        .trn-form-section:last-child { margin-bottom: 0; }
        .trn-form-section__title {
          font-size: 14px; font-weight: 600;
          margin: 0 0 14px 0; padding-bottom: 8px;
          border-bottom: 1px solid var(--trn-border);
        }
        .trn-row-2 {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .trn-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .trn-field__label {
          font-size: 13px; font-weight: 500; color: var(--trn-label);
          display: flex; align-items: center; justify-content: space-between; gap: 6px;
        }
        .trn-field__required { color: var(--trn-danger); margin-left: 2px; }
        .trn-field__hint { font-size: 11px; color: var(--trn-muted); font-weight: 400; }
        .trn-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--trn-border);
          border-radius: 8px; background: #fff;
          font-size: 14px; color: var(--trn-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .trn-input:focus {
          outline: none; border-color: var(--trn-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .trn-input::placeholder { color: #94a3b8; }
        .trn-input--textarea { resize: vertical; min-height: 60px; }

        @media (max-width: 900px) {
          .trn-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .trn-page { padding: 16px; }
          .trn-page__title { font-size: 20px; }
          .trn-stats { grid-template-columns: 1fr; }
          .trn-drawer { width: 100vw; }
          .trn-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

/* ──────── Helpers ──────── */
function StatCard({ label, value, hint, tone }) {
  return (
    <div className="trn-stat">
      <div className={`trn-stat__icon trn-stat__icon--${tone}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="1" y="3" width="15" height="13" />
          <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </div>
      <div>
        <div className="trn-stat__label">{label}</div>
        <div className="trn-stat__value">{value}</div>
        <div className="trn-stat__hint">{hint}</div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="trn-field">
      <label className="trn-field__label">
        <span>
          {label}
          {required && <span className="trn-field__required">*</span>}
        </span>
        {hint && <span className="trn-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
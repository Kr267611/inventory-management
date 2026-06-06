import React, { useState, useMemo, useEffect } from "react";
import { paymentModeApi } from "../../Api/paymentModeApi";
import { companyApi } from "../../Api/companyApi";

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
  Wallet: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
      <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
      <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
    </svg>
  ),
};

const EMPTY_FORM = {
  name: "",
  description: "",
  company: "",
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ------------------------------------------------------------------
   MAIN
   ------------------------------------------------------------------ */
export default function PaymentModeMaster() {
  const [modes, setModes] = useState([]);
  const [companies, setCompanies] = useState([]);
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
      const [modesData, companiesData] = await Promise.all([
        paymentModeApi.getAll(),
        companyApi.getAll(),
      ]);
      setModes(modesData);
      setCompanies(companiesData);
    } catch (err) {
      alert("Failed to load: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ──────── FILTER ──────── */
  const filtered = useMemo(() => {
    let list = [...modes];
    if (statusFilter === "active") list = list.filter((m) => m.isActive);
    else if (statusFilter === "inactive") list = list.filter((m) => !m.isActive);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((m) =>
        m.name?.toLowerCase().includes(q) ||
        (m.description || "").toLowerCase().includes(q) ||
        (m.company?.name || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [modes, search, statusFilter]);

  /* ──────── STATS ──────── */
  const stats = useMemo(() => {
    const active = modes.filter((m) => m.isActive).length;
    return { total: modes.length, active, inactive: modes.length - active };
  }, [modes]);

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
    setForm({
      ...EMPTY_FORM,
      company: companies[0]?._id || "",
    });
    setDrawerOpen(true);
  };

  const openEdit = (m) => {
    setEditingId(m._id);
    setForm({
      name: m.name || "",
      description: m.description || "",
      company: m.company?._id || m.company || "",
    });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  /* ──────── SAVE / DELETE / REACTIVATE ──────── */
  const handleSave = async () => {
    if (!form.name.trim()) return alert("Payment Mode Name required hai");
    if (!form.company) return alert("Company select karo");
    try {
      setSaving(true);
      if (editingId) await paymentModeApi.update(editingId, form);
      else await paymentModeApi.create(form);
      setDrawerOpen(false);
      await loadData();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (m) => {
    if (!window.confirm(`"${m.name}" ko deactivate karna hai?`)) return;
    try {
      await paymentModeApi.remove(m._id);
      await loadData();
    } catch (err) { alert("Delete failed: " + err.message); }
  };

  const handleReactivate = async (m) => {
    if (!window.confirm(`"${m.name}" ko reactivate karna hai?`)) return;
    try {
      await paymentModeApi.reactivate(m._id);
      await loadData();
    } catch (err) { alert("Reactivate failed: " + err.message); }
  };

  return (
    <div className="pm-page">
      {/* Header */}
      <div className="pm-page__header">
        <div className="pm-page__title-wrap">
          <h1 className="pm-page__title">Payment Mode</h1>
          <div className="pm-breadcrumb">
            <span>Home</span><span className="pm-breadcrumb__sep">/</span>
            <span>Masters</span><span className="pm-breadcrumb__sep">/</span>
            <span className="pm-breadcrumb__current">Payment Mode</span>
          </div>
        </div>
        <button className="pm-btn pm-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Payment Mode</span>
        </button>
      </div>

      {/* Stats */}
      <div className="pm-stats">
        <StatCard label="Total Payment Modes" value={stats.total}    hint="All Records"      tone="teal"  />
        <StatCard label="Active"              value={stats.active}   hint="Currently Active" tone="green" />
        <StatCard label="Inactive"            value={stats.inactive} hint="Deactivated"      tone="gray"  />
      </div>

      {/* Toolbar */}
      <div className="pm-card">
        <div className="pm-toolbar">
          <div className="pm-search">
            <span className="pm-search__icon"><Icon.Search /></span>
            <input
              className="pm-search__input"
              placeholder="Search by name, description or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="pm-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button className="pm-btn pm-btn--ghost" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="pm-table-wrap">
          <table className="pm-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Name</th>
                <th>Description</th>
                <th>Company</th>
                <th>Created At</th>
                <th className="pm-th--center">Status</th>
                <th className="pm-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="7" className="pm-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="7" className="pm-td--empty">No payment modes found</td></tr>
              ) : (
                filtered.map((m, idx) => (
                  <tr key={m._id} className="pm-tr">
                    <td>{idx + 1}</td>
                    <td className="pm-td--name">{m.name}</td>
                    <td className="pm-td--desc">{m.description || "-"}</td>
                    <td>{m.company?.name || "-"}</td>
                    <td>{formatDate(m.createdAt)}</td>
                    <td className="pm-td--center">
                      <span className={`pm-badge pm-badge--${m.isActive ? "active" : "inactive"}`}>
                        {m.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="pm-actions">
                        <button className="pm-icon-action pm-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="pm-icon-action pm-icon-action--edit" title="Edit" onClick={() => openEdit(m)}><Icon.Edit /></button>
                        {m.isActive ? (
                          <button className="pm-icon-action pm-icon-action--delete" title="Deactivate" onClick={() => handleDelete(m)}><Icon.Trash /></button>
                        ) : (
                          <button className="pm-icon-action pm-icon-action--reactivate" title="Reactivate" onClick={() => handleReactivate(m)}><Icon.RotateCcw /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pm-pagination">
          <div className="pm-pagination__info">
            Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="pm-pagination__controls">
            <button className="pm-page-btn" disabled>Previous</button>
            <button className="pm-page-btn pm-page-btn--active">1</button>
            <button className="pm-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="pm-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`pm-drawer ${drawerOpen ? "pm-drawer--open" : ""}`}>
        <div className="pm-drawer__header">
          <h2 className="pm-drawer__title">{editingId ? "Edit Payment Mode" : "Add New Payment Mode"}</h2>
          <button className="pm-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="pm-drawer__body">
          <section className="pm-form-section">
            <h3 className="pm-form-section__title">Payment Mode Details</h3>

            <Field label="Name" required>
              <input className="pm-input" placeholder="e.g., Cash, UPI, NEFT, Cheque" value={form.name} onChange={(e) => handleField("name", e.target.value)} autoFocus />
            </Field>

            <Field label="Company" required>
              <select className="pm-input" value={form.company} onChange={(e) => handleField("company", e.target.value)}>
                <option value="">Select company...</option>
                {companies.map((co) => (
                  <option key={co._id} value={co._id}>{co.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Description" hint="Optional notes about this mode">
              <textarea className="pm-input pm-input--textarea" rows="3" placeholder="e.g., Bank transfer via NEFT" value={form.description} onChange={(e) => handleField("description", e.target.value)} />
            </Field>
          </section>
        </div>

        <div className="pm-drawer__footer">
          <button className="pm-btn pm-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="pm-btn pm-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : (editingId ? "Update" : "Save")}
          </button>
        </div>
      </aside>

      <style>{`
        .pm-page, .pm-page * { box-sizing: border-box; }
        .pm-page {
          --pm-text: #0f172a;
          --pm-muted: #64748b;
          --pm-label: #475569;
          --pm-card: #ffffff;
          --pm-border: #e5e7eb;
          --pm-primary: #2563eb;
          --pm-primary-hover: #1d4ed8;
          --pm-danger: #ef4444;
          --pm-success: #10b981;
          --pm-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--pm-text);
          padding: 24px; font-size: 14px; line-height: 1.4;
        }
        .pm-page svg { width: 18px; height: 18px; display: block; }

        .pm-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .pm-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .pm-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--pm-muted); font-size: 13px; flex-wrap: wrap; }
        .pm-breadcrumb__sep { color: #cbd5e1; }
        .pm-breadcrumb__current { color: var(--pm-primary); font-weight: 500; }

        .pm-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .pm-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .pm-btn--ghost { background: #fff; border-color: var(--pm-border); color: var(--pm-text); }
        .pm-btn--ghost:hover { background: #f8fafc; }
        .pm-btn--primary { background: var(--pm-primary); color: #fff; border-color: var(--pm-primary); }
        .pm-btn--primary:hover:not(:disabled) { background: var(--pm-primary-hover); }
        .pm-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; color: var(--pm-muted);
        }
        .pm-icon-btn:hover { background: #f1f5f9; color: var(--pm-text); }

        .pm-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; margin-bottom: 20px;
        }
        .pm-stat {
          background: var(--pm-card); border: 1px solid var(--pm-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--pm-shadow);
          display: flex; align-items: center; gap: 14px;
        }
        .pm-stat__icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .pm-stat__icon svg { width: 22px; height: 22px; }
        .pm-stat__icon--teal  { background: #ccfbf1; color: #0d9488; }
        .pm-stat__icon--green { background: #d1fae5; color: #059669; }
        .pm-stat__icon--gray  { background: #f1f5f9; color: #64748b; }
        .pm-stat__label { font-size: 12px; color: var(--pm-muted); }
        .pm-stat__value { font-size: 22px; font-weight: 700; line-height: 1.2; }
        .pm-stat__hint { font-size: 11px; color: var(--pm-muted); }

        .pm-card {
          background: var(--pm-card); border: 1px solid var(--pm-border);
          border-radius: 12px; box-shadow: var(--pm-shadow);
          overflow: hidden;
        }
        .pm-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--pm-border);
        }
        .pm-search { flex: 1; min-width: 220px; position: relative; }
        .pm-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: var(--pm-muted);
        }
        .pm-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--pm-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--pm-text);
          font-family: inherit;
        }
        .pm-search__input:focus {
          outline: none; border-color: var(--pm-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .pm-status-filter {
          padding: 9px 12px;
          border: 1px solid var(--pm-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--pm-text);
          font-family: inherit; cursor: pointer; min-width: 140px;
        }

        .pm-table-wrap { overflow-x: auto; }
        .pm-table { width: 100%; border-collapse: collapse; min-width: 800px; }
        .pm-table th {
          background: #f8fafc; padding: 12px 14px;
          font-size: 11px; font-weight: 600;
          color: var(--pm-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--pm-border);
          white-space: nowrap;
        }
        .pm-th--center { text-align: center; }
        .pm-table td {
          padding: 14px; font-size: 13px;
          border-bottom: 1px solid var(--pm-border);
          white-space: nowrap;
        }
        .pm-tr:hover { background: #fafbfc; }
        .pm-tr:last-child td { border-bottom: none; }
        .pm-td--name { font-weight: 500; }
        .pm-td--desc {
          max-width: 280px; overflow: hidden;
          text-overflow: ellipsis; color: var(--pm-muted);
        }
        .pm-td--center { text-align: center; }
        .pm-td--empty { text-align: center; color: var(--pm-muted); padding: 40px; }

        .pm-badge {
          display: inline-block;
          padding: 3px 10px; border-radius: 12px;
          font-size: 11px; font-weight: 600;
        }
        .pm-badge--active   { background: #d1fae5; color: #047857; }
        .pm-badge--inactive { background: #f1f5f9; color: #64748b; }

        .pm-actions { display: inline-flex; gap: 6px; }
        .pm-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px; border: 1px solid transparent;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .pm-icon-action svg { width: 14px; height: 14px; }
        .pm-icon-action--view { background: #eff6ff; color: var(--pm-primary); }
        .pm-icon-action--view:hover { background: #dbeafe; }
        .pm-icon-action--edit { background: #eff6ff; color: var(--pm-primary); }
        .pm-icon-action--edit:hover { background: #dbeafe; }
        .pm-icon-action--delete { background: #fee2e2; color: var(--pm-danger); }
        .pm-icon-action--delete:hover { background: #fecaca; }
        .pm-icon-action--reactivate { background: #d1fae5; color: var(--pm-success); }
        .pm-icon-action--reactivate:hover { background: #a7f3d0; }

        .pm-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--pm-border);
        }
        .pm-pagination__info { font-size: 13px; color: var(--pm-muted); }
        .pm-pagination__controls { display: flex; gap: 6px; }
        .pm-page-btn {
          min-width: 32px; padding: 6px 12px;
          border: 1px solid var(--pm-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--pm-text); font-family: inherit;
        }
        .pm-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .pm-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .pm-page-btn--active { background: var(--pm-primary); color: #fff; border-color: var(--pm-primary); }

        /* DRAWER */
        .pm-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: pmFade 0.2s ease;
        }
        @keyframes pmFade { from { opacity: 0; } to { opacity: 1; } }
        .pm-drawer {
          position: fixed; top: 0; right: 0;
          width: 420px; max-width: 100vw;
          height: 100vh; background: #fff;
          box-shadow: -10px 0 30px rgba(0,0,0,0.15);
          z-index: 100; display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s ease;
        }
        .pm-drawer--open { transform: translateX(0); }
        .pm-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--pm-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .pm-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .pm-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .pm-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--pm-border);
          display: flex; gap: 10px; background: #fff;
        }
        .pm-drawer__footer .pm-btn { flex: 1; justify-content: center; }

        .pm-form-section { margin-bottom: 24px; }
        .pm-form-section__title {
          font-size: 14px; font-weight: 600;
          margin: 0 0 14px 0; padding-bottom: 8px;
          border-bottom: 1px solid var(--pm-border);
        }
        .pm-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .pm-field__label {
          font-size: 13px; font-weight: 500; color: var(--pm-label);
          display: flex; align-items: center; justify-content: space-between; gap: 6px;
        }
        .pm-field__required { color: var(--pm-danger); margin-left: 2px; }
        .pm-field__hint { font-size: 11px; color: var(--pm-muted); font-weight: 400; }
        .pm-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--pm-border);
          border-radius: 8px; background: #fff;
          font-size: 14px; color: var(--pm-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .pm-input:focus {
          outline: none; border-color: var(--pm-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .pm-input::placeholder { color: #94a3b8; }
        .pm-input--textarea { resize: vertical; min-height: 70px; }

        @media (max-width: 900px) {
          .pm-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .pm-page { padding: 16px; }
          .pm-page__title { font-size: 20px; }
          .pm-stats { grid-template-columns: 1fr; }
          .pm-drawer { width: 100vw; }
        }
      `}</style>
    </div>
  );
}

/* ──────── Helpers ──────── */
function StatCard({ label, value, hint, tone }) {
  return (
    <div className="pm-stat">
      <div className={`pm-stat__icon pm-stat__icon--${tone}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4" />
          <path d="M3 5v14a2 2 0 0 0 2 2h16v-5" />
          <path d="M18 12a2 2 0 0 0 0 4h4v-4Z" />
        </svg>
      </div>
      <div>
        <div className="pm-stat__label">{label}</div>
        <div className="pm-stat__value">{value}</div>
        <div className="pm-stat__hint">{hint}</div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="pm-field">
      <label className="pm-field__label">
        <span>
          {label}
          {required && <span className="pm-field__required">*</span>}
        </span>
        {hint && <span className="pm-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
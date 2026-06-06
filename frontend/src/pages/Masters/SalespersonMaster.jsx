import React, { useState, useMemo, useEffect } from "react";
import { salesPersonApi } from "../../Api/SalespersonApi";
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
  User: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  ),
};

const EMPTY_FORM = {
  name: "",
  code: "",
  role: "Sales",
  phone: "",
  email: "",
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
export default function SalesPersonMaster() {
  const [persons, setPersons] = useState([]);
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
      const [personsData, companiesData] = await Promise.all([
        salesPersonApi.getAll(),
        companyApi.getAll(),
      ]);
      setPersons(personsData);
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
    let list = [...persons];
    if (statusFilter === "active") list = list.filter((p) => p.isActive);
    else if (statusFilter === "inactive") list = list.filter((p) => !p.isActive);

    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((p) =>
        p.name?.toLowerCase().includes(q) ||
        (p.code || "").toLowerCase().includes(q) ||
        (p.phone || "").toLowerCase().includes(q) ||
        (p.email || "").toLowerCase().includes(q) ||
        (p.role || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [persons, search, statusFilter]);

  /* ──────── STATS ──────── */
  const stats = useMemo(() => {
    const active = persons.filter((p) => p.isActive).length;
    return { total: persons.length, active, inactive: persons.length - active };
  }, [persons]);

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

  const openEdit = (p) => {
    setEditingId(p._id);
    setForm({
      name: p.name || "",
      code: p.code || "",
      role: p.role || "Sales",
      phone: p.phone || "",
      email: p.email || "",
      company: p.company?._id || p.company || "",
    });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  /* ──────── SAVE / DELETE / REACTIVATE ──────── */
  const handleSave = async () => {
    if (!form.name.trim()) return alert("Name required hai");
    if (!form.company) return alert("Company select karo");
    try {
      setSaving(true);
      if (editingId) await salesPersonApi.update(editingId, form);
      else await salesPersonApi.create(form);
      setDrawerOpen(false);
      await loadData();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`"${p.name}" ko deactivate karna hai?\n(Past sales records intact rahenge)`)) return;
    try {
      await salesPersonApi.remove(p._id);
      await loadData();
    } catch (err) { alert("Delete failed: " + err.message); }
  };

  const handleReactivate = async (p) => {
    if (!window.confirm(`"${p.name}" ko reactivate karna hai?`)) return;
    try {
      await salesPersonApi.reactivate(p._id);
      await loadData();
    } catch (err) { alert("Reactivate failed: " + err.message); }
  };

  return (
    <div className="sper-page">
      {/* Header */}
      <div className="sper-page__header">
        <div className="sper-page__title-wrap">
          <h1 className="sper-page__title">Sales Person</h1>
          <div className="sper-breadcrumb">
            <span>Home</span><span className="sper-breadcrumb__sep">/</span>
            <span>Masters</span><span className="sper-breadcrumb__sep">/</span>
            <span className="sper-breadcrumb__current">Sales Person</span>
          </div>
        </div>
        <button className="sper-btn sper-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Sales Person</span>
        </button>
      </div>

      {/* Stats */}
      <div className="sper-stats">
        <StatCard label="Total Sales Persons" value={stats.total}    hint="All Records"      tone="indigo" />
        <StatCard label="Active"              value={stats.active}   hint="Currently Active" tone="green"  />
        <StatCard label="Inactive"            value={stats.inactive} hint="Deactivated"      tone="gray"   />
      </div>

      {/* Toolbar */}
      <div className="sper-card">
        <div className="sper-toolbar">
          <div className="sper-search">
            <span className="sper-search__icon"><Icon.Search /></span>
            <input
              className="sper-search__input"
              placeholder="Search by name, code, phone, email or role..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <select
            className="sper-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
          <button className="sper-btn sper-btn--ghost" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="sper-table-wrap">
          <table className="sper-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Code</th>
                <th>Name</th>
                <th>Role</th>
                <th>Phone</th>
                <th>Email</th>
                <th>Created At</th>
                <th className="sper-th--center">Status</th>
                <th className="sper-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="9" className="sper-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="9" className="sper-td--empty">No sales persons found</td></tr>
              ) : (
                filtered.map((p, idx) => (
                  <tr key={p._id} className="sper-tr">
                    <td>{idx + 1}</td>
                    <td className="sper-td--code">{p.code || "-"}</td>
                    <td className="sper-td--name">{p.name}</td>
                    <td><span className="sper-role-chip">{p.role || "Sales"}</span></td>
                    <td>{p.phone || "-"}</td>
                    <td>{p.email || "-"}</td>
                    <td>{formatDate(p.createdAt)}</td>
                    <td className="sper-td--center">
                      <span className={`sper-badge sper-badge--${p.isActive ? "active" : "inactive"}`}>
                        {p.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="sper-actions">
                        <button className="sper-icon-action sper-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="sper-icon-action sper-icon-action--edit" title="Edit" onClick={() => openEdit(p)}><Icon.Edit /></button>
                        {p.isActive ? (
                          <button className="sper-icon-action sper-icon-action--delete" title="Deactivate" onClick={() => handleDelete(p)}><Icon.Trash /></button>
                        ) : (
                          <button className="sper-icon-action sper-icon-action--reactivate" title="Reactivate" onClick={() => handleReactivate(p)}><Icon.RotateCcw /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="sper-pagination">
          <div className="sper-pagination__info">
            Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="sper-pagination__controls">
            <button className="sper-page-btn" disabled>Previous</button>
            <button className="sper-page-btn sper-page-btn--active">1</button>
            <button className="sper-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="sper-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`sper-drawer ${drawerOpen ? "sper-drawer--open" : ""}`}>
        <div className="sper-drawer__header">
          <h2 className="sper-drawer__title">{editingId ? "Edit Sales Person" : "Add New Sales Person"}</h2>
          <button className="sper-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="sper-drawer__body">
          {/* Basic Info */}
          <section className="sper-form-section">
            <h3 className="sper-form-section__title">Basic Information</h3>
            <Field label="Full Name" required>
              <input className="sper-input" placeholder="e.g., Rahul Sharma" value={form.name} onChange={(e) => handleField("name", e.target.value)} autoFocus />
            </Field>
            <div className="sper-row-2">
              <Field label="Code" hint="e.g., SP-001">
                <input className="sper-input" placeholder="Internal code" value={form.code} onChange={(e) => handleField("code", e.target.value.toUpperCase())} />
              </Field>
              <Field label="Role">
                <select className="sper-input" value={form.role} onChange={(e) => handleField("role", e.target.value)}>
                  <option value="Sales">Sales</option>
                  <option value="Senior Sales">Senior Sales</option>
                  <option value="Sales Manager">Sales Manager</option>
                  <option value="Field Executive">Field Executive</option>
                  <option value="Team Lead">Team Lead</option>
                </select>
              </Field>
            </div>
            <Field label="Company" required>
              <select className="sper-input" value={form.company} onChange={(e) => handleField("company", e.target.value)}>
                <option value="">Select company...</option>
                {companies.map((co) => (
                  <option key={co._id} value={co._id}>{co.name}</option>
                ))}
              </select>
            </Field>
          </section>

          {/* Contact */}
          <section className="sper-form-section">
            <h3 className="sper-form-section__title">Contact Details</h3>
            <Field label="Phone">
              <input className="sper-input" placeholder="e.g., 9876543210" value={form.phone} onChange={(e) => handleField("phone", e.target.value)} />
            </Field>
            <Field label="Email">
              <input className="sper-input" type="email" placeholder="e.g., rahul@bsm.com" value={form.email} onChange={(e) => handleField("email", e.target.value)} />
            </Field>
          </section>
        </div>

        <div className="sper-drawer__footer">
          <button className="sper-btn sper-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="sper-btn sper-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : (editingId ? "Update" : "Save")}
          </button>
        </div>
      </aside>

      <style>{`
        .sper-page, .sper-page * { box-sizing: border-box; }
        .sper-page {
          --sper-text: #0f172a;
          --sper-muted: #64748b;
          --sper-label: #475569;
          --sper-card: #ffffff;
          --sper-border: #e5e7eb;
          --sper-primary: #2563eb;
          --sper-primary-hover: #1d4ed8;
          --sper-danger: #ef4444;
          --sper-success: #10b981;
          --sper-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--sper-text);
          padding: 24px; font-size: 14px; line-height: 1.4;
        }
        .sper-page svg { width: 18px; height: 18px; display: block; }

        .sper-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .sper-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .sper-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--sper-muted); font-size: 13px; flex-wrap: wrap; }
        .sper-breadcrumb__sep { color: #cbd5e1; }
        .sper-breadcrumb__current { color: var(--sper-primary); font-weight: 500; }

        .sper-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .sper-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sper-btn--ghost { background: #fff; border-color: var(--sper-border); color: var(--sper-text); }
        .sper-btn--ghost:hover { background: #f8fafc; }
        .sper-btn--primary { background: var(--sper-primary); color: #fff; border-color: var(--sper-primary); }
        .sper-btn--primary:hover:not(:disabled) { background: var(--sper-primary-hover); }
        .sper-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; color: var(--sper-muted);
        }
        .sper-icon-btn:hover { background: #f1f5f9; color: var(--sper-text); }

        .sper-stats {
          display: grid; grid-template-columns: repeat(3, 1fr);
          gap: 14px; margin-bottom: 20px;
        }
        .sper-stat {
          background: var(--sper-card); border: 1px solid var(--sper-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--sper-shadow);
          display: flex; align-items: center; gap: 14px;
        }
        .sper-stat__icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .sper-stat__icon svg { width: 22px; height: 22px; }
        .sper-stat__icon--indigo { background: #e0e7ff; color: #4f46e5; }
        .sper-stat__icon--green  { background: #d1fae5; color: #059669; }
        .sper-stat__icon--gray   { background: #f1f5f9; color: #64748b; }
        .sper-stat__label { font-size: 12px; color: var(--sper-muted); }
        .sper-stat__value { font-size: 22px; font-weight: 700; line-height: 1.2; }
        .sper-stat__hint { font-size: 11px; color: var(--sper-muted); }

        .sper-card {
          background: var(--sper-card); border: 1px solid var(--sper-border);
          border-radius: 12px; box-shadow: var(--sper-shadow);
          overflow: hidden;
        }
        .sper-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--sper-border);
        }
        .sper-search { flex: 1; min-width: 220px; position: relative; }
        .sper-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: var(--sper-muted);
        }
        .sper-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--sper-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--sper-text);
          font-family: inherit;
        }
        .sper-search__input:focus {
          outline: none; border-color: var(--sper-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .sper-status-filter {
          padding: 9px 12px;
          border: 1px solid var(--sper-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--sper-text);
          font-family: inherit; cursor: pointer; min-width: 140px;
        }

        .sper-table-wrap { overflow-x: auto; }
        .sper-table { width: 100%; border-collapse: collapse; min-width: 950px; }
        .sper-table th {
          background: #f8fafc; padding: 12px 14px;
          font-size: 11px; font-weight: 600;
          color: var(--sper-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--sper-border);
          white-space: nowrap;
        }
        .sper-th--center { text-align: center; }
        .sper-table td {
          padding: 14px; font-size: 13px;
          border-bottom: 1px solid var(--sper-border);
          white-space: nowrap;
        }
        .sper-tr:hover { background: #fafbfc; }
        .sper-tr:last-child td { border-bottom: none; }
        .sper-td--code { font-weight: 500; color: var(--sper-primary); }
        .sper-td--name { font-weight: 500; }
        .sper-td--center { text-align: center; }
        .sper-td--empty { text-align: center; color: var(--sper-muted); padding: 40px; }

        .sper-role-chip {
          display: inline-block;
          padding: 3px 10px;
          background: #eef2ff;
          color: #4f46e5;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 500;
        }

        .sper-badge {
          display: inline-block;
          padding: 3px 10px; border-radius: 12px;
          font-size: 11px; font-weight: 600;
        }
        .sper-badge--active   { background: #d1fae5; color: #047857; }
        .sper-badge--inactive { background: #f1f5f9; color: #64748b; }

        .sper-actions { display: inline-flex; gap: 6px; }
        .sper-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px; border: 1px solid transparent;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .sper-icon-action svg { width: 14px; height: 14px; }
        .sper-icon-action--view { background: #eff6ff; color: var(--sper-primary); }
        .sper-icon-action--view:hover { background: #dbeafe; }
        .sper-icon-action--edit { background: #eff6ff; color: var(--sper-primary); }
        .sper-icon-action--edit:hover { background: #dbeafe; }
        .sper-icon-action--delete { background: #fee2e2; color: var(--sper-danger); }
        .sper-icon-action--delete:hover { background: #fecaca; }
        .sper-icon-action--reactivate { background: #d1fae5; color: var(--sper-success); }
        .sper-icon-action--reactivate:hover { background: #a7f3d0; }

        .sper-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--sper-border);
        }
        .sper-pagination__info { font-size: 13px; color: var(--sper-muted); }
        .sper-pagination__controls { display: flex; gap: 6px; }
        .sper-page-btn {
          min-width: 32px; padding: 6px 12px;
          border: 1px solid var(--sper-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--sper-text); font-family: inherit;
        }
        .sper-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .sper-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .sper-page-btn--active { background: var(--sper-primary); color: #fff; border-color: var(--sper-primary); }

        /* DRAWER */
        .sper-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: sperFade 0.2s ease;
        }
        @keyframes sperFade { from { opacity: 0; } to { opacity: 1; } }
        .sper-drawer {
          position: fixed; top: 0; right: 0;
          width: 440px; max-width: 100vw;
          height: 100vh; background: #fff;
          box-shadow: -10px 0 30px rgba(0,0,0,0.15);
          z-index: 100; display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s ease;
        }
        .sper-drawer--open { transform: translateX(0); }
        .sper-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--sper-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .sper-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .sper-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .sper-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--sper-border);
          display: flex; gap: 10px; background: #fff;
        }
        .sper-drawer__footer .sper-btn { flex: 1; justify-content: center; }

        .sper-form-section { margin-bottom: 24px; }
        .sper-form-section:last-child { margin-bottom: 0; }
        .sper-form-section__title {
          font-size: 14px; font-weight: 600;
          margin: 0 0 14px 0; padding-bottom: 8px;
          border-bottom: 1px solid var(--sper-border);
        }
        .sper-row-2 {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .sper-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .sper-field__label {
          font-size: 13px; font-weight: 500; color: var(--sper-label);
          display: flex; align-items: center; justify-content: space-between; gap: 6px;
        }
        .sper-field__required { color: var(--sper-danger); margin-left: 2px; }
        .sper-field__hint { font-size: 11px; color: var(--sper-muted); font-weight: 400; }
        .sper-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--sper-border);
          border-radius: 8px; background: #fff;
          font-size: 14px; color: var(--sper-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sper-input:focus {
          outline: none; border-color: var(--sper-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .sper-input::placeholder { color: #94a3b8; }

        @media (max-width: 900px) {
          .sper-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .sper-page { padding: 16px; }
          .sper-page__title { font-size: 20px; }
          .sper-stats { grid-template-columns: 1fr; }
          .sper-drawer { width: 100vw; }
          .sper-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

/* ──────── Helpers ──────── */
function StatCard({ label, value, hint, tone }) {
  return (
    <div className="sper-stat">
      <div className={`sper-stat__icon sper-stat__icon--${tone}`}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
          <circle cx="12" cy="7" r="4" />
        </svg>
      </div>
      <div>
        <div className="sper-stat__label">{label}</div>
        <div className="sper-stat__value">{value}</div>
        <div className="sper-stat__hint">{hint}</div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="sper-field">
      <label className="sper-field__label">
        <span>
          {label}
          {required && <span className="sper-field__required">*</span>}
        </span>
        {hint && <span className="sper-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

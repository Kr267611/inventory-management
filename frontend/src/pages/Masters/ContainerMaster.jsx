import React, { useState, useMemo, useEffect } from "react";
import { containerApi } from "../../Api/container";
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
  Container: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
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
export default function ContainerMaster() {
  const [containers, setContainers] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  /* ──────── LOAD CONTAINERS + COMPANIES (for dropdown) ──────── */
  const loadData = async () => {
    try {
      setLoading(true);
      const [containersData, companiesData] = await Promise.all([
        containerApi.getAll(),
        companyApi.getAll(),
      ]);
      setContainers(containersData);
      setCompanies(companiesData);
    } catch (err) {
      alert("Failed to load data: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ──────── FILTER ──────── */
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return containers;
    return containers.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.description || "").toLowerCase().includes(q) ||
      (c.company?.name || "").toLowerCase().includes(q)
    );
  }, [containers, search]);

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
      company: companies[0]?._id || "",   // default first company
    });
    setDrawerOpen(true);
  };

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name || "",
      description: c.description || "",
      company: c.company?._id || c.company || "",
    });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  /* ──────── SAVE (API) ──────── */
  const handleSave = async () => {
    if (!form.name.trim()) return alert("Container Name required hai");
    if (!form.company) return alert("Company select karo");

    try {
      setSaving(true);
      if (editingId) {
        await containerApi.update(editingId, form);
      } else {
        await containerApi.create(form);
      }
      setDrawerOpen(false);
      await loadData();   // refresh list
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ──────── DELETE (API) ──────── */
  const handleDelete = async (id) => {
    if (!window.confirm("Sure delete karna hai?")) return;
    try {
      await containerApi.remove(id);
      await loadData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="container-page">
      {/* Header */}
      <div className="container-page__header">
        <div className="container-page__title-wrap">
          <h1 className="container-page__title">Container</h1>
          <div className="container-breadcrumb">
            <span>Home</span><span className="container-breadcrumb__sep">/</span>
            <span>Masters</span><span className="container-breadcrumb__sep">/</span>
            <span className="container-breadcrumb__current">Container</span>
          </div>
        </div>
        <button className="container-btn container-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Container</span>
        </button>
      </div>

      {/* Stats */}
      <div className="container-stat-card">
        <div className="container-stat-card__icon"><Icon.Container /></div>
        <div>
          <div className="container-stat-card__label">Total Containers</div>
          <div className="container-stat-card__value">{containers.length}</div>
          <div className="container-stat-card__hint">Total Container Records</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="container-card">
        <div className="container-toolbar">
          <div className="container-search">
            <span className="container-search__icon"><Icon.Search /></span>
            <input
              className="container-search__input"
              placeholder="Search by name, description or company..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="container-btn container-btn--ghost" onClick={() => setSearch("")}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="container-table-wrap">
          <table className="container-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Container Name</th>
                <th>Description</th>
                <th>Company</th>
                <th>Created At</th>
                <th className="container-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="6" className="container-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="6" className="container-td--empty">No containers found</td></tr>
              ) : (
                filtered.map((c, idx) => (
                  <tr key={c._id} className="container-tr">
                    <td>{idx + 1}</td>
                    <td className="container-td--name">{c.name}</td>
                    <td className="container-td--desc">{c.description || "-"}</td>
                    <td>{c.company?.name || "-"}</td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="container-actions">
                        <button className="container-icon-action container-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="container-icon-action container-icon-action--edit" title="Edit" onClick={() => openEdit(c)}><Icon.Edit /></button>
                        <button className="container-icon-action container-icon-action--delete" title="Delete" onClick={() => handleDelete(c._id)}><Icon.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="container-pagination">
          <div className="container-pagination__info">
            Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="container-pagination__controls">
            <button className="container-page-btn" disabled>Previous</button>
            <button className="container-page-btn container-page-btn--active">1</button>
            <button className="container-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="container-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`container-drawer ${drawerOpen ? "container-drawer--open" : ""}`}>
        <div className="container-drawer__header">
          <h2 className="container-drawer__title">{editingId ? "Edit Container" : "Add New Container"}</h2>
          <button className="container-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="container-drawer__body">
          <section className="container-form-section">
            <h3 className="container-form-section__title">Container Information</h3>

            <Field label="Container Name" required>
              <input
                className="container-input"
                placeholder="e.g., 20ft Container, 40ft HQ"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                autoFocus
              />
            </Field>

            <Field label="Company" required>
              <select
                className="container-input"
                value={form.company}
                onChange={(e) => handleField("company", e.target.value)}
              >
                <option value="">Select company...</option>
                {companies.map((co) => (
                  <option key={co._id} value={co._id}>{co.name}</option>
                ))}
              </select>
            </Field>

            <Field label="Description" hint="Optional notes or details">
              <textarea
                className="container-input container-input--textarea"
                rows="3"
                placeholder="Enter description (optional)"
                value={form.description}
                onChange={(e) => handleField("description", e.target.value)}
              />
            </Field>
          </section>
        </div>

        <div className="container-drawer__footer">
          <button className="container-btn container-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="container-btn container-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : (editingId ? "Update Container" : "Save Container")}
          </button>
        </div>
      </aside>

      <style>{`
        .container-page, .container-page * { box-sizing: border-box; }
        .container-page {
          --ct-text: #0f172a;
          --ct-muted: #64748b;
          --ct-label: #475569;
          --ct-card: #ffffff;
          --ct-border: #e5e7eb;
          --ct-primary: #2563eb;
          --ct-primary-hover: #1d4ed8;
          --ct-danger: #ef4444;
          --ct-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--ct-text);
          padding: 24px;
          font-size: 14px;
          line-height: 1.4;
        }
        .container-page svg { width: 18px; height: 18px; display: block; }

        .container-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .container-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .container-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--ct-muted); font-size: 13px; flex-wrap: wrap; }
        .container-breadcrumb__sep { color: #cbd5e1; }
        .container-breadcrumb__current { color: var(--ct-primary); font-weight: 500; }

        .container-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .container-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .container-btn--ghost { background: #fff; border-color: var(--ct-border); color: var(--ct-text); }
        .container-btn--ghost:hover { background: #f8fafc; }
        .container-btn--primary { background: var(--ct-primary); color: #fff; border-color: var(--ct-primary); }
        .container-btn--primary:hover:not(:disabled) { background: var(--ct-primary-hover); }
        .container-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; color: var(--ct-muted);
        }
        .container-icon-btn:hover { background: #f1f5f9; color: var(--ct-text); }

        .container-stat-card {
          background: var(--ct-card); border: 1px solid var(--ct-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--ct-shadow);
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px;
        }
        .container-stat-card__icon {
          width: 52px; height: 52px;
          background: #cffafe;
          color: #0891b2;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .container-stat-card__icon svg { width: 24px; height: 24px; }
        .container-stat-card__label { font-size: 13px; color: var(--ct-muted); }
        .container-stat-card__value { font-size: 26px; font-weight: 700; line-height: 1.2; }
        .container-stat-card__hint { font-size: 12px; color: var(--ct-muted); }

        .container-card {
          background: var(--ct-card); border: 1px solid var(--ct-border);
          border-radius: 12px; box-shadow: var(--ct-shadow);
          overflow: hidden;
        }
        .container-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--ct-border);
        }
        .container-search { flex: 1; min-width: 220px; position: relative; }
        .container-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: var(--ct-muted);
        }
        .container-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--ct-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--ct-text);
          font-family: inherit;
        }
        .container-search__input:focus {
          outline: none; border-color: var(--ct-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .container-table-wrap { overflow-x: auto; }
        .container-table { width: 100%; border-collapse: collapse; min-width: 700px; }
        .container-table th {
          background: #f8fafc; padding: 12px 16px;
          font-size: 12px; font-weight: 600;
          color: var(--ct-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.5px;
          border-bottom: 1px solid var(--ct-border);
        }
        .container-th--center { text-align: center; }
        .container-table td {
          padding: 14px 16px; font-size: 14px;
          border-bottom: 1px solid var(--ct-border);
        }
        .container-tr:hover { background: #fafbfc; }
        .container-tr:last-child td { border-bottom: none; }
        .container-td--name { font-weight: 500; }
        .container-td--desc {
          max-width: 280px; white-space: nowrap;
          overflow: hidden; text-overflow: ellipsis;
          color: var(--ct-muted);
        }
        .container-td--empty { text-align: center; color: var(--ct-muted); padding: 40px; }

        .container-actions { display: inline-flex; gap: 6px; }
        .container-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px; border: 1px solid transparent;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .container-icon-action svg { width: 14px; height: 14px; }
        .container-icon-action--view { background: #eff6ff; color: var(--ct-primary); }
        .container-icon-action--view:hover { background: #dbeafe; }
        .container-icon-action--edit { background: #eff6ff; color: var(--ct-primary); }
        .container-icon-action--edit:hover { background: #dbeafe; }
        .container-icon-action--delete { background: #fee2e2; color: var(--ct-danger); }
        .container-icon-action--delete:hover { background: #fecaca; }

        .container-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--ct-border);
          background: #fff;
        }
        .container-pagination__info { font-size: 13px; color: var(--ct-muted); }
        .container-pagination__controls { display: flex; gap: 6px; }
        .container-page-btn {
          min-width: 32px; padding: 6px 12px;
          border: 1px solid var(--ct-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--ct-text); font-family: inherit;
        }
        .container-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .container-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .container-page-btn--active { background: var(--ct-primary); color: #fff; border-color: var(--ct-primary); }

        /* DRAWER */
        .container-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: containerFade 0.2s ease;
        }
        @keyframes containerFade { from { opacity: 0; } to { opacity: 1; } }
        .container-drawer {
          position: fixed; top: 0; right: 0;
          width: 420px; max-width: 100vw;
          height: 100vh; background: #fff;
          box-shadow: -10px 0 30px rgba(0,0,0,0.15);
          z-index: 100; display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s ease;
        }
        .container-drawer--open { transform: translateX(0); }
        .container-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--ct-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .container-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .container-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .container-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--ct-border);
          display: flex; gap: 10px;
          flex-shrink: 0; background: #fff;
        }
        .container-drawer__footer .container-btn { flex: 1; justify-content: center; }

        .container-form-section { margin-bottom: 24px; }
        .container-form-section:last-child { margin-bottom: 0; }
        .container-form-section__title {
          font-size: 14px; font-weight: 600;
          color: var(--ct-text);
          margin: 0 0 14px 0; padding-bottom: 8px;
          border-bottom: 1px solid var(--ct-border);
        }
        .container-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .container-field__label {
          font-size: 13px; font-weight: 500;
          color: var(--ct-label);
          display: flex; align-items: center; gap: 6px;
        }
        .container-field__required { color: var(--ct-danger); }
        .container-field__hint { font-size: 11px; color: var(--ct-muted); font-weight: 400; }
        .container-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--ct-border);
          border-radius: 8px; background: #fff;
          font-size: 14px; color: var(--ct-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .container-input:focus {
          outline: none; border-color: var(--ct-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .container-input::placeholder { color: #94a3b8; }
        .container-input--textarea { resize: vertical; min-height: 80px; }

        @media (max-width: 768px) {
          .container-page { padding: 16px; }
          .container-page__title { font-size: 20px; }
          .container-page__header .container-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .container-drawer { width: 100vw; }
          .container-pagination { justify-content: center; }
          .container-pagination__info { text-align: center; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="container-field">
      <label className="container-field__label">
        <span>
          {label}
          {required && <span className="container-field__required">*</span>}
        </span>
        {hint && <span className="container-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
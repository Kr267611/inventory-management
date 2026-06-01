import React, { useState, useMemo, useEffect } from "react";
import {designApi} from "../../Api/design";
// 👆 baad me designApi banao to swap kar dena

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
  Design: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1.5" />
      <circle cx="17.5" cy="10.5" r="1.5" />
      <circle cx="8.5" cy="7.5" r="1.5" />
      <circle cx="6.5" cy="12.5" r="1.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
};

const EMPTY_FORM = { designNo: "" };

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ------------------------------------------------------------------
   MAIN
   ------------------------------------------------------------------ */
export default function DesignMaster() {
  const [designs, setDesigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadDesigns = async () => {
    try {
      setLoading(true);
      const data = await designApi.getAll();   // 👈 swap with designApi.getAll() later
      setDesigns(data);
    } catch (err) {
      alert("Failed to load designs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDesigns();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return designs;
    return designs.filter((d) => d.name.toLowerCase().includes(q));
  }, [designs, search]);

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

  const openAdd = () => {
    setEditingId(null);
    setForm({ ...EMPTY_FORM });
    setDrawerOpen(true);
  };

  const openEdit = (d) => {
    setEditingId(d._id);
    setForm({ designNo: d.designNo || "" });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.designNo.trim()) {
      alert("Design Number required hai");
      return;
    }
    try{
    if (editingId) {
      setDesigns(designs.map((d) => (d._id === editingId ? { ...d, ...form } : d)));
      await designApi.update(editingId, form); // 👈 swap with designApi.update() later
    } else {
      const newDesign = { ...form, _id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
      setDesigns([newDesign, ...designs]);
      await designApi.create(form); // 👈 swap with designApi.create() later
    }
    setDrawerOpen(false);
    loadDesigns(); // Refresh list after save
  }catch(err){
    alert("Failed to save design: " + err.message);
  }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sure delete karna hai?")) {
      try {
        await designApi.remove(id);
        setDesigns(designs.filter((d) => d._id !== id));
      } catch (err) {
        alert("Failed to delete design: " + err.message);
      }
    }
  };

  return (
    <div className="design-page">
      {/* Header */}
      <div className="design-page__header">
        <div className="design-page__title-wrap">
          <h1 className="design-page__title">Design</h1>
          <div className="design-breadcrumb">
            <span>Home</span><span className="design-breadcrumb__sep">/</span>
            <span>Masters</span><span className="design-breadcrumb__sep">/</span>
            <span className="design-breadcrumb__current">Design</span>
          </div>
        </div>
        <button className="design-btn design-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Design</span>
        </button>
      </div>

      {/* Stats */}
      <div className="design-stat-card">
        <div className="design-stat-card__icon"><Icon.Design /></div>
        <div>
          <div className="design-stat-card__label">Total Designs</div>
          <div className="design-stat-card__value">{designs.length}</div>
          <div className="design-stat-card__hint">Total Design Records</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="design-card">
        <div className="design-toolbar">
          <div className="design-search">
            <span className="design-search__icon"><Icon.Search /></span>
            <input
              className="design-search__input"
              placeholder="Search by design name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="design-btn design-btn--ghost" onClick={() => setSearch("")}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="design-table-wrap">
          <table className="design-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Design Number</th>
                <th>Created At</th>
                <th className="design-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="design-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="design-td--empty">No designs found</td></tr>
              ) : (
                filtered.map((d, idx) => (
                  <tr key={d._id} className="design-tr">
                    <td>{idx + 1}</td>
                    <td className="design-td--name">{d.designNo}</td>
                    <td>{formatDate(d.createdAt)}</td>
                    <td>
                      <div className="design-actions">
                        <button className="design-icon-action design-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="design-icon-action design-icon-action--edit" title="Edit" onClick={() => openEdit(d)}><Icon.Edit /></button>
                        <button className="design-icon-action design-icon-action--delete" title="Delete" onClick={() => handleDelete(d._id)}><Icon.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="design-pagination">
          <div className="design-pagination__info">
            Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="design-pagination__controls">
            <button className="design-page-btn" disabled>Previous</button>
            <button className="design-page-btn design-page-btn--active">1</button>
            <button className="design-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="design-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`design-drawer ${drawerOpen ? "design-drawer--open" : ""}`}>
        <div className="design-drawer__header">
          <h2 className="design-drawer__title">{editingId ? "Edit Design" : "Add New Design"}</h2>
          <button className="design-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="design-drawer__body">
          <section className="design-form-section">
            <h3 className="design-form-section__title">Design Information</h3>

            <Field label="Design No" required>
              <input
                className="design-input"
                placeholder="e.g., D001, D002, D003"
                value={form.designNo}
                onChange={(e) => handleField("designNo", e.target.value)}
                autoFocus
              />
            </Field>
          </section>
        </div>

        <div className="design-drawer__footer">
          <button className="design-btn design-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="design-btn design-btn--primary" onClick={handleSave}>
            {editingId ? "Update Design" : "Save Design"}
          </button>
        </div>
      </aside>

      <style>{`
        .design-page, .design-page * { box-sizing: border-box; }
        .design-page {
          --dm-text: #0f172a;
          --dm-muted: #64748b;
          --dm-label: #475569;
          --dm-card: #ffffff;
          --dm-border: #e5e7eb;
          --dm-primary: #2563eb;
          --dm-primary-hover: #1d4ed8;
          --dm-danger: #ef4444;
          --dm-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--dm-text);
          padding: 24px;
          font-size: 14px;
          line-height: 1.4;
        }
        .design-page svg { width: 18px; height: 18px; display: block; }

        .design-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .design-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .design-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--dm-muted); font-size: 13px; flex-wrap: wrap; }
        .design-breadcrumb__sep { color: #cbd5e1; }
        .design-breadcrumb__current { color: var(--dm-primary); font-weight: 500; }

        .design-btn {
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
        .design-btn--ghost { background: #fff; border-color: var(--dm-border); color: var(--dm-text); }
        .design-btn--ghost:hover { background: #f8fafc; }
        .design-btn--primary { background: var(--dm-primary); color: #fff; border-color: var(--dm-primary); }
        .design-btn--primary:hover { background: var(--dm-primary-hover); }
        .design-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          color: var(--dm-muted);
        }
        .design-icon-btn:hover { background: #f1f5f9; color: var(--dm-text); }

        .design-stat-card {
          background: var(--dm-card);
          border: 1px solid var(--dm-border);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--dm-shadow);
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px;
        }
        .design-stat-card__icon {
          width: 52px; height: 52px;
          background: #fce7f3;
          color: #db2777;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .design-stat-card__icon svg { width: 24px; height: 24px; }
        .design-stat-card__label { font-size: 13px; color: var(--dm-muted); }
        .design-stat-card__value { font-size: 26px; font-weight: 700; line-height: 1.2; }
        .design-stat-card__hint { font-size: 12px; color: var(--dm-muted); }

        .design-card {
          background: var(--dm-card);
          border: 1px solid var(--dm-border);
          border-radius: 12px;
          box-shadow: var(--dm-shadow);
          overflow: hidden;
        }

        .design-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--dm-border);
        }
        .design-search { flex: 1; min-width: 220px; position: relative; }
        .design-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--dm-muted);
        }
        .design-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--dm-border);
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: var(--dm-text);
          font-family: inherit;
        }
        .design-search__input:focus {
          outline: none;
          border-color: var(--dm-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .design-table-wrap { overflow-x: auto; }
        .design-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .design-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 12px; font-weight: 600;
          color: var(--dm-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--dm-border);
        }
        .design-th--center { text-align: center; }
        .design-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--dm-border);
        }
        .design-tr:hover { background: #fafbfc; }
        .design-tr:last-child td { border-bottom: none; }
        .design-td--name { font-weight: 500; }
        .design-td--empty { text-align: center; color: var(--dm-muted); padding: 40px; }

        .design-actions { display: inline-flex; gap: 6px; justify-content: center; }
        .design-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .design-icon-action svg { width: 14px; height: 14px; }
        .design-icon-action--view { background: #eff6ff; color: var(--dm-primary); }
        .design-icon-action--view:hover { background: #dbeafe; }
        .design-icon-action--edit { background: #eff6ff; color: var(--dm-primary); }
        .design-icon-action--edit:hover { background: #dbeafe; }
        .design-icon-action--delete { background: #fee2e2; color: var(--dm-danger); }
        .design-icon-action--delete:hover { background: #fecaca; }

        .design-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--dm-border);
          background: #fff;
        }
        .design-pagination__info { font-size: 13px; color: var(--dm-muted); }
        .design-pagination__controls { display: flex; gap: 6px; }
        .design-page-btn {
          min-width: 32px;
          padding: 6px 12px;
          border: 1px solid var(--dm-border);
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          color: var(--dm-text);
          font-family: inherit;
          transition: all 0.15s;
        }
        .design-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .design-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .design-page-btn--active { background: var(--dm-primary); color: #fff; border-color: var(--dm-primary); }

        /* DRAWER */
        .design-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: designFade 0.2s ease;
        }
        @keyframes designFade { from { opacity: 0; } to { opacity: 1; } }
        .design-drawer {
          position: fixed; top: 0; right: 0;
          width: 420px; max-width: 100vw;
          height: 100vh;
          background: #fff;
          box-shadow: -10px 0 30px rgba(0,0,0,0.15);
          z-index: 100;
          display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s ease;
        }
        .design-drawer--open { transform: translateX(0); }
        .design-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--dm-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .design-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .design-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .design-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--dm-border);
          display: flex; gap: 10px;
          flex-shrink: 0;
          background: #fff;
        }
        .design-drawer__footer .design-btn { flex: 1; justify-content: center; }

        .design-form-section { margin-bottom: 24px; }
        .design-form-section:last-child { margin-bottom: 0; }
        .design-form-section__title {
          font-size: 14px; font-weight: 600;
          color: var(--dm-text);
          margin: 0 0 14px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--dm-border);
        }
        .design-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .design-field__label { font-size: 13px; font-weight: 500; color: var(--dm-label); display: flex; align-items: center; gap: 6px; }
        .design-field__required { color: var(--dm-danger); }
        .design-field__hint { font-size: 11px; color: var(--dm-muted); font-weight: 400; }
        .design-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--dm-border);
          border-radius: 8px;
          background: #fff;
          font-size: 14px; color: var(--dm-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .design-input:focus {
          outline: none;
          border-color: var(--dm-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .design-input::placeholder { color: #94a3b8; }

        @media (max-width: 768px) {
          .design-page { padding: 16px; }
          .design-page__title { font-size: 20px; }
          .design-page__header .design-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .design-drawer { width: 100vw; }
          .design-pagination { justify-content: center; }
          .design-pagination__info { text-align: center; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="design-field">
      <label className="design-field__label">
        <span>
          {label}
          {required && <span className="design-field__required">*</span>}
        </span>
        {hint && <span className="design-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
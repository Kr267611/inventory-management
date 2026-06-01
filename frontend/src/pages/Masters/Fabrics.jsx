import React, { useState, useMemo, useEffect } from "react";
import {fabricsApi} from "../../Api/fabricsApi";
// 👆 Note: ideally fabricApi banao iske liye. Abhi companyApi pe chal raha hai.

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
  Fabric: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 6h18M3 12h18M3 18h18" />
      <path d="M7 3v18M17 3v18" />
    </svg>
  ),
};

const EMPTY_FORM = { name: "" };

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ------------------------------------------------------------------
   MAIN
   ------------------------------------------------------------------ */
export default function FabricsMaster() {
  const [fabrics, setFabrics] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  const loadFabrics = async () => {
    try {
      setLoading(true);
      const data = await fabricsApi.getAll();  // 👈 swap with fabricApi.getAll() later
      setFabrics(data);
    } catch (err) {
      alert("Failed to load fabrics: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFabrics();
  }, []);

  // Filter — sirf name pe
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return fabrics;
    return fabrics.filter((f) => f.name.toLowerCase().includes(q));
  }, [fabrics, search]);

  // Body scroll lock + Escape close
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

  const openEdit = (f) => {
    setEditingId(f._id);
    setForm({ name: f.name || "" });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

const handleSave = async () => {           // ← async add kar
  if (!form.name.trim()) {
    alert("Fabric Name required hai");
    return;
  }

  try {
    if (editingId) {
      await fabricsApi.update(editingId, form);
    } else {
      await fabricsApi.create(form);
    }
    await loadFabrics();     // ← backend se fresh data
    setDrawerOpen(false);
  } catch (err) {
    alert("Failed to save fabric: " + err.message);
  }
};


  const handleDelete = async (id) => {
    if (window.confirm("Sure delete karna hai?")) {
      try {
        await fabricsApi.remove(id);
        await loadFabrics();
      } catch (err) {
        alert("Failed to delete fabric: " + err.message);
      }
    }
  };

  return (
    <div className="fabric-page">
      {/* Header */}
      <div className="fabric-page__header">
        <div className="fabric-page__title-wrap">
          <h1 className="fabric-page__title">Fabrics</h1>
          <div className="fabric-breadcrumb">
            <span>Home</span><span className="fabric-breadcrumb__sep">/</span>
            <span>Masters</span><span className="fabric-breadcrumb__sep">/</span>
            <span className="fabric-breadcrumb__current">Fabrics</span>
          </div>
        </div>
        <button className="fabric-btn fabric-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Fabric</span>
        </button>
      </div>

      {/* Stats */}
      <div className="fabric-stat-card">
        <div className="fabric-stat-card__icon"><Icon.Fabric /></div>
        <div>
          <div className="fabric-stat-card__label">Total Fabrics</div>
          <div className="fabric-stat-card__value">{fabrics.length}</div>
          <div className="fabric-stat-card__hint">Total Fabric Records</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="fabric-card">
        <div className="fabric-toolbar">
          <div className="fabric-search">
            <span className="fabric-search__icon"><Icon.Search /></span>
            <input
              className="fabric-search__input"
              placeholder="Search by fabric name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="fabric-btn fabric-btn--ghost" onClick={() => setSearch("")}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table — sirf 4 columns */}
        <div className="fabric-table-wrap">
          <table className="fabric-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Fabric Name</th>
                <th>Created At</th>
                <th className="fabric-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="fabric-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="fabric-td--empty">No fabrics found</td></tr>
              ) : (
                filtered.map((f, idx) => (
                  <tr key={f._id} className="fabric-tr">
                    <td>{idx + 1}</td>
                    <td className="fabric-td--name">{f.name}</td>
                    <td>{formatDate(f.createdAt)}</td>
                    <td>
                      <div className="fabric-actions">
                        <button className="fabric-icon-action fabric-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="fabric-icon-action fabric-icon-action--edit" title="Edit" onClick={() => openEdit(f)}><Icon.Edit /></button>
                        <button className="fabric-icon-action fabric-icon-action--delete" title="Delete" onClick={() => handleDelete(f._id)}><Icon.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="fabric-pagination">
          <div className="fabric-pagination__info">
            Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="fabric-pagination__controls">
            <button className="fabric-page-btn" disabled>Previous</button>
            <button className="fabric-page-btn fabric-page-btn--active">1</button>
            <button className="fabric-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* DRAWER — sirf Fabric Name field */}
      {drawerOpen && <div className="fabric-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`fabric-drawer ${drawerOpen ? "fabric-drawer--open" : ""}`}>
        <div className="fabric-drawer__header">
          <h2 className="fabric-drawer__title">{editingId ? "Edit Fabric" : "Add New Fabric"}</h2>
          <button className="fabric-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="fabric-drawer__body">
          <section className="fabric-form-section">
            <h3 className="fabric-form-section__title">Fabric Information</h3>

            <Field label="Fabric Name" required>
              <input
                className="fabric-input"
                placeholder="e.g., Pure Silk, Chanderi, Banarasi"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                autoFocus
              />
            </Field>
          </section>
        </div>

        <div className="fabric-drawer__footer">
          <button className="fabric-btn fabric-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="fabric-btn fabric-btn--primary" onClick={handleSave}>
            {editingId ? "Update Fabric" : "Save Fabric"}
          </button>
        </div>
      </aside>

      <style>{`
        .fabric-page, .fabric-page * { box-sizing: border-box; }
        .fabric-page {
          --fb-text: #0f172a;
          --fb-muted: #64748b;
          --fb-label: #475569;
          --fb-card: #ffffff;
          --fb-border: #e5e7eb;
          --fb-primary: #2563eb;
          --fb-primary-hover: #1d4ed8;
          --fb-danger: #ef4444;
          --fb-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--fb-text);
          padding: 24px;
          font-size: 14px;
          line-height: 1.4;
        }
        .fabric-page svg { width: 18px; height: 18px; display: block; }

        .fabric-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .fabric-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .fabric-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--fb-muted); font-size: 13px; flex-wrap: wrap; }
        .fabric-breadcrumb__sep { color: #cbd5e1; }
        .fabric-breadcrumb__current { color: var(--fb-primary); font-weight: 500; }

        .fabric-btn {
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
        .fabric-btn--ghost { background: #fff; border-color: var(--fb-border); color: var(--fb-text); }
        .fabric-btn--ghost:hover { background: #f8fafc; }
        .fabric-btn--primary { background: var(--fb-primary); color: #fff; border-color: var(--fb-primary); }
        .fabric-btn--primary:hover { background: var(--fb-primary-hover); }
        .fabric-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          color: var(--fb-muted);
        }
        .fabric-icon-btn:hover { background: #f1f5f9; color: var(--fb-text); }

        .fabric-stat-card {
          background: var(--fb-card);
          border: 1px solid var(--fb-border);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--fb-shadow);
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px;
        }
        .fabric-stat-card__icon {
          width: 52px; height: 52px;
          background: #dbeafe;
          color: #2563eb;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .fabric-stat-card__icon svg { width: 24px; height: 24px; }
        .fabric-stat-card__label { font-size: 13px; color: var(--fb-muted); }
        .fabric-stat-card__value { font-size: 26px; font-weight: 700; line-height: 1.2; }
        .fabric-stat-card__hint { font-size: 12px; color: var(--fb-muted); }

        .fabric-card {
          background: var(--fb-card);
          border: 1px solid var(--fb-border);
          border-radius: 12px;
          box-shadow: var(--fb-shadow);
          overflow: hidden;
        }

        .fabric-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--fb-border);
        }
        .fabric-search { flex: 1; min-width: 220px; position: relative; }
        .fabric-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--fb-muted);
        }
        .fabric-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--fb-border);
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: var(--fb-text);
          font-family: inherit;
        }
        .fabric-search__input:focus {
          outline: none;
          border-color: var(--fb-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .fabric-table-wrap { overflow-x: auto; }
        .fabric-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .fabric-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 12px; font-weight: 600;
          color: var(--fb-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--fb-border);
        }
        .fabric-th--center { text-align: center; }
        .fabric-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--fb-border);
        }
        .fabric-tr:hover { background: #fafbfc; }
        .fabric-tr:last-child td { border-bottom: none; }
        .fabric-td--name { font-weight: 500; }
        .fabric-td--empty { text-align: center; color: var(--fb-muted); padding: 40px; }

        .fabric-actions { display: inline-flex; gap: 6px; justify-content: center; }
        .fabric-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .fabric-icon-action svg { width: 14px; height: 14px; }
        .fabric-icon-action--view { background: #eff6ff; color: var(--fb-primary); }
        .fabric-icon-action--view:hover { background: #dbeafe; }
        .fabric-icon-action--edit { background: #eff6ff; color: var(--fb-primary); }
        .fabric-icon-action--edit:hover { background: #dbeafe; }
        .fabric-icon-action--delete { background: #fee2e2; color: var(--fb-danger); }
        .fabric-icon-action--delete:hover { background: #fecaca; }

        .fabric-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--fb-border);
          background: #fff;
        }
        .fabric-pagination__info { font-size: 13px; color: var(--fb-muted); }
        .fabric-pagination__controls { display: flex; gap: 6px; }
        .fabric-page-btn {
          min-width: 32px;
          padding: 6px 12px;
          border: 1px solid var(--fb-border);
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          color: var(--fb-text);
          font-family: inherit;
          transition: all 0.15s;
        }
        .fabric-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .fabric-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .fabric-page-btn--active { background: var(--fb-primary); color: #fff; border-color: var(--fb-primary); }

        /* DRAWER */
        .fabric-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: fabricFade 0.2s ease;
        }
        @keyframes fabricFade { from { opacity: 0; } to { opacity: 1; } }
        .fabric-drawer {
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
        .fabric-drawer--open { transform: translateX(0); }
        .fabric-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--fb-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .fabric-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .fabric-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .fabric-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--fb-border);
          display: flex; gap: 10px;
          flex-shrink: 0;
          background: #fff;
        }
        .fabric-drawer__footer .fabric-btn { flex: 1; justify-content: center; }

        .fabric-form-section { margin-bottom: 24px; }
        .fabric-form-section:last-child { margin-bottom: 0; }
        .fabric-form-section__title {
          font-size: 14px; font-weight: 600;
          color: var(--fb-text);
          margin: 0 0 14px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--fb-border);
        }
        .fabric-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .fabric-field__label { font-size: 13px; font-weight: 500; color: var(--fb-label); display: flex; align-items: center; gap: 6px; }
        .fabric-field__required { color: var(--fb-danger); }
        .fabric-field__hint { font-size: 11px; color: var(--fb-muted); font-weight: 400; }
        .fabric-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--fb-border);
          border-radius: 8px;
          background: #fff;
          font-size: 14px; color: var(--fb-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .fabric-input:focus {
          outline: none;
          border-color: var(--fb-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .fabric-input::placeholder { color: #94a3b8; }

        @media (max-width: 768px) {
          .fabric-page { padding: 16px; }
          .fabric-page__title { font-size: 20px; }
          .fabric-page__header .fabric-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .fabric-drawer { width: 100vw; }
          .fabric-pagination { justify-content: center; }
          .fabric-pagination__info { text-align: center; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="fabric-field">
      <label className="fabric-field__label">
        <span>
          {label}
          {required && <span className="fabric-field__required">*</span>}
        </span>
        {hint && <span className="fabric-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
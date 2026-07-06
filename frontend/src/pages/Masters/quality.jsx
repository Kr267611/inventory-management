import React, { useState, useMemo, useEffect } from "react";
import {qualityApi} from "../../Api/quality";
import { isAdmin } from "../../utils/auth";  
// 👆 baad me qualityApi banao to swap kar dena

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
  Quality: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
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
export default function QualityMaster() {
  const [qualities, setQualities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadQualities = async () => {
    try {
      setLoading(true);
      const data = await qualityApi.getAll();   // 👈 swap with qualityApi.getAll() later
      setQualities(data);
    } catch (err) {
      alert("Failed to load qualities: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQualities();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return qualities;
    return qualities.filter((x) => x.name.toLowerCase().includes(q));
  }, [qualities, search]);

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

  const openEdit = (q) => {
    setEditingId(q._id);
    setForm({ name: q.name || "" });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Quality Name required hai");
      return;
    }
    try{
    if (editingId) {
      setQualities(qualities.map((q) => (q._id === editingId ? { ...q, ...form } : q)));
      await qualityApi.update(editingId, form);
    } else {
      const newQuality = { ...form, _id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
      setQualities([newQuality, ...qualities]);
      await qualityApi.create(form);
      await loadQualities(); // reload to get the new ID and createdAt from backend
    }
    setDrawerOpen(false);
}catch(err){    
    alert("Failed to save quality: " + err.message);
}
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sure delete karna hai?")) {
      try {
        await qualityApi.remove(id);
        setQualities(qualities.filter((q) => q._id !== id));
      } catch (err) {
        alert("Failed to delete quality: " + err.message);
      }
    }
  };

  /* ──────── PAGINATION ──────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [search]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <div className="quality-page">
      {/* Header */}
      <div className="quality-page__header">
        <div className="quality-page__title-wrap">
          <h1 className="quality-page__title">Quality</h1>
          <div className="quality-breadcrumb">
            <span>Home</span><span className="quality-breadcrumb__sep">/</span>
            <span>Masters</span><span className="quality-breadcrumb__sep">/</span>
            <span className="quality-breadcrumb__current">Quality</span>
          </div>
        </div>
        <button className="quality-btn quality-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Quality</span>
        </button>
      </div>

      {/* Stats */}
      <div className="quality-stat-card">
        <div className="quality-stat-card__icon"><Icon.Quality /></div>
        <div>
          <div className="quality-stat-card__label">Total Qualities</div>
          <div className="quality-stat-card__value">{qualities.length}</div>
          <div className="quality-stat-card__hint">Total Quality Records</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="quality-card">
        <div className="quality-toolbar">
          <div className="quality-search">
            <span className="quality-search__icon"><Icon.Search /></span>
            <input
              className="quality-search__input"
              placeholder="Search by quality name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="quality-btn quality-btn--ghost" onClick={() => setSearch("")}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="quality-table-wrap">
          <table className="quality-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Quality Name</th>
                <th>Created At</th>
                <th className="quality-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="quality-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="quality-td--empty">No qualities found</td></tr>
              ) : (
                paginated.map((q, idx) => (
                  <tr key={q._id} className="quality-tr">
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td className="quality-td--name">{q.name}</td>
                    <td>{formatDate(q.createdAt)}</td>
                    <td>
                      <div className="quality-actions">
                        <button className="quality-icon-action quality-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="quality-icon-action quality-icon-action--edit" title="Edit" onClick={() => openEdit(q)}><Icon.Edit /></button>
                        <button className="quality-icon-action quality-icon-action--delete" title={isAdmin() ? "Delete" : "Only admin can delete"} onClick={() => handleDelete(q._id)}
                          disabled={!isAdmin()}><Icon.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="quality-pagination">
          <div className="quality-pagination__info">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
          </div>
          <div className="quality-pagination__controls">
            <button
              className="quality-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`quality-page-btn ${page === currentPage ? "quality-page-btn--active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="quality-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="quality-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`quality-drawer ${drawerOpen ? "quality-drawer--open" : ""}`}>
        <div className="quality-drawer__header">
          <h2 className="quality-drawer__title">{editingId ? "Edit Quality" : "Add New Quality"}</h2>
          <button className="quality-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="quality-drawer__body">
          <section className="quality-form-section">
            <h3 className="quality-form-section__title">Quality Information</h3>

            <Field label="Quality Name" required>
              <input
                className="quality-input"
                placeholder="e.g., Premium, A-Grade, Standard"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                autoFocus
              />
            </Field>
          </section>
        </div>

        <div className="quality-drawer__footer">
          <button className="quality-btn quality-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="quality-btn quality-btn--primary" onClick={handleSave}>
            {editingId ? "Update Quality" : "Save Quality"}
          </button>
        </div>
      </aside>

      <style>{`
        .quality-page, .quality-page * { box-sizing: border-box; }
        .quality-page {
          --ql-text: #0f172a;
          --ql-muted: #64748b;
          --ql-label: #475569;
          --ql-card: #ffffff;
          --ql-border: #e5e7eb;
          --ql-primary: #2563eb;
          --ql-primary-hover: #1d4ed8;
          --ql-danger: #ef4444;
          --ql-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--ql-text);
          padding: 24px;
          font-size: 14px;
          line-height: 1.4;
        }
        .quality-page svg { width: 18px; height: 18px; display: block; }

        .quality-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .quality-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .quality-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--ql-muted); font-size: 13px; flex-wrap: wrap; }
        .quality-breadcrumb__sep { color: #cbd5e1; }
        .quality-breadcrumb__current { color: var(--ql-primary); font-weight: 500; }

        .quality-btn {
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
        .quality-btn--ghost { background: #fff; border-color: var(--ql-border); color: var(--ql-text); }
        .quality-btn--ghost:hover { background: #f8fafc; }
        .quality-btn--primary { background: var(--ql-primary); color: #fff; border-color: var(--ql-primary); }
        .quality-btn--primary:hover { background: var(--ql-primary-hover); }
        .quality-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          color: var(--ql-muted);
        }
        .quality-icon-btn:hover { background: #f1f5f9; color: var(--ql-text); }

        .quality-stat-card {
          background: var(--ql-card);
          border: 1px solid var(--ql-border);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--ql-shadow);
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px;
        }
        .quality-stat-card__icon {
          width: 52px; height: 52px;
          background: #fef3c7;
          color: #d97706;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .quality-stat-card__icon svg { width: 24px; height: 24px; }
        .quality-stat-card__label { font-size: 13px; color: var(--ql-muted); }
        .quality-stat-card__value { font-size: 26px; font-weight: 700; line-height: 1.2; }
        .quality-stat-card__hint { font-size: 12px; color: var(--ql-muted); }

        .quality-card {
          background: var(--ql-card);
          border: 1px solid var(--ql-border);
          border-radius: 12px;
          box-shadow: var(--ql-shadow);
          overflow: hidden;
        }

        .quality-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--ql-border);
        }
        .quality-search { flex: 1; min-width: 220px; position: relative; }
        .quality-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--ql-muted);
        }
        .quality-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--ql-border);
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: var(--ql-text);
          font-family: inherit;
        }
        .quality-search__input:focus {
          outline: none;
          border-color: var(--ql-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .quality-table-wrap { overflow-x: auto; }
        .quality-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .quality-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 12px; font-weight: 600;
          color: var(--ql-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--ql-border);
        }
        .quality-th--center { text-align: center; }
        .quality-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--ql-border);
        }
        .quality-tr:hover { background: #fafbfc; }
        .quality-tr:last-child td { border-bottom: none; }
        .quality-td--name { font-weight: 500; }
        .quality-td--empty { text-align: center; color: var(--ql-muted); padding: 40px; }

        .quality-actions { display: inline-flex; gap: 6px; justify-content: center; }
        .quality-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .quality-icon-action svg { width: 14px; height: 14px; }
        .quality-icon-action--view { background: #eff6ff; color: var(--ql-primary); }
        .quality-icon-action--view:hover { background: #dbeafe; }
        .quality-icon-action--edit { background: #eff6ff; color: var(--ql-primary); }
        .quality-icon-action--edit:hover { background: #dbeafe; }
      .quality-icon-action--delete { background: #fee2e2; color: var(--ql-danger); }
        .quality-icon-action--delete:hover:not(:disabled) { background: #fecaca; }
        .quality-icon-action:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          background: #f1f5f9;
          color: #94a3b8;
        }
        .quality-icon-action:disabled:hover {
          background: #f1f5f9;
        }

        .quality-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--ql-border);
          background: #fff;
        }
        .quality-pagination__info { font-size: 13px; color: var(--ql-muted); }
        .quality-pagination__controls { display: flex; gap: 6px; }
        .quality-page-btn {
          min-width: 32px;
          padding: 6px 12px;
          border: 1px solid var(--ql-border);
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          color: var(--ql-text);
          font-family: inherit;
          transition: all 0.15s;
        }
        .quality-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .quality-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .quality-page-btn--active { background: var(--ql-primary); color: #fff; border-color: var(--ql-primary); }

        /* DRAWER */
        .quality-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: qualityFade 0.2s ease;
        }
        @keyframes qualityFade { from { opacity: 0; } to { opacity: 1; } }
        .quality-drawer {
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
        .quality-drawer--open { transform: translateX(0); }
        .quality-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--ql-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .quality-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .quality-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .quality-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--ql-border);
          display: flex; gap: 10px;
          flex-shrink: 0;
          background: #fff;
        }
        .quality-drawer__footer .quality-btn { flex: 1; justify-content: center; }

        .quality-form-section { margin-bottom: 24px; }
        .quality-form-section:last-child { margin-bottom: 0; }
        .quality-form-section__title {
          font-size: 14px; font-weight: 600;
          color: var(--ql-text);
          margin: 0 0 14px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--ql-border);
        }
        .quality-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .quality-field__label { font-size: 13px; font-weight: 500; color: var(--ql-label); display: flex; align-items: center; gap: 6px; }
        .quality-field__required { color: var(--ql-danger); }
        .quality-field__hint { font-size: 11px; color: var(--ql-muted); font-weight: 400; }
        .quality-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--ql-border);
          border-radius: 8px;
          background: #fff;
          font-size: 14px; color: var(--ql-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .quality-input:focus {
          outline: none;
          border-color: var(--ql-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .quality-input::placeholder { color: #94a3b8; }

        @media (max-width: 768px) {
          .quality-page { padding: 16px; }
          .quality-page__title { font-size: 20px; }
          .quality-page__header .quality-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .quality-drawer { width: 100vw; }
          .quality-pagination { justify-content: center; }
          .quality-pagination__info { text-align: center; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="quality-field">
      <label className="quality-field__label">
        <span>
          {label}
          {required && <span className="quality-field__required">*</span>}
        </span>
        {hint && <span className="quality-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
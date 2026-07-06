import React, { useState, useMemo, useEffect } from "react";
import { colorApi } from "../../Api/color";
import { isAdmin } from "../../utils/auth";

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
  Palette: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1.5" />
      <circle cx="17.5" cy="10.5" r="1.5" />
      <circle cx="8.5" cy="7.5" r="1.5" />
      <circle cx="6.5" cy="12.5" r="1.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.668-1.668h1.996c3.051 0 5.555-2.503 5.555-5.554C21.965 6.012 17.461 2 12 2z" />
    </svg>
  ),
};

const EMPTY_FORM = { name: "" };   // ✅ backend ke hisaab se

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ------------------------------------------------------------------
   MAIN
   ------------------------------------------------------------------ */
export default function ColorMaster() {
  const [colors, setColors] = useState([]);      // ✅ proper naming
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadColors = async () => {
    try {
      setLoading(true);
      const data = await colorApi.getAllColors();
      setColors(data);
    } catch (err) {
      alert("Failed to load colors: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadColors();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return colors;
    return colors.filter((c) => (c.name || "").toLowerCase().includes(q));
  }, [colors, search]);

  /* ──────── PAGINATION ──────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // search change hone pe page 1 pe reset
  useEffect(() => { setCurrentPage(1); }, [search]);

  // agar current page range se bahar chala jaaye (delete ke baad)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

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

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({ name: c.name || "" });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Color Name required hai");
      return;
    }
    try {
      if (editingId) {
        await colorApi.updateColor(editingId, form);
      } else {
        await colorApi.createColor(form);
      }
      await loadColors();          // backend se fresh data
      setDrawerOpen(false);
    } catch (err) {
      alert("Failed to save color: " + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Sure delete karna hai?")) return;
    try {
      await colorApi.deleteColor(id);
      await loadColors();
    } catch (err) {
      alert("Failed to delete color: " + err.message);
    }
  };

  return (
    <div className="color-page">
      {/* Header */}
      <div className="color-page__header">
        <div className="color-page__title-wrap">
          <h1 className="color-page__title">Color</h1>
          <div className="color-breadcrumb">
            <span>Home</span><span className="color-breadcrumb__sep">/</span>
            <span>Masters</span><span className="color-breadcrumb__sep">/</span>
            <span className="color-breadcrumb__current">Color</span>
          </div>
        </div>
        <button className="color-btn color-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Color</span>
        </button>
      </div>

      {/* Stats */}
      <div className="color-stat-card">
        <div className="color-stat-card__icon"><Icon.Palette /></div>
        <div>
          <div className="color-stat-card__label">Total Colors</div>
          <div className="color-stat-card__value">{colors.length}</div>
          <div className="color-stat-card__hint">Total Color Records</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="color-card">
        <div className="color-toolbar">
          <div className="color-search">
            <span className="color-search__icon"><Icon.Search /></span>
            <input
              className="color-search__input"
              placeholder="Search by color name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="color-btn color-btn--ghost" onClick={() => setSearch("")}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="color-table-wrap">
          <table className="color-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Color Name</th>
                <th>Created At</th>
                <th className="color-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="color-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="color-td--empty">No colors found</td></tr>
              ) : (
                paginated.map((c, idx) => (
                  <tr key={c._id} className="color-tr">
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td className="color-td--name">{c.name}</td>
                    <td>{formatDate(c.createdAt)}</td>
                    <td>
                      <div className="color-actions">
                        <button className="color-icon-action color-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="color-icon-action color-icon-action--edit" title="Edit" onClick={() => openEdit(c)}><Icon.Edit /></button>
                        <button className="color-icon-action color-icon-action--delete" title={isAdmin()?"Delete":"Only admin can delete"} onClick={() => handleDelete(c._id)}
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
        <div className="color-pagination">
          <div className="color-pagination__info">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
          </div>
          <div className="color-pagination__controls">
            <button
              className="color-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`color-page-btn ${page === currentPage ? "color-page-btn--active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="color-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="color-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`color-drawer ${drawerOpen ? "color-drawer--open" : ""}`}>
        <div className="color-drawer__header">
          <h2 className="color-drawer__title">{editingId ? "Edit Color" : "Add New Color"}</h2>
          <button className="color-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="color-drawer__body">
          <section className="color-form-section">
            <h3 className="color-form-section__title">Color Information</h3>

            <Field label="Color Name" required>
              <input
                className="color-input"
                placeholder="e.g., Red, Blue, Green"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                autoFocus
              />
            </Field>
          </section>
        </div>

        <div className="color-drawer__footer">
          <button className="color-btn color-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="color-btn color-btn--primary" onClick={handleSave}>
            {editingId ? "Update Color" : "Save Color"}
          </button>
        </div>
      </aside>

      <style>{`
        .color-page, .color-page * { box-sizing: border-box; }
        .color-page {
          --cl-text: #0f172a;
          --cl-muted: #64748b;
          --cl-label: #475569;
          --cl-card: #ffffff;
          --cl-border: #e5e7eb;
          --cl-primary: #2563eb;
          --cl-primary-hover: #1d4ed8;
          --cl-danger: #ef4444;
          --cl-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--cl-text);
          padding: 24px;
          font-size: 14px;
          line-height: 1.4;
        }
        .color-page svg { width: 18px; height: 18px; display: block; }

        .color-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .color-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .color-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--cl-muted); font-size: 13px; flex-wrap: wrap; }
        .color-breadcrumb__sep { color: #cbd5e1; }
        .color-breadcrumb__current { color: var(--cl-primary); font-weight: 500; }

        .color-btn {
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
        .color-btn--ghost { background: #fff; border-color: var(--cl-border); color: var(--cl-text); }
        .color-btn--ghost:hover { background: #f8fafc; }
        .color-btn--primary { background: var(--cl-primary); color: #fff; border-color: var(--cl-primary); }
        .color-btn--primary:hover { background: var(--cl-primary-hover); }
        .color-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          color: var(--cl-muted);
        }
        .color-icon-btn:hover { background: #f1f5f9; color: var(--cl-text); }

        .color-stat-card {
          background: var(--cl-card);
          border: 1px solid var(--cl-border);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--cl-shadow);
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px;
        }
        .color-stat-card__icon {
          width: 52px; height: 52px;
          background: #fce7f3;
          color: #db2777;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .color-stat-card__icon svg { width: 24px; height: 24px; }
        .color-stat-card__label { font-size: 13px; color: var(--cl-muted); }
        .color-stat-card__value { font-size: 26px; font-weight: 700; line-height: 1.2; }
        .color-stat-card__hint { font-size: 12px; color: var(--cl-muted); }

        .color-card {
          background: var(--cl-card);
          border: 1px solid var(--cl-border);
          border-radius: 12px;
          box-shadow: var(--cl-shadow);
          overflow: hidden;
        }

        .color-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--cl-border);
        }
        .color-search { flex: 1; min-width: 220px; position: relative; }
        .color-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--cl-muted);
        }
        .color-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--cl-border);
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: var(--cl-text);
          font-family: inherit;
        }
        .color-search__input:focus {
          outline: none;
          border-color: var(--cl-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .color-table-wrap { overflow-x: auto; }
        .color-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .color-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 12px; font-weight: 600;
          color: var(--cl-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--cl-border);
        }
        .color-th--center { text-align: center; }
        .color-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--cl-border);
        }
        .color-tr:hover { background: #fafbfc; }
        .color-tr:last-child td { border-bottom: none; }
        .color-td--name { font-weight: 500; }
        .color-td--empty { text-align: center; color: var(--cl-muted); padding: 40px; }

        .color-actions { display: inline-flex; gap: 6px; justify-content: center; }
        .color-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .color-icon-action svg { width: 14px; height: 14px; }
        .color-icon-action--view { background: #eff6ff; color: var(--cl-primary); }
        .color-icon-action--view:hover { background: #dbeafe; }
        .color-icon-action--edit { background: #eff6ff; color: var(--cl-primary); }
        .color-icon-action--edit:hover { background: #dbeafe; }
        .color-icon-action--delete { background: #fee2e2; color: var(--cl-danger); }
        .color-icon-action--delete:hover:not(:disabled) { background: #fecaca; }
        .color-icon-action:disabled {
          opacity: 0.35;
          cursor: not-allowed;
          background: #f1f5f9;
          color: #94a3b8;
        }
        .color-icon-action:disabled:hover {
          background: #f1f5f9;
        }

        .color-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--cl-border);
          background: #fff;
        }
        .color-pagination__info { font-size: 13px; color: var(--cl-muted); }
        .color-pagination__controls { display: flex; gap: 6px; }
        .color-page-btn {
          min-width: 32px;
          padding: 6px 12px;
          border: 1px solid var(--cl-border);
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          color: var(--cl-text);
          font-family: inherit;
          transition: all 0.15s;
        }
        .color-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .color-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .color-page-btn--active { background: var(--cl-primary); color: #fff; border-color: var(--cl-primary); }

        /* DRAWER */
        .color-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: colorFade 0.2s ease;
        }
        @keyframes colorFade { from { opacity: 0; } to { opacity: 1; } }
        .color-drawer {
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
        .color-drawer--open { transform: translateX(0); }
        .color-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--cl-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .color-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .color-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .color-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--cl-border);
          display: flex; gap: 10px;
          flex-shrink: 0;
          background: #fff;
        }
        .color-drawer__footer .color-btn { flex: 1; justify-content: center; }

        .color-form-section { margin-bottom: 24px; }
        .color-form-section:last-child { margin-bottom: 0; }
        .color-form-section__title {
          font-size: 14px; font-weight: 600;
          color: var(--cl-text);
          margin: 0 0 14px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--cl-border);
        }
        .color-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .color-field__label { font-size: 13px; font-weight: 500; color: var(--cl-label); display: flex; align-items: center; gap: 6px; }
        .color-field__required { color: var(--cl-danger); }
        .color-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--cl-border);
          border-radius: 8px;
          background: #fff;
          font-size: 14px; color: var(--cl-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .color-input:focus {
          outline: none;
          border-color: var(--cl-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .color-input::placeholder { color: #94a3b8; }

        @media (max-width: 768px) {
          .color-page { padding: 16px; }
          .color-page__title { font-size: 20px; }
          .color-page__header .color-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .color-drawer { width: 100vw; }
          .color-pagination { justify-content: center; }
          .color-pagination__info { text-align: center; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, children }) {
  return (
    <div className="color-field">
      <label className="color-field__label">
        <span>
          {label}
          {required && <span className="color-field__required">*</span>}
        </span>
      </label>
      {children}
    </div>
  );
}
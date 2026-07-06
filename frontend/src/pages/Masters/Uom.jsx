import React, { useState, useMemo, useEffect } from "react";
import {UomApi} from "../../Api/uom"; // 👈 swap with locationApi later
// 👆 baad me locationApi banao to swap kar dena

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
  Location: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
      <circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Uom: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 12h20" />
      <path d="M6 8v4M10 6v6M14 8v4M18 6v6" />
      <rect x="2" y="12" width="20" height="6" rx="1" />
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
export default function UomMaster() {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const loadLocations = async () => {
    try {
      setLoading(true);
      const data = await UomApi.getAllUoms();  // 👈 swap with uomApi.getAll() later
      setLocations(data);
    } catch (err) {
      alert("Failed to load UOMs: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLocations();
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((l) => l.name.toLowerCase().includes(q));
  }, [locations, search]);

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

  const openEdit = (l) => {
    setEditingId(l._id);
    setForm({ name: l.name || "" });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = async () => {
    if (!form.name.trim()) {
      alert("Location Name required hai");
      return;
    }
    try{
    if (editingId) {
      setLocations(locations.map((l) => (l._id === editingId ? { ...l, ...form } : l)));
      await UomApi.updateUom(editingId, form); // 👈 swap with UomApi.update() later
    } else {
      const newUOM = { ...form, _id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
      setLocations([newUOM, ...locations]);
      await UomApi.createUom(form); // 👈 swap with UomApi.create() later
    }
    setDrawerOpen(false);
  }catch(err){
    alert("Failed to save UOM: " + err.message);
  }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Sure delete karna hai?")) {
      setLocations(locations.filter((l) => l._id !== id));
      try {
        await UomApi.deleteUom(id); // 👈 swap with UomApi.remove() later
      } catch (err) {
        alert("Failed to delete UOM: " + err.message);
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
    <div className="location-page">
      {/* Header */}
      <div className="location-page__header">
        <div className="location-page__title-wrap">
          <h1 className="location-page__title">UOM</h1>
          <div className="location-breadcrumb">
            <span>Home</span><span className="location-breadcrumb__sep">/</span>
            <span>Masters</span><span className="location-breadcrumb__sep">/</span>
            <span className="location-breadcrumb__current">UOM</span>
          </div>
        </div>
        <button className="location-btn location-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New UOM</span>
        </button>
      </div>

      {/* Stats */}
      <div className="location-stat-card">
        <div className="location-stat-card__icon"><Icon.Uom /></div>
        <div>
          <div className="location-stat-card__label">Total UOMs</div>
          <div className="location-stat-card__value">{locations.length}</div>
          <div className="location-stat-card__hint">Total UOM Records</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="location-card">
        <div className="location-toolbar">
          <div class="location-search">
            <span className="location-search__icon"><Icon.Search /></span>
            <input
              className="location-search__input"
              placeholder="Search by UOM name..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="location-btn location-btn--ghost" onClick={() => setSearch("")}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="location-table-wrap">
          <table className="location-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>UOM Name</th>
                <th>Created At</th>
                <th className="location-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="4" className="location-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="4" className="location-td--empty">No UOMs found</td></tr>
              ) : (
                paginated.map((l, idx) => (
                  <tr key={l._id} className="location-tr">
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td className="location-td--name">{l.name}</td>
                    <td>{formatDate(l.createdAt)}</td>
                    <td>
                      <div className="location-actions">
                        <button className="location-icon-action location-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="location-icon-action location-icon-action--edit" title="Edit" onClick={() => openEdit(l)}><Icon.Edit /></button>
                        <button className="location-icon-action location-icon-action--delete" title="Delete" onClick={() => handleDelete(l._id)}><Icon.Trash /></button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="location-pagination">
          <div className="location-pagination__info">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
          </div>
          <div className="location-pagination__controls">
            <button
              className="location-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`location-page-btn ${page === currentPage ? "location-page-btn--active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="location-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="location-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`location-drawer ${drawerOpen ? "location-drawer--open" : ""}`}>
        <div className="location-drawer__header">
          <h2 className="location-drawer__title">{editingId ? "Edit UOM" : "Add New UOM"}</h2>
          <button className="location-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="location-drawer__body">
          <section className="location-form-section">
            <h3 className="location-form-section__title">UOM Information</h3>

            <Field label="UOM Name" required>
              <input
                className="location-input"
                placeholder="e.g., kg, liters, pieces"
                value={form.name}
                onChange={(e) => handleField("name", e.target.value)}
                autoFocus
              />
            </Field>
          </section>
        </div>

        <div className="location-drawer__footer">
          <button className="location-btn location-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="location-btn location-btn--primary" onClick={handleSave}>
            {editingId ? "Update UOM" : "Save UOM"}
          </button>
        </div>
      </aside>

      <style>{`
        .location-page, .location-page * { box-sizing: border-box; }
        .location-page {
          --lc-text: #0f172a;
          --lc-muted: #64748b;
          --lc-label: #475569;
          --lc-card: #ffffff;
          --lc-border: #e5e7eb;
          --lc-primary: #2563eb;
          --lc-primary-hover: #1d4ed8;
          --lc-danger: #ef4444;
          --lc-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--lc-text);
          padding: 24px;
          font-size: 14px;
          line-height: 1.4;
        }
        .location-page svg { width: 18px; height: 18px; display: block; }

        .location-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .location-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .location-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--lc-muted); font-size: 13px; flex-wrap: wrap; }
        .location-breadcrumb__sep { color: #cbd5e1; }
        .location-breadcrumb__current { color: var(--lc-primary); font-weight: 500; }

        .location-btn {
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
        .location-btn--ghost { background: #fff; border-color: var(--lc-border); color: var(--lc-text); }
        .location-btn--ghost:hover { background: #f8fafc; }
        .location-btn--primary { background: var(--lc-primary); color: #fff; border-color: var(--lc-primary); }
        .location-btn--primary:hover { background: var(--lc-primary-hover); }
        .location-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          color: var(--lc-muted);
        }
        .location-icon-btn:hover { background: #f1f5f9; color: var(--lc-text); }

        .location-stat-card {
          background: var(--lc-card);
          border: 1px solid var(--lc-border);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--lc-shadow);
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px;
        }
        .location-stat-card__icon {
          width: 52px; height: 52px;
          background: #dcfce7;
          color: #16a34a;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .location-stat-card__icon svg { width: 24px; height: 24px; }
        .location-stat-card__label { font-size: 13px; color: var(--lc-muted); }
        .location-stat-card__value { font-size: 26px; font-weight: 700; line-height: 1.2; }
        .location-stat-card__hint { font-size: 12px; color: var(--lc-muted); }

        .location-card {
          background: var(--lc-card);
          border: 1px solid var(--lc-border);
          border-radius: 12px;
          box-shadow: var(--lc-shadow);
          overflow: hidden;
        }

        .location-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--lc-border);
        }
        .location-search { flex: 1; min-width: 220px; position: relative; }
        .location-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--lc-muted);
        }
        .location-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--lc-border);
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: var(--lc-text);
          font-family: inherit;
        }
        .location-search__input:focus {
          outline: none;
          border-color: var(--lc-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .location-table-wrap { overflow-x: auto; }
        .location-table { width: 100%; border-collapse: collapse; min-width: 600px; }
        .location-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 12px; font-weight: 600;
          color: var(--lc-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--lc-border);
        }
        .location-th--center { text-align: center; }
        .location-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--lc-border);
        }
        .location-tr:hover { background: #fafbfc; }
        .location-tr:last-child td { border-bottom: none; }
        .location-td--name { font-weight: 500; }
        .location-td--empty { text-align: center; color: var(--lc-muted); padding: 40px; }

        .location-actions { display: inline-flex; gap: 6px; justify-content: center; }
        .location-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .location-icon-action svg { width: 14px; height: 14px; }
        .location-icon-action--view { background: #eff6ff; color: var(--lc-primary); }
        .location-icon-action--view:hover { background: #dbeafe; }
        .location-icon-action--edit { background: #eff6ff; color: var(--lc-primary); }
        .location-icon-action--edit:hover { background: #dbeafe; }
        .location-icon-action--delete { background: #fee2e2; color: var(--lc-danger); }
        .location-icon-action--delete:hover { background: #fecaca; }

        .location-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--lc-border);
          background: #fff;
        }
        .location-pagination__info { font-size: 13px; color: var(--lc-muted); }
        .location-pagination__controls { display: flex; gap: 6px; }
        .location-page-btn {
          min-width: 32px;
          padding: 6px 12px;
          border: 1px solid var(--lc-border);
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          color: var(--lc-text);
          font-family: inherit;
          transition: all 0.15s;
        }
        .location-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .location-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .location-page-btn--active { background: var(--lc-primary); color: #fff; border-color: var(--lc-primary); }

        /* DRAWER */
        .location-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: locationFade 0.2s ease;
        }
        @keyframes locationFade { from { opacity: 0; } to { opacity: 1; } }
        .location-drawer {
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
        .location-drawer--open { transform: translateX(0); }
        .location-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--lc-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .location-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .location-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .location-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--lc-border);
          display: flex; gap: 10px;
          flex-shrink: 0;
          background: #fff;
        }
        .location-drawer__footer .location-btn { flex: 1; justify-content: center; }

        .location-form-section { margin-bottom: 24px; }
        .location-form-section:last-child { margin-bottom: 0; }
        .location-form-section__title {
          font-size: 14px; font-weight: 600;
          color: var(--lc-text);
          margin: 0 0 14px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--lc-border);
        }
        .location-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .location-field__label { font-size: 13px; font-weight: 500; color: var(--lc-label); display: flex; align-items: center; gap: 6px; }
        .location-field__required { color: var(--lc-danger); }
        .location-field__hint { font-size: 11px; color: var(--lc-muted); font-weight: 400; }
        .location-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--lc-border);
          border-radius: 8px;
          background: #fff;
          font-size: 14px; color: var(--lc-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .location-input:focus {
          outline: none;
          border-color: var(--lc-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .location-input::placeholder { color: #94a3b8; }

        @media (max-width: 768px) {
          .location-page { padding: 16px; }
          .location-page__title { font-size: 20px; }
          .location-page__header .location-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .location-drawer { width: 100vw; }
          .location-pagination { justify-content: center; }
          .location-pagination__info { text-align: center; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="location-field">
      <label className="location-field__label">
        <span>
          {label}
          {required && <span className="location-field__required">*</span>}
        </span>
        {hint && <span className="location-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
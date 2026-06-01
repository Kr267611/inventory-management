import React, { useState, useMemo, useEffect } from "react";
import { companyApi } from "../../Api/companyApi"; // ✅

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
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="18" /><line x1="15" y1="22" x2="15" y2="18" />
      <line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" />
    </svg>
  ),
};

/* ------------------------------------------------------------------
   MOCK DATA — matches your Mongoose Company schema exactly
   Fields: name, code, address, city, state, country, mobile, email
   ------------------------------------------------------------------ */
// const SEED = [
//   { _id: "6a12f65448e274348fd287eb", name: "Bhaskar Silk Mills", code: "BSM",  email: "",                          mobile: "9076845826",  address: "",                  city: "Surat",     state: "Gujarat",   country: "India", createdAt: "2026-05-24T13:00:04.670Z" },
//   { _id: "mock-002",                  name: "Shree Textiles",      code: "ST",   email: "shree.textiles@gmail.com",  mobile: "9123456789",  address: "Ring Road",         city: "Mumbai",    state: "Maharashtra", country: "India", createdAt: "2026-05-22T10:30:00.000Z" },
//   { _id: "mock-003",                  name: "Om Fabrics",          code: "OF",   email: "info@omfabrics.com",        mobile: "9988776655",  address: "Naroda Industrial", city: "Ahmedabad", state: "Gujarat",   country: "India", createdAt: "2026-05-20T09:15:00.000Z" },
//   { _id: "mock-004",                  name: "Milan Textiles",      code: "MT",   email: "milan.textiles@gmail.com",  mobile: "8765432109",  address: "",                  city: "Delhi",     state: "Delhi",     country: "India", createdAt: "2026-05-18T11:45:00.000Z" },
//   { _id: "mock-005",                  name: "ABC Exports",         code: "ABC",  email: "abc.exports@gmail.com",     mobile: "7654321098",  address: "Electronic City",   city: "Bengaluru", state: "Karnataka", country: "India", createdAt: "2026-05-15T08:00:00.000Z" },
// ];

const EMPTY_FORM = {
  name: "", code: "", email: "", mobile: "",
  address: "", city: "", state: "", country: "India",
};

const formatDate = (iso) => {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

/* ------------------------------------------------------------------
   MAIN
   ------------------------------------------------------------------ */
export default function CompanyMaster() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);

  // Load companies on mount
  const loadCompanies = async () => { 
    try {
      setLoading(true);
      const data = await companyApi.getAll();
      setCompanies(data);
    } catch (err) {
      alert("Failed to load companies: " + err.message);
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    loadCompanies();
  }, []);

  // Filter
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return companies;
    return companies.filter((c) =>
      c.name.toLowerCase().includes(q) ||
      (c.code || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.city || "").toLowerCase().includes(q)
    );
  }, [companies, search]);

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

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name || "",
      code: c.code || "",
      email: c.email || "",
      mobile: c.mobile || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      country: c.country || "India",
    });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  const handleSave = () => {
    if (!form.name.trim()) {
      alert("Company Name required hai");
      return;
    }
    if (editingId) {
      setCompanies(companies.map((c) => (c._id === editingId ? { ...c, ...form } : c)));
    } else {
      const newCompany = { ...form, _id: `local-${Date.now()}`, createdAt: new Date().toISOString() };
      setCompanies([newCompany, ...companies]);
    }
    setDrawerOpen(false);
  };

  const handleDelete = (id) => {
    if (window.confirm("Sure delete karna hai?")) {
      setCompanies(companies.filter((c) => c._id !== id));
    }
  };

  return (
    <div className="company-page">
      {/* Header */}
      <div className="company-page__header">
        <div className="company-page__title-wrap">
          <h1 className="company-page__title">Company</h1>
          <div className="company-breadcrumb">
            <span>Home</span><span className="company-breadcrumb__sep">/</span>
            <span>Masters</span><span className="company-breadcrumb__sep">/</span>
            <span className="company-breadcrumb__current">Company</span>
          </div>
        </div>
        <button className="company-btn company-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Company</span>
        </button>
      </div>

      {/* Stats */}
      <div className="company-stat-card">
        <div className="company-stat-card__icon"><Icon.Building /></div>
        <div>
          <div className="company-stat-card__label">Total Companies</div>
          <div className="company-stat-card__value">{companies.length}</div>
          <div className="company-stat-card__hint">Total Company Records</div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="company-card">
        <div className="company-toolbar">
          <div className="company-search">
            <span className="company-search__icon"><Icon.Search /></span>
            <input
              className="company-search__input"
              placeholder="Search by name, code, email or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button className="company-btn company-btn--ghost" onClick={() => setSearch("")}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="company-table-wrap">
          <table className="company-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Code</th>
                <th>Name</th>
                <th>Email</th>
                <th>Mobile</th>
                <th>Location</th>
                <th>Country</th>
                <th>Created At</th>
                <th className="company-th--center">Action</th>
              </tr>
            </thead>
         <tbody>
  {loading ? (
    <tr><td colSpan="9" className="company-td--empty">Loading...</td></tr>
  ) : filtered.length === 0 ? (
    <tr><td colSpan="9" className="company-td--empty">No companies found</td></tr>
  ) : (
    filtered.map((c, idx) => (
      <tr key={c._id} className="company-tr">
        <td>{idx + 1}</td>
        <td className="company-td--code">{c.code || "-"}</td>
        <td className="company-td--name">{c.name}</td>
        <td>{c.email || "-"}</td>
        <td>{c.mobile || "-"}</td>
        <td>{[c.city, c.state].filter(Boolean).join(", ") || "-"}</td>
        <td>{c.country || "-"}</td>
        <td>{formatDate(c.createdAt)}</td>
        <td>
          <div className="company-actions">
            <button className="company-icon-action company-icon-action--view" title="View"><Icon.Eye /></button>
            <button className="company-icon-action company-icon-action--edit" title="Edit" onClick={() => openEdit(c)}><Icon.Edit /></button>
            <button className="company-icon-action company-icon-action--delete" title="Delete" onClick={() => handleDelete(c._id)}><Icon.Trash /></button>
          </div>
        </td>
      </tr>
    ))
  )}
</tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="company-pagination">
          <div className="company-pagination__info">
            Showing {filtered.length === 0 ? 0 : 1} to {filtered.length} of {filtered.length} entries
          </div>
          <div className="company-pagination__controls">
            <button className="company-page-btn" disabled>Previous</button>
            <button className="company-page-btn company-page-btn--active">1</button>
            <button className="company-page-btn" disabled>Next</button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="company-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`company-drawer ${drawerOpen ? "company-drawer--open" : ""}`}>
        <div className="company-drawer__header">
          <h2 className="company-drawer__title">{editingId ? "Edit Company" : "Add New Company"}</h2>
          <button className="company-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="company-drawer__body">
          <section className="company-form-section">
            <h3 className="company-form-section__title">Company Information</h3>

            <Field label="Company Name" required>
              <input className="company-input" placeholder="Enter company name" value={form.name} onChange={(e) => handleField("name", e.target.value)} />
            </Field>
            <Field label="Code" hint="Short identifier (e.g., BSM)">
              <input className="company-input" placeholder="Enter company code" value={form.code} onChange={(e) => handleField("code", e.target.value.toUpperCase())} />
            </Field>
            <Field label="Email">
              <input className="company-input" type="email" placeholder="Enter email address" value={form.email} onChange={(e) => handleField("email", e.target.value)} />
            </Field>
            <Field label="Mobile">
              <input className="company-input" placeholder="Enter mobile number" value={form.mobile} onChange={(e) => handleField("mobile", e.target.value)} />
            </Field>
            <Field label="Address">
              <textarea className="company-input company-input--textarea" rows="3" placeholder="Enter full address" value={form.address} onChange={(e) => handleField("address", e.target.value)} />
            </Field>
          </section>

          <section className="company-form-section">
            <h3 className="company-form-section__title">Location</h3>
            <Field label="City">
              <input className="company-input" placeholder="e.g., Surat" value={form.city} onChange={(e) => handleField("city", e.target.value)} />
            </Field>
            <Field label="State">
              <input className="company-input" placeholder="e.g., Gujarat" value={form.state} onChange={(e) => handleField("state", e.target.value)} />
            </Field>
            <Field label="Country">
              <input className="company-input" placeholder="e.g., India" value={form.country} onChange={(e) => handleField("country", e.target.value)} />
            </Field>
          </section>
        </div>

        <div className="company-drawer__footer">
          <button className="company-btn company-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="company-btn company-btn--primary" onClick={handleSave}>{editingId ? "Update Company" : "Save Company"}</button>
        </div>
      </aside>

      <style>{`
        .company-page, .company-page * { box-sizing: border-box; }
        .company-page {
          --co-text: #0f172a;
          --co-muted: #64748b;
          --co-label: #475569;
          --co-card: #ffffff;
          --co-border: #e5e7eb;
          --co-primary: #2563eb;
          --co-primary-hover: #1d4ed8;
          --co-danger: #ef4444;
          --co-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--co-text);
          padding: 24px;
          font-size: 14px;
          line-height: 1.4;
        }
        .company-page svg { width: 18px; height: 18px; display: block; }

        .company-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .company-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .company-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--co-muted); font-size: 13px; flex-wrap: wrap; }
        .company-breadcrumb__sep { color: #cbd5e1; }
        .company-breadcrumb__current { color: var(--co-primary); font-weight: 500; }

        .company-btn {
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
        .company-btn--ghost { background: #fff; border-color: var(--co-border); color: var(--co-text); }
        .company-btn--ghost:hover { background: #f8fafc; }
        .company-btn--primary { background: var(--co-primary); color: #fff; border-color: var(--co-primary); }
        .company-btn--primary:hover { background: var(--co-primary-hover); }
        .company-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px;
          color: var(--co-muted);
        }
        .company-icon-btn:hover { background: #f1f5f9; color: var(--co-text); }

        .company-stat-card {
          background: var(--co-card);
          border: 1px solid var(--co-border);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--co-shadow);
          display: flex; align-items: center; gap: 16px;
          margin-bottom: 20px;
        }
        .company-stat-card__icon {
          width: 52px; height: 52px;
          background: #f3e8ff;
          color: #9333ea;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .company-stat-card__icon svg { width: 24px; height: 24px; }
        .company-stat-card__label { font-size: 13px; color: var(--co-muted); }
        .company-stat-card__value { font-size: 26px; font-weight: 700; line-height: 1.2; }
        .company-stat-card__hint { font-size: 12px; color: var(--co-muted); }

        .company-card {
          background: var(--co-card);
          border: 1px solid var(--co-border);
          border-radius: 12px;
          box-shadow: var(--co-shadow);
          overflow: hidden;
        }

        .company-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--co-border);
        }
        .company-search { flex: 1; min-width: 220px; position: relative; }
        .company-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%);
          color: var(--co-muted);
        }
        .company-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--co-border);
          border-radius: 8px;
          font-size: 14px;
          background: #fff;
          color: var(--co-text);
          font-family: inherit;
        }
        .company-search__input:focus {
          outline: none;
          border-color: var(--co-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .company-table-wrap { overflow-x: auto; }
        .company-table { width: 100%; border-collapse: collapse; min-width: 900px; }
        .company-table th {
          background: #f8fafc;
          padding: 12px 16px;
          font-size: 12px; font-weight: 600;
          color: var(--co-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border-bottom: 1px solid var(--co-border);
        }
        .company-th--center { text-align: center; }
        .company-table td {
          padding: 14px 16px;
          font-size: 14px;
          border-bottom: 1px solid var(--co-border);
        }
        .company-tr:hover { background: #fafbfc; }
        .company-tr:last-child td { border-bottom: none; }
        .company-td--code { font-weight: 500; color: var(--co-primary); }
        .company-td--name { font-weight: 500; }
        .company-td--empty { text-align: center; color: var(--co-muted); padding: 40px; }

        .company-actions { display: inline-flex; gap: 6px; }
        .company-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px;
          border: 1px solid transparent;
          cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .company-icon-action svg { width: 14px; height: 14px; }
        .company-icon-action--view { background: #eff6ff; color: var(--co-primary); }
        .company-icon-action--view:hover { background: #dbeafe; }
        .company-icon-action--edit { background: #eff6ff; color: var(--co-primary); }
        .company-icon-action--edit:hover { background: #dbeafe; }
        .company-icon-action--delete { background: #fee2e2; color: var(--co-danger); }
        .company-icon-action--delete:hover { background: #fecaca; }

        .company-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--co-border);
          background: #fff;
        }
        .company-pagination__info { font-size: 13px; color: var(--co-muted); }
        .company-pagination__controls { display: flex; gap: 6px; }
        .company-page-btn {
          min-width: 32px;
          padding: 6px 12px;
          border: 1px solid var(--co-border);
          background: #fff;
          border-radius: 6px;
          font-size: 13px;
          cursor: pointer;
          color: var(--co-text);
          font-family: inherit;
          transition: all 0.15s;
        }
        .company-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .company-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .company-page-btn--active { background: var(--co-primary); color: #fff; border-color: var(--co-primary); }

        /* DRAWER */
        .company-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: companyFade 0.2s ease;
        }
        @keyframes companyFade { from { opacity: 0; } to { opacity: 1; } }
        .company-drawer {
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
        .company-drawer--open { transform: translateX(0); }
        .company-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--co-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .company-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .company-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .company-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--co-border);
          display: flex; gap: 10px;
          flex-shrink: 0;
          background: #fff;
        }
        .company-drawer__footer .company-btn { flex: 1; justify-content: center; }

        .company-form-section { margin-bottom: 24px; }
        .company-form-section:last-child { margin-bottom: 0; }
        .company-form-section__title {
          font-size: 14px; font-weight: 600;
          color: var(--co-text);
          margin: 0 0 14px 0;
          padding-bottom: 8px;
          border-bottom: 1px solid var(--co-border);
        }
        .company-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .company-field__label { font-size: 13px; font-weight: 500; color: var(--co-label); display: flex; align-items: center; gap: 6px; }
        .company-field__required { color: var(--co-danger); }
        .company-field__hint { font-size: 11px; color: var(--co-muted); font-weight: 400; }
        .company-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--co-border);
          border-radius: 8px;
          background: #fff;
          font-size: 14px; color: var(--co-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .company-input:focus {
          outline: none;
          border-color: var(--co-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .company-input::placeholder { color: #94a3b8; }
        .company-input--textarea { resize: vertical; min-height: 70px; }

        @media (max-width: 768px) {
          .company-page { padding: 16px; }
          .company-page__title { font-size: 20px; }
          .company-page__header .company-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .company-drawer { width: 100vw; }
          .company-pagination { justify-content: center; }
          .company-pagination__info { text-align: center; width: 100%; }
        }
      `}</style>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="company-field">
      <label className="company-field__label">
        <span>
          {label}
          {required && <span className="company-field__required">*</span>}
        </span>
        {hint && <span className="company-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}

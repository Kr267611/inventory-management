import React, { useState, useMemo, useEffect } from "react";
import { customerApi } from "../../Api/customerApi";

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
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  RotateCcw: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10" />
      <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
    </svg>
  ),
};

const EMPTY_FORM = {
  name: "", code: "",
  contactPerson: "", phone: "", email: "",
  gstNo: "", pan: "",
  address: "", city: "", state: "", pincode: "", country: "India",
  paymentTerms: "", creditLimit: 0,
  isActive: true,
};

// const formatDate = (iso) => {
//   if (!iso) return "-";
//   const d = new Date(iso);
//   return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
// };

const fmtCurrency = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

/* ------------------------------------------------------------------
   MAIN
   ------------------------------------------------------------------ */
export default function CustomerMaster() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");  // all / active / inactive
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  /* ──────── LOAD CUSTOMERS ──────── */
  const loadCustomers = async () => {
    try {
      setLoading(true);
      const data = await customerApi.getAll();   // sab fetch karo (active + inactive)
      setCustomers(data);
    } catch (err) {
      alert("Failed to load customers: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCustomers(); }, []);

  /* ──────── FILTER ──────── */
  const filtered = useMemo(() => {
    let list = [...customers];

    // Status filter
    if (statusFilter === "active") list = list.filter((c) => c.isActive);
    else if (statusFilter === "inactive") list = list.filter((c) => !c.isActive);

    // Search filter
    const q = search.trim().toLowerCase();
    if (q) {
      list = list.filter((c) =>
        c.name?.toLowerCase().includes(q) ||
        (c.code || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q) ||
        (c.gstNo || "").toLowerCase().includes(q) ||
        (c.city || "").toLowerCase().includes(q) ||
        (c.contactPerson || "").toLowerCase().includes(q)
      );
    }
    return list;
  }, [customers, search, statusFilter]);

  /* ──────── STATS ──────── */
  const stats = useMemo(() => {
    const active = customers.filter((c) => c.isActive).length;
    const inactive = customers.length - active;
    const totalOutstanding = customers.reduce((s, c) => s + (c.outstanding || 0), 0);
    return { total: customers.length, active, inactive, totalOutstanding };
  }, [customers]);

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

  const openEdit = (c) => {
    setEditingId(c._id);
    setForm({
      name: c.name || "",
      code: c.code || "",
      contactPerson: c.contactPerson || "",
      phone: c.phone || "",
      email: c.email || "",
      gstNo: c.gstNo || "",
      pan: c.pan || "",
      address: c.address || "",
      city: c.city || "",
      state: c.state || "",
      pincode: c.pincode || "",
      country: c.country || "India",
      paymentTerms: c.paymentTerms || "",
      creditLimit: c.creditLimit || 0,
      isActive: c.isActive !== false,
    });
    setDrawerOpen(true);
  };

  const handleField = (field, value) => setForm({ ...form, [field]: value });

  /* ──────── SAVE (API) ──────── */
  const handleSave = async () => {
    if (!form.name.trim()) return alert("Customer Name required hai");
    if (!form.contactPerson.trim()) return alert("Contact Person required hai");
    if (!form.phone.trim()) return alert("Phone required hai");
    if (!form.email.trim()) return alert("Email required hai");
    if (!form.address.trim()) return alert("Address required hai");

    const payload = {
      ...form,
      creditLimit: Number(form.creditLimit) || 0,
    };

    try {
      setSaving(true);
      if (editingId) {
        await customerApi.update(editingId, payload);
      } else {
        await customerApi.create(payload);
      }
      setDrawerOpen(false);
      await loadCustomers();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  /* ──────── DELETE (soft delete via API) ──────── */
  const handleDelete = async (c) => {
    if (!window.confirm(`"${c.name}" ko deactivate karna hai?\n(Data delete nahi hoga, sirf hide ho jaayega)`)) return;
    try {
      await customerApi.remove(c._id);
      await loadCustomers();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  /* ──────── REACTIVATE ──────── */
  const handleReactivate = async (c) => {
    if (!window.confirm(`"${c.name}" ko reactivate karna hai?`)) return;
    try {
      await customerApi.reactivate(c._id);
      await loadCustomers();
    } catch (err) {
      alert("Reactivate failed: " + err.message);
    }
  };

  /* ──────── PAGINATION ──────── */
  const totalPages = Math.max(1, Math.ceil(filtered.length / ITEMS_PER_PAGE));

  const paginated = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filtered.slice(start, start + ITEMS_PER_PAGE);
  }, [filtered, currentPage]);

  // search/filter change hone pe page 1 pe reset
  useEffect(() => { setCurrentPage(1); }, [search, statusFilter]);

  // agar current page range se bahar chala jaaye (delete ke baad)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  return (
    <div className="cust-page">
      {/* Header */}
      <div className="cust-page__header">
        <div className="cust-page__title-wrap">
          <h1 className="cust-page__title">Customer</h1>
          <div className="cust-breadcrumb">
            <span>Home</span><span className="cust-breadcrumb__sep">/</span>
            <span>Masters</span><span className="cust-breadcrumb__sep">/</span>
            <span className="cust-breadcrumb__current">Customer</span>
          </div>
        </div>
        <button className="cust-btn cust-btn--primary" onClick={openAdd}>
          <Icon.Plus /><span>Add New Customer</span>
        </button>
      </div>

      {/* Stats */}
      <div className="cust-stats">
        <StatCard label="Total Customers" value={stats.total} hint="All Records" icon={<Icon.Users />} tone="indigo" />
        <StatCard label="Active Customers" value={stats.active} hint="Currently Active" icon={<Icon.Users />} tone="green" />
        <StatCard label="Inactive" value={stats.inactive} hint="Deactivated" icon={<Icon.Users />} tone="gray" />
        <StatCard label="Total Outstanding" value={`₹ ${fmtCurrency(stats.totalOutstanding)}`} hint="Customer Dues" icon={<Icon.Users />} tone="amber" />
      </div>

      {/* Toolbar */}
      <div className="cust-card">
        <div className="cust-toolbar">
          <div className="cust-search">
            <span className="cust-search__icon"><Icon.Search /></span>
            <input
              className="cust-search__input"
              placeholder="Search by name, code, phone, GST or city..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <select
            className="cust-status-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="all">All Status</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button className="cust-btn cust-btn--ghost" onClick={() => { setSearch(""); setStatusFilter("all"); }}>
            <Icon.Refresh /><span>Reset</span>
          </button>
        </div>

        {/* Table */}
        <div className="cust-table-wrap">
          <table className="cust-table">
            <thead>
              <tr>
                <th>SR No.</th>
                <th>Code</th>
                <th>Name</th>
                <th>Contact Person</th>
                <th>Phone</th>
                <th>GST No</th>
                <th>City</th>
                <th className="cust-th--right">Credit Limit</th>
                <th className="cust-th--right">Outstanding</th>
                <th className="cust-th--center">Status</th>
                <th className="cust-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan="11" className="cust-td--empty">Loading...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan="11" className="cust-td--empty">No customers found</td></tr>
              ) : (
                paginated.map((c, idx) => (
                  <tr key={c._id} className="cust-tr">
                    <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                    <td className="cust-td--code">{c.code || "-"}</td>
                    <td className="cust-td--name">{c.name}</td>
                    <td>{c.contactPerson || "-"}</td>
                    <td>{c.phone || "-"}</td>
                    <td>{c.gstNo || "-"}</td>
                    <td>{c.city || "-"}</td>
                    <td className="cust-td--right">{c.creditLimit ? `₹ ${fmtCurrency(c.creditLimit)}` : "-"}</td>
                    <td className={`cust-td--right ${c.outstanding > 0 ? "cust-td--due" : ""}`}>
                      {c.outstanding > 0 ? `₹ ${fmtCurrency(c.outstanding)}` : "₹ 0"}
                    </td>
                    <td className="cust-td--center">
                      <span className={`cust-badge cust-badge--${c.isActive ? "active" : "inactive"}`}>
                        {c.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td>
                      <div className="cust-actions">
                        <button className="cust-icon-action cust-icon-action--view" title="View"><Icon.Eye /></button>
                        <button className="cust-icon-action cust-icon-action--edit" title="Edit" onClick={() => openEdit(c)}><Icon.Edit /></button>
                        {c.isActive ? (
                          <button className="cust-icon-action cust-icon-action--delete" title="Deactivate" onClick={() => handleDelete(c)}><Icon.Trash /></button>
                        ) : (
                          <button className="cust-icon-action cust-icon-action--reactivate" title="Reactivate" onClick={() => handleReactivate(c)}><Icon.RotateCcw /></button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {/* Pagination */}
        <div className="cust-pagination">
          <div className="cust-pagination__info">
            Showing {filtered.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filtered.length)} of {filtered.length} entries
          </div>
          <div className="cust-pagination__controls">
            <button
              className="cust-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`cust-page-btn ${page === currentPage ? "cust-page-btn--active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="cust-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      {/* DRAWER */}
      {drawerOpen && <div className="cust-overlay" onClick={() => setDrawerOpen(false)} />}
      <aside className={`cust-drawer ${drawerOpen ? "cust-drawer--open" : ""}`}>
        <div className="cust-drawer__header">
          <h2 className="cust-drawer__title">{editingId ? "Edit Customer" : "Add New Customer"}</h2>
          <button className="cust-icon-btn" onClick={() => setDrawerOpen(false)}><Icon.X /></button>
        </div>

        <div className="cust-drawer__body">
          {/* Basic Info */}
          <section className="cust-form-section">
            <h3 className="cust-form-section__title">Basic Information</h3>
            <Field label="Customer Name" required>
              <input className="cust-input" placeholder="Enter customer name" value={form.name} onChange={(e) => handleField("name", e.target.value)} autoFocus />
            </Field>
            <Field label="Code" hint="e.g., CUST-001">
              <input className="cust-input" placeholder="Enter customer code" value={form.code} onChange={(e) => handleField("code", e.target.value.toUpperCase())} />
            </Field>
          </section>

          {/* Contact */}
          <section className="cust-form-section">
            <h3 className="cust-form-section__title">Contact Information</h3>
            <Field label="Contact Person" required>
              <input className="cust-input" placeholder="e.g., Rahul Sharma" value={form.contactPerson} onChange={(e) => handleField("contactPerson", e.target.value)} />
            </Field>
            <Field label="Phone" required>
              <input className="cust-input" placeholder="Enter phone number" value={form.phone} onChange={(e) => handleField("phone", e.target.value)} />
            </Field>
            <Field label="Email" required>
              <input className="cust-input" type="email" placeholder="Enter email address" value={form.email} onChange={(e) => handleField("email", e.target.value)} />
            </Field>
          </section>

          {/* Tax / Legal */}
          <section className="cust-form-section">
            <h3 className="cust-form-section__title">Tax & Legal</h3>
            <Field label="GST No">
              <input className="cust-input" placeholder="e.g., 24AAPPA7421C2Z6" value={form.gstNo} onChange={(e) => handleField("gstNo", e.target.value.toUpperCase())} />
            </Field>
            <Field label="PAN No">
              <input className="cust-input" placeholder="e.g., AAPPA7421C" value={form.pan} onChange={(e) => handleField("pan", e.target.value.toUpperCase())} />
            </Field>
          </section>

          {/* Address */}
          <section className="cust-form-section">
            <h3 className="cust-form-section__title">Address</h3>
            <Field label="Address" required>
              <textarea className="cust-input cust-input--textarea" rows="2" placeholder="Enter full address" value={form.address} onChange={(e) => handleField("address", e.target.value)} />
            </Field>
            <div className="cust-row-2">
              <Field label="City">
                <input className="cust-input" placeholder="e.g., Surat" value={form.city} onChange={(e) => handleField("city", e.target.value)} />
              </Field>
              <Field label="State">
                <input className="cust-input" placeholder="e.g., Gujarat" value={form.state} onChange={(e) => handleField("state", e.target.value)} />
              </Field>
            </div>
            <div className="cust-row-2">
              <Field label="Pincode">
                <input className="cust-input" placeholder="e.g., 395003" value={form.pincode} onChange={(e) => handleField("pincode", e.target.value)} />
              </Field>
              <Field label="Country">
                <input className="cust-input" placeholder="e.g., India" value={form.country} onChange={(e) => handleField("country", e.target.value)} />
              </Field>
            </div>
          </section>

          {/* Business Terms */}
          <section className="cust-form-section">
            <h3 className="cust-form-section__title">Business Terms</h3>
            <Field label="Payment Terms" hint='e.g., "30 days", "COD"'>
              <input className="cust-input" placeholder="Enter payment terms" value={form.paymentTerms} onChange={(e) => handleField("paymentTerms", e.target.value)} />
            </Field>
            <Field label="Credit Limit (₹)" hint="Maximum credit allowed">
              <input className="cust-input" type="number" min="0" placeholder="0" value={form.creditLimit} onChange={(e) => handleField("creditLimit", e.target.value)} />
            </Field>
          </section>
        </div>

        <div className="cust-drawer__footer">
          <button className="cust-btn cust-btn--ghost" onClick={() => setDrawerOpen(false)}>Cancel</button>
          <button className="cust-btn cust-btn--primary" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : (editingId ? "Update Customer" : "Save Customer")}
          </button>
        </div>
      </aside>

      <style>{`
        .cust-page, .cust-page * { box-sizing: border-box; }
        .cust-page {
          --cu-text: #0f172a;
          --cu-muted: #64748b;
          --cu-label: #475569;
          --cu-card: #ffffff;
          --cu-border: #e5e7eb;
          --cu-primary: #2563eb;
          --cu-primary-hover: #1d4ed8;
          --cu-danger: #ef4444;
          --cu-success: #10b981;
          --cu-warning: #f59e0b;
          --cu-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--cu-text);
          padding: 24px; font-size: 14px; line-height: 1.4;
        }
        .cust-page svg { width: 18px; height: 18px; display: block; }

        .cust-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .cust-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .cust-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--cu-muted); font-size: 13px; flex-wrap: wrap; }
        .cust-breadcrumb__sep { color: #cbd5e1; }
        .cust-breadcrumb__current { color: var(--cu-primary); font-weight: 500; }

        .cust-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .cust-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .cust-btn--ghost { background: #fff; border-color: var(--cu-border); color: var(--cu-text); }
        .cust-btn--ghost:hover { background: #f8fafc; }
        .cust-btn--primary { background: var(--cu-primary); color: #fff; border-color: var(--cu-primary); }
        .cust-btn--primary:hover:not(:disabled) { background: var(--cu-primary-hover); }
        .cust-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 32px; height: 32px;
          display: flex; align-items: center; justify-content: center;
          border-radius: 6px; color: var(--cu-muted);
        }
        .cust-icon-btn:hover { background: #f1f5f9; color: var(--cu-text); }

        /* STAT CARDS */
        .cust-stats {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 14px; margin-bottom: 20px;
        }
        .cust-stat {
          background: var(--cu-card);
          border: 1px solid var(--cu-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--cu-shadow);
          display: flex; align-items: center; gap: 14px;
        }
        .cust-stat__icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .cust-stat__icon svg { width: 22px; height: 22px; }
        .cust-stat__icon--indigo { background: #e0e7ff; color: #4f46e5; }
        .cust-stat__icon--green  { background: #d1fae5; color: #059669; }
        .cust-stat__icon--gray   { background: #f1f5f9; color: #64748b; }
        .cust-stat__icon--amber  { background: #fef3c7; color: #d97706; }
        .cust-stat__label { font-size: 12px; color: var(--cu-muted); }
        .cust-stat__value { font-size: 22px; font-weight: 700; line-height: 1.2; }
        .cust-stat__hint { font-size: 11px; color: var(--cu-muted); }

        .cust-card {
          background: var(--cu-card); border: 1px solid var(--cu-border);
          border-radius: 12px; box-shadow: var(--cu-shadow);
          overflow: hidden;
        }
        .cust-toolbar {
          padding: 16px 20px;
          display: flex; align-items: center; gap: 12px;
          flex-wrap: wrap;
          border-bottom: 1px solid var(--cu-border);
        }
        .cust-search { flex: 1; min-width: 220px; position: relative; }
        .cust-search__icon {
          position: absolute; left: 12px; top: 50%;
          transform: translateY(-50%); color: var(--cu-muted);
        }
        .cust-search__input {
          width: 100%;
          padding: 9px 12px 9px 38px;
          border: 1px solid var(--cu-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--cu-text);
          font-family: inherit;
        }
        .cust-search__input:focus {
          outline: none; border-color: var(--cu-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .cust-status-filter {
          padding: 9px 12px;
          border: 1px solid var(--cu-border);
          border-radius: 8px; font-size: 14px;
          background: #fff; color: var(--cu-text);
          font-family: inherit; cursor: pointer;
          min-width: 140px;
        }

        .cust-table-wrap { overflow-x: auto; }
        .cust-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        .cust-table th {
          background: #f8fafc; padding: 12px 14px;
          font-size: 11px; font-weight: 600;
          color: var(--cu-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--cu-border);
          white-space: nowrap;
        }
        .cust-th--right { text-align: right; }
        .cust-th--center { text-align: center; }
        .cust-table td {
          padding: 14px; font-size: 13px;
          border-bottom: 1px solid var(--cu-border);
          white-space: nowrap;
        }
        .cust-tr:hover { background: #fafbfc; }
        .cust-tr:last-child td { border-bottom: none; }
        .cust-td--code { font-weight: 500; color: var(--cu-primary); }
        .cust-td--name { font-weight: 500; }
        .cust-td--right { text-align: right; }
        .cust-td--center { text-align: center; }
        .cust-td--due { color: var(--cu-danger); font-weight: 600; }
        .cust-td--empty { text-align: center; color: var(--cu-muted); padding: 40px; }

        .cust-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px; font-weight: 600;
        }
        .cust-badge--active   { background: #d1fae5; color: #047857; }
        .cust-badge--inactive { background: #f1f5f9; color: #64748b; }

        .cust-actions { display: inline-flex; gap: 6px; }
        .cust-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px; border: 1px solid transparent;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .cust-icon-action svg { width: 14px; height: 14px; }
        .cust-icon-action--view { background: #eff6ff; color: var(--cu-primary); }
        .cust-icon-action--view:hover { background: #dbeafe; }
        .cust-icon-action--edit { background: #eff6ff; color: var(--cu-primary); }
        .cust-icon-action--edit:hover { background: #dbeafe; }
        .cust-icon-action--delete { background: #fee2e2; color: var(--cu-danger); }
        .cust-icon-action--delete:hover { background: #fecaca; }
        .cust-icon-action--reactivate { background: #d1fae5; color: var(--cu-success); }
        .cust-icon-action--reactivate:hover { background: #a7f3d0; }

        .cust-pagination {
          padding: 12px 20px;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--cu-border);
          background: #fff;
        }
        .cust-pagination__info { font-size: 13px; color: var(--cu-muted); }
        .cust-pagination__controls { display: flex; gap: 6px; }
        .cust-page-btn {
          min-width: 32px; padding: 6px 12px;
          border: 1px solid var(--cu-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--cu-text); font-family: inherit;
        }
        .cust-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .cust-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .cust-page-btn--active { background: var(--cu-primary); color: #fff; border-color: var(--cu-primary); }

        /* DRAWER */
        .cust-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.45);
          z-index: 90;
          animation: custFade 0.2s ease;
        }
        @keyframes custFade { from { opacity: 0; } to { opacity: 1; } }
        .cust-drawer {
          position: fixed; top: 0; right: 0;
          width: 460px; max-width: 100vw;
          height: 100vh; background: #fff;
          box-shadow: -10px 0 30px rgba(0,0,0,0.15);
          z-index: 100; display: flex; flex-direction: column;
          transform: translateX(100%);
          transition: transform 0.25s ease;
        }
        .cust-drawer--open { transform: translateX(0); }
        .cust-drawer__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--cu-border);
          display: flex; align-items: center; justify-content: space-between;
          flex-shrink: 0;
        }
        .cust-drawer__title { font-size: 18px; font-weight: 600; margin: 0; }
        .cust-drawer__body { flex: 1; overflow-y: auto; padding: 20px; }
        .cust-drawer__footer {
          padding: 16px 20px;
          border-top: 1px solid var(--cu-border);
          display: flex; gap: 10px;
          flex-shrink: 0; background: #fff;
        }
        .cust-drawer__footer .cust-btn { flex: 1; justify-content: center; }

        .cust-form-section { margin-bottom: 24px; }
        .cust-form-section:last-child { margin-bottom: 0; }
        .cust-form-section__title {
          font-size: 14px; font-weight: 600;
          color: var(--cu-text);
          margin: 0 0 14px 0; padding-bottom: 8px;
          border-bottom: 1px solid var(--cu-border);
        }
        .cust-row-2 {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 10px;
        }
        .cust-field { display: flex; flex-direction: column; gap: 6px; margin-bottom: 14px; }
        .cust-field__label {
          font-size: 13px; font-weight: 500;
          color: var(--cu-label);
          display: flex; align-items: center; justify-content: space-between; gap: 6px;
        }
        .cust-field__required { color: var(--cu-danger); margin-left: 2px; }
        .cust-field__hint { font-size: 11px; color: var(--cu-muted); font-weight: 400; }
        .cust-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--cu-border);
          border-radius: 8px; background: #fff;
          font-size: 14px; color: var(--cu-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .cust-input:focus {
          outline: none; border-color: var(--cu-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .cust-input::placeholder { color: #94a3b8; }
        .cust-input--textarea { resize: vertical; min-height: 60px; }

        @media (max-width: 1200px) {
          .cust-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .cust-page { padding: 16px; }
          .cust-page__title { font-size: 20px; }
          .cust-page__header .cust-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 560px) {
          .cust-stats { grid-template-columns: 1fr; }
          .cust-drawer { width: 100vw; }
          .cust-pagination { justify-content: center; }
          .cust-pagination__info { text-align: center; width: 100%; }
          .cust-row-2 { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

/* ──────── Helper Components ──────── */
function StatCard({ label, value, hint, icon, tone }) {
  return (
    <div className="cust-stat">
      <div className={`cust-stat__icon cust-stat__icon--${tone}`}>{icon}</div>
      <div>
        <div className="cust-stat__label">{label}</div>
        <div className="cust-stat__value">{value}</div>
        <div className="cust-stat__hint">{hint}</div>
      </div>
    </div>
  );
}

function Field({ label, required, hint, children }) {
  return (
    <div className="cust-field">
      <label className="cust-field__label">
        <span>
          {label}
          {required && <span className="cust-field__required">*</span>}
        </span>
        {hint && <span className="cust-field__hint">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
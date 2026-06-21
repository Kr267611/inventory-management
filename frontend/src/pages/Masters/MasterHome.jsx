import { fetchAllMasters } from "../../Api/masterApi";
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

/* ------------------------------------------------------------------
   INLINE ICONS
   ------------------------------------------------------------------ */
const Icon = {
  ArrowLeft: () => (                                                              // 🆕
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
  Fabric: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" /><line x1="8" y1="17" x2="13" y2="17" />
    </svg>
  ),
  Award: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7" />
      <polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88" />
    </svg>
  ),
  PenSquare: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  ),
  Palette: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="13.5" cy="6.5" r="1.5" /><circle cx="17.5" cy="10.5" r="1.5" />
      <circle cx="8.5" cy="7.5" r="1.5" /><circle cx="6.5" cy="12.5" r="1.5" />
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.437-1.125-.29-.289-.438-.652-.438-1.125a1.64 1.64 0 0 1 1.688-1.688h1.996c3.051 0 5.543-2.492 5.543-5.543C21 6.012 16.984 2 12 2z" />
    </svg>
  ),
  Truck: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  ),
  MapPin: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" />
    </svg>
  ),
  Scale: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="M2 16l3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1z" />
      <path d="M7 21h10" /><path d="M12 3v18" /><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2" />
    </svg>
  ),
  Building: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2" />
      <line x1="9" y1="22" x2="9" y2="18" /><line x1="15" y1="22" x2="15" y2="18" />
      <line x1="8" y1="6" x2="10" y2="6" /><line x1="14" y1="6" x2="16" y2="6" />
      <line x1="8" y1="10" x2="10" y2="10" /><line x1="14" y1="10" x2="16" y2="10" />
      <line x1="8" y1="14" x2="10" y2="14" /><line x1="14" y1="14" x2="16" y2="14" />
    </svg>
  ),
  Container: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 21h18" /><path d="M5 21V7l8-4v18" /><path d="M19 21V11l-6-4" />
      <line x1="9" y1="9" x2="9" y2="9.01" /><line x1="9" y1="12" x2="9" y2="12.01" />
      <line x1="9" y1="15" x2="9" y2="15.01" /><line x1="9" y1="18" x2="9" y2="18.01" />
    </svg>
  ),
  DollarCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="6" x2="12" y2="18" />
      <path d="M15 9.5a2.5 2.5 0 0 0-2.5-2.5h-1a2.5 2.5 0 0 0 0 5h1a2.5 2.5 0 0 1 0 5h-1A2.5 2.5 0 0 1 9 14.5" />
    </svg>
  ),
  Grid: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="1" />
      <line x1="3" y1="9" x2="21" y2="9" /><line x1="3" y1="15" x2="21" y2="15" />
      <line x1="9" y1="3" x2="9" y2="21" /><line x1="15" y1="3" x2="15" y2="21" />
    </svg>
  ),
  Users: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  CheckCircle: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Clock: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  ),
};

/* ------------------------------------------------------------------
   DATA — Easy to edit, add/remove masters
   ------------------------------------------------------------------ */
const MASTERS = [
  { key: "fabric", title: "Fabric", subtitle: "Manage all fabric items", countLabel: "Total Fabrics", icon: <Icon.Fabric />, color: "blue" },
  { key: "quality", title: "Quality", subtitle: "Manage fabric qualities", countLabel: "Total Qualities", icon: <Icon.Award />, color: "green" },
  { key: "design", title: "Design", subtitle: "Manage fabric designs", countLabel: "Total Designs", icon: <Icon.PenSquare />, color: "purple" },
  { key: "color", title: "Color", subtitle: "Manage fabric colors", countLabel: "Total Colors", icon: <Icon.Palette />, color: "pink" },
  { key: "supplier", title: "Supplier", subtitle: "Manage all suppliers", countLabel: "Total Suppliers", icon: <Icon.Truck />, color: "orange" },
  { key: "location", title: "Location", subtitle: "Manage all locations", countLabel: "Total Locations", icon: <Icon.MapPin />, color: "teal" },
  { key: "uom", title: "UOM", subtitle: "Manage units of measurement", countLabel: "Total UOMs", icon: <Icon.Scale />, color: "indigo" },
  { key: "company", title: "Company", subtitle: "Manage company details", countLabel: "Total Companies", icon: <Icon.Building />, color: "violet" },
  { key: "container", title: "Container", subtitle: "Manage all containers", countLabel: "Total Containers", icon: <Icon.Container />, color: "purple" },
  { key: "customer", title: "Customer", subtitle: "Manage customers", countLabel: "Total Customers", icon: <Icon.Users />, color: "blue" },
  { key: "paymentmode", title: "Payment Mode", subtitle: "Manage payment modes", countLabel: "Total Payment Modes", icon: <Icon.Grid />, color: "orange" },
  { key: "salesPerson", title: "Sales Person", subtitle: "Manage sales persons", countLabel: "Total Sales Persons", icon: <Icon.Users />, color: "blue" },
  { key: "transport", title: "Transport", subtitle: "Manage transporters", countLabel: "Total Transporters", icon: <Icon.Truck />, color: "blue" },
];

const STATS = [
  { key: "total", label: "Total Masters", value: 13, hint: "All master records", icon: <Icon.Users />, color: "blue" },
  { key: "active", label: "Active Masters", value: 13, hint: "Active records", icon: <Icon.CheckCircle />, color: "green" },
  { key: "inactive", label: "Inactive Masters", value: 0, hint: "Inactive records", icon: <Icon.Trash />, color: "red" },
  { key: "updated", label: "Last Updated", value: "Today", hint: "Recently updated", icon: <Icon.Clock />, color: "purple" },
];

/* ------------------------------------------------------------------
   MAIN COMPONENT
   ------------------------------------------------------------------ */
export default function Masters({ onView, onAddNew }) {
  const navigate = useNavigate();
  const [counts, setCounts] = useState({});
  const handleView = (key) => {
    if (onView) onView(key);
    else navigate(`/dashboard/masters/${key}`);
  };

  useEffect(() => {
    const loadCounts = async () => {
      try {
        const data = await fetchAllMasters();
        setCounts({
          company: data.companies?.length || 0,
          location: data.locations?.length || 0,
          supplier: data.suppliers?.length || 0,
          customer: data.customers?.length || 0,
          fabric: data.fabrics?.length || 0,
          quality: data.qualities?.length || 0,
          design: data.designs?.length || 0,
          color: data.colors?.length || 0,
          uom: data.uoms?.length || 0,
          transport: data.transports?.length || 0,
          salesPerson: data.salespersons?.length || 0,
          paymentmode: data.paymentModes?.length || 0,
        });
      } catch (error) {
        console.error(error);
      }
    };

    loadCounts();
  }, []);

  return (
    <div className="master-page">
      {/* Page header */}
      <div className="master-page__header">
        <div className="master-page__title-wrap">
          <h1 className="master-page__title">Masters</h1>
          <div className="master-breadcrumb">
            <span>Home</span>
            <span className="master-breadcrumb__sep">/</span>
            <span className="master-breadcrumb__current">Masters</span>
          </div>
        </div>
        <div className="master-page__actions">                              {/* 🆕 wrapper */}
          <button className="master-btn master-btn--ghost" onClick={() => navigate(-1)}>     {/* 🆕 */}
            <Icon.ArrowLeft /><span>Back</span>
          </button>
          {/* <button className="master-btn master-btn--primary" onClick={onAddNew} disabled>
            <Icon.Plus /><span>Add New Master</span><Icon.ChevronDown />
          </button> */}
        </div>
      </div>

      {/* Masters grid */}
      <div className="master-grid">
        {MASTERS.map((m) => (
          <div key={m.key} className={`master-card master-card--${m.color}`}>
            <div className="master-card__top">
              <div className="master-card__icon">{m.icon}</div>
              <div className="master-card__heading">
                <div className="master-card__title">{m.title}</div>
                <div className="master-card__subtitle">{m.subtitle}</div>
              </div>
            </div>
            <div className="master-card__count">
              {counts[m.key] ?? 0}
            </div>
            <div className="master-card__count-label">{m.countLabel}</div>
            <button className="master-card__btn" onClick={() => handleView(m.key)}>
              View {m.title === "UOM" ? "UOMs" : m.title === "Customer" ? "Customers" : m.title === "Company" ? "Companies" : m.title + "s"}
            </button>
          </div>
        ))}
      </div>

      {/* Stats row */}
      <div className="master-stats-grid">
        {STATS.map((s) => (
          <div key={s.key} className={`master-stat master-stat--${s.color}`}>
            <div className="master-stat__icon">{s.icon}</div>
            <div className="master-stat__body">
              <div className="master-stat__label">{s.label}</div>
              <div className="master-stat__value">{s.value}</div>
              <div className="master-stat__hint">{s.hint}</div>
            </div>
          </div>
        ))}
      </div>

      <style>{`
        .master-page, .master-page * { box-sizing: border-box; }
        .master-page {
          --m-text: #0f172a;
          --m-muted: #64748b;
          --m-label: #475569;
          --m-card: #ffffff;
          --m-border: #e5e7eb;
          --m-primary: #2563eb;
          --m-primary-hover: #1d4ed8;
          --m-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);

          /* color palette per master */
          --c-blue-bg: #2563eb;      --c-blue-tint: #eff6ff;     --c-blue-text: #2563eb;     --c-blue-border: #bfdbfe;
          --c-green-bg: #10b981;     --c-green-tint: #ecfdf5;    --c-green-text: #059669;    --c-green-border: #a7f3d0;
          --c-purple-bg: #a855f7;    --c-purple-tint: #faf5ff;   --c-purple-text: #9333ea;   --c-purple-border: #e9d5ff;
          --c-pink-bg: #ec4899;      --c-pink-tint: #fdf2f8;     --c-pink-text: #db2777;     --c-pink-border: #fbcfe8;
          --c-orange-bg: #f97316;    --c-orange-tint: #fff7ed;   --c-orange-text: #ea580c;   --c-orange-border: #fed7aa;
          --c-teal-bg: #14b8a6;      --c-teal-tint: #f0fdfa;     --c-teal-text: #0d9488;     --c-teal-border: #99f6e4;
          --c-indigo-bg: #6366f1;    --c-indigo-tint: #eef2ff;   --c-indigo-text: #4f46e5;   --c-indigo-border: #c7d2fe;
          --c-violet-bg: #8b5cf6;    --c-violet-tint: #f5f3ff;   --c-violet-text: #7c3aed;   --c-violet-border: #ddd6fe;
          --c-red-bg: #ef4444;       --c-red-tint: #fef2f2;      --c-red-text: #dc2626;      --c-red-border: #fecaca;

          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--m-text);
        //   padding: 24px;
        //   font-size: 14px;
        //   line-height: 1.4;
        }
        .master-page svg { width: 20px; height: 20px; display: block; }

        /* Header */
        .master-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 24px;
        }
        .master-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .master-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--m-muted); font-size: 13px; }
        .master-breadcrumb__sep { color: #cbd5e1; }
        .master-breadcrumb__current { color: var(--m-primary); font-weight: 500; }

        .master-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px;
          border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer;
          border: 1px solid transparent;
          transition: all 0.15s;
          font-family: inherit;
        }
        .master-btn--primary { background: var(--m-primary); color: #fff; border-color: var(--m-primary); }
        .master-btn--primary:hover { background: var(--m-primary-hover); }
        .master-btn--primary svg { width: 16px; height: 16px; }

        /* 🆕 Ghost button + actions wrapper */
.master-btn--ghost {
  background: #fff;
  color: var(--m-text);
  border-color: var(--m-border);
}
.master-btn--ghost:hover {
  background: #f8fafc;
  border-color: #cbd5e1;
}
.master-btn--ghost svg { width: 16px; height: 16px; }

.master-page__actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

        /* Master grid */
        .master-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
          margin-bottom: 24px;
        }

        .master-card {
          background: var(--m-card);
          border: 1px solid var(--m-border);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--m-shadow);
          display: flex;
          flex-direction: column;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .master-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }

        .master-card__top {
          display: flex; gap: 12px; align-items: flex-start;
          margin-bottom: 18px;
        }
        .master-card__icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          color: #fff;
          flex-shrink: 0;
        }
        .master-card__icon svg { width: 22px; height: 22px; }
        .master-card__heading { min-width: 0; }
        .master-card__title { font-size: 16px; font-weight: 600; color: var(--m-text); }
        .master-card__subtitle { font-size: 12px; color: var(--m-muted); margin-top: 2px; line-height: 1.3; }

        .master-card__count {
          font-size: 32px; font-weight: 700;
          color: var(--m-text); line-height: 1;
          margin-bottom: 4px;
        }
        .master-card__count-label {
          font-size: 13px; color: var(--m-muted);
          margin-bottom: 16px;
        }
        .master-card__btn {
          width: 100%;
          padding: 10px;
          border-radius: 8px;
          border: 1px solid transparent;
          font-size: 13px; font-weight: 500;
          cursor: pointer;
          transition: all 0.15s;
          font-family: inherit;
          margin-top: auto;
        }

        /* Apply colors per modifier */
        .master-card--blue   .master-card__icon { background: var(--c-blue-bg); }
        .master-card--blue   .master-card__btn  { background: var(--c-blue-tint);   color: var(--c-blue-text);   border-color: var(--c-blue-border); }
        .master-card--blue   .master-card__btn:hover  { background: #dbeafe; }

        .master-card--green  .master-card__icon { background: var(--c-green-bg); }
        .master-card--green  .master-card__btn  { background: var(--c-green-tint);  color: var(--c-green-text);  border-color: var(--c-green-border); }
        .master-card--green  .master-card__btn:hover  { background: #d1fae5; }

        .master-card--purple .master-card__icon { background: var(--c-purple-bg); }
        .master-card--purple .master-card__btn  { background: var(--c-purple-tint); color: var(--c-purple-text); border-color: var(--c-purple-border); }
        .master-card--purple .master-card__btn:hover  { background: #f3e8ff; }

        .master-card--pink   .master-card__icon { background: var(--c-pink-bg); }
        .master-card--pink   .master-card__btn  { background: var(--c-pink-tint);   color: var(--c-pink-text);   border-color: var(--c-pink-border); }
        .master-card--pink   .master-card__btn:hover  { background: #fce7f3; }

        .master-card--orange .master-card__icon { background: var(--c-orange-bg); }
        .master-card--orange .master-card__btn  { background: var(--c-orange-tint); color: var(--c-orange-text); border-color: var(--c-orange-border); }
        .master-card--orange .master-card__btn:hover  { background: #ffedd5; }

        .master-card--teal   .master-card__icon { background: var(--c-teal-bg); }
        .master-card--teal   .master-card__btn  { background: var(--c-teal-tint);   color: var(--c-teal-text);   border-color: var(--c-teal-border); }
        .master-card--teal   .master-card__btn:hover  { background: #ccfbf1; }

        .master-card--indigo .master-card__icon { background: var(--c-indigo-bg); }
        .master-card--indigo .master-card__btn  { background: var(--c-indigo-tint); color: var(--c-indigo-text); border-color: var(--c-indigo-border); }
        .master-card--indigo .master-card__btn:hover  { background: #e0e7ff; }

        .master-card--violet .master-card__icon { background: var(--c-violet-bg); }
        .master-card--violet .master-card__btn  { background: var(--c-violet-tint); color: var(--c-violet-text); border-color: var(--c-violet-border); }
        .master-card--violet .master-card__btn:hover  { background: #ede9fe; }

        /* Stats grid */
        .master-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .master-stat {
          background: var(--m-card);
          border: 1px solid var(--m-border);
          border-radius: 12px;
          padding: 16px;
          box-shadow: var(--m-shadow);
          display: flex; align-items: center; gap: 14px;
        }
        .master-stat__icon {
          width: 44px; height: 44px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .master-stat__icon svg { width: 22px; height: 22px; }
        .master-stat__body { min-width: 0; }
        .master-stat__label { font-size: 13px; color: var(--m-muted); margin-bottom: 2px; }
        .master-stat__value { font-size: 22px; font-weight: 700; color: var(--m-text); line-height: 1.1; }
        .master-stat__hint { font-size: 12px; color: var(--m-muted); margin-top: 2px; }

        .master-stat--blue   .master-stat__icon { background: var(--c-blue-tint);   color: var(--c-blue-text); }
        .master-stat--green  .master-stat__icon { background: var(--c-green-tint);  color: var(--c-green-text); }
        .master-stat--red    .master-stat__icon { background: var(--c-red-tint);    color: var(--c-red-text); }
        .master-stat--purple .master-stat__icon { background: var(--c-purple-tint); color: var(--c-purple-text); }

        /* Responsive */
        @media (max-width: 1200px) {
          .master-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 900px) {
          .master-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .master-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
        }
        @media (max-width: 640px) {
          .master-page { padding: 16px; }
          .master-page__title { font-size: 20px; }
          .master-page__header .master-btn { width: 100%; justify-content: center; }
        }
        @media (max-width: 480px) {
          .master-grid { grid-template-columns: 1fr; }
          .master-stats-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

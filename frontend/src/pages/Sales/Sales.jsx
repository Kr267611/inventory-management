import React, { useState, useMemo } from "react";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  ArrowLeft: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" />
    </svg>
  ),
  Refresh: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  ),
  Save: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
      <polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
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
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
};

/* ================================================================
   MOCK DATA
   ================================================================ */
const CUSTOMERS = ["MILON TEXTILES", "RIYA BOUTIQUE", "SHIVAM TRADERS", "OM FABRICS", "ABC EXPORTS"];
const LOCATIONS = ["Godown A", "Godown B"];
const TRANSPORTS = ["Self", "Courier", "Goods Transport"];
const PAYMENT_TYPES = ["Credit", "Cash", "NEFT", "UPI", "Cheque"];
const SALES_PERSONS = ["Rajesh Kumar", "Suresh Patel", "Amit Sharma"];
const FABRICS = ["GREY FABRIC", "BLUE FABRIC", "BLACK FABRIC", "WHITE FABRIC", "NAVY FABRIC", "RED FABRIC"];
const QUALITIES = ["POLY KNIT BIG", "COTTON", "SILK"];
const COLORS = ["GREY", "BLUE", "BLACK", "WHITE", "NAVY", "RED", "GREEN", "YELLOW"];

const fmt = (n) => Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const EMPTY_ITEM = {
  fabric: "GREY FABRIC",
  quality: "POLY KNIT BIG",
  color: "GREY",
  pcs: "",
  meterPerPcs: "",
  availablePcs: 6,
  rate: "",
  discount: "0",
};

/* ================================================================
   MAIN
   ================================================================ */
export default function Sales() {
  const [form, setForm] = useState({
    saleDate: "2026-05-30",
    invoiceNo: "SAL-2026-125",
    customer: "MILON TEXTILES",
    location: "Godown A",
    transport: "Self",
    lrNo: "",
    gstNo: "24AAPPX1234C1Z6",
    paymentType: "Credit",
    dueDate: "2026-06-15",
    salesPerson: "Rajesh Kumar",
    remarks: "",
  });

  const [itemForm, setItemForm] = useState({
    fabric: "GREY FABRIC",
    quality: "POLY KNIT BIG",
    color: "GREY",
    pcs: "2",
    meterPerPcs: "25.59",
    availablePcs: 6,
    rate: "95.00",
    discount: "0",
  });

  // Start with the sample row matching the image
  const [items, setItems] = useState([
    {
      id: 1,
      fabric: "GREY FABRIC",
      quality: "POLY KNIT BIG",
      color: "GREY",
      pcs: 2,
      meterPerPcs: 25.59,
      totalMeter: 51.18,
      rate: 95.0,
      discount: 0,
      amount: 4864.2,
    },
  ]);

  const [editingId, setEditingId] = useState(null);

  const setF = (k, v) => setForm({ ...form, [k]: v });
  const setIf = (k, v) => setItemForm({ ...itemForm, [k]: v });

  // Live calculation in item form
  const itemAmount = useMemo(() => {
    const pcs = parseFloat(itemForm.pcs) || 0;
    const m = parseFloat(itemForm.meterPerPcs) || 0;
    const r = parseFloat(itemForm.rate) || 0;
    const d = parseFloat(itemForm.discount) || 0;
    const totalMeter = pcs * m;
    return Math.max(totalMeter * r - totalMeter * d, 0);
  }, [itemForm]);

  // Summary calculations
  const summary = useMemo(() => {
    const totalPcs = items.reduce((s, it) => s + (it.pcs || 0), 0);
    const totalMeter = items.reduce((s, it) => s + (it.totalMeter || 0), 0);
    const grossAmount = items.reduce((s, it) => s + it.totalMeter * it.rate, 0);
    const discountTotal = items.reduce((s, it) => s + it.totalMeter * it.discount, 0);
    const netAmount = grossAmount - discountTotal;
    const avgMeter = totalPcs ? totalMeter / totalPcs : 0;
    const avgRate = totalMeter ? grossAmount / totalMeter : 0;
    return { totalPcs, totalMeter, avgMeter, avgRate, grossAmount, discountTotal, netAmount };
  }, [items]);

  const handleAddItem = () => {
    const pcs = parseFloat(itemForm.pcs);
    const meterPerPcs = parseFloat(itemForm.meterPerPcs);
    const rate = parseFloat(itemForm.rate);
    const discount = parseFloat(itemForm.discount) || 0;

    if (!pcs || !meterPerPcs || !rate) {
      alert("PCS, Meter (Per PCS) aur Rate fill karo");
      return;
    }
    if (pcs > itemForm.availablePcs) {
      alert(`Sirf ${itemForm.availablePcs} PCS available hain stock me`);
      return;
    }

    const totalMeter = pcs * meterPerPcs;
    const amount = Math.max(totalMeter * rate - totalMeter * discount, 0);

    const newRow = {
      id: editingId ?? Date.now(),
      fabric: itemForm.fabric,
      quality: itemForm.quality,
      color: itemForm.color,
      pcs,
      meterPerPcs,
      totalMeter,
      rate,
      discount,
      amount,
    };

    if (editingId) {
      setItems(items.map((it) => (it.id === editingId ? newRow : it)));
      setEditingId(null);
    } else {
      setItems([...items, newRow]);
    }
    setItemForm({ ...EMPTY_ITEM, availablePcs: 6 });
  };

  const handleEdit = (row) => {
    setEditingId(row.id);
    setItemForm({
      fabric: row.fabric,
      quality: row.quality,
      color: row.color,
      pcs: String(row.pcs),
      meterPerPcs: String(row.meterPerPcs),
      availablePcs: 6,
      rate: String(row.rate),
      discount: String(row.discount),
    });
  };

  const handleDelete = (id) => {
    if (window.confirm("Item delete karna hai?")) {
      setItems(items.filter((it) => it.id !== id));
      if (editingId === id) setEditingId(null);
    }
  };

  const handleReset = () => {
    if (!window.confirm("Saare items aur form reset ho jaayenge. Sure?")) return;
    setItems([]);
    setItemForm({ ...EMPTY_ITEM, availablePcs: 6 });
    setEditingId(null);
    setForm({ ...form, lrNo: "", remarks: "" });
  };

  const handleSave = () => {
    if (items.length === 0) {
      alert("Kam se kam ek item add karo");
      return;
    }
    alert("Sales saved (mock).\n\n" + JSON.stringify({ ...form, items, summary }, null, 2));
  };

  return (
    <div className="sales-page">
      {/* HEADER */}
      <div className="sales-page__header">
        <div>
          <h1 className="sales-page__title">Sales Entry</h1>
          <div className="sales-breadcrumb">
            <span>Home</span>
            <span className="sales-breadcrumb__sep">/</span>
            <span className="sales-breadcrumb__current">Sales Entry</span>
          </div>
        </div>
        <div className="sales-page__actions">
          <button className="sales-btn sales-btn--ghost" onClick={() => alert("Back to List (mock)")}>
            <Icon.ArrowLeft /><span>Back to List</span>
          </button>
          <button className="sales-btn sales-btn--ghost" onClick={handleReset}>
            <Icon.Refresh /><span>Reset</span>
          </button>
          <button className="sales-btn sales-btn--primary" onClick={handleSave}>
            <Icon.Save /><span>Save Sales</span>
          </button>
        </div>
      </div>

      {/* MAIN GRID */}
      <div className="sales-content">
        <div className="sales-main">
          {/* SALES INFORMATION */}
          <section className="sales-card">
            <h2 className="sales-card__title">Sales Information</h2>
            <div className="sales-grid sales-grid--3">
              <Field label="Sale Date" required>
                <div className="sales-input-wrap">
                  <input type="date" className="sales-input" value={form.saleDate} onChange={(e) => setF("saleDate", e.target.value)} />
                  <span className="sales-input__icon"><Icon.Calendar /></span>
                </div>
              </Field>
              <Field label="Invoice No" required>
                <input className="sales-input" value={form.invoiceNo} onChange={(e) => setF("invoiceNo", e.target.value)} />
              </Field>
              <Field label="Customer / Party" required>
                <select className="sales-input" value={form.customer} onChange={(e) => setF("customer", e.target.value)}>
                  {CUSTOMERS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>

              <Field label="Location (Godown)" required>
                <select className="sales-input" value={form.location} onChange={(e) => setF("location", e.target.value)}>
                  {LOCATIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Transport">
                <select className="sales-input" value={form.transport} onChange={(e) => setF("transport", e.target.value)}>
                  {TRANSPORTS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="LR No">
                <input className="sales-input" placeholder="Enter LR No" value={form.lrNo} onChange={(e) => setF("lrNo", e.target.value)} />
              </Field>

              <Field label="GST No">
                <input className="sales-input" value={form.gstNo} onChange={(e) => setF("gstNo", e.target.value)} />
              </Field>
              <Field label="Payment Type">
                <select className="sales-input" value={form.paymentType} onChange={(e) => setF("paymentType", e.target.value)}>
                  {PAYMENT_TYPES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Due Date">
                <div className="sales-input-wrap">
                  <input type="date" className="sales-input" value={form.dueDate} onChange={(e) => setF("dueDate", e.target.value)} />
                  <span className="sales-input__icon"><Icon.Calendar /></span>
                </div>
              </Field>

              <Field label="Sales Person">
                <select className="sales-input" value={form.salesPerson} onChange={(e) => setF("salesPerson", e.target.value)}>
                  {SALES_PERSONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Remarks" full>
                <input className="sales-input" placeholder="Enter remarks (optional)" value={form.remarks} onChange={(e) => setF("remarks", e.target.value)} />
              </Field>
            </div>
          </section>

          {/* ADD ITEMS */}
          <section className="sales-card">
            <div className="sales-card__head">
              <h2 className="sales-card__title">Add Items</h2>
              <button className="sales-btn sales-btn--primary sales-btn--sm" onClick={handleAddItem}>
                {editingId ? <Icon.Check /> : <Icon.Plus />}
                <span>{editingId ? "Update Item" : "Add Item"}</span>
              </button>
            </div>

            <div className="sales-grid sales-grid--4">
              <Field label="Fabric / Item" required>
                <select className="sales-input" value={itemForm.fabric} onChange={(e) => setIf("fabric", e.target.value)}>
                  {FABRICS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Quality" required>
                <select className="sales-input" value={itemForm.quality} onChange={(e) => setIf("quality", e.target.value)}>
                  {QUALITIES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Color" required>
                <select className="sales-input" value={itemForm.color} onChange={(e) => setIf("color", e.target.value)}>
                  {COLORS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="PCS (Taka)" required>
                <input className="sales-input" type="number" min="1" value={itemForm.pcs} onChange={(e) => setIf("pcs", e.target.value)} placeholder="0" />
              </Field>
            </div>

            <div className="sales-grid sales-grid--5">
              <Field label="Meter (Per PCS)">
                <input className="sales-input" type="number" step="0.01" value={itemForm.meterPerPcs} onChange={(e) => setIf("meterPerPcs", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Available PCS">
                <input className="sales-input sales-input--readonly" readOnly value={itemForm.availablePcs} />
              </Field>
              <Field label="Rate (Per Mtr)" required>
                <input className="sales-input" type="number" step="0.01" value={itemForm.rate} onChange={(e) => setIf("rate", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Discount (Per Mtr)">
                <input className="sales-input" type="number" step="0.01" value={itemForm.discount} onChange={(e) => setIf("discount", e.target.value)} placeholder="0.00" />
              </Field>
              <Field label="Amount (INR)">
                <input className="sales-input sales-input--computed" readOnly value={fmt(itemAmount)} />
              </Field>
            </div>
          </section>

          {/* SELECTED ITEMS TABLE */}
          <section className="sales-card">
            <h2 className="sales-card__title">Selected Items</h2>

            <div className="sales-table-wrap">
              <table className="sales-table">
                <thead>
                  <tr>
                    <th>SR No.</th>
                    <th>Fabric / Item</th>
                    <th>Quality</th>
                    <th>Color</th>
                    <th className="sales-th--right">PCS (Taka)</th>
                    <th className="sales-th--right">Meter (Per PCS)</th>
                    <th className="sales-th--right">Total Meter</th>
                    <th className="sales-th--right">Rate (Per Mtr)</th>
                    <th className="sales-th--right">Discount</th>
                    <th className="sales-th--right">Amount (INR)</th>
                    <th className="sales-th--center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="11" className="sales-td--empty">No items added. Add items from the form above.</td></tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it.id} className={`sales-tr ${editingId === it.id ? "sales-tr--editing" : ""}`}>
                        <td>{idx + 1}</td>
                        <td className="sales-td--strong">{it.fabric}</td>
                        <td>{it.quality}</td>
                        <td>{it.color}</td>
                        <td className="sales-td--right">{it.pcs}</td>
                        <td className="sales-td--right">{fmt(it.meterPerPcs)}</td>
                        <td className="sales-td--right">{fmt(it.totalMeter)}</td>
                        <td className="sales-td--right">{fmt(it.rate)}</td>
                        <td className="sales-td--right">{fmt(it.totalMeter * it.discount)}</td>
                        <td className="sales-td--right sales-td--strong">{fmt(it.amount)}</td>
                        <td className="sales-td--center">
                          <div className="sales-actions">
                            <button className="sales-icon-btn sales-icon-btn--edit" title="Edit" onClick={() => handleEdit(it)}><Icon.Edit /></button>
                            <button className="sales-icon-btn sales-icon-btn--delete" title="Delete" onClick={() => handleDelete(it.id)}><Icon.Trash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr className="sales-total-row">
                      <td colSpan="4" className="sales-td--strong sales-td--center">Total</td>
                      <td className="sales-td--right sales-td--strong">{summary.totalPcs}</td>
                      <td></td>
                      <td className="sales-td--right sales-td--strong">{fmt(summary.totalMeter)}</td>
                      <td></td>
                      <td className="sales-td--right sales-td--strong">{fmt(summary.discountTotal)}</td>
                      <td className="sales-td--right sales-td--strong">{fmt(summary.netAmount)}</td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>

            <div className="sales-pagination__info">
              Showing {items.length === 0 ? 0 : 1} to {items.length} of {items.length} entries
            </div>
          </section>

          {/* NOTE */}
          <div className="sales-note">
            <Icon.Info />
            <span><strong>Note:</strong> Sales entry will automatically reduce stock from Inventory (available PCS).</span>
          </div>
        </div>

        {/* RIGHT SUMMARY */}
        <aside className="sales-aside">
          <section className="sales-card">
            <h2 className="sales-card__title">Sales Summary</h2>

            <div className="sales-summary-grid">
              <SummaryBox label="Total PCS (Taka)" value={summary.totalPcs} />
              <SummaryBox label="Total Meter" value={fmt(summary.totalMeter)} />
              <SummaryBox label="Average Meter (Per PCS)" value={fmt(summary.avgMeter)} />
              <SummaryBox label="Rate (Per Mtr)" value={fmt(summary.avgRate)} />
            </div>

            <div className="sales-highlight sales-highlight--blue">
              <div className="sales-highlight__label">Total Amount (INR)</div>
              <div className="sales-highlight__value">{fmt(summary.grossAmount)}</div>
            </div>
            <div className="sales-highlight sales-highlight--yellow">
              <div className="sales-highlight__label">Discount (INR)</div>
              <div className="sales-highlight__value">{fmt(summary.discountTotal)}</div>
            </div>
            <div className="sales-highlight sales-highlight--green">
              <div className="sales-highlight__label">Net Amount (INR)</div>
              <div className="sales-highlight__value">{fmt(summary.netAmount)}</div>
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .sales-page, .sales-page * { box-sizing: border-box; }
        .sales-page {
          --sl-text: #0f172a;
          --sl-muted: #64748b;
          --sl-label: #475569;
          --sl-card: #ffffff;
          --sl-border: #e5e7eb;
          --sl-primary: #2563eb;
          --sl-primary-hover: #1d4ed8;
          --sl-danger: #ef4444;
          --sl-success: #10b981;
          --sl-warning: #f59e0b;
          --sl-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--sl-text);
          font-size: 14px;
          line-height: 1.4;
          // padding: 24px;
        }
        .sales-page svg { width: 16px; height: 16px; display: block; }

        /* HEADER */
        .sales-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .sales-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .sales-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--sl-muted); font-size: 13px; }
        .sales-breadcrumb__sep { color: #cbd5e1; }
        .sales-breadcrumb__current { color: var(--sl-primary); font-weight: 500; }
        .sales-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        /* BUTTONS */
        .sales-btn {
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
        .sales-btn--ghost { background: #fff; border-color: var(--sl-border); color: var(--sl-text); }
        .sales-btn--ghost:hover { background: #f8fafc; }
        .sales-btn--primary { background: var(--sl-primary); color: #fff; border-color: var(--sl-primary); }
        .sales-btn--primary:hover { background: var(--sl-primary-hover); }
        .sales-btn--sm { padding: 7px 12px; font-size: 13px; }
        .sales-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 30px; height: 30px;
          border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .sales-icon-btn svg { width: 14px; height: 14px; }
        .sales-icon-btn--edit { background: #dbeafe; color: var(--sl-primary); }
        .sales-icon-btn--edit:hover { background: #bfdbfe; }
        .sales-icon-btn--delete { background: #fee2e2; color: var(--sl-danger); }
        .sales-icon-btn--delete:hover { background: #fecaca; }

        /* LAYOUT */
        .sales-content {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 20px;
          align-items: flex-start;
        }
        .sales-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
        .sales-aside { display: flex; flex-direction: column; gap: 18px; }

        /* CARD */
        .sales-card {
          background: var(--sl-card);
          border: 1px solid var(--sl-border);
          border-radius: 12px;
          padding: 20px;
          box-shadow: var(--sl-shadow);
        }
        .sales-card__title { font-size: 16px; font-weight: 600; margin: 0 0 16px 0; }
        .sales-card__head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
        }
        .sales-card__head .sales-card__title { margin: 0; }

        /* FORM GRID */
        .sales-grid {
          display: grid;
          gap: 14px 18px;
        }
        .sales-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .sales-grid--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 14px; }
        .sales-grid--5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }

        /* FIELD */
        .sales-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .sales-field--full { grid-column: 1 / -1; }
        .sales-field--span2 { grid-column: span 2; }
        .sales-field__label {
          font-size: 13px;
          font-weight: 500;
          color: var(--sl-label);
        }
        .sales-field__required { color: var(--sl-danger); margin-left: 2px; }

        /* INPUTS */
        .sales-input {
          width: 100%;
          padding: 9px 12px;
          border: 1px solid var(--sl-border);
          border-radius: 8px;
          background: #fff;
          font-size: 14px;
          color: var(--sl-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sales-input:focus {
          outline: none;
          border-color: var(--sl-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .sales-input::placeholder { color: #94a3b8; }
        .sales-input--readonly {
          background: #f8fafc;
          color: var(--sl-muted);
          cursor: not-allowed;
        }
        .sales-input--computed {
          background: #eff6ff;
          color: var(--sl-primary);
          font-weight: 600;
          border-color: #bfdbfe;
        }
        .sales-input-wrap { position: relative; }
        .sales-input-wrap .sales-input { padding-right: 36px; }
        .sales-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--sl-muted); pointer-events: none;
        }

        /* TABLE */
        .sales-table-wrap {
          overflow-x: auto;
          border: 1px solid var(--sl-border);
          border-radius: 8px;
        }
        .sales-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        .sales-table th {
          background: #f8fafc;
          padding: 11px 14px;
          font-size: 11px; font-weight: 600;
          color: var(--sl-muted);
          text-align: left;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          border-bottom: 1px solid var(--sl-border);
          white-space: nowrap;
        }
        .sales-th--right { text-align: right; }
        .sales-th--center { text-align: center; }
        .sales-table td {
          padding: 13px 14px;
          font-size: 13px;
          border-bottom: 1px solid var(--sl-border);
          white-space: nowrap;
        }
        .sales-tr:hover { background: #fafbfc; }
        .sales-tr--editing { background: #fef3c7 !important; }
        .sales-tr:last-child td { border-bottom: none; }
        .sales-td--right { text-align: right; }
        .sales-td--center { text-align: center; }
        .sales-td--strong { font-weight: 600; }
        .sales-td--empty { text-align: center; color: var(--sl-muted); padding: 32px !important; }
        .sales-actions { display: inline-flex; gap: 6px; justify-content: center; }

        /* TOTAL ROW */
        .sales-total-row td {
          background: #f8fafc;
          font-size: 13px;
          padding: 14px;
          border-top: 2px solid var(--sl-border);
          border-bottom: none;
        }

        .sales-pagination__info {
          margin-top: 12px;
          font-size: 13px;
          color: var(--sl-muted);
        }

        /* NOTE */
        .sales-note {
          background: #eff6ff;
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 14px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px;
          color: #1e40af;
        }
        .sales-note svg { color: var(--sl-primary); flex-shrink: 0; }

        /* SUMMARY */
        .sales-summary-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 14px;
        }
        .sales-summary-box {
          background: #f8fafc;
          border: 1px solid var(--sl-border);
          border-radius: 10px;
          padding: 14px;
        }
        .sales-summary-box__label { font-size: 12px; color: var(--sl-muted); margin-bottom: 6px; }
        .sales-summary-box__value { font-size: 20px; font-weight: 700; color: var(--sl-text); }

        .sales-highlight {
          border-radius: 10px;
          padding: 16px;
          margin-top: 12px;
        }
        .sales-highlight:first-of-type { margin-top: 0; }
        .sales-highlight--blue { background: #eff6ff; border: 1px solid #bfdbfe; }
        .sales-highlight--blue .sales-highlight__value { color: var(--sl-primary); }
        .sales-highlight--yellow { background: #fefce8; border: 1px solid #fde68a; }
        .sales-highlight--yellow .sales-highlight__value { color: #b45309; }
        .sales-highlight--green { background: #ecfdf5; border: 1px solid #a7f3d0; }
        .sales-highlight--green .sales-highlight__value { color: var(--sl-success); }
        .sales-highlight__label { font-size: 13px; color: var(--sl-label); margin-bottom: 6px; font-weight: 500; }
        .sales-highlight__value { font-size: 22px; font-weight: 700; }

        /* RESPONSIVE */
        @media (max-width: 1300px) {
          .sales-content { grid-template-columns: 1fr; }
          .sales-aside { order: -1; }
          .sales-summary-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 1000px) {
          .sales-grid--5 { grid-template-columns: repeat(3, 1fr); }
          .sales-grid--4 { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 800px) {
          .sales-grid--3 { grid-template-columns: repeat(2, 1fr); }
          .sales-summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 600px) {
          .sales-page { padding: 16px; }
          .sales-page__title { font-size: 20px; }
          .sales-grid--3,
          .sales-grid--4,
          .sales-grid--5 { grid-template-columns: 1fr; }
          .sales-summary-grid { grid-template-columns: 1fr 1fr; }
          .sales-page__actions { width: 100%; }
          .sales-page__actions .sales-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

/* ================================================================
   HELPERS
   ================================================================ */
function Field({ label, required, full, children }) {
  return (
    <div className={`sales-field ${full ? "sales-field--full" : ""}`}>
      <label className="sales-field__label">
        {label}
        {required && <span className="sales-field__required">*</span>}
      </label>
      {children}
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="sales-summary-box">
      <div className="sales-summary-box__label">{label}</div>
      <div className="sales-summary-box__value">{value}</div>
    </div>
  );
}
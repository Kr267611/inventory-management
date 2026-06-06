import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { inwardApi } from "../../Api/inwardApi";
import { fetchAllMasters } from "../../Api/masterApi";

/* Inline icons */
const Icon = {
  ChevronDown: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  ),
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
  Calendar: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" />
      <line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
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
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
};

const EMPTY_FORM = {
  entryDate: new Date().toISOString().slice(0, 10),
  voucherNo: "",
  company: "", location: "", supplier: "",
  fabric: "", fabricQuality: "", design: "", defaultColor: "",
  uom: "", processType: "",
  gstNo: "", challanNo: "", invoiceNo: "", hsnCode: "",
  lrNo: "", transport: "Self", invType: "FRESH GOODS",
  lotNo: "", rack: "",
  weight: 0, weaver: "", gsm: "", width: "", remarks: "",
  currencyType: "INR", rate: 0, exchangeRate: 1,
};

export default function InwardEntry() {
  const navigate = useNavigate();
  const { id: editId } = useParams();

  const [form, setForm] = useState(EMPTY_FORM);
  const [pcsDetails, setPcsDetails] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editDraft, setEditDraft] = useState({ meter: 0, color: "" });

  const [masters, setMasters] = useState({
    companies: [], locations: [], suppliers: [],
    fabrics: [], qualities: [], designs: [], colors: [], uoms: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  /* ──────── FETCH MASTERS + INWARD (if editing) ──────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const m = await fetchAllMasters();
        setMasters(m);

        // Default selections — pehla option auto-select
        setForm((f) => ({
          ...f,
          company: f.company || m.companies[0]?._id || "",
          location: f.location || m.locations[0]?._id || "",
          uom: f.uom || m.uoms[0]?._id || "",
        }));

        // Agar edit mode hai, existing inward load karo
        if (editId) {
          const inw = await inwardApi.getById(editId);
          setForm({
            entryDate: inw.entryDate?.slice(0, 10) || "",
            voucherNo: inw.voucherNo || "",
            company: inw.company?._id || inw.company || "",
            location: inw.location?._id || inw.location || "",
            supplier: inw.supplier?._id || inw.supplier || "",
            fabric: inw.fabric?._id || inw.fabric || "",
            fabricQuality: inw.fabricQuality?._id || inw.fabricQuality || "",
            design: inw.design?._id || inw.design || "",
            defaultColor: inw.defaultColor?._id || inw.defaultColor || "",
            uom: inw.uom?._id || inw.uom || "",
            processType: inw.processType?._id || inw.processType || "",
            gstNo: inw.gstNo || "", challanNo: inw.challanNo || "",
            invoiceNo: inw.invoiceNo || "", hsnCode: inw.hsnCode || "",
            lrNo: inw.lrNo || "", transport: inw.transport || "Self",
            invType: inw.invType || "FRESH GOODS",
            lotNo: inw.lotNo || "", rack: inw.rack || "",
            weight: inw.weight || 0, weaver: inw.weaver || "",
            gsm: inw.gsm || "", width: inw.width || "",
            remarks: inw.remarks || "",
            currencyType: inw.currencyType || "INR",
            rate: inw.rate || 0, exchangeRate: inw.exchangeRate || 1,
          });
          setPcsDetails(
            (inw.pcsDetails || []).map((p, i) => ({
              id: p._id || i + 1,
              pcsNo: p.pcsNo || i + 1,
              meter: p.meter || 0,
              color: p.color?._id || p.color || "",
            }))
          );
        }
      } catch (err) {
        alert("Data load failed: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  /* ──────── SUMMARY ──────── */
  const summary = useMemo(() => {
    const totalPcs = pcsDetails.length;
    const totalMeter = pcsDetails.reduce((s, p) => s + (parseFloat(p.meter) || 0), 0);
    const avgMeter = totalPcs ? totalMeter / totalPcs : 0;
    const rate = parseFloat(form.rate) || 0;
    const greyAmount = totalMeter * rate;
    return {
      totalPcs,
      totalMeter: totalMeter.toFixed(2),
      avgMeter: avgMeter.toFixed(2),
      greyRate: rate.toFixed(2),
      greyAmount: greyAmount.toFixed(2),
      adjDiff: "0.000",
    };
  }, [pcsDetails, form.rate]);

  /* ──────── HANDLERS ──────── */
  const handle = (field, value) => setForm({ ...form, [field]: value });

  const addPcs = () => {
    setPcsDetails([
      ...pcsDetails,
      {
        id: Date.now(),
        pcsNo: pcsDetails.length + 1,
        meter: 0,
        color: form.defaultColor || "",
      },
    ]);
  };

  const deletePcs = (id) => {
    const filtered = pcsDetails
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, pcsNo: i + 1 }));
    setPcsDetails(filtered);
    if (editingId === id) setEditingId(null);
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditDraft({ meter: row.meter, color: row.color });
  };

  const saveEdit = (id) => {
    setPcsDetails(
      pcsDetails.map((p) =>
        p.id === id
          ? { ...p, meter: parseFloat(editDraft.meter) || 0, color: editDraft.color }
          : p
      )
    );
    setEditingId(null);
  };

  const resetForm = () => {
    if (!window.confirm("Form aur PCS sab reset ho jaayega. Sure?")) return;
    setPcsDetails([]);
    setForm({
      ...EMPTY_FORM,
      company: masters.companies[0]?._id || "",
      location: masters.locations[0]?._id || "",
      uom: masters.uoms[0]?._id || "",
    });
    setEditingId(null);
  };

  /* ──────── SAVE / UPDATE ──────── */
  const handleSave = async () => {
    if (!form.voucherNo) return alert("Voucher No daalo");
    if (!form.supplier) return alert("Supplier select karo");
    if (!form.fabric) return alert("Fabric select karo");
    if (!form.rate || parseFloat(form.rate) <= 0) return alert("Grey Rate enter karo");
    if (pcsDetails.length === 0) return alert("Kam se kam ek PCS add karo");

    const payload = {
      ...form,
      rate: parseFloat(form.rate) || 0,
      exchangeRate: parseFloat(form.exchangeRate) || 1,
      weight: parseFloat(form.weight) || 0,
      pcsDetails: pcsDetails.map((p, i) => ({
        pcsNo: i + 1,
        meter: parseFloat(p.meter) || 0,
        color: p.color || form.defaultColor || undefined,
      })),
    };
     
    console.log("Payload to save:", payload);
    // Empty optional ObjectId fields ko bhejna nahi (warna Mongoose cast error)
    ["fabricQuality", "design", "defaultColor", "uom", "processType", "container"].forEach((k) => {
      if (!payload[k]) delete payload[k];
    });

    try {
      setSaving(true);
      if (editId) {
        await inwardApi.update(editId, payload);
        alert("Inward updated! Inventory bhi update ho gaya.");
      } else {
        await inwardApi.create(payload);
        alert("Inward saved! Inventory me add ho gaya.");
      }
      navigate("/dashboard/inward");
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="inward-page">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          Loading...
        </div>
      </div>
    );
  }

  return (
    <div className="inward-page">
      {/* Page header */}
      <div className="inward-page__header">
        <div className="inward-page__title-wrap">
          <h1 className="inward-page__title">{editId ? "Edit Inward Entry" : "Inward Entry"}</h1>
          <div className="inward-breadcrumb">
            <span>Home</span>
            <span className="inward-breadcrumb__sep">/</span>
            <span className="inward-breadcrumb__current">Inward Entry</span>
          </div>
        </div>
        <div className="inward-page__actions">
          <button className="inward-btn inward-btn--ghost" onClick={() => navigate("/dashboard/inward")}>
            <Icon.ArrowLeft /><span>Back to List</span>
          </button>
          <button className="inward-btn inward-btn--ghost" onClick={resetForm}>
            <Icon.Refresh /><span>Reset</span>
          </button>
          <button className="inward-btn inward-btn--primary" onClick={handleSave} disabled={saving}>
            <Icon.Save />
            <span>{saving ? "Saving..." : (editId ? "Update Inward" : "Save Inward")}</span>
          </button>
        </div>
      </div>

      {/* Content grid */}
      <div className="inward-content">
        {/* LEFT */}
        <div className="inward-content__left">
          {/* Inward Information */}
          <section className="inward-card">
            <h2 className="inward-card__title">Inward Information</h2>
            <div className="inward-grid">
              <Field label="Inward Date" required>
                <div className="inward-input-wrap">
                  <input type="date" className="inward-input" value={form.entryDate} onChange={(e) => handle("entryDate", e.target.value)} />
                  <span className="inward-input__icon"><Icon.Calendar /></span>
                </div>
              </Field>
              <Field label="Voucher No" required>
                <input className="inward-input" value={form.voucherNo} onChange={(e) => handle("voucherNo", e.target.value)} />
              </Field>

              <Field label="Company" required>
                <MasterSelect value={form.company} onChange={(v) => handle("company", v)} options={masters.companies} />
              </Field>
              <Field label="Location" required>
                <MasterSelect value={form.location} onChange={(v) => handle("location", v)} options={masters.locations} />
              </Field>

              <Field label="Supplier / Party" required>
                <MasterSelect value={form.supplier} onChange={(v) => handle("supplier", v)} options={masters.suppliers} />
              </Field>
              <Field label="GST No">
                <input className="inward-input" value={form.gstNo} onChange={(e) => handle("gstNo", e.target.value)} />
              </Field>
              <Field label="Challan No">
                <input className="inward-input" value={form.challanNo} onChange={(e) => handle("challanNo", e.target.value)} />
              </Field>
              <Field label="Invoice / Bill No">
                <input className="inward-input" value={form.invoiceNo} onChange={(e) => handle("invoiceNo", e.target.value)} />
              </Field>

              <Field label="Quality" required>
                <MasterSelect value={form.fabricQuality} onChange={(v) => handle("fabricQuality", v)} options={masters.qualities} />
              </Field>
              <Field label="HSN Code">
                <input className="inward-input" value={form.hsnCode} onChange={(e) => handle("hsnCode", e.target.value)} />
              </Field>
              <Field label="LR No">
                <input className="inward-input" placeholder="Enter LR No" value={form.lrNo} onChange={(e) => handle("lrNo", e.target.value)} />
              </Field>
              <Field label="Transport">
                <input className="inward-input" value={form.transport} onChange={(e) => handle("transport", e.target.value)} />
              </Field>

              <Field label="Fabric / Item" required>
                <MasterSelect value={form.fabric} onChange={(v) => handle("fabric", v)} options={masters.fabrics} />
              </Field>
              <Field label="Design">
                <MasterSelect value={form.design} onChange={(v) => handle("design", v)} options={masters.designs} labelKey="designNo" />
              </Field>
              <Field label="Color">
                <MasterSelect value={form.defaultColor} onChange={(v) => handle("defaultColor", v)} options={masters.colors} />
              </Field>
              <Field label="Process Type">
                <Select value={form.processType} onChange={(v) => handle("processType", v)} options={["", "DYEING", "PRINTING", "FINISHING"]} />
              </Field>

              <Field label="Inv. Type">
                <input className="inward-input" value={form.invType} onChange={(e) => handle("invType", e.target.value)} />
              </Field>
              <Field label="Lot No" required>
                <input className="inward-input" value={form.lotNo} onChange={(e) => handle("lotNo", e.target.value)} />
              </Field>
              <Field label="Rack">
                <input className="inward-input" value={form.rack} onChange={(e) => handle("rack", e.target.value)} />
              </Field>
              <Field label="Weight (KG)">
                <input className="inward-input" type="number" step="0.001" value={form.weight} onChange={(e) => handle("weight", e.target.value)} />
              </Field>

              <Field label="Weaver">
                <input className="inward-input" value={form.weaver} onChange={(e) => handle("weaver", e.target.value)} />
              </Field>
              <Field label="GSM">
                <input className="inward-input" value={form.gsm} onChange={(e) => handle("gsm", e.target.value)} />
              </Field>
              <Field label="Width">
                <input className="inward-input" value={form.width} onChange={(e) => handle("width", e.target.value)} />
              </Field>
              <Field label="UOM">
                <MasterSelect value={form.uom} onChange={(v) => handle("uom", v)} options={masters.uoms} />
              </Field>

              <Field label="Remarks">
                <input className="inward-input" value={form.remarks} onChange={(e) => handle("remarks", e.target.value)} />
              </Field>
              <Field label="Currency Type">
                <Select value={form.currencyType} onChange={(v) => handle("currencyType", v)} options={["INR", "USD", "NGN"]} />
              </Field>
              <Field label="Grey Rate (Per Mtr)" required>
                <input className="inward-input" type="number" step="0.01" value={form.rate} onChange={(e) => handle("rate", e.target.value)} />
              </Field>
              <Field label="Exchange Rate">
                <input className="inward-input" type="number" step="0.01" value={form.exchangeRate} onChange={(e) => handle("exchangeRate", e.target.value)} />
              </Field>
              <Field label="Grey Amount">
                <input className="inward-input inward-input--readonly" readOnly value={Number(summary.greyAmount).toFixed(2)} />
              </Field>
            </div>
          </section>

          {/* PCS Details */}
          <section className="inward-card">
            <div className="inward-pcs-header">
              <div>
                <h2 className="inward-card__title inward-card__title--inline">PCS / Taka Details</h2>
                <div className="inward-pcs-hint">
                  <Icon.Info />
                  <span>Add multiple PCS (Taka) with meter and color details</span>
                </div>
              </div>
              <button className="inward-btn inward-btn--primary inward-btn--sm" onClick={addPcs}>
                <Icon.Plus /><span>Add PCS</span>
              </button>
            </div>

            <div className="inward-table-wrap">
              <table className="inward-table">
                <thead>
                  <tr>
                    <th className="inward-th inward-th--center">PCS No.</th>
                    <th className="inward-th inward-th--center">Meter</th>
                    <th className="inward-th inward-th--center">Color</th>
                    <th className="inward-th inward-th--center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pcsDetails.length === 0 && (
                    <tr>
                      <td className="inward-td inward-td--empty" colSpan="4">No PCS added yet. Click "Add PCS" to start.</td>
                    </tr>
                  )}
                  {pcsDetails.map((row) => {
                    const colorName = masters.colors.find((c) => c._id === row.color)?.name || "-";
                    return (
                      <tr key={row.id} className="inward-tr">
                        <td className="inward-td inward-td--center">{row.pcsNo}</td>
                        <td className="inward-td inward-td--center">
                          {editingId === row.id ? (
                            <input className="inward-input inward-input--inline" type="number" step="0.01"
                              value={editDraft.meter}
                              onChange={(e) => setEditDraft({ ...editDraft, meter: e.target.value })} />
                          ) : (
                            Number(row.meter).toFixed(2)
                          )}
                        </td>
                        <td className="inward-td inward-td--center">
                          {editingId === row.id ? (
                            <select className="inward-input inward-input--inline"
                              value={editDraft.color}
                              onChange={(e) => setEditDraft({ ...editDraft, color: e.target.value })}>
                              <option value="">-</option>
                              {masters.colors.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                            </select>
                          ) : (
                            <span className="inward-chip">{colorName}</span>
                          )}
                        </td>
                        <td className="inward-td inward-td--center">
                          <div className="inward-actions">
                            {editingId === row.id ? (
                              <button className="inward-icon-action inward-icon-action--save" onClick={() => saveEdit(row.id)} title="Save">
                                <Icon.Check />
                              </button>
                            ) : (
                              <button className="inward-icon-action inward-icon-action--edit" onClick={() => startEdit(row)} title="Edit">
                                <Icon.Edit />
                              </button>
                            )}
                            <button className="inward-icon-action inward-icon-action--delete" onClick={() => deletePcs(row.id)} title="Delete">
                              <Icon.Trash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </div>

        {/* RIGHT — Summary */}
        <aside className="inward-content__right">
          <section className="inward-card">
            <h2 className="inward-card__title">Inward Summary</h2>
            <div className="inward-summary-grid">
              <SummaryBox label="Total PCS (Taka)" value={summary.totalPcs} />
              <SummaryBox label="Total Meter" value={summary.totalMeter} />
              <SummaryBox label="Average Meter" value={summary.avgMeter} />
              <SummaryBox label="Grey Rate (Per Mtr)" value={summary.greyRate} />
            </div>
            <div className="inward-highlight inward-highlight--blue">
              <div className="inward-highlight__label">Grey Amount (INR)</div>
              <div className="inward-highlight__value">
                {Number(summary.greyAmount).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>
            <div className="inward-highlight inward-highlight--green">
              <div className="inward-highlight__label">Taka Adjustment Diff</div>
              <div className="inward-highlight__value">{summary.adjDiff}</div>
            </div>
          </section>
        </aside>
      </div>

      <style>{`
        .inward-page, .inward-page * { box-sizing: border-box; }
        .inward-page {
          --inw-card: #ffffff;
          --inw-border: #e5e7eb;
          --inw-text: #0f172a;
          --inw-muted: #64748b;
          --inw-label: #475569;
          --inw-primary: #2563eb;
          --inw-primary-hover: #1d4ed8;
          --inw-danger: #ef4444;
          --inw-success: #10b981;
          --inw-input-border: #d1d5db;
          --inw-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--inw-text);
        }
        .inward-page svg { width: 18px; height: 18px; display: block; }

        .inward-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .inward-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .inward-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--inw-muted); font-size: 13px; }
        .inward-breadcrumb__sep { color: #cbd5e1; }
        .inward-breadcrumb__current { color: var(--inw-primary); font-weight: 500; }
        .inward-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .inward-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit;
        }
        .inward-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .inward-btn--ghost { background: #fff; border-color: var(--inw-border); color: var(--inw-text); }
        .inward-btn--ghost:hover { background: #f8fafc; border-color: #cbd5e1; }
        .inward-btn--primary { background: var(--inw-primary); color: #fff; border-color: var(--inw-primary); }
        .inward-btn--primary:hover:not(:disabled) { background: var(--inw-primary-hover); }
        .inward-btn--sm { padding: 7px 12px; font-size: 13px; }

        .inward-content {
          display: grid; grid-template-columns: 1fr 320px;
          gap: 20px; align-items: flex-start;
        }
        .inward-content__left { display: flex; flex-direction: column; gap: 20px; min-width: 0; }
        .inward-content__right { display: flex; flex-direction: column; gap: 20px; }

        .inward-card {
          background: var(--inw-card);
          border: 1px solid var(--inw-border);
          border-radius: 12px; padding: 20px;
          box-shadow: var(--inw-shadow);
        }
        .inward-card__title { font-size: 16px; font-weight: 600; margin: 0 0 18px 0; }
        .inward-card__title--inline { margin: 0; }

        .inward-grid {
          display: grid; grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 14px 24px;
        }
        .inward-field {
          display: flex; flex-direction: row; align-items: center;
          gap: 10px; min-width: 0;
        }
        .inward-field__label {
          flex: 0 0 130px;
          font-size: 13px; font-weight: 500;
          color: var(--inw-label); line-height: 1.25;
        }
        .inward-field__required { color: var(--inw-danger); margin-left: 2px; }
        .inward-field > :not(.inward-field__label) {
          flex: 1 1 auto; min-width: 0;
        }

        .inward-input, .inward-select {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--inw-input-border);
          border-radius: 8px; background: #fff;
          font-size: 14px; color: var(--inw-text);
          transition: border-color 0.15s, box-shadow 0.15s;
          font-family: inherit;
        }
        .inward-input:focus, .inward-select:focus {
          outline: none; border-color: var(--inw-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .inward-input::placeholder { color: #94a3b8; }
        .inward-input--readonly { background: #f8fafc; color: var(--inw-muted); cursor: not-allowed; }
        .inward-input-wrap { position: relative; }
        .inward-input-wrap .inward-input { padding-right: 36px; }
        .inward-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%); color: var(--inw-muted);
          pointer-events: none;
        }
        .inward-select-wrap { position: relative; }
        .inward-select { appearance: none; -webkit-appearance: none; padding-right: 36px; cursor: pointer; }
        .inward-select-wrap__chev {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%); color: var(--inw-muted);
          pointer-events: none;
        }
        .inward-input--inline { padding: 6px 10px; font-size: 13px; max-width: 140px; margin: 0 auto; }

        .inward-pcs-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 16px;
        }
        .inward-pcs-hint {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--inw-primary); margin-top: 6px;
        }
        .inward-pcs-hint svg { width: 14px; height: 14px; }

        .inward-table-wrap { overflow-x: auto; border: 1px solid var(--inw-border); border-radius: 8px; }
        .inward-table { width: 100%; border-collapse: collapse; min-width: 480px; }
        .inward-th {
          background: #f8fafc; padding: 12px 16px;
          font-size: 13px; font-weight: 600;
          color: var(--inw-label); text-align: left;
          border-bottom: 1px solid var(--inw-border);
        }
        .inward-th--center, .inward-td--center { text-align: center; }
        .inward-td {
          padding: 12px 16px; font-size: 14px;
          border-bottom: 1px solid var(--inw-border);
        }
        .inward-tr:last-child .inward-td { border-bottom: none; }
        .inward-tr:hover { background: #fafbfc; }
        .inward-td--empty { text-align: center; color: var(--inw-muted); padding: 32px; }
        .inward-chip {
          display: inline-block; padding: 4px 12px;
          background: #f1f5f9; border-radius: 12px;
          font-size: 12px; font-weight: 500; color: var(--inw-label);
        }
        .inward-actions { display: inline-flex; gap: 6px; justify-content: center; }
        .inward-icon-action {
          width: 30px; height: 30px;
          border-radius: 6px; border: 1px solid transparent;
          cursor: pointer; display: inline-flex;
          align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .inward-icon-action svg { width: 14px; height: 14px; }
        .inward-icon-action--edit { background: #dbeafe; color: var(--inw-primary); }
        .inward-icon-action--edit:hover { background: #bfdbfe; }
        .inward-icon-action--delete { background: #fee2e2; color: var(--inw-danger); }
        .inward-icon-action--delete:hover { background: #fecaca; }
        .inward-icon-action--save { background: #d1fae5; color: var(--inw-success); }
        .inward-icon-action--save:hover { background: #a7f3d0; }

        .inward-summary-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 12px; margin-bottom: 12px;
        }
        .inward-summary-box {
          background: #f8fafc; border: 1px solid var(--inw-border);
          border-radius: 10px; padding: 14px;
        }
        .inward-summary-box__label { font-size: 12px; color: var(--inw-muted); margin-bottom: 6px; }
        .inward-summary-box__value { font-size: 20px; font-weight: 700; color: var(--inw-text); }

        .inward-highlight { border-radius: 10px; padding: 16px; margin-top: 12px; }
        .inward-highlight--blue { background: #eff6ff; border: 1px solid #bfdbfe; }
        .inward-highlight--blue .inward-highlight__value { color: var(--inw-primary); }
        .inward-highlight--green { background: #ecfdf5; border: 1px solid #a7f3d0; }
        .inward-highlight--green .inward-highlight__value { color: var(--inw-success); }
        .inward-highlight__label { font-size: 13px; color: var(--inw-label); margin-bottom: 6px; font-weight: 500; }
        .inward-highlight__value { font-size: 22px; font-weight: 700; }

        @media (min-width: 1500px) {
          .inward-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        }
        @media (max-width: 1200px) {
          .inward-content { grid-template-columns: 1fr; }
          .inward-content__right { order: -1; }
          .inward-summary-grid { grid-template-columns: repeat(4, 1fr); }
        }
        @media (max-width: 900px) {
          .inward-grid { grid-template-columns: 1fr; }
          .inward-summary-grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 640px) {
          .inward-page__title { font-size: 20px; }
          .inward-field {
            flex-direction: column; align-items: stretch; gap: 6px;
          }
          .inward-field__label { flex: none; }
        }
        @media (max-width: 560px) {
          .inward-summary-grid { grid-template-columns: 1fr 1fr; }
          .inward-page__actions { width: 100%; }
          .inward-page__actions .inward-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
function Field({ label, required, children }) {
  return (
    <div className="inward-field">
      <label className="inward-field__label">
        {label}
        {required && <span className="inward-field__required">*</span>}
      </label>
      {children}
    </div>
  );
}

/* For static string options like Currency, Process Type */
function Select({ value, onChange, options }) {
  return (
    <div className="inward-select-wrap">
      <select className="inward-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt} value={opt}>{opt || "Select..."}</option>
        ))}
      </select>
      <span className="inward-select-wrap__chev"><Icon.ChevronDown /></span>
    </div>
  );
}

/* For master data objects with _id + name */
function MasterSelect({ value, onChange, options = [] ,labelKey = "name"}) {
  return (
    <div className="inward-select-wrap">
      <select className="inward-select" value={value || ""} onChange={(e) => onChange(e.target.value)}>
        <option value="">Select...</option>
        {options.map((opt) => (
          <option key={opt._id} value={opt._id}>{opt[labelKey]}</option>
        ))}
      </select>
      <span className="inward-select-wrap__chev"><Icon.ChevronDown /></span>
    </div>
  );
}

function SummaryBox({ label, value }) {
  return (
    <div className="inward-summary-box">
      <div className="inward-summary-box__label">{label}</div>
      <div className="inward-summary-box__value">{value}</div>
    </div>
  );
}
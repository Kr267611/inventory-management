import React, { useState } from "react";
import { inventoryApi } from "../../Api/inventoryApi";

/* ══════════════════════════════════════════════════════════════
   SALES — BULK BALE ADD
   Comma-separated bale nos → lookup all → sell FULL bale each →
   per-bale editable rate → push all into the sale's items list.

   Usage inside Sales.jsx (place ABOVE the single-bale "Add Items"
   card, inside <div className="sales-main">):

     import SalesBulkBaleAdd from "./SalesBulkBaleAdd";
     ...
     <SalesBulkBaleAdd
       existingItems={items}
       onAddItems={(newItems) => setItems((prev) => [...prev, ...newItems])}
     />

   It reuses inventoryApi.lookupByBale (same as single flow), so no
   backend change is needed.
   ══════════════════════════════════════════════════════════════ */

const fmt = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const Icon = {
  Search: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  Plus: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  Trash: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  Check: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

export default function SalesBulkBaleAdd({ existingItems = [], onAddItems }) {
  const [baleInput, setBaleInput] = useState("");
  const [rows, setRows] = useState([]);       // looked-up bale rows
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState([]);   // { baleNo, error }

  /* ──────── Lookup all comma-separated bales ──────── */
  const handleLookupAll = async () => {
    // Parse: split by comma / space / newline, dedupe, uppercase
    const list = [...new Set(
      baleInput
        .split(/[,\n\s]+/)
        .map((b) => b.toUpperCase().trim())
        .filter(Boolean)
    )];

    if (list.length === 0) {
      setErrors([{ baleNo: "-", error: "Koi bale no nahi mila" }]);
      return;
    }

    setLoading(true);
    setErrors([]);
    const found = [];
    const failed = [];
    const alreadyInSale = new Set(existingItems.map((it) => it.baleNo));
    const alreadyPicked = new Set(rows.map((r) => r.baleNo));

    for (const baleNo of list) {
      // skip if already added to sale or already in this preview
      if (alreadyInSale.has(baleNo)) {
        failed.push({ baleNo, error: "Already added to sale" });
        continue;
      }
      if (alreadyPicked.has(baleNo)) {
        continue; // silently skip dup in same lookup
      }

      try {
        const inv = await inventoryApi.lookupByBale(baleNo);
        const availablePcs = inv.availablePcs || 0;

        if (availablePcs <= 0) {
          failed.push({ baleNo, error: "0 PCS available (out of stock)" });
          continue;
        }

        // Full bale: use pcsDetails if present, else build from avg
        let pcsDetails = [];
        let totalMeter = 0;
        if (Array.isArray(inv.pcsDetails) && inv.pcsDetails.length > 0) {
          pcsDetails = inv.pcsDetails.map((p, i) => ({
            pcsNo: p.pcsNo || i + 1,
            meter: parseFloat(p.meter) || 0,
            color: p.color?._id || p.color || inv.color?._id || undefined,
          }));
          totalMeter = pcsDetails.reduce((s, p) => s + p.meter, 0);
        } else {
          const perMeter = inv.avgMeterPerPcs || 0;
          pcsDetails = Array.from({ length: availablePcs }, (_, i) => ({
            pcsNo: i + 1,
            meter: perMeter,
            color: inv.color?._id || undefined,
          }));
          totalMeter = perMeter * availablePcs;
        }

        found.push({
          id: `${baleNo}-${Date.now()}-${Math.random()}`,
          baleNo: inv.baleNo,
          fabric: inv.fabric?._id || "",
          fabricName: inv.fabric?.name || "-",
          fabricQuality: inv.fabricQuality?._id || "",
          qualityName: inv.fabricQuality?.name || "-",
          color: inv.color?._id || "",
          colorName: inv.color?.name || "-",
          location: inv.location?._id || "",
          pcs: availablePcs,
          totalMeter: +totalMeter.toFixed(2),
          meterPerPcs: availablePcs > 0 ? +(totalMeter / availablePcs).toFixed(3) : 0,
          rate: String(inv.rate || ""),   // auto-filled, editable
          discount: "0",
          pcsDetails,
        });
      } catch (err) {
        failed.push({ baleNo, error: err.message || "Not found" });
      }
    }

    setRows((prev) => [...prev, ...found]);
    setErrors(failed);
    setBaleInput("");
    setLoading(false);
  };

  const updateRow = (id, field, value) => {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, [field]: value } : r)));
  };

  const removeRow = (id) => {
    setRows((rs) => rs.filter((r) => r.id !== id));
  };

  const clearAll = () => {
    setRows([]);
    setErrors([]);
    setBaleInput("");
  };

  /* ──────── Push all rows into the sale ──────── */
  const handleAddAll = () => {
    // Validate every row has a valid rate
    const noRate = rows.find((r) => !(parseFloat(r.rate) > 0));
    if (noRate) {
      alert(`Bale ${noRate.baleNo} ka rate daalo`);
      return;
    }

    const items = rows.map((r) => {
      const rate = parseFloat(r.rate) || 0;
      const discount = parseFloat(r.discount) || 0;
      const amount = Math.max(r.totalMeter * rate - r.totalMeter * discount, 0);
      return {
        id: Date.now() + Math.random(),
        baleNo: r.baleNo,
        fabric: r.fabric,
        fabricQuality: r.fabricQuality,
        color: r.color,
        location: r.location,
        pcs: r.pcs,
        meterPerPcs: r.meterPerPcs,
        totalMeter: r.totalMeter,
        rate,
        discount,
        amount,
        pcsDetails: r.pcsDetails,
      };
    });

    onAddItems?.(items);
    clearAll();
  };

  // Live totals for the preview footer
  const totalPcs = rows.reduce((s, r) => s + (r.pcs || 0), 0);
  const totalMeter = rows.reduce((s, r) => s + (r.totalMeter || 0), 0);
  const totalAmount = rows.reduce((s, r) => {
    const rate = parseFloat(r.rate) || 0;
    const disc = parseFloat(r.discount) || 0;
    return s + Math.max(r.totalMeter * rate - r.totalMeter * disc, 0);
  }, 0);

  return (
    <section className="sbb-card">
      <div className="sbb-head">
        <div>
          <h2 className="sbb-title">Multiple Bale Add</h2>
          <p className="sbb-sub">
            Multiple bale no comma se daalo (e.g. A35, A36, A37). Poora bale bikega. Rate har bale ka alag edit kar sakte ho.
          </p>
        </div>
      </div>

      {/* Input bar */}
      <div className="sbb-input-bar">
        <input
          className="sbb-input"
          placeholder="A35, A36, A37..."
          value={baleInput}
          onChange={(e) => setBaleInput(e.target.value.toUpperCase())}
          onKeyDown={(e) => {
            if (e.key === "Enter") { e.preventDefault(); handleLookupAll(); }
          }}
        />
        <button className="sbb-btn sbb-btn--primary" onClick={handleLookupAll} disabled={loading || !baleInput.trim()}>
          <Icon.Search /><span>{loading ? "Searching" : "Search"}</span>
        </button>
      </div>

      {/* Errors */}
      {errors.length > 0 && (
        <div className="sbb-errors">
          {errors.map((e, i) => (
            <div key={i} className="sbb-error-line">
              <Icon.X /> <strong>{e.baleNo}</strong>: {e.error}
            </div>
          ))}
        </div>
      )}

      {/* Preview table */}
      {rows.length > 0 && (
        <>
          <div className="sbb-table-wrap">
            <table className="sbb-table">
              <thead>
                <tr>
                  <th>Bale No</th>
                  <th>Fabric</th>
                  <th>Quality</th>
                  <th>Color</th>
                  <th className="sbb-r">Pcs</th>
                  <th className="sbb-r">Total Mtr</th>
                  <th className="sbb-r">Rate *</th>
                  <th className="sbb-r">Disc</th>
                  <th className="sbb-r">Amount</th>
                  <th className="sbb-c">Del</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                  const rate = parseFloat(r.rate) || 0;
                  const disc = parseFloat(r.discount) || 0;
                  const amt = Math.max(r.totalMeter * rate - r.totalMeter * disc, 0);
                  return (
                    <tr key={r.id}>
                      <td><span className="sbb-chip">{r.baleNo}</span></td>
                      <td className="sbb-strong">{r.fabricName}</td>
                      <td>{r.qualityName}</td>
                      <td>{r.colorName}</td>
                      <td className="sbb-r">{r.pcs}</td>
                      <td className="sbb-r">{fmt(r.totalMeter)}</td>
                      <td className="sbb-r">
                        <input
                          type="number" step="0.01"
                          className="sbb-cell-input"
                          value={r.rate}
                          onChange={(e) => updateRow(r.id, "rate", e.target.value)}
                          placeholder="0.00"
                        />
                      </td>
                      <td className="sbb-r">
                        <input
                          type="number" step="0.01"
                          className="sbb-cell-input"
                          value={r.discount}
                          onChange={(e) => updateRow(r.id, "discount", e.target.value)}
                        />
                      </td>
                      <td className="sbb-r sbb-strong">{fmt(amt)}</td>
                      <td className="sbb-c">
                        <button className="sbb-del" onClick={() => removeRow(r.id)} title="Remove">
                          <Icon.Trash />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="sbb-total">
                  <td colSpan="4" className="sbb-strong">TOTAL ({rows.length} bales)</td>
                  <td className="sbb-r sbb-strong">{totalPcs}</td>
                  <td className="sbb-r sbb-strong">{fmt(totalMeter)}</td>
                  <td></td><td></td>
                  <td className="sbb-r sbb-strong">{fmt(totalAmount)}</td>
                  <td></td>
                </tr>
              </tfoot>
            </table>
          </div>

          <div className="sbb-actions">
            <button className="sbb-btn sbb-btn--ghost" onClick={clearAll}>Clear</button>
            <button className="sbb-btn sbb-btn--success" onClick={handleAddAll}>
              <Icon.Check /><span>Add All {rows.length} Bale(s) to Sale</span>
            </button>
          </div>
        </>
      )}

      <style>{`
        .sbb-card {
          background: #fff; border: 1px solid #e5e7eb;
          border-left: 4px solid #2563eb;
          border-radius: 12px; padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .sbb-card svg { width: 16px; height: 16px; display: block; }
        .sbb-head { margin-bottom: 14px; }
        .sbb-title { font-size: 16px; font-weight: 600; margin: 0 0 4px 0; color: #0f172a; }
        .sbb-sub { font-size: 12px; color: #64748b; margin: 0; line-height: 1.5; }

        .sbb-input-bar { display: flex; gap: 10px; flex-wrap: wrap; }
        .sbb-input {
          flex: 1; min-width: 220px;
          padding: 11px 14px; border: 2px solid #2563eb;
          border-radius: 8px; font-size: 15px; font-weight: 600;
          text-transform: uppercase; letter-spacing: 0.5px;
          font-family: inherit; color: #0f172a;
        }
        .sbb-input:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.15); }
        .sbb-input::placeholder { color: #cbd5e1; font-weight: 400; letter-spacing: normal; }

        .sbb-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 10px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500; cursor: pointer;
          border: 1px solid transparent; font-family: inherit; white-space: nowrap;
        }
        .sbb-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .sbb-btn--primary { background: #2563eb; color: #fff; }
        .sbb-btn--primary:hover:not(:disabled) { background: #1d4ed8; }
        .sbb-btn--ghost { background: #fff; border-color: #e5e7eb; color: #334155; }
        .sbb-btn--ghost:hover { background: #f8fafc; }
        .sbb-btn--success { background: #10b981; color: #fff; }
        .sbb-btn--success:hover { background: #059669; }

        .sbb-errors {
          margin-top: 12px; background: #fef2f2; border: 1px solid #fecaca;
          border-radius: 8px; padding: 10px 14px;
        }
        .sbb-error-line {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: #b91c1c; padding: 2px 0;
        }
        .sbb-error-line svg { width: 13px; height: 13px; }

        .sbb-table-wrap {
          margin-top: 14px; overflow-x: auto;
          border: 1px solid #e5e7eb; border-radius: 8px;
        }
        .sbb-table { width: 100%; border-collapse: collapse; min-width: 760px; }
        .sbb-table th {
          background: #fffbeb; padding: 10px 12px; text-align: left;
          font-size: 11px; font-weight: 700; color: #92400e;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid #fde68a; white-space: nowrap;
        }
        .sbb-table td {
          padding: 10px 12px; font-size: 13px; color: #334155;
          border-bottom: 1px solid #f1f5f9; white-space: nowrap;
        }
        .sbb-table tbody tr:hover { background: #fffbeb; }
        .sbb-r { text-align: right; }
        .sbb-c { text-align: center; }
        .sbb-strong { font-weight: 600; }
        .sbb-chip {
          display: inline-block; padding: 3px 10px;
          background: #dbeafe; color: #1e40af;
          border-radius: 6px; font-family: ui-monospace, monospace;
          font-size: 12px; font-weight: 700; letter-spacing: 0.5px;
        }
        .sbb-cell-input {
          width: 80px; padding: 5px 8px; text-align: right;
          border: 1px solid #d1d5db; border-radius: 6px;
          font-size: 13px; font-family: inherit;
        }
        .sbb-cell-input:focus { outline: none; border-color: #f59e0b; box-shadow: 0 0 0 2px rgba(245,158,11,0.15); }
        .sbb-del {
          width: 28px; height: 28px; border-radius: 6px;
          background: #fee2e2; color: #ef4444; border: none; cursor: pointer;
          display: inline-flex; align-items: center; justify-content: center;
        }
        .sbb-del:hover { background: #fecaca; }
        .sbb-del svg { width: 13px; height: 13px; }
        .sbb-total td { background: #fffbeb; border-top: 2px solid #fbbf24; border-bottom: none; padding: 12px; color: #92400e; }

        .sbb-actions {
          margin-top: 14px; display: flex; justify-content: flex-end; gap: 10px; flex-wrap: wrap;
        }
      `}</style>
    </section>
  );
}
import React, { useState, useRef } from "react";
import * as XLSX from "xlsx";
import { inwardApi } from "../../Api/inwardApi";

/* ══════════════════════════════════════════════════════════════
   INWARD BULK IMPORT — Button + Modal
   Usage in InwardEntry header:

     import InwardBulkImport from "./InwardBulkImport";
     ...
     <InwardBulkImport onDone={() => window.location.reload()} />

   Requires: npm install xlsx
   ══════════════════════════════════════════════════════════════ */

// Map various header spellings → internal field key
const HEADER_MAP = {
  "bale no": "baleNo", "baleno": "baleNo", "bale": "baleNo",
  "entry date": "entryDate", "date": "entryDate",
  "supplier": "supplier",
  "fabric": "fabric", "fabric name": "fabric",
  "fabric quality": "fabricQuality", "quality": "fabricQuality",
  "design": "design", "design no": "design",
  "color": "color", "colour": "color",
  "pcs count": "pcsCount", "pcs": "pcsCount", "pieces": "pcsCount",
  "total meter": "totalMeter", "meter": "totalMeter", "meters": "totalMeter",
  "rate (inr)": "rate", "rate": "rate", "rate inr": "rate",
  "exchange rate": "exchangeRate",
  "invoice no": "invoiceNo", "invoice": "invoiceNo",
  "challan no": "challanNo", "challan": "challanNo",
  "remarks": "remarks", "remark": "remarks", "note": "remarks",
};

const Icon = {
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  X: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

export default function InwardBulkImport({ onDone }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);        // parsed rows
  const [fileName, setFileName] = useState("");
  const [parseError, setParseError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [result, setResult] = useState(null);  // server response
  const fileRef = useRef(null);

  const reset = () => {
    setRows([]); setFileName(""); setParseError(""); setResult(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const closeModal = () => { setOpen(false); reset(); };

  /* ──────── Parse uploaded file ──────── */
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setParseError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = new Uint8Array(ev.target.result);
        const wb = XLSX.read(data, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        // header:1 → array of arrays
        const raw = XLSX.utils.sheet_to_json(ws, { header: 1, blankrows: false, defval: "" });

        if (raw.length < 2) {
          setParseError("File me koi data row nahi mila (sirf header ya khali).");
          setRows([]);
          return;
        }

        // Build header→key map from first row
        const headerRow = raw[0].map((h) => String(h).trim().toLowerCase());
        const keys = headerRow.map((h) => HEADER_MAP[h] || null);

        const parsed = [];
        for (let i = 1; i < raw.length; i++) {
          const line = raw[i];
          const obj = {};
          let hasData = false;
          keys.forEach((k, ci) => {
            if (!k) return;
            let val = line[ci];
            if (val !== "" && val !== null && val !== undefined) hasData = true;
            // Excel date serial → yyyy-mm-dd
            if (k === "entryDate" && typeof val === "number") {
              const d = XLSX.SSF.parse_date_code(val);
              if (d) val = `${d.y}-${String(d.m).padStart(2, "0")}-${String(d.d).padStart(2, "0")}`;
            }
            obj[k] = typeof val === "string" ? val.trim() : val;
          });
          if (hasData) parsed.push(obj);
        }

        if (parsed.length === 0) {
          setParseError("Koi valid row nahi mili. Header names check karo (template use karo).");
          setRows([]);
          return;
        }
        setRows(parsed);
      } catch (err) {
        setParseError("File parse nahi hui: " + err.message);
        setRows([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  /* ──────── Upload to server ──────── */
  const handleUpload = async () => {
    if (rows.length === 0) return;
    try {
      setUploading(true);
      const res = await inwardApi.bulkImport(rows);
      setResult(res);
    } catch (err) {
      setParseError("Import failed: " + (err?.response?.data?.message || err.message));
    } finally {
      setUploading(false);
    }
  };

  /* ──────── Download template (CSV, no lib needed) ──────── */
  const downloadTemplate = () => {
    const headers = [
      "Bale No", "Entry Date", "Supplier", "Fabric", "Fabric Quality",
      "Design", "Color", "Pcs Count", "Total Meter", "Rate (INR)",
      "Exchange Rate", "Invoice No", "Challan No", "Remarks",
    ];
    const sample = [
      "A101", "2026-07-06", "Ramesh Textiles", "Cotton Silk", "Premium",
      "D-45", "Red", "10", "274", "120.50", "1", "INV-001", "CH-01", "First lot",
    ];
    const csv = [headers.join(","), sample.join(",")].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Inward_Bulk_Import_Template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      {/* Trigger button — place next to "Back to List" */}
      <button className="ibi-trigger" onClick={() => setOpen(true)}>
        <Icon.Upload /><span>Import Excel/CSV</span>
      </button>

      {open && (
        <div className="ibi-overlay" onClick={closeModal}>
          <div className="ibi-modal" onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="ibi-head">
              <h2 className="ibi-title">Bulk Import Inward</h2>
              <button className="ibi-close" onClick={closeModal}><Icon.X /></button>
            </div>

            <div className="ibi-body">
              {/* Step help */}
              <div className="ibi-help">
                <strong>How it works:</strong> Download the template, fill your bales,
                then upload. Supplier/Fabric/Color auto-create if new. Duplicate Bale No is skipped.
              </div>

              {/* Template download */}
              <button className="ibi-tpl-btn" onClick={downloadTemplate}>
                <Icon.Download /><span>Download Template (CSV)</span>
              </button>

              {/* File picker */}
              <label className="ibi-drop">
                <input
                  ref={fileRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  onChange={handleFile}
                  style={{ display: "none" }}
                />
                <Icon.Upload />
                <span className="ibi-drop-main">
                  {fileName || "Click to choose .xlsx / .csv file"}
                </span>
                <span className="ibi-drop-sub">Excel or CSV, first sheet is used</span>
              </label>

              {parseError && <div className="ibi-err">{parseError}</div>}

              {/* Parsed preview */}
              {rows.length > 0 && !result && (
                <div className="ibi-preview">
                  <div className="ibi-preview-head">
                    <strong>{rows.length}</strong> row(s) ready to import
                  </div>
                  <div className="ibi-preview-table-wrap">
                    <table className="ibi-preview-table">
                      <thead>
                        <tr>
                          <th>Bale</th><th>Supplier</th><th>Fabric</th>
                          <th>Quality</th><th>Pcs</th><th>Meter</th><th>Rate</th>
                        </tr>
                      </thead>
                      <tbody>
                        {rows.slice(0, 8).map((r, i) => (
                          <tr key={i}>
                            <td>{r.baleNo || "-"}</td>
                            <td>{r.supplier || "-"}</td>
                            <td>{r.fabric || "-"}</td>
                            <td>{r.fabricQuality || "-"}</td>
                            <td>{r.pcsCount || "-"}</td>
                            <td>{r.totalMeter || "-"}</td>
                            <td>{r.rate || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {rows.length > 8 && (
                      <div className="ibi-preview-more">+ {rows.length - 8} more row(s)</div>
                    )}
                  </div>
                </div>
              )}

              {/* Result summary */}
              {result && (
                <div className="ibi-result">
                  <div className="ibi-result-cards">
                    <div className="ibi-rc ibi-rc--green">
                      <div className="ibi-rc-num">{result.createdCount || 0}</div>
                      <div className="ibi-rc-lbl">Imported</div>
                    </div>
                    <div className="ibi-rc ibi-rc--amber">
                      <div className="ibi-rc-num">{result.skippedCount || 0}</div>
                      <div className="ibi-rc-lbl">Skipped</div>
                    </div>
                    <div className="ibi-rc ibi-rc--red">
                      <div className="ibi-rc-num">{result.errorCount || 0}</div>
                      <div className="ibi-rc-lbl">Errors</div>
                    </div>
                  </div>

                  {result.skipped?.length > 0 && (
                    <div className="ibi-detail">
                      <strong>Skipped (duplicate bale):</strong>
                      <div className="ibi-chips">
                        {result.skipped.map((s, i) => (
                          <span key={i} className="ibi-chip ibi-chip--amber" title={s.reason}>
                            {s.baleNo}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {result.errors?.length > 0 && (
                    <div className="ibi-detail">
                      <strong>Errors:</strong>
                      <ul className="ibi-err-list">
                        {result.errors.map((e, i) => (
                          <li key={i}>Row {e.row} ({e.baleNo}): {e.error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="ibi-foot">
              {!result ? (
                <>
                  <button className="ibi-btn ibi-btn--ghost" onClick={closeModal}>Cancel</button>
                  <button
                    className="ibi-btn ibi-btn--primary"
                    onClick={handleUpload}
                    disabled={rows.length === 0 || uploading}
                  >
                    {uploading ? "Importing..." : `Import ${rows.length || ""} Row(s)`}
                  </button>
                </>
              ) : (
                <>
                  <button className="ibi-btn ibi-btn--ghost" onClick={reset}>Import Another</button>
                  <button
                    className="ibi-btn ibi-btn--primary"
                    onClick={() => { closeModal(); onDone?.(); }}
                  >
                    Done
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      <style>{`
        .ibi-trigger {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500; cursor: pointer;
          background: #ecfdf5; border: 1px solid #10b981; color: #047857;
          font-family: inherit; transition: all 0.15s;
        }
        .ibi-trigger:hover { background: #d1fae5; }
        .ibi-trigger svg { width: 18px; height: 18px; }

        .ibi-overlay {
          position: fixed; inset: 0; z-index: 1000;
          background: rgba(15,23,42,0.5);
          display: flex; align-items: center; justify-content: center;
          padding: 16px;
        }
        .ibi-modal {
          background: #fff; border-radius: 14px;
          width: 100%; max-width: 620px; max-height: 90vh;
          display: flex; flex-direction: column;
          box-shadow: 0 20px 50px rgba(0,0,0,0.25);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .ibi-head {
          display: flex; align-items: center; justify-content: space-between;
          padding: 18px 20px; border-bottom: 1px solid #e5e7eb;
        }
        .ibi-title { font-size: 18px; font-weight: 700; margin: 0; color: #0f172a; }
        .ibi-close {
          width: 32px; height: 32px; border-radius: 8px;
          border: none; background: #f1f5f9; cursor: pointer;
          display: flex; align-items: center; justify-content: center; color: #475569;
        }
        .ibi-close:hover { background: #e2e8f0; }
        .ibi-close svg { width: 18px; height: 18px; }

        .ibi-body {
          padding: 20px; overflow-y: auto;
          display: flex; flex-direction: column; gap: 14px;
        }
        .ibi-help {
          font-size: 13px; color: #475569; line-height: 1.5;
          background: #eff6ff; border: 1px solid #bfdbfe;
          padding: 12px 14px; border-radius: 10px;
        }
        .ibi-tpl-btn {
          display: inline-flex; align-items: center; gap: 8px;
          align-self: flex-start;
          padding: 8px 14px; border-radius: 8px; cursor: pointer;
          background: #fff; border: 1px solid #cbd5e1; color: #334155;
          font-size: 13px; font-weight: 500; font-family: inherit;
        }
        .ibi-tpl-btn:hover { background: #f8fafc; }
        .ibi-tpl-btn svg { width: 16px; height: 16px; }

        .ibi-drop {
          display: flex; flex-direction: column; align-items: center; gap: 6px;
          padding: 28px 20px; border: 2px dashed #cbd5e1; border-radius: 12px;
          cursor: pointer; text-align: center; transition: all 0.15s;
          background: #f8fafc; color: #64748b;
        }
        .ibi-drop:hover { border-color: #2563eb; background: #eff6ff; color: #2563eb; }
        .ibi-drop svg { width: 28px; height: 28px; }
        .ibi-drop-main { font-size: 14px; font-weight: 600; color: #334155; }
        .ibi-drop-sub { font-size: 12px; color: #94a3b8; }

        .ibi-err {
          font-size: 13px; color: #b91c1c;
          background: #fee2e2; border: 1px solid #fecaca;
          padding: 10px 14px; border-radius: 8px;
        }

        .ibi-preview-head { font-size: 13px; color: #334155; margin-bottom: 8px; }
        .ibi-preview-table-wrap {
          border: 1px solid #e5e7eb; border-radius: 8px; overflow-x: auto;
        }
        .ibi-preview-table { width: 100%; border-collapse: collapse; font-size: 12px; }
        .ibi-preview-table th {
          background: #f8fafc; padding: 8px 10px; text-align: left;
          font-weight: 600; color: #475569; border-bottom: 1px solid #e5e7eb;
          white-space: nowrap;
        }
        .ibi-preview-table td {
          padding: 8px 10px; border-bottom: 1px solid #f1f5f9; color: #334155;
          white-space: nowrap;
        }
        .ibi-preview-table tr:last-child td { border-bottom: none; }
        .ibi-preview-more { padding: 8px 10px; font-size: 12px; color: #94a3b8; background: #f8fafc; }

        .ibi-result-cards { display: flex; gap: 12px; }
        .ibi-rc {
          flex: 1; text-align: center; padding: 16px 10px;
          border-radius: 12px; border: 1px solid;
        }
        .ibi-rc-num { font-size: 26px; font-weight: 700; line-height: 1; }
        .ibi-rc-lbl { font-size: 12px; margin-top: 4px; font-weight: 500; }
        .ibi-rc--green { background: #ecfdf5; border-color: #a7f3d0; color: #047857; }
        .ibi-rc--amber { background: #fffbeb; border-color: #fde68a; color: #b45309; }
        .ibi-rc--red   { background: #fef2f2; border-color: #fecaca; color: #b91c1c; }

        .ibi-detail { margin-top: 14px; font-size: 13px; color: #334155; }
        .ibi-chips { display: flex; flex-wrap: wrap; gap: 6px; margin-top: 8px; }
        .ibi-chip {
          padding: 3px 10px; border-radius: 8px; font-size: 12px; font-weight: 600;
          font-family: ui-monospace, monospace;
        }
        .ibi-chip--amber { background: #fef3c7; color: #92400e; }
        .ibi-err-list { margin: 8px 0 0; padding-left: 18px; color: #b91c1c; font-size: 12px; }
        .ibi-err-list li { margin-bottom: 3px; }

        .ibi-foot {
          display: flex; justify-content: flex-end; gap: 10px;
          padding: 16px 20px; border-top: 1px solid #e5e7eb;
        }
        .ibi-btn {
          padding: 9px 18px; border-radius: 8px; font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent; font-family: inherit;
        }
        .ibi-btn:disabled { opacity: 0.55; cursor: not-allowed; }
        .ibi-btn--ghost { background: #fff; border-color: #e5e7eb; color: #334155; }
        .ibi-btn--ghost:hover { background: #f8fafc; }
        .ibi-btn--primary { background: #2563eb; color: #fff; }
        .ibi-btn--primary:hover:not(:disabled) { background: #1d4ed8; }
      `}</style>
    </>
  );
}
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
  Tag: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  ),
  Search: () => (                                                                  // 🆕
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  ),
  X: () => (                                                                       // 🆕
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
};

// 🆕 Generate auto voucher number — INW-YYYYMMDD-NNN
const generateVoucherNo = async (entryDate) => {
  const date = new Date(entryDate);
  const yyyy = date.getFullYear();
  const mm   = String(date.getMonth() + 1).padStart(2, "0");
  const dd   = String(date.getDate()).padStart(2, "0");
  const prefix = `INW-${yyyy}${mm}${dd}-`;

  try {
    const allInwards = await inwardApi.getAll();
    let maxSeq = 0;
    (allInwards || []).forEach((inw) => {
      if (inw.voucherNo?.startsWith(prefix)) {
        const seq = parseInt(inw.voucherNo.slice(prefix.length), 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
  } catch {
    return `${prefix}001`;
  }
};

const EMPTY_FORM = {
  entryDate: new Date().toISOString().slice(0, 10),
  voucherNo: "",
  baleNo: "",                                       // 🆕 BALE NO
  company: "", location: "", supplier: "",
  fabric: "", fabricQuality: "", design: "", defaultColor: "",
  uom: "", processType: "",
  gstNo: "", challanNo: "", invoiceNo: "", hsnCode: "",
  lrNo: "", transport: "Self", invType: "FRESH GOODS",
  lotNo: "", rack: "",
  weight: 0, weaver: "", gsm: "", width: "", remarks: "",
  currencyType: "INR", rate: 0, exchangeRate: 1,
  pcsCount: 0,  // pcs count drives auto-rows
  totalMeterInput: 0,
  sqMtr: 0, grossWeight: 0, netWeight: 0,
};

export default function InwardEntry() {
  const navigate = useNavigate();
  const { id: editId } = useParams();

  const [form, setForm] = useState(EMPTY_FORM);
  const [pcsDetails, setPcsDetails] = useState([]);
  const [recentInwards, setRecentInwards] = useState([]);     // 🆕
  const [totalInwards, setTotalInwards] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");

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

        const list = await inwardApi.getAll().catch(() => []);
        const sorted = (list || [])
          .sort((a, b) => new Date(b.entryDate) - new Date(a.entryDate))
        setRecentInwards(sorted);
        setTotalInwards((list || []).length);

        // Default selections — pehla option auto-select
        setForm((f) => ({
          ...f,
          company: f.company || m.companies[0]?._id || "",
          location: f.location || m.locations[0]?._id || "",
          uom: f.uom || m.uoms[0]?._id || "",
        }));

        // 🆕 Auto-generate voucher for NEW inward only
if (!editId) {
  const newVoucher = await generateVoucherNo(new Date().toISOString().slice(0, 10));
  setForm((f) => ({ ...f, voucherNo: newVoucher }));
}

        // Agar edit mode hai, existing inward load karo
        if (editId) {
          const inw = await inwardApi.getById(editId);
          setForm({
            entryDate: inw.entryDate?.slice(0, 10) || "",
            voucherNo: inw.voucherNo || "",
            baleNo: inw.baleNo || "",                    // 🆕 load bale no
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

   useEffect(() => {
    if (editId) return;                // edit mode: don't auto-change
    if (!form.entryDate) return;
    (async () => {
      const newVoucher = await generateVoucherNo(form.entryDate);
      setForm((f) => ({ ...f, voucherNo: newVoucher }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.entryDate]);

  /* ──────── 🆕 FILTERED RECENT INWARDS ──────── */
  const displayedInwards = useMemo(() => {
    if (!searchQuery.trim()) {
      return recentInwards.slice(0, 10);   // default: last 10
    }
    const q = searchQuery.toLowerCase().trim();
    return recentInwards.filter((inw) =>
      (inw.baleNo || "").toLowerCase().includes(q) ||
      (inw.fabric?.name || "").toLowerCase().includes(q) ||
      (inw.fabricQuality?.name || "").toLowerCase().includes(q) ||
      (inw.voucherNo || "").toLowerCase().includes(q) ||
      (inw.design?.designNo || "").toLowerCase().includes(q)
    );
  }, [recentInwards, searchQuery]);
  /* ──────── SUMMARY ──────── */
  const summary = useMemo(() => {
    const totalPcs = pcsDetails.length;
    const totalMeter = pcsDetails.reduce((s, p) => s + (parseFloat(p.meter) || 0), 0);
    const totalSqMtr = pcsDetails.reduce((s, p) => s + (parseFloat(p.sqMtr) || 0), 0);
    const totalGWht = pcsDetails.reduce((s, p) => s + (parseFloat(p.grossWeight) || 0), 0);
    const totalNWht = pcsDetails.reduce((s, p) => s + (parseFloat(p.netWeight) || 0), 0);

    const rateINR = parseFloat(form.rate) || 0;
    const exRate = parseFloat(form.exchangeRate) || 1;
    const rateNGN = rateINR * exRate;
    const totalINR = totalMeter * rateINR;
    const totalNGN = totalMeter * rateNGN;

    return {
      totalPcs,
      totalMeter: totalMeter.toFixed(2),
      totalSqMtr: totalSqMtr.toFixed(2),
      totalGWht: totalGWht.toFixed(3),
      totalNWht: totalNWht.toFixed(3),
      rateINR: rateINR.toFixed(2),
      rateNGN: rateNGN.toFixed(2),
      totalINR: totalINR.toFixed(2),
      totalNGN: totalNGN.toFixed(2),
    };
  }, [pcsDetails, form.rate, form.exchangeRate]);

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

  // 🆕 Auto-generate N rows when PCS count entered
  const handlePcsCountChange = (count) => {
    const n = Math.max(0, parseInt(count) || 0);
    // 🆕 Calculate per-row meter if total is set
    const currentTotal = parseFloat(form.totalMeterInput) || 0;
    const perRow = n > 0 && currentTotal > 0 ? +(currentTotal / n).toFixed(3) : 0;

    setForm({ ...form, pcsCount: n });

    if (n === 0) {
      setPcsDetails([]);
      return;
    }

    if (n > pcsDetails.length) {
      // Add new rows
      const toAdd = n - pcsDetails.length;
      // 🆕 Existing rows ko bhi redistribute if total set
      const existingRows = perRow > 0
        ? pcsDetails.map((p) => ({ ...p, meter: perRow }))
        : pcsDetails;
      const newRows = Array.from({ length: toAdd }, (_, i) => ({
        id: Date.now() + Math.random() + i,
        pcsNo: pcsDetails.length + i + 1,
        meter: perRow,                                       // 🆕 auto-fill from total
        sqMtr: 0,
        grossWeight: 0,
        netWeight: 0,
        color: form.defaultColor || "",                      // uses MIX if defaultColor set to MIX
      }));
      setPcsDetails([...existingRows, ...newRows]);
    } else if (n < pcsDetails.length) {
      const removing = pcsDetails.length - n;
      if (window.confirm(`Last ${removing} row(s) delete ho jaayenge. Confirm?`)) {
        let trimmed = pcsDetails.slice(0, n);
        // 🆕 Redistribute remaining
        if (perRow > 0) {
          trimmed = trimmed.map((p) => ({ ...p, meter: perRow }));
        }
        setPcsDetails(trimmed);
      } else {
        setForm({ ...form, pcsCount: pcsDetails.length });
      }
    }
  };

  // 🆕 Update individual cell in PCS row
  const updatePcsCell = (id, field, value) => {
    setPcsDetails(pcsDetails.map((p) =>
      p.id === id ? { ...p, [field]: value } : p
    ));
  };

  // 🆕 Total meter input — auto-distribute equally across all rows
  const handleTotalMeterChange = (value) => {
    setForm({ ...form, totalMeterInput: value });

    const total = parseFloat(value) || 0;
    if (total > 0 && pcsDetails.length > 0) {
      const perRow = +(total / pcsDetails.length).toFixed(3);
      // Sab rows me equal meter assign karo
      setPcsDetails(pcsDetails.map((p) => ({
        ...p,
        meter: perRow,
        // color stays from defaultColor (set "MIX" if needed)
        color: p.color || form.defaultColor || "",
      })));
    }
  };

  const deletePcs = (id) => {
    const filtered = pcsDetails
      .filter((p) => p.id !== id)
      .map((p, i) => ({ ...p, pcsNo: i + 1 }));
    setPcsDetails(filtered);
    // if (editingId === id) setEditingId(null);
  };

  // const startEdit = (row) => {
  //   setEditingId(row.id);
  //   setEditDraft({ meter: row.meter, color: row.color });
  // };

  // const saveEdit = (id) => {
  //   setPcsDetails(
  //     pcsDetails.map((p) =>
  //       p.id === id
  //         ? { ...p, meter: parseFloat(editDraft.meter) || 0, color: editDraft.color }
  //         : p
  //     )
  //   );
  //   setEditingId(null);
  // };

  const resetForm = () => {
    if (!window.confirm("Form aur PCS sab reset ho jaayega. Sure?")) return;
    setPcsDetails([]);
    setForm({
      ...EMPTY_FORM,
      company: masters.companies[0]?._id || "",
      location: masters.locations[0]?._id || "",
      uom: masters.uoms[0]?._id || "",
    });
    // setEditingId(null);
  };

  /* ──────── SAVE / UPDATE ──────── */
  const handleSave = async () => {
    if (!form.baleNo) return alert("Bale No daalo (e.g. A35, 1224)");
    if (!form.fabric) return alert("Fabric select karo");
    if (!form.fabricQuality) return alert("Fabric Quality select karo");
    if (!form.rate || parseFloat(form.rate) <= 0) return alert("Rate INR enter karo");
    if (pcsDetails.length === 0) return alert("Pcs Count enter karo (rows auto-generate honge)");

    const payload = {
      ...form,
      baleNo: form.baleNo.toUpperCase().trim(),         // 🆕 always uppercase
      rate: parseFloat(form.rate) || 0,
      exchangeRate: parseFloat(form.exchangeRate) || 1,
      weight: parseFloat(form.weight) || 0,
      pcsDetails: pcsDetails.map((p, i) => {
        const row = {
          pcsNo: i + 1,
          meter: parseFloat(p.meter) || 0,
        };
        // 🆕 Color only if valid ObjectId (24-char hex), warna skip
        const c = p.color || form.defaultColor;
        if (c && c.length === 24) {
          row.color = c;
        }
        return row;
      }),
    };

    console.log("Payload to save:", payload);

    // Empty optional ObjectId fields ko bhejna nahi (warna Mongoose cast error)
    ["fabricQuality", "design", "defaultColor", "uom", "processType", "container", "supplier", "company", "location",].forEach((k) => {
      if (!payload[k]) delete payload[k];
    });

    // strip frontend-only fields
    delete payload.pcsCount;
    delete payload.totalMeterInput;
    // debugger;

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
          <button className="inward-btn inward-btn--ghost" onClick={() => navigate("/dashboard/reports/inward-report")}>
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
      {/* Content — Single column layout */}
      <div className="inward-content-v2">

        {/* ════════════════════════════════
            🆕 Recent Inward - Auto Hide when user types
            ════════════════════════════════ */}
        {!editId && !form.baleNo && pcsDetails.length === 0 && recentInwards.length > 0 && (
          <section className="inward-card inward-recent-card">
            <div className="inward-recent-header">
              <div>
                <h2 className="inward-card__title inward-card__title--inline">
                  Recent Inwards <span className="inward-recent-count">
                    ({searchQuery ? `${displayedInwards.length} found` : `${totalInwards} total`})
                  </span>
                </h2>
                <div className="inward-pcs-hint">
                  <Icon.Info />
                  <span>Form fill karte hi yeh table hide ho jayega · Search by Bale No, Fabric, Quality</span>
                </div>
              </div>
              <div className="inward-recent-actions">                                       {/* 🆕 */}
                {/* 🆕 Search Box */}
                <div className="inward-search-wrap">
                  <span className="inward-search-icon"><Icon.Search /></span>
                  <input
                    type="text"
                    className="inward-search-input"
                    placeholder="Search Bale No, Fabric..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button
                      className="inward-search-clear"
                      onClick={() => setSearchQuery("")}
                      title="Clear search"
                    >
                      <Icon.X />
                    </button>
                  )}
                </div>
                <button
                  className="inward-btn inward-btn--ghost inward-btn--sm"
                  onClick={() => navigate("/dashboard/reports/inward-report")}
                >
                  <span>View All</span>
                </button>
              </div>
            </div>
            <div className="inward-table-wrap">
              <table className="inward-table">
                <thead>
                  <tr>
                    <th className="inward-th">Date</th>
                    <th className="inward-th">Bale No</th>
                    <th className="inward-th">Fabric</th>
                    <th className="inward-th">Quality</th>
                    <th className="inward-th inward-th--center">Pcs</th>
                    <th className="inward-th inward-th--center">Meter</th>
                    <th className="inward-th inward-th--center">Rate (₹)</th>
                    <th className="inward-th inward-th--center">Total (₹)</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedInwards.length === 0 ? (
                    <tr>
                      <td colSpan="8" className="inward-td inward-td--empty">
                        {searchQuery ? `🔍 "${searchQuery}" — koi match nahi mila` : "Koi inward nahi"}
                      </td>
                    </tr>
                  ) : (
                    displayedInwards.map((inw) => {
                      const totalMeter = (inw.pcsDetails || []).reduce(
                        (s, p) => s + (parseFloat(p.meter) || 0), 0
                      );
                      const totalAmount = totalMeter * (parseFloat(inw.rate) || 0);
                      return (
                        <tr
                          key={inw._id}
                          className="inward-tr inward-tr--clickable"
                          onClick={() => navigate(`/dashboard/inward/${inw._id}`)}
                          title="Click to edit"
                        >
                          <td className="inward-td">
                            {inw.entryDate
                              ? new Date(inw.entryDate).toLocaleDateString("en-GB")
                              : "—"}
                          </td>
                          <td className="inward-td">
                            <strong className="inward-recent-bale">{inw.baleNo || "—"}</strong>
                          </td>
                          <td className="inward-td">{inw.fabric?.name || "—"}</td>
                          <td className="inward-td">{inw.fabricQuality?.name || "—"}</td>
                          <td className="inward-td inward-td--center">
                            {(inw.pcsDetails || []).length}
                          </td>
                          <td className="inward-td inward-td--center">
                            {totalMeter.toFixed(2)}
                          </td>
                          <td className="inward-td inward-td--center">
                            {(parseFloat(inw.rate) || 0).toFixed(2)}
                          </td>
                          <td className="inward-td inward-td--center">
                            <strong className="inward-recent-total">
                              {totalAmount.toFixed(2)}
                            </strong>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </section>
        )}

        {/* ════════════════════════════════
            🆕 TOP STRIP — Date + Bale No
            ════════════════════════════════ */}
        <section className="inward-card inward-top-strip">
          <Field label="Entry Date" required>
            <div className="inward-input-wrap">
              <input
                type="date"
                className="inward-input"
                value={form.entryDate}
                onChange={(e) => handle("entryDate", e.target.value)}
              />
              <span className="inward-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="Bale No" required>
            <input
              className="inward-input inward-bale-input-v2"
              placeholder="A35"
              value={form.baleNo}
              onChange={(e) => handle("baleNo", e.target.value.toUpperCase())}
              disabled={!!editId}
              title={editId ? "Bale No cannot be changed in edit mode" : ""}
            />
          </Field>
          <Field label="Voucher No" required>
            <input
              className="inward-input"
              placeholder="Optional"
              value={form.voucherNo}
              onChange={(e) => handle("voucherNo", e.target.value)}
            />
          </Field>
        </section>

        {/* ════════════════════════════════
            🆕 SECTION 1 — REQUIRED FIELDS
            ════════════════════════════════ */}
        <section className="inward-card inward-section-required">
          <div className="inward-section-badge">REQUIRED FIELDS</div>
          <div className="inward-grid-v2">
            <Field label="Fabric Name" required>
              <MasterSelect value={form.fabric} onChange={(v) => handle("fabric", v)} options={masters.fabrics} />
            </Field>
            <Field label="Fabric Quality" required>
              <MasterSelect value={form.fabricQuality} onChange={(v) => handle("fabricQuality", v)} options={masters.qualities} />
            </Field>
            <Field label="Design No">
              <MasterSelect value={form.design} onChange={(v) => handle("design", v)} options={masters.designs} labelKey="designNo" />
            </Field>
            <Field label="Color">
              <MasterSelect value={form.defaultColor} onChange={(v) => handle("defaultColor", v)} options={masters.colors} />
            </Field>
            <Field label="Pcs (Count)" required>
              <input
                className="inward-input inward-input--highlight"
                type="number"
                min="0"
                placeholder="15"
                value={form.pcsCount || pcsDetails.length || ""}
                onChange={(e) => handlePcsCountChange(e.target.value)}
              />
            </Field>
            <Field label="Total Meter (Qty)" required>
              {/* 🆕 USER ENTERS TOTAL — auto-distribute equally */}
              <input
                className="inward-input inward-input--highlight"
                type="number"
                step="0.01"
                placeholder="274"
                value={form.totalMeterInput || ""}
                onChange={(e) => handleTotalMeterChange(e.target.value)}
              />
            </Field>
            <Field label="Per Row" >
              {/* 🆕 Auto display: total / pcs */}
              <input
                className="inward-input inward-input--readonly"
                readOnly
                value={
                  form.pcsCount > 0 && parseFloat(form.totalMeterInput) > 0
                    ? (parseFloat(form.totalMeterInput) / form.pcsCount).toFixed(3) + " m"
                    : "—"
                }
              />
            </Field>
            <Field label="Actual Sum (after edits)">
              {/* Existing sum display - shows after manual edits */}
              <input
                className="inward-input inward-input--readonly"
                readOnly
                value={summary.totalMeter + " m"}
              />
            </Field>
            <Field label="UOM">
              <MasterSelect value={form.uom} onChange={(v) => handle("uom", v)} options={masters.uoms} />
            </Field>
            <Field label="Sq. Meter">
              <input
                className="inward-input"
                type="number"
                step="0.001"
                value={form.sqMtr}
                onChange={(e) => handle("sqMtr", e.target.value)}
              />
            </Field>

            <Field label="G.Wht">
              <input
                className="inward-input"
                type="number"
                step="0.001"
                value={form.grossWeight}
                onChange={(e) => handle("grossWeight", e.target.value)}
              />
            </Field>

            <Field label="N.Wht">
              <input
                className="inward-input"
                type="number"
                step="0.001"
                value={form.netWeight}
                onChange={(e) => handle("netWeight", e.target.value)}
              />
            </Field>
          </div>
        </section>

        {/* ════════════════════════════════
            🆕 SECTION 2 — USER ENTRY (PCS Table)
            ════════════════════════════════ */}
        <section className="inward-card inward-section-entry">
          <div className="inward-section-badge inward-section-badge--green">USER ENTRY</div>
          <div className="inward-pcs-header">
            <div>
              <h2 className="inward-card__title inward-card__title--inline">
                PCS Details ({pcsDetails.length} rows)
              </h2>
              <div className="inward-pcs-hint">
                <Icon.Info />
                <span>Pcs Count enter karte hi rows auto-generate honge</span>
              </div>
            </div>
            <button className="inward-btn inward-btn--ghost inward-btn--sm" onClick={addPcs}>
              <Icon.Plus /><span>Add Row</span>
            </button>
          </div>

          <div className="inward-table-wrap">
            <table className="inward-table">
              <thead>
                <tr>
                  <th className="inward-th inward-th--center">PCS</th>
                  <th className="inward-th inward-th--center">Meter</th>
                  <th className="inward-th inward-th--center">Color</th>
                  <th className="inward-th inward-th--center">Action</th>
                </tr>
              </thead>
              <tbody>
                {pcsDetails.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="inward-td inward-td--empty">
                      Pcs Count enter karo upar to auto rows aaye, ya "Add Row" se manually add karo
                    </td>
                  </tr>
                ) : (
                  pcsDetails.map((row) => (
                    <tr key={row.id} className="inward-tr">
                      <td className="inward-td inward-td--center">{row.pcsNo}</td>
                      <td className="inward-td inward-td--center">
                        <input
                          type="number"
                          step="0.01"
                          className="inward-input inward-input--cell"
                          value={row.meter}
                          onChange={(e) => updatePcsCell(row.id, "meter", e.target.value)}
                        />
                      </td>
                      <td className="inward-td inward-td--center">
                        <select
                          className="inward-select inward-input--cell"
                          style={{ minWidth: 90 }}
                          value={row.color}
                          onChange={(e) => updatePcsCell(row.id, "color", e.target.value)}
                        >
                          <option value="">Select...</option>
                          {masters.colors.map(c => (
                            <option key={c._id} value={c._id}>{c.name}</option>
                          ))}
                        </select>
                      </td>
                      <td className="inward-td inward-td--center">
                        <button
                          className="inward-icon-action inward-icon-action--delete"
                          onClick={() => deletePcs(row.id)}
                          title="Delete"
                        >
                          <Icon.Trash />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {pcsDetails.length > 0 && (
                <tfoot>
                  <tr className="inward-total-row">
                    <td className="inward-td inward-td--center inward-td--strong">TOTAL</td>
                    <td className="inward-td inward-td--center inward-td--strong">{summary.totalMeter}</td>
                    <td className="inward-td inward-td--center inward-td--strong">—</td>
                    <td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </section>

        {/* ════════════════════════════════
            🆕 SECTION 3 — AUTO CALCULATED
            ════════════════════════════════ */}
        <section className="inward-card inward-section-auto">
          <div className="inward-section-badge inward-section-badge--purple">AUTO CALCULATED</div>
          <div className="inward-grid-v2">
            <Field label="Rate per Qty (INR)" required>
              <input
                className="inward-input inward-input--highlight"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={form.rate}
                onChange={(e) => handle("rate", e.target.value)}
              />
            </Field>
            <Field label="Exchange Rate">
              <input
                className="inward-input"
                type="number"
                step="0.01"
                placeholder="1.00"
                value={form.exchangeRate}
                onChange={(e) => handle("exchangeRate", e.target.value)}
              />
            </Field>
            <Field label="Rate per Qty (NGN)">
              <input
                className="inward-input inward-input--readonly"
                readOnly
                value={summary.rateNGN}
              />
            </Field>
            <Field label="Total Amount (INR)">
              <input
                className="inward-input inward-input--readonly inward-input--total"
                readOnly
                value={summary.totalINR}
              />
            </Field>
            <Field label="Total Amount (NGN)">
              <input
                className="inward-input inward-input--readonly inward-input--total"
                readOnly
                value={summary.totalNGN}
              />
            </Field>
          </div>
        </section>
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

        /* 🆕 V2 Layout — Single column */
        .inward-content-v2 {
          display: flex; flex-direction: column;
          gap: 16px;
        }

        /* 🆕 Top strip with date + bale */
        .inward-top-strip {
          display: grid;
          grid-template-columns: 1fr 1.5fr 1fr;
          gap: 16px;
          align-items: end;
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border-color: #bfdbfe;
        }
        .inward-bale-input-v2 {
          font-size: 16px !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          border: 2px solid var(--inw-primary) !important;
        }

        /* 🆕 Section badges */
        .inward-section-badge {
          display: inline-block;
          padding: 4px 10px;
          background: #dbeafe;
          color: #1e3a8a;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.8px;
          border-radius: 12px;
          margin-bottom: 14px;
        }
        .inward-section-badge--green {
          background: #d1fae5;
          color: #065f46;
        }
        .inward-section-badge--purple {
          background: #ede9fe;
          color: #5b21b6;
        }

        /* 🆕 V2 grid - 3 columns */
        .inward-grid-v2 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 14px 20px;
        }

        /* 🆕 Section borders + colors */
        .inward-section-required {
          border-left: 4px solid #2563eb;
        }
        .inward-section-entry {
          border-left: 4px solid #10b981;
        }
        .inward-section-auto {
          border-left: 4px solid #8b5cf6;
          background: #faf5ff;
        }
        
        .inward-recent-card {
  border-left: 4px solid #0891b2;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
}
.inward-recent-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.inward-recent-count {
  color: var(--inw-muted);
  font-weight: 500;
  font-size: 14px;
  margin-left: 6px;
}
.inward-tr--clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.inward-tr--clickable:hover {
  background: #ecfeff !important;
}
.inward-recent-bale {
  color: var(--inw-primary);
  font-weight: 700;
  letter-spacing: 0.5px;
}
.inward-recent-actions {
  display: flex;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}
.inward-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.inward-search-icon {
  position: absolute;
  left: 10px;
  color: var(--inw-muted);
  pointer-events: none;
  display: flex;
}
.inward-search-icon svg { width: 14px; height: 14px; }
.inward-search-input {
  padding: 8px 32px 8px 32px;
  border: 1px solid var(--inw-border);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-family: inherit;
  width: 220px;
  transition: all 0.15s;
}
.inward-search-input:focus {
  outline: none;
  border-color: var(--inw-primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  width: 260px;
}
.inward-search-input::placeholder { color: #94a3b8; }
.inward-search-clear {
  position: absolute;
  right: 8px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: #e5e7eb;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--inw-text);
}
.inward-search-clear:hover { background: #cbd5e1; }
.inward-search-clear svg { width: 11px; height: 11px; }


        /* 🆕 Highlight input (Pcs count, Rate INR) */
        .inward-input--highlight {
          border-color: var(--inw-primary) !important;
          font-weight: 600 !important;
          font-size: 15px !important;
          background: #eff6ff !important;
        }

        /* 🆕 Total amount field — emphasized */
        .inward-input--total {
          font-size: 16px !important;
          font-weight: 700 !important;
          color: #065f46 !important;
          background: #ecfdf5 !important;
        }

        /* 🆕 PCS table cell input */
        .inward-input--cell {
          padding: 6px 8px !important;
          font-size: 13px !important;
          text-align: center !important;
          max-width: 110px;
          margin: 0 auto;
        }

        /* 🆕 Total row in table */
        .inward-total-row td {
          background: #f8fafc;
          font-weight: 700;
          border-top: 2px solid var(--inw-border);
        }
        .inward-td--strong { font-weight: 700; }

        @media (max-width: 1100px) {
          .inward-grid-v2 { grid-template-columns: repeat(2, 1fr); }
          .inward-top-strip { grid-template-columns: 1fr; }
        }
        @media (max-width: 640px) {
          .inward-grid-v2 { grid-template-columns: 1fr; }
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

        /* 🆕 BALE CARD — highlighted top section */
        .inward-bale-card {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
        }
        .inward-bale-row {
          display: flex; align-items: center; gap: 16px;
          flex-wrap: wrap;
        }
        .inward-bale-icon {
          width: 48px; height: 48px; flex-shrink: 0;
          border-radius: 12px;
          background: var(--inw-primary); color: #fff;
          display: flex; align-items: center; justify-content: center;
        }
        .inward-bale-icon svg { width: 22px; height: 22px; }
        .inward-bale-label { flex: 1; min-width: 200px; }
        .inward-bale-label__title { font-size: 15px; font-weight: 600; color: var(--inw-text); }
        .inward-bale-label__hint { font-size: 12px; color: var(--inw-muted); margin-top: 2px; }
        .inward-bale-input {
          flex: 0 0 220px;
          font-size: 18px !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 12px 16px !important;
          border: 2px solid var(--inw-primary) !important;
          background: #fff;
        }
        .inward-bale-input:disabled {
          background: #f1f5f9 !important;
          color: var(--inw-muted) !important;
          cursor: not-allowed;
        }

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

        /* 🆕 Bale No in summary sidebar */
        .inward-bale-summary {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 12px 16px;
          margin-bottom: 14px;
          text-align: center;
        }
        .inward-bale-summary__label {
          font-size: 11px; color: var(--inw-muted);
          text-transform: uppercase; letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .inward-bale-summary__value {
          font-size: 22px; font-weight: 700;
          color: var(--inw-primary);
          letter-spacing: 1px;
        }

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
          .inward-bale-input { flex: 1 1 100%; }
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
// function Select({ value, onChange, options }) {
//   return (
//     <div className="inward-select-wrap">
//       <select className="inward-select" value={value} onChange={(e) => onChange(e.target.value)}>
//         {options.map((opt) => (
//           <option key={opt} value={opt}>{opt || "Select..."}</option>
//         ))}
//       </select>
//       <span className="inward-select-wrap__chev"><Icon.ChevronDown /></span>
//     </div>
//   );
// }

/* For master data objects with _id + name */
function MasterSelect({ value, onChange, options = [], labelKey = "name" }) {
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

// function SummaryBox({ label, value }) {
//   return (
//     <div className="inward-summary-box">
//       <div className="inward-summary-box__label">{label}</div>
//       <div className="inward-summary-box__value">{value}</div>
//     </div>
//   );
// }
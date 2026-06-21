import React, { useState, useMemo, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { salesApi } from "../../Api/sales";
import { inventoryApi } from "../../Api/inventoryApi";
import { fetchAllMasters } from "../../Api/masterApi";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  Save: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>,
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Edit: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  Check: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Info: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>,
  Tag: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" /><line x1="7" y1="7" x2="7.01" y2="7" /></svg>,
  Spinner: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="sales-spinner"><line x1="12" y1="2" x2="12" y2="6" /><line x1="12" y1="18" x2="12" y2="22" /><line x1="4.93" y1="4.93" x2="7.76" y2="7.76" /><line x1="16.24" y1="16.24" x2="19.07" y2="19.07" /><line x1="2" y1="12" x2="6" y2="12" /><line x1="18" y1="12" x2="22" y2="12" /></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
};

const PAYMENT_TYPES = ["Credit", "Cash", "Advance"];


// const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmt = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

// 🆕 Generate auto invoice number — INV-YYYYMMDD-NNN
const generateInvoiceNo = async (saleDate) => {
  const date = new Date(saleDate);
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");
  const prefix = `INV-${yyyy}${mm}${dd}-`;

  try {
    const allSales = await salesApi.getAll();
    let maxSeq = 0;
    (allSales || []).forEach((s) => {
      if (s.invoiceNo?.startsWith(prefix)) {
        const seq = parseInt(s.invoiceNo.slice(prefix.length), 10);
        if (!isNaN(seq) && seq > maxSeq) maxSeq = seq;
      }
    });
    return `${prefix}${String(maxSeq + 1).padStart(3, "0")}`;
  } catch {
    return `${prefix}001`;
  }
};

const EMPTY_FORM = {
  saleDate: new Date().toISOString().slice(0, 10),
  invoiceNo: "",
  customer: "",
  company: "",
  location: "",
  transport: "",
  lrNo: "",
  gstNo: "",
  paymentType: "Credit",
  paymentMode: "",
  dueDate: "",
  salesPerson: "",
  remarks: "",
};

const EMPTY_ITEM = {
  baleNo: "",
  fabric: "",
  fabricQuality: "",
  color: "",
  location: "",
  rate: "",
  discount: "0",
};

/* ================================================================
   MAIN
   ================================================================ */
export default function Sales() {
  const navigate = useNavigate();
  const { id: editId } = useParams();

  const [form, setForm] = useState(EMPTY_FORM);
  const [itemForm, setItemForm] = useState(EMPTY_ITEM);
  const [items, setItems] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [salePcsRows, setSalePcsRows] = useState([]);
  const [recentSales, setRecentSales] = useState([]);        // 🆕
  const [totalSales, setTotalSales] = useState(0);            // 🆕
  const [searchQuery, setSearchQuery] = useState("");
  const [masters, setMasters] = useState({
    customers: [], companies: [], locations: [], fabrics: [],
    qualities: [], colors: [], salesPersons: [], transports: [],
    paymentModes: [],
  });

  // 🆕 Bale lookup state
  const [baleData, setBaleData] = useState(null);   // matched inventory record
  const [baleLookup, setBaleLookup] = useState({ loading: false, error: "" });

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const setF = (k, v) => setForm({ ...form, [k]: v });
  const setIf = (k, v) => setItemForm({ ...itemForm, [k]: v });

  /* ──────── LOAD MASTERS (and existing sale if editing) ──────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const m = await fetchAllMasters();
        setMasters({
          customers: m.customers || [],
          companies: m.companies || [],
          locations: m.locations || [],
          fabrics: m.fabrics || [],
          qualities: m.qualities || [],
          colors: m.colors || [],
          salesPersons: m.salespersons || m.salesPersons || [],
          transports: m.transports || [],
          paymentModes: m.paymentModes || [],
        });

        setForm((f) => ({
          ...f,
          company: f.company || m.companies?.[0]?._id || "",
          location: f.location || m.locations?.[0]?._id || "",
        }));

        if (!editId) {
          const newInvoice = await generateInvoiceNo(new Date().toISOString().slice(0, 10));
          setForm((f) => ({ ...f, invoiceNo: newInvoice }));
        }

        // 🆕 Fetch recent sales for the bottom table
        const allSales = await salesApi.getAll().catch(() => []);
        const sorted = (allSales || [])
          .sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate));
        setRecentSales(sorted);
        setTotalSales((allSales || []).length);

        if (editId) {
          const sale = await salesApi.getById(editId);
          setForm({
            saleDate: sale.saleDate?.slice(0, 10) || "",
            invoiceNo: sale.invoiceNo || "",
            customer: sale.customer?._id || sale.customer || "",
            company: sale.company?._id || sale.company || "",
            location: sale.location?._id || sale.location || "",
            transport: sale.transport?._id || sale.transport || "",
            lrNo: sale.lrNo || "",
            gstNo: sale.gstNo || "",
            paymentType: sale.paymentType || "Credit",
            paymentMode: sale.paymentMode?._id || sale.paymentMode || "",
            dueDate: sale.dueDate?.slice(0, 10) || "",
            salesPerson: sale.salesPerson?._id || sale.salesPerson || "",
            remarks: sale.remarks || "",
          });
          setItems(
            (sale.items || []).map((it, idx) => ({
              id: it._id || idx + 1,
              baleNo: it.baleNo || "",                  // 🆕
              fabric: it.fabric?._id || it.fabric,
              fabricQuality: it.fabricQuality?._id || it.fabricQuality,
              color: it.color?._id || it.color,
              location: it.location?._id || it.location,
              pcs: it.pcs,
              meterPerPcs: it.meterPerPcs,
              totalMeter: it.totalMeter,
              rate: it.rate,
              discount: it.discount,
              amount: it.amount,
            }))
          );
        }
      } catch (err) {
        alert("Load failed: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId]);

  /* ──────── AUTO-FILL customer GST when customer changes ──────── */
  useEffect(() => {
    if (!form.customer) return;
    const cust = masters.customers.find((c) => c._id === form.customer);
    if (cust?.gstNo) setForm((f) => ({ ...f, gstNo: cust.gstNo }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.customer]);

  /* 🆕 ──────── AUTO-REGENERATE invoice when date changes (new sales only) ──────── */


  useEffect(() => {
    if (editId) return;                // edit mode: don't auto-change
    if (!form.saleDate) return;
    (async () => {
      const newInvoice = await generateInvoiceNo(form.saleDate);
      setForm((f) => ({ ...f, invoiceNo: newInvoice }));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.saleDate]);

  /* ──────── 🆕 BALE LOOKUP — heart of bale-based sales ──────── */
  const lookupBale = async (baleNoRaw) => {
    const baleNo = (baleNoRaw || "").toUpperCase().trim();
    if (!baleNo) {
      setBaleData(null);
      setSalePcsRows([]);                                                  // 🆕
      setBaleLookup({ loading: false, error: "" });
      return;
    }

    try {
      setBaleLookup({ loading: true, error: "" });
      const inv = await inventoryApi.lookupByBale(baleNo);

      // Auto-fill bale-related fields
      setItemForm((prev) => ({
        ...prev,
        baleNo: inv.baleNo,
        fabric: inv.fabric?._id || "",
        fabricQuality: inv.fabricQuality?._id || "",
        color: inv.color?._id || "",
        location: inv.location?._id || "",
        rate: prev.rate || String(inv.rate || ""),
      }));

      // 🆕 Generate per-piece rows
      let rows = [];
      if (Array.isArray(inv.pcsDetails) && inv.pcsDetails.length > 0) {
        // Backend gave actual pcsDetails — use them
        rows = inv.pcsDetails.map((p, i) => ({
          id: Date.now() + i,
          pcsNo: p.pcsNo || i + 1,
          meter: parseFloat(p.meter) || 0,
          color: p.color?._id || p.color || inv.color?._id || "",
          selected: true,
        }));
      } else {
        // Fallback: generate from availablePcs + avgMeterPerPcs
        const count = inv.availablePcs || 0;
        const perMeter = inv.avgMeterPerPcs || 0;
        rows = Array.from({ length: count }, (_, i) => ({
          id: Date.now() + i,
          pcsNo: i + 1,
          meter: perMeter,
          color: inv.color?._id || "",
          selected: true,
        }));
      }
      setSalePcsRows(rows);

      setBaleData(inv);
      setBaleLookup({ loading: false, error: "" });
    } catch (err) {
      setBaleData(null);
      setSalePcsRows([]);                                                  // 🆕
      setBaleLookup({ loading: false, error: err.message });
    }
  };

  /* ──────── Available PCS — from looked-up bale ──────── */
  const availablePcs = useMemo(() => {
    if (!baleData) return 0;
    let avail = baleData.availablePcs || 0;
    // If editing an item from same bale, add back its pcs
    if (editingId) {
      const editingItem = items.find((it) => it.id === editingId);
      if (editingItem && editingItem.baleNo === baleData.baleNo) {
        avail += editingItem.pcs || 0;
      }
    }
    return avail;
  }, [baleData, editingId, items]);

  /* ──────── LIVE CALCULATIONS ──────── */
  /* ──────── 🆕 LIVE CALCULATIONS (per-piece) ──────── */
  const selectedPcs = useMemo(
    () => salePcsRows.filter((r) => r.selected),
    [salePcsRows]
  );
  const selectedPcsCount = selectedPcs.length;
  const selectedTotalMeter = useMemo(
    () => selectedPcs.reduce((s, r) => s + (parseFloat(r.meter) || 0), 0),
    [selectedPcs]
  );
  const itemAmount = useMemo(() => {
    const r = parseFloat(itemForm.rate) || 0;
    const d = parseFloat(itemForm.discount) || 0;
    return Math.max(selectedTotalMeter * r - selectedTotalMeter * d, 0);
  }, [selectedTotalMeter, itemForm.rate, itemForm.discount]);

  /* 🆕 ──────── FILTERED RECENT SALES ──────── */
  const displayedSales = useMemo(() => {
    if (!searchQuery.trim()) {
      return recentSales.slice(0, 10);   // default: last 10
    }
    const q = searchQuery.toLowerCase().trim();
    return recentSales.filter((s) =>
      (s.invoiceNo || "").toLowerCase().includes(q) ||
      (s.customer?.name || "").toLowerCase().includes(q) ||
      (s.items || []).some((it) => (it.baleNo || "").toLowerCase().includes(q))
    );
  }, [recentSales, searchQuery]);


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


  const togglePcsRow = (id) => {
    setSalePcsRows((rows) => rows.map((r) => r.id === id ? { ...r, selected: !r.selected } : r));
  };
  const updatePcsRow = (id, field, value) => {
    setSalePcsRows((rows) => rows.map((r) => r.id === id ? { ...r, [field]: value } : r));
  };
  const toggleAllPcs = (val) => {
    setSalePcsRows((rows) => rows.map((r) => ({ ...r, selected: val })));
  };

  /* ──────── ITEM HANDLERS ──────── */
  const handleAddItem = () => {
    if (!itemForm.baleNo) return alert("Bale No daalo (e.g., A35)");
    if (!baleData) return alert("Pehle bale lookup karo");

    const rate = parseFloat(itemForm.rate);
    const discount = parseFloat(itemForm.discount) || 0;
    if (!rate || rate <= 0) return alert("Rate enter karo");

    if (selectedPcsCount === 0) return alert("Kam se kam ek piece select karo");
    if (selectedTotalMeter <= 0) return alert("Selected pieces ka total meter zero hai");

    // Duplicate bale check
    const duplicate = items.find((it) =>
      it.baleNo === itemForm.baleNo && it.id !== editingId
    );
    if (duplicate) return alert(`Bale ${itemForm.baleNo} already added. Edit that row instead.`);

    if (selectedPcsCount > availablePcs) {
      return alert(`Sirf ${availablePcs} PCS available hain bale ${itemForm.baleNo} me`);
    }

    const avgMeterPerPcs = selectedTotalMeter / selectedPcsCount;
    const amount = Math.max(selectedTotalMeter * rate - selectedTotalMeter * discount, 0);

    const newRow = {
      id: editingId ?? Date.now(),
      baleNo: itemForm.baleNo,
      fabric: itemForm.fabric,
      fabricQuality: itemForm.fabricQuality,
      color: itemForm.color,
      location: itemForm.location || form.location,
      pcs: selectedPcsCount,
      meterPerPcs: avgMeterPerPcs,
      totalMeter: selectedTotalMeter,
      rate,
      discount,
      amount,
      pcsDetails: selectedPcs.map((r) => ({                // 🆕 per-piece details
        pcsNo: r.pcsNo,
        meter: parseFloat(r.meter) || 0,
        color: r.color || itemForm.color || undefined,
      })),
    };

    if (editingId) {
      setItems(items.map((it) => (it.id === editingId ? newRow : it)));
      setEditingId(null);
    } else {
      setItems([...items, newRow]);
    }

    // Reset
    setItemForm(EMPTY_ITEM);
    setSalePcsRows([]);
    setBaleData(null);
    setBaleLookup({ loading: false, error: "" });
  };

  const handleEditItem = (row) => {
    setEditingId(row.id);
    setItemForm({
      baleNo: row.baleNo || "",
      fabric: row.fabric,
      fabricQuality: row.fabricQuality,
      color: row.color,
      location: row.location || "",
      rate: String(row.rate),
      discount: String(row.discount),
    });
    if (row.baleNo) lookupBale(row.baleNo);
  };

  const handleDeleteItem = (id) => {
    if (!window.confirm("Item delete karna hai?")) return;
    setItems(items.filter((it) => it.id !== id));
    if (editingId === id) {
      setEditingId(null);
      setItemForm(EMPTY_ITEM);
      setBaleData(null);
    }
  };

  const handleClearBale = () => {
    setItemForm(EMPTY_ITEM);
    setSalePcsRows([]);                                                     // 🆕
    setBaleData(null);
    setBaleLookup({ loading: false, error: "" });
    setEditingId(null);
  };

  const handleReset = () => {
    if (!window.confirm("Saare items aur form reset ho jaayenge. Sure?")) return;
    setItems([]);
    setItemForm(EMPTY_ITEM);
    setSalePcsRows([]);
    setBaleData(null);
    setBaleLookup({ loading: false, error: "" });
    setEditingId(null);
    setForm({
      ...EMPTY_FORM,
      company: masters.companies[0]?._id || "",
      location: masters.locations[0]?._id || "",
    });
  };

  /* ──────── SAVE (API) ──────── */
  const handleSave = async () => {
    if (!form.invoiceNo.trim()) return alert("Invoice No daalo");
    if (!form.customer) return alert("Customer select karo");
    if (!form.company) return alert("Company select karo");
    if (items.length === 0) return alert("Kam se kam ek item add karo");

    // Verify all items have baleNo
    const missingBale = items.find((it) => !it.baleNo);
    if (missingBale) return alert("Saare items me bale no chahiye");

    const payload = {
      saleDate: form.saleDate,
      invoiceNo: form.invoiceNo,
      customer: form.customer,
      company: form.company,
      location: form.location || undefined,
      salesPerson: form.salesPerson || undefined,
      transport: form.transport || undefined,
      paymentMode: form.paymentMode || undefined,
      gstNo: form.gstNo,
      lrNo: form.lrNo,
      paymentType: form.paymentType,
      dueDate: form.dueDate || undefined,
      remarks: form.remarks,
      items: items.map((it) => ({
        baleNo: it.baleNo,                              // 🆕
        fabric: it.fabric,
        fabricQuality: it.fabricQuality || undefined,
        color: it.color || undefined,
        location: it.location || form.location || undefined,
        pcs: Number(it.pcs),
        meterPerPcs: Number(it.meterPerPcs),
        rate: Number(it.rate),
        discount: Number(it.discount) || 0,
      })),
    };

    Object.keys(payload).forEach((k) => {
      if (payload[k] === undefined || payload[k] === "") delete payload[k];
    });

    try {
      setSaving(true);
      if (editId) {
        await salesApi.update(editId, payload);
        alert("Sale updated! Inventory bhi update ho gaya.");
      } else {
        await salesApi.create(payload);
        alert("Sale created! Bale-wise stock ghat gaya.");
      }
      navigate("/dashboard/sales");
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const nameOf = (list, id) => list.find((x) => x._id === id)?.name || "-";

  if (loading) {
    return (
      <div className="sales-page" style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
        Loading...
      </div>
    );
  }

  return (
    <div className="sales-page">
      {/* HEADER */}
      <div className="sales-page__header">
        <div>
          <h1 className="sales-page__title">{editId ? "Edit Sales Entry" : "Sales Entry"}</h1>
          <div className="sales-breadcrumb">
            <span>Home</span>
            <span className="sales-breadcrumb__sep">/</span>
            <span className="sales-breadcrumb__current">Sales Entry</span>
          </div>
        </div>
        <div className="sales-page__actions">
          <button className="sales-btn sales-btn--ghost" onClick={() => navigate("/dashboard/reports/sales-report")}>
            <Icon.ArrowLeft /><span>Back to List</span>
          </button>
          <button className="sales-btn sales-btn--ghost" onClick={handleReset}>
            <Icon.Refresh /><span>Reset</span>
          </button>
          <button className="sales-btn sales-btn--primary" onClick={handleSave} disabled={saving}>
            <Icon.Save /><span>{saving ? "Saving..." : (editId ? "Update Sale" : "Save Sale")}</span>
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
                <input className="sales-input" placeholder="e.g., SAL-2026-125" value={form.invoiceNo} onChange={(e) => setF("invoiceNo", e.target.value)} />
              </Field>
              <Field label="Customer / Party" required>
                <MasterSelect value={form.customer} onChange={(v) => setF("customer", v)} options={masters.customers} />
              </Field>

              {/* <Field label="Company" required>
                <MasterSelect value={form.company} onChange={(v) => setF("company", v)} options={masters.companies} />
              </Field>
              <Field label="Location (Godown)">
                <MasterSelect value={form.location} onChange={(v) => setF("location", v)} options={masters.locations} />
              </Field>
              <Field label="Transport">
                <MasterSelect value={form.transport} onChange={(v) => setF("transport", v)} options={masters.transports} />
              </Field> */}

              {/* <Field label="LR No">
                <input className="sales-input" placeholder="Enter LR No" value={form.lrNo} onChange={(e) => setF("lrNo", e.target.value)} />
              </Field>
              <Field label="GST No">
                <input className="sales-input" placeholder="(auto-fills from customer)" value={form.gstNo} onChange={(e) => setF("gstNo", e.target.value)} />
              </Field> */}
              <Field label="Sales Person">
                <MasterSelect value={form.salesPerson} onChange={(v) => setF("salesPerson", v)} options={masters.salesPersons} />
              </Field>

              <Field label="Payment Type">
                <select className="sales-input" value={form.paymentType} onChange={(e) => setF("paymentType", e.target.value)}>
                  {PAYMENT_TYPES.map((o) => <option key={o}>{o}</option>)}
                </select>
              </Field>
              <Field label="Payment Mode">
                <MasterSelect value={form.paymentMode} onChange={(v) => setF("paymentMode", v)} options={masters.paymentModes} />
              </Field>
              <Field label="Due Date">
                <div className="sales-input-wrap">
                  <input type="date" className="sales-input" value={form.dueDate} onChange={(e) => setF("dueDate", e.target.value)} />
                  <span className="sales-input__icon"><Icon.Calendar /></span>
                </div>
              </Field>

              <Field label="Remarks" full>
                <input className="sales-input" placeholder="Enter remarks (optional)" value={form.remarks} onChange={(e) => setF("remarks", e.target.value)} />
              </Field>
            </div>
          </section>

          {/* 🆕 ADD ITEMS — BALE-BASED */}
          <section className="sales-card">
            <div className="sales-card__head">
              <h2 className="sales-card__title">Add Items (by Bale No)</h2>
              <button
                className="sales-btn sales-btn--primary sales-btn--sm"
                onClick={handleAddItem}
                disabled={!baleData}
              >
                {editingId ? <Icon.Check /> : <Icon.Plus />}
                <span>{editingId ? "Update Item" : "Add Item"}</span>
              </button>
            </div>

            {/* 🆕 BALE LOOKUP BAR — top, highlighted */}
            <div className="sales-bale-bar">
              <div className="sales-bale-bar__main">
                <div className="sales-bale-bar__icon"><Icon.Tag /></div>
                <div className="sales-bale-bar__input-wrap">
                  <label className="sales-bale-bar__label">
                    Bale No <span className="sales-field__required">*</span>
                  </label>
                  <input
                    className="sales-input sales-bale-input"
                    placeholder="A35, A59, 1224..."
                    value={itemForm.baleNo}
                    onChange={(e) => setIf("baleNo", e.target.value.toUpperCase())}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        lookupBale(itemForm.baleNo);
                      }
                    }}
                    onBlur={() => {
                      if (itemForm.baleNo && (!baleData || baleData.baleNo !== itemForm.baleNo)) {
                        lookupBale(itemForm.baleNo);
                      }
                    }}
                  />
                </div>

                {/* Lookup status */}
                <div className="sales-bale-bar__status">
                  {baleLookup.loading && (
                    <span className="sales-bale-status sales-bale-status--loading">
                      <Icon.Spinner /> Looking up...
                    </span>
                  )}
                  {!baleLookup.loading && baleData && (
                    <span className="sales-bale-status sales-bale-status--success">
                      <Icon.Check /> Found: <strong>{baleData.fabric?.name}</strong> · {baleData.availablePcs} PCS available
                    </span>
                  )}
                  {!baleLookup.loading && baleLookup.error && (
                    <span className="sales-bale-status sales-bale-status--error">
                      <Icon.X /> {baleLookup.error}
                    </span>
                  )}
                  {!baleLookup.loading && !baleData && !baleLookup.error && !itemForm.baleNo && (
                    <span className="sales-bale-status sales-bale-status--hint">
                      Type bale no and press Enter or Tab to lookup
                    </span>
                  )}
                </div>

                {(baleData || itemForm.baleNo) && (
                  <button className="sales-bale-clear" onClick={handleClearBale} title="Clear">
                    <Icon.X />
                  </button>
                )}
              </div>
            </div>

            {/* Auto-filled fields (Row 1 — read-only) */}
            <div className="sales-grid sales-grid--4">
              <Field label="Fabric / Item">
                <MasterSelect value={itemForm.fabric} options={masters.fabrics} disabled />
              </Field>
              <Field label="Quality">
                <MasterSelect value={itemForm.fabricQuality} options={masters.qualities} disabled />
              </Field>
              <Field label="Color">
                <MasterSelect value={itemForm.color} options={masters.colors} disabled />
              </Field>
              <Field label="Available PCS">
                <input
                  className={`sales-input ${availablePcs <= 0 ? "sales-input--zero" : "sales-input--readonly"}`}
                  readOnly
                  value={availablePcs}
                />
              </Field>
            </div>

            {/* User-editable fields (Row 2) */}
            {/* 🆕 PIECES TABLE — editable per piece */}
            {baleData && salePcsRows.length > 0 && (
              <div className="sales-pcs-section">
                <div className="sales-pcs-header">
                  <div>
                    <h3 className="sales-pcs-title">
                      Pieces in Bale ({salePcsRows.length})
                    </h3>
                    <div className="sales-pcs-hint">
                      <Icon.Info />
                      <span>Uncheck pieces to skip · Edit meter for partial sale</span>
                    </div>
                  </div>
                  <div className="sales-pcs-actions">
                    <button className="sales-btn sales-btn--ghost sales-btn--sm" onClick={() => toggleAllPcs(true)}>
                      Select All
                    </button>
                    <button className="sales-btn sales-btn--ghost sales-btn--sm" onClick={() => toggleAllPcs(false)}>
                      Clear All
                    </button>
                  </div>
                </div>

                <div className="sales-pcs-table-wrap">
                  <table className="sales-pcs-table">
                    <thead>
                      <tr>
                        <th className="sales-th--center" style={{ width: 50 }}>Sell</th>
                        <th className="sales-th--center" style={{ width: 80 }}>PCS No</th>
                        <th className="sales-th--center">Meter</th>
                        <th className="sales-th--center">Color</th>
                      </tr>
                    </thead>
                    <tbody>
                      {salePcsRows.map((row) => (
                        <tr
                          key={row.id}
                          className={`sales-pcs-tr ${row.selected ? "sales-pcs-tr--active" : "sales-pcs-tr--skip"}`}
                        >
                          <td className="sales-td--center">
                            <input
                              type="checkbox"
                              className="sales-pcs-check"
                              checked={row.selected}
                              onChange={() => togglePcsRow(row.id)}
                            />
                          </td>
                          <td className="sales-td--center sales-td--strong">{row.pcsNo}</td>
                          <td className="sales-td--center">
                            <input
                              type="number"
                              step="0.01"
                              className="sales-input sales-pcs-input"
                              value={row.meter}
                              onChange={(e) => updatePcsRow(row.id, "meter", e.target.value)}
                              disabled={!row.selected}
                            />
                          </td>
                          <td className="sales-td--center">
                            <select
                              className="sales-input sales-pcs-input"
                              value={row.color}
                              onChange={(e) => updatePcsRow(row.id, "color", e.target.value)}
                              disabled={!row.selected}
                            >
                              <option value="">—</option>
                              {masters.colors.map((c) => (
                                <option key={c._id} value={c._id}>{c.name}</option>
                              ))}
                            </select>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="sales-pcs-total">
                        <td colSpan="2" className="sales-td--strong sales-td--center">
                          SELECTED
                        </td>
                        <td className="sales-td--center sales-td--strong">
                          {selectedPcsCount} pcs · {fmt(selectedTotalMeter)}m
                        </td>
                        <td></td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>
            )}

            {/* Rate / Discount / Amount */}
            <div className="sales-grid sales-grid--4">
              <Field label="Rate (Per Mtr)" required>
                <input
                  className="sales-input"
                  type="number"
                  step="0.01"
                  value={itemForm.rate}
                  onChange={(e) => setIf("rate", e.target.value)}
                  placeholder="0.00"
                  disabled={!baleData}
                />
              </Field>
              <Field label="Discount (Per Mtr)">
                <input
                  className="sales-input"
                  type="number"
                  step="0.01"
                  value={itemForm.discount}
                  onChange={(e) => setIf("discount", e.target.value)}
                  placeholder="0.00"
                  disabled={!baleData}
                />
              </Field>
              <Field label="Selected">
                <input
                  className="sales-input sales-input--readonly"
                  readOnly
                  value={`${selectedPcsCount} pcs · ${fmt(selectedTotalMeter)}m`}
                />
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
                    <th>Bale No</th>
                    <th>Fabric / Item</th>
                    <th>Quality</th>
                    <th>Color</th>
                    <th className="sales-th--right">PCS</th>
                    <th className="sales-th--right">Meter (Per PCS)</th>
                    <th className="sales-th--right">Total Meter</th>
                    <th className="sales-th--right">Rate</th>
                    <th className="sales-th--right">Discount</th>
                    <th className="sales-th--right">Amount</th>
                    <th className="sales-th--center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 ? (
                    <tr><td colSpan="12" className="sales-td--empty">No items added. Lookup bale no above and add.</td></tr>
                  ) : (
                    items.map((it, idx) => (
                      <tr key={it.id} className={`sales-tr ${editingId === it.id ? "sales-tr--editing" : ""}`}>
                        <td>{idx + 1}</td>
                        <td><span className="sales-bale-chip">{it.baleNo || "-"}</span></td>
                        <td className="sales-td--strong">{nameOf(masters.fabrics, it.fabric)}</td>
                        <td>{nameOf(masters.qualities, it.fabricQuality)}</td>
                        <td>{nameOf(masters.colors, it.color)}</td>
                        <td className="sales-td--right">{it.pcs}</td>
                        <td className="sales-td--right">{fmt(it.meterPerPcs)}</td>
                        <td className="sales-td--right">{fmt(it.totalMeter)}</td>
                        <td className="sales-td--right">{fmt(it.rate)}</td>
                        <td className="sales-td--right">{fmt(it.totalMeter * it.discount)}</td>
                        <td className="sales-td--right sales-td--strong">{fmt(it.amount)}</td>
                        <td className="sales-td--center">
                          <div className="sales-actions">
                            <button className="sales-icon-btn sales-icon-btn--edit" title="Edit" onClick={() => handleEditItem(it)}><Icon.Edit /></button>
                            <button className="sales-icon-btn sales-icon-btn--delete" title="Delete" onClick={() => handleDeleteItem(it.id)}><Icon.Trash /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {items.length > 0 && (
                  <tfoot>
                    <tr className="sales-total-row">
                      <td colSpan="5" className="sales-td--strong sales-td--center">Total</td>
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
            <span><strong>Flow:</strong> Bale no enter karo → Lookup → fabric/quality/color auto-fill → PCS to sell daalo → Add → Save. Inventory automatically bale-wise update hoga.</span>
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

          {!editId && !form.customer && items.length === 0 && recentSales.length > 0 && (
            <section className="sales-card sales-recent-card">
              <div className="sales-recent-header">
                <div>
                  <h2 className="sales-card__title" style={{ margin: 0 }}>
                    Recent Sales <span className="sales-recent-count">
                      ({searchQuery ? `${displayedSales.length} found` : `${totalSales} total`})
                    </span>
                  </h2>
                  <div className="sales-recent-hint">
                    <Icon.Info />
                    <span>Customer select karte hi yeh table hide ho jayega · Search by Invoice, Customer, Bale</span>
                  </div>
                </div>
                <div className="sales-recent-actions">
                  <div className="sales-search-wrap">
                    <input
                      type="text"
                      className="sales-search-input"
                      placeholder="Search Invoice, Customer, Bale..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <button
                        className="sales-search-clear"
                        onClick={() => setSearchQuery("")}
                        title="Clear search"
                      >
                        <Icon.X />
                      </button>
                    )}
                  </div>
                  <button
                    className="sales-btn sales-btn--ghost sales-btn--sm"
                    onClick={() => navigate("/dashboard/reports/sales-report")}
                  >
                    <span>View All</span>
                  </button>
                </div>
              </div>

              <div className="sales-table-wrap">
                <table className="sales-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Invoice No</th>
                      <th>Customer</th>
                      <th>Items</th>
                      <th className="sales-th--right">Total PCS</th>
                      <th className="sales-th--right">Total Meter</th>
                      <th className="sales-th--right">Net Amount</th>
                      <th className="sales-th--center">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {displayedSales.length === 0 ? (
                      <tr>
                        <td colSpan="8" className="sales-td--empty">
                          {searchQuery ? `🔍 "${searchQuery}" — koi match nahi mila` : "Koi sales nahi"}
                        </td>
                      </tr>
                    ) : (
                      displayedSales.map((s) => {
                        const totalPcs = (s.items || []).reduce((sum, it) => sum + (it.pcs || 0), 0);
                        const totalMeter = (s.items || []).reduce((sum, it) => sum + (it.totalMeter || 0), 0);
                        const baleList = (s.items || []).map((it) => it.baleNo).filter(Boolean).join(", ");
                        const status = s.paymentStatus || (s.balanceDue > 0 ? "Pending" : "Paid");
                        return (
                          <tr
                            key={s._id}
                            className="sales-tr sales-tr--clickable"
                            onClick={() => navigate(`/dashboard/sales/${s._id}`)}
                            title="Click to edit"
                          >
                            <td>{s.saleDate ? new Date(s.saleDate).toLocaleDateString("en-GB") : "—"}</td>
                            <td>
                              <span className="sales-recent-invoice">{s.invoiceNo || "—"}</span>
                            </td>
                            <td className="sales-td--strong">{s.customer?.name || "—"}</td>
                            <td>
                              <span style={{ fontSize: 11, color: "#64748b" }}>
                                {baleList || "—"}
                              </span>
                            </td>
                            <td className="sales-td--right">{totalPcs}</td>
                            <td className="sales-td--right">{fmt(totalMeter)}</td>
                            <td className="sales-td--right sales-td--strong">
                              {fmt(s.netAmount || 0)}
                            </td>
                            <td className="sales-td--center">
                              <span className={`sales-status-badge sales-status-badge--${status.toLowerCase()}`}>
                                {status}
                              </span>
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
          color: var(--sl-text); font-size: 14px; line-height: 1.4;
        }
        .sales-page svg { width: 16px; height: 16px; display: block; }

        .sales-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .sales-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .sales-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--sl-muted); font-size: 13px; }
        .sales-breadcrumb__sep { color: #cbd5e1; }
        .sales-breadcrumb__current { color: var(--sl-primary); font-weight: 500; }
        .sales-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .sales-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .sales-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .sales-btn--ghost { background: #fff; border-color: var(--sl-border); color: var(--sl-text); }
        .sales-btn--ghost:hover { background: #f8fafc; }
        .sales-btn--primary { background: var(--sl-primary); color: #fff; border-color: var(--sl-primary); }
        .sales-btn--primary:hover:not(:disabled) { background: var(--sl-primary-hover); }
        .sales-btn--sm { padding: 7px 12px; font-size: 13px; }
        .sales-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 30px; height: 30px; border-radius: 6px;
          display: inline-flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .sales-icon-btn svg { width: 14px; height: 14px; }
        .sales-icon-btn--edit { background: #dbeafe; color: var(--sl-primary); }
        .sales-icon-btn--edit:hover { background: #bfdbfe; }
        .sales-icon-btn--delete { background: #fee2e2; color: var(--sl-danger); }
        .sales-icon-btn--delete:hover { background: #fecaca; }

        .sales-content {
          display: grid; grid-template-columns: 1fr 320px;
          gap: 20px; align-items: flex-start;
        }
        .sales-main { display: flex; flex-direction: column; gap: 18px; min-width: 0; }
        .sales-aside { display: flex; flex-direction: column; gap: 18px; }

        .sales-card {
          background: var(--sl-card); border: 1px solid var(--sl-border);
          border-radius: 12px; padding: 20px;
          box-shadow: var(--sl-shadow);
        }
        .sales-card__title { font-size: 16px; font-weight: 600; margin: 0 0 16px 0; }
        .sales-card__head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 16px; gap: 12px; flex-wrap: wrap;
        }
        .sales-card__head .sales-card__title { margin: 0; }

        .sales-grid { display: grid; gap: 14px 18px; }
        .sales-grid--3 { grid-template-columns: repeat(3, minmax(0, 1fr)); }
        .sales-grid--4 { grid-template-columns: repeat(4, minmax(0, 1fr)); margin-bottom: 14px; }
        .sales-grid--5 { grid-template-columns: repeat(5, minmax(0, 1fr)); }

        .sales-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .sales-field--full { grid-column: 1 / -1; }
        .sales-field__label { font-size: 13px; font-weight: 500; color: var(--sl-label); }
        .sales-field__required { color: var(--sl-danger); margin-left: 2px; }

        .sales-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--sl-border);
          border-radius: 8px; background: #fff;
          font-size: 14px; color: var(--sl-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .sales-input:focus {
          outline: none; border-color: var(--sl-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .sales-input:disabled { background: #f8fafc; color: var(--sl-muted); cursor: not-allowed; }
        .sales-input::placeholder { color: #94a3b8; }
        .sales-input--readonly { background: #f8fafc; color: var(--sl-text); cursor: default; font-weight: 600; }
        .sales-input--zero { background: #fee2e2; color: #b91c1c; cursor: not-allowed; font-weight: 600; }
        .sales-input--computed {
          background: #eff6ff; color: var(--sl-primary);
          font-weight: 600; border-color: #bfdbfe;
        }
        .sales-input-wrap { position: relative; }
        .sales-input-wrap .sales-input { padding-right: 36px; }
        .sales-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--sl-muted); pointer-events: none;
        }

        /* 🆕 BALE LOOKUP BAR — hero section */
        .sales-bale-bar {
          background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
          border: 1px solid #bfdbfe;
          border-radius: 10px;
          padding: 16px;
          margin-bottom: 18px;
        }
        .sales-bale-bar__main {
          display: flex; align-items: center; gap: 14px; flex-wrap: wrap;
        }
        .sales-bale-bar__icon {
          width: 44px; height: 44px; flex-shrink: 0;
          background: var(--sl-primary); color: #fff;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .sales-bale-bar__icon svg { width: 20px; height: 20px; }
        .sales-bale-bar__input-wrap {
          flex: 0 0 240px; display: flex; flex-direction: column; gap: 4px;
        }
        .sales-bale-bar__label {
          font-size: 12px; font-weight: 600; color: var(--sl-label);
        }
        .sales-bale-input {
          font-size: 16px !important;
          font-weight: 700 !important;
          text-transform: uppercase;
          letter-spacing: 1px;
          padding: 10px 14px !important;
          border: 2px solid var(--sl-primary) !important;
          background: #fff !important;
        }
        .sales-bale-bar__status {
          flex: 1; min-width: 200px;
        }
        .sales-bale-status {
          display: inline-flex; align-items: center; gap: 6px;
          font-size: 13px; padding: 6px 12px; border-radius: 6px;
        }
        .sales-bale-status svg { width: 14px; height: 14px; }
        .sales-bale-status--loading { background: #f1f5f9; color: var(--sl-muted); }
        .sales-bale-status--success { background: #d1fae5; color: #047857; }
        .sales-bale-status--error   { background: #fee2e2; color: #b91c1c; }
        .sales-bale-status--hint    { color: var(--sl-muted); font-style: italic; }
        .sales-bale-clear {
          background: #fff; border: 1px solid var(--sl-border);
          width: 36px; height: 36px; border-radius: 8px;
          cursor: pointer; color: var(--sl-muted);
          display: flex; align-items: center; justify-content: center;
          transition: all 0.15s;
        }
        .sales-bale-clear:hover { background: #fee2e2; color: var(--sl-danger); border-color: #fecaca; }

        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .sales-spinner { animation: spin 1s linear infinite; }
        /* 🆕 PIECES TABLE */
.sales-pcs-section {
  margin-bottom: 18px;
  padding: 14px;
  background: #f0fdf4;
  border: 1px solid #a7f3d0;
  border-radius: 10px;
}
.sales-pcs-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 12px;
  flex-wrap: wrap;
}
.sales-pcs-title {
  font-size: 14px;
  font-weight: 600;
  color: #065f46;
  margin: 0;
}
.sales-pcs-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--sl-muted);
  margin-top: 4px;
}
.sales-pcs-hint svg { width: 12px; height: 12px; }
.sales-pcs-actions { display: flex; gap: 6px; }

.sales-pcs-table-wrap {
  background: #fff;
  border: 1px solid #a7f3d0;
  border-radius: 8px;
  overflow: hidden;
  max-height: 320px;
  overflow-y: auto;
}
.sales-pcs-table { width: 100%; border-collapse: collapse; }
.sales-pcs-table th {
  background: #d1fae5;
  padding: 8px 10px;
  font-size: 11px;
  font-weight: 700;
  color: #065f46;
  letter-spacing: 0.4px;
  text-transform: uppercase;
  border-bottom: 1px solid #a7f3d0;
  white-space: nowrap;
}
.sales-pcs-table td {
  padding: 8px 10px;
  font-size: 13px;
  border-bottom: 1px solid #ecfdf5;
}
.sales-pcs-tr--skip {
  background: #f8fafc;
  opacity: 0.55;
}
.sales-pcs-tr--active:hover {
  background: #f0fdf4;
}
.sales-pcs-check {
  width: 16px; height: 16px;
  accent-color: #10b981;
  cursor: pointer;
}
.sales-pcs-input {
  padding: 5px 8px !important;
  font-size: 13px !important;
  max-width: 130px;
  margin: 0 auto;
  text-align: center;
}
.sales-pcs-total td {
  background: #d1fae5;
  border-top: 2px solid #10b981;
  border-bottom: none;
  padding: 10px;
  font-weight: 700;
  color: #065f46;
}

/* 🆕 RECENT SALES CARD */
.sales-recent-card {
  border-left: 4px solid #0891b2;
  background: linear-gradient(135deg, #f0fdfa 0%, #ecfeff 100%);
}
.sales-recent-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
  margin-bottom: 14px;
}
.sales-recent-count {
  color: var(--sl-muted);
  font-weight: 500;
  font-size: 14px;
  margin-left: 6px;
}
.sales-recent-hint {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--sl-primary);
  margin-top: 4px;
}
.sales-recent-hint svg { width: 12px; height: 12px; }
.sales-recent-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}
.sales-tr--clickable {
  cursor: pointer;
  transition: background 0.15s;
}
.sales-tr--clickable:hover {
  background: #ecfeff !important;
}
.sales-recent-invoice {
  font-family: ui-monospace, SFMono-Regular, monospace;
  color: var(--sl-primary);
  font-weight: 700;
  font-size: 12px;
}

/* Search box */
.sales-search-wrap {
  position: relative;
  display: flex;
  align-items: center;
}
.sales-search-input {
  padding: 8px 32px 8px 12px;
  border: 1px solid var(--sl-border);
  border-radius: 8px;
  background: #fff;
  font-size: 13px;
  font-family: inherit;
  width: 240px;
  transition: all 0.15s;
}
.sales-search-input:focus {
  outline: none;
  border-color: var(--sl-primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
  width: 280px;
}
.sales-search-input::placeholder { color: #94a3b8; }
.sales-search-clear {
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
  color: var(--sl-text);
}
.sales-search-clear:hover { background: #cbd5e1; }
.sales-search-clear svg { width: 11px; height: 11px; }

/* Status badge */
.sales-status-badge {
  display: inline-block;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.4px;
}
.sales-status-badge--paid     { background: #d1fae5; color: #065f46; }
.sales-status-badge--partial  { background: #fef3c7; color: #92400e; }
.sales-status-badge--pending  { background: #fee2e2; color: #991b1b; }
.sales-status-badge--advance  { background: #dbeafe; color: #1e40af; }
        /* Bale chip in table */
        .sales-bale-chip {
          display: inline-block;
          padding: 4px 10px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 6px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 12px;
          font-weight: 700;
          letter-spacing: 0.5px;
        }

        .sales-table-wrap { overflow-x: auto; border: 1px solid var(--sl-border); border-radius: 8px; }
        .sales-table { width: 100%; border-collapse: collapse; min-width: 1200px; }
        .sales-table th {
          background: #f8fafc; padding: 11px 14px;
          font-size: 11px; font-weight: 600;
          color: var(--sl-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--sl-border);
          white-space: nowrap;
        }
        .sales-th--right { text-align: right; }
        .sales-th--center { text-align: center; }
        .sales-table td {
          padding: 13px 14px; font-size: 13px;
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

        .sales-total-row td {
          background: #f8fafc; font-size: 13px;
          padding: 14px;
          border-top: 2px solid var(--sl-border);
          border-bottom: none;
        }

        .sales-pagination__info { margin-top: 12px; font-size: 13px; color: var(--sl-muted); }

        .sales-note {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 14px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #1e40af;
          margin-bottom: 20px;
        }
        .sales-note svg { color: var(--sl-primary); flex-shrink: 0; }

        .sales-summary-grid {
          display: grid; grid-template-columns: repeat(2, 1fr);
          gap: 12px; margin-bottom: 14px;
        }
        .sales-summary-box {
          background: #f8fafc; border: 1px solid var(--sl-border);
          border-radius: 10px; padding: 14px;
        }
        .sales-summary-box__label { font-size: 12px; color: var(--sl-muted); margin-bottom: 6px; }
        .sales-summary-box__value { font-size: 20px; font-weight: 700; color: var(--sl-text); }

        .sales-highlight { border-radius: 10px; padding: 16px; margin-top: 12px; }
        .sales-highlight:first-of-type { margin-top: 0; }
        .sales-highlight--blue { background: #eff6ff; border: 1px solid #bfdbfe; }
        .sales-highlight--blue .sales-highlight__value { color: var(--sl-primary); }
        .sales-highlight--yellow { background: #fefce8; border: 1px solid #fde68a; }
        .sales-highlight--yellow .sales-highlight__value { color: #b45309; }
        .sales-highlight--green { background: #ecfdf5; border: 1px solid #a7f3d0; }
        .sales-highlight--green .sales-highlight__value { color: var(--sl-success); }
        .sales-highlight__label { font-size: 13px; color: var(--sl-label); margin-bottom: 6px; font-weight: 500; }
        .sales-highlight__value { font-size: 22px; font-weight: 700; }

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
          .sales-bale-bar__input-wrap { flex: 1 1 100%; }
        }
        @media (max-width: 600px) {
          .sales-page { padding: 16px; }
          .sales-page__title { font-size: 20px; }
          .sales-grid--3, .sales-grid--4, .sales-grid--5 { grid-template-columns: 1fr; }
          .sales-summary-grid { grid-template-columns: 1fr 1fr; }
          .sales-page__actions { width: 100%; }
          .sales-page__actions .sales-btn { flex: 1; justify-content: center; }
        }
      `}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
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

function MasterSelect({ value, onChange, options = [], disabled = false }) {
  return (
    <select
      className="sales-input"
      value={value || ""}
      onChange={(e) => onChange?.(e.target.value)}
      disabled={disabled}
    >
      <option value="">Select...</option>
      {options.map((opt) => (
        <option key={opt._id} value={opt._id}>{opt.name}</option>
      ))}
    </select>
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
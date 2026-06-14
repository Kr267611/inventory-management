import React, { useState, useMemo, useEffect } from "react";
import { paymentApi } from "../../Api/paymentApi";
import { salesApi } from "../../Api/sales";
import { fetchAllMasters } from "../../Api/masterApi";
import { isAdmin } from "../../utils/auth";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  Plus: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Wallet: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" /><path d="M20 12v0a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2v-4h-2z" /></svg>,
  Bag: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  Alert: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
};

const STATUSES = ["All Status", "Partial", "Full", "Advance"];
const DONUT_COLORS = ["#3b82f6", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4"];

const fmtINR = (n) => "₹ " + Number(n || 0).toLocaleString("en-IN");
const fmtINRCompact = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

const EMPTY_PAYMENT_FORM = {
  customer: "",
  // 🔧 sale removed — ab multi-invoice allocations use karenge
  paymentDate: new Date().toISOString().slice(0, 10),
  paymentMode: "",
  referenceNo: "",
  amountReceived: "",
  remarks: "",
  company: "",
  receivedBy: "",
};

const EMPTY_FILTERS = {
  fromDate: "", toDate: "",
  customer: "", company: "", mode: "",
  invoiceSearch: "", status: "All Status", refSearch: "",
};

/* ================================================================
   MAIN
   ================================================================ */
export default function Payment() {
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [stats, setStats] = useState({ totalReceived: 0, monthCollection: 0, totalInvoices: 0, totalOutstanding: 0 });
  const [masters, setMasters] = useState({ customers: [], companies: [], paymentModes: [], salesPersons: [] });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAdd, setShowAdd] = useState(false);

  const [form, setForm] = useState(EMPTY_PAYMENT_FORM);
  // 🆕 Multi-invoice allocations: { saleId: "amount" }
  const [allocations, setAllocations] = useState({});

  // 👇 TWO filter states — user types in `filters`, table reads from `appliedFilters`
  const [filters, setFilters] = useState(EMPTY_FILTERS);
  const [appliedFilters, setAppliedFilters] = useState(EMPTY_FILTERS);

  const setF = (k, v) => setFilters({ ...filters, [k]: v });
  const setFm = (k, v) => setForm({ ...form, [k]: v });

  /* ──────── LOAD ALL DATA ──────── */
  const loadData = async () => {
    try {
      setLoading(true);
      const [paymentsData, statsData, salesData, mastersData] = await Promise.all([
        paymentApi.getAll(),
        paymentApi.getStats(),
        salesApi.getAll(),
        fetchAllMasters(),
      ]);
      setPayments(paymentsData);
      setStats(statsData);
      setSales(salesData);
      setMasters({
        customers:    mastersData.customers || [],
        companies:    mastersData.companies || [],
        paymentModes: mastersData.paymentModes || [],
        salesPersons: mastersData.salesPersons || [],
      });
    } catch (err) {
      alert("Load failed: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ──────── CUSTOMER'S UNPAID SALES (for modal dropdown) ──────── */
  const customerSales = useMemo(() => {
    if (!form.customer) return [];
    return sales.filter((s) => {
      const sCustomerId = s.customer?._id || s.customer;
      return sCustomerId === form.customer && s.paymentStatus !== "Paid";
    });
  }, [sales, form.customer]);

  /* ──────── 🆕 TOTAL APPLIED across all selected invoices ──────── */
  const totalApplied = useMemo(() => {
    return Object.values(allocations).reduce((s, a) => s + (parseFloat(a) || 0), 0);
  }, [allocations]);

  /* ──────── 🆕 ADVANCE AMOUNT (excess over applied) ──────── */
  const advanceAmount = useMemo(() => {
    const recv = parseFloat(form.amountReceived) || 0;
    return Math.max(recv - totalApplied, 0);
  }, [form.amountReceived, totalApplied]);

  /* ──────── 🆕 ALLOCATION HANDLERS ──────── */
  const toggleAllocation = (saleId, checked, balanceDue) => {
    if (checked) {
      // Auto-fill with min(balanceDue, remaining amount)
      const recv = parseFloat(form.amountReceived) || 0;
      const remaining = Math.max(recv - totalApplied, 0);
      const defaultAmt = remaining > 0 ? Math.min(balanceDue, remaining) : balanceDue;
      setAllocations((prev) => ({ ...prev, [saleId]: defaultAmt.toFixed(2) }));
    } else {
      setAllocations((prev) => {
        const next = { ...prev };
        delete next[saleId];
        return next;
      });
    }
  };

  const setAllocAmount = (saleId, value) => {
    setAllocations((prev) => ({ ...prev, [saleId]: value }));
  };

  // 🆕 Auto-allocate FIFO (oldest invoices first)
  const autoAllocate = () => {
    const recv = parseFloat(form.amountReceived) || 0;
    if (recv <= 0) return alert("Pehle Amount Received daalo");

    let remaining = recv;
    const newAllocs = {};
    // Sort by oldest first
    const sorted = [...customerSales].sort(
      (a, b) => new Date(a.saleDate) - new Date(b.saleDate)
    );
    for (const s of sorted) {
      if (remaining <= 0) break;
      const apply = Math.min(remaining, s.balanceDue || 0);
      if (apply > 0) {
        newAllocs[s._id] = apply.toFixed(2);
        remaining -= apply;
      }
    }
    setAllocations(newAllocs);
  };

  /* ──────── FILTERED PAYMENTS (uses appliedFilters, not filters) ──────── */
  const filteredPayments = useMemo(() => {
    let list = [...payments];
    if (appliedFilters.customer) list = list.filter((p) => (p.customer?._id || p.customer) === appliedFilters.customer);
    if (appliedFilters.company)  list = list.filter((p) => (p.company?._id  || p.company)  === appliedFilters.company);
    if (appliedFilters.mode)     list = list.filter((p) => (p.paymentMode?._id || p.paymentMode) === appliedFilters.mode);
    if (appliedFilters.status && appliedFilters.status !== "All Status") list = list.filter((p) => p.status === appliedFilters.status);
    if (appliedFilters.invoiceSearch) {
      const q = appliedFilters.invoiceSearch.toLowerCase();
      list = list.filter((p) => (p.sale?.invoiceNo || "").toLowerCase().includes(q));
    }
    if (appliedFilters.refSearch) {
      const q = appliedFilters.refSearch.toLowerCase();
      list = list.filter((p) => (p.referenceNo || "").toLowerCase().includes(q));
    }
    if (appliedFilters.fromDate) list = list.filter((p) => new Date(p.paymentDate) >= new Date(appliedFilters.fromDate));
    if (appliedFilters.toDate)   list = list.filter((p) => new Date(p.paymentDate) <= new Date(appliedFilters.toDate));
    return list;
  }, [payments, appliedFilters]);

  // Active filter indicator
  const hasActiveFilters = useMemo(() => {
    return JSON.stringify(appliedFilters) !== JSON.stringify(EMPTY_FILTERS);
  }, [appliedFilters]);

  /* ──────── PAYMENT MODE SUMMARY (donut chart) ──────── */
  const modeSummary = useMemo(() => {
    const totals = {};
    let grandTotal = 0;
    payments.forEach((p) => {
      const mode = p.paymentMode?.name || "Other";
      totals[mode] = (totals[mode] || 0) + (p.amountReceived || 0);
      grandTotal += p.amountReceived || 0;
    });
    if (grandTotal === 0) return { items: [], total: 0 };
    const items = Object.entries(totals)
      .map(([name, amount], idx) => ({
        name, amount,
        percent: +((amount / grandTotal) * 100).toFixed(1),
        color: DONUT_COLORS[idx % DONUT_COLORS.length],
      }))
      .sort((a, b) => b.amount - a.amount);
    return { items, total: grandTotal };
  }, [payments]);

  /* ──────── TOP CUSTOMERS (by outstanding) ──────── */
  const topCustomers = useMemo(() => {
    const totals = {};
    sales.forEach((s) => {
      if ((s.balanceDue || 0) > 0) {
        const name = s.customer?.name || "Unknown";
        totals[name] = (totals[name] || 0) + s.balanceDue;
      }
    });
    return Object.entries(totals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [sales]);

  /* ──────── RECENT OVERDUE ──────── */
  const recentOverdue = useMemo(() => {
    const today = new Date();
    return sales
      .filter((s) => (s.balanceDue || 0) > 0 && s.dueDate && new Date(s.dueDate) < today)
      .map((s) => ({
        invoice: s.invoiceNo,
        customer: s.customer?.name || "-",
        amount: s.balanceDue,
        days: Math.floor((today - new Date(s.dueDate)) / (1000 * 60 * 60 * 24)),
      }))
      .sort((a, b) => b.days - a.days)
      .slice(0, 5);
  }, [sales]);

  /* ──────── OVERVIEW ──────── */
  const overview = useMemo(() => ([
    { label: "Total Invoices",    value: stats.totalInvoices,    color: "default" },
    { label: "Total Received",    value: stats.totalReceived,    color: "green"   },
    { label: "Total Outstanding", value: stats.totalOutstanding, color: "orange"  },
    { label: "Overdue Amount",    value: recentOverdue.reduce((s, o) => s + o.amount, 0), color: "red" },
  ]), [stats, recentOverdue]);

  /* ──────── STAT CARDS ──────── */
  const STAT_CARDS = [
    { label: "Total Collection (This Month)", value: stats.monthCollection,   icon: "wallet", color: "blue"   },
    { label: "Total Received",                value: stats.totalReceived,     icon: "bag",    color: "green"  },
    { label: "Total Outstanding",             value: stats.totalOutstanding,  icon: "clock",  color: "orange" },
    { label: "Overdue Amount",                value: overview[3].value,       icon: "alert",  color: "purple" },
  ];

  /* ──────── FILTER HANDLERS ──────── */
  const applyFilters = () => setAppliedFilters(filters);

  const handleReset = () => {
    setFilters(EMPTY_FILTERS);
    setAppliedFilters(EMPTY_FILTERS);
  };

  /* ──────── ADD/SAVE HANDLERS ──────── */
  const openAdd = () => {
    setForm({
      ...EMPTY_PAYMENT_FORM,
      company: masters.companies[0]?._id || "",
    });
    setAllocations({});                          // 🆕 reset
    setShowAdd(true);
  };

  const handleCustomerChange = (v) => {
    setForm({ ...form, customer: v });
    setAllocations({});                          // 🆕 reset allocations on customer change
  };

  const handleSave = async () => {
    // Basic validation
    if (!form.customer)    return alert("Customer select karo");
    if (!form.company)     return alert("Company select karo");
    if (!form.paymentMode) return alert("Payment Mode select karo");

    const recv = parseFloat(form.amountReceived) || 0;
    if (recv <= 0) return alert("Amount Received daalo (> 0)");

    // Valid allocations (amount > 0)
    const validAllocs = Object.entries(allocations)
      .map(([saleId, amt]) => ({ saleId, amount: parseFloat(amt) || 0 }))
      .filter((a) => a.amount > 0);

    // Per-invoice over-allocation check
    for (const a of validAllocs) {
      const sale = sales.find((s) => s._id === a.saleId);
      if (sale && a.amount > sale.balanceDue + 0.01) {
        return alert(
          `Invoice ${sale.invoiceNo}: applied ₹${a.amount} > due ₹${sale.balanceDue.toFixed(2)}`
        );
      }
    }

    // Total applied check
    if (totalApplied > recv + 0.01) {
      return alert(
        `Total Applied (₹${totalApplied.toFixed(2)}) Amount Received (₹${recv.toFixed(2)}) se zyaada hai`
      );
    }

    // Must have either invoice allocation OR pure advance
    if (validAllocs.length === 0 && advanceAmount === 0) {
      return alert("Kam se kam ek invoice select karo ya advance amount daalo");
    }

    try {
      setSaving(true);
      const errors = [];
      let savedCount = 0;

      // 1️⃣ Per-invoice payments
      for (const a of validAllocs) {
        try {
          const payload = {
            paymentDate: form.paymentDate,
            customer: form.customer,
            sale: a.saleId,
            company: form.company,
            paymentMode: form.paymentMode,
            amountReceived: a.amount,
          };
          if (form.receivedBy)  payload.receivedBy = form.receivedBy;
          if (form.referenceNo) payload.referenceNo = form.referenceNo;
          if (form.remarks)     payload.remarks = form.remarks;

          await paymentApi.create(payload);
          savedCount++;
        } catch (err) {
          errors.push(`Invoice payment failed: ${err.message}`);
        }
      }

      // 2️⃣ Advance payment (excess amount, no specific invoice)
      if (advanceAmount > 0) {
        try {
          const advPayload = {
            paymentDate: form.paymentDate,
            customer: form.customer,
            company: form.company,
            paymentMode: form.paymentMode,
            amountReceived: advanceAmount,
            isAdvance: true,                                     // 🆕 backend flag
            remarks: (form.remarks ? form.remarks + " — " : "") + "Advance Payment",
          };
          if (form.receivedBy)  advPayload.receivedBy = form.receivedBy;
          if (form.referenceNo) advPayload.referenceNo = form.referenceNo;

          await paymentApi.create(advPayload);
          savedCount++;
        } catch (err) {
          errors.push(`Advance failed: ${err.message} (Backend me sale optional banao + isAdvance handle karo)`);
        }
      }

      if (errors.length > 0) {
        alert(`Saved ${savedCount} payment(s) with errors:\n${errors.join("\n")}`);
      } else {
        alert(
          `${savedCount} payment(s) recorded` +
          (advanceAmount > 0 ? ` (including ₹${advanceAmount.toFixed(2)} advance)` : "")
        );
      }

      setShowAdd(false);
      setAllocations({});
      await loadData();
    } catch (err) {
      alert("Save failed: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (p) => {
    if (!window.confirm(`Payment ${p.paymentId} delete karna hai?\nSale ka status revert ho jaayega.`)) return;
    try {
      await paymentApi.remove(p._id);
      await loadData();
    } catch (err) {
      alert("Delete failed: " + err.message);
    }
  };

  return (
    <div className="payment-page">
      {/* HEADER */}
      <div className="payment-page__header">
        <div>
          <h1 className="payment-page__title">Payment Details</h1>
          <div className="payment-breadcrumb">
            <span>Home</span>
            <span className="payment-breadcrumb__sep">/</span>
            <span className="payment-breadcrumb__current">Payment Details</span>
          </div>
        </div>
        <div className="payment-page__actions">
          <button className="payment-btn payment-btn--primary" onClick={openAdd}>
            <Icon.Plus /><span>Add Payment</span>
          </button>
        </div>
      </div>

      {/* LAYOUT */}
      <div className="payment-layout">
        {/* MAIN */}
        <main className="payment-main">
          {/* Stat cards */}
          <div className="payment-stats">
            {STAT_CARDS.map((s) => (
              <div key={s.label} className="payment-stat">
                <div className={`payment-stat__icon payment-stat__icon--${s.color}`}>
                  {s.icon === "wallet" && <Icon.Wallet />}
                  {s.icon === "bag" && <Icon.Bag />}
                  {s.icon === "clock" && <Icon.Clock />}
                  {s.icon === "alert" && <Icon.Alert />}
                </div>
                <div className="payment-stat__body">
                  <div className="payment-stat__label">{s.label}</div>
                  <div className="payment-stat__value">{fmtINR(s.value)}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Filters card */}
          <div className="payment-card payment-filters">
            <div className="payment-filters__row">
              <Field label="From Date">
                <div className="payment-input-wrap">
                  <input type="date" className="payment-input" value={filters.fromDate} onChange={(e) => setF("fromDate", e.target.value)} />
                  <span className="payment-input__icon"><Icon.Calendar /></span>
                </div>
              </Field>
              <Field label="To Date">
                <div className="payment-input-wrap">
                  <input type="date" className="payment-input" value={filters.toDate} onChange={(e) => setF("toDate", e.target.value)} />
                  <span className="payment-input__icon"><Icon.Calendar /></span>
                </div>
              </Field>
              <Field label="Customer">
                <select className="payment-input" value={filters.customer} onChange={(e) => setF("customer", e.target.value)}>
                  <option value="">All Customers</option>
                  {masters.customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Company">
                <select className="payment-input" value={filters.company} onChange={(e) => setF("company", e.target.value)}>
                  <option value="">All Companies</option>
                  {masters.companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                </select>
              </Field>
              <Field label="Payment Mode">
                <select className="payment-input" value={filters.mode} onChange={(e) => setF("mode", e.target.value)}>
                  <option value="">All Modes</option>
                  {masters.paymentModes.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                </select>
              </Field>
            </div>

            <div className="payment-filters__row">
              <Field label="Invoice / Bill No.">
                <div className="payment-input-wrap">
                  <span className="payment-input__icon payment-input__icon--left"><Icon.Search /></span>
                  <input
                    className="payment-input payment-input--with-left-icon"
                    placeholder="Search Invoice / Bill No."
                    value={filters.invoiceSearch}
                    onChange={(e) => setF("invoiceSearch", e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                  />
                </div>
              </Field>
              <Field label="Payment Status">
                <select className="payment-input" value={filters.status} onChange={(e) => setF("status", e.target.value)}>
                  {STATUSES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </Field>
              <Field label="Reference No.">
                <input
                  className="payment-input"
                  placeholder="Cheque / Ref No."
                  value={filters.refSearch}
                  onChange={(e) => setF("refSearch", e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && applyFilters()}
                />
              </Field>
              <div className="payment-filters__actions">
                <button className="payment-btn payment-btn--primary" onClick={applyFilters}>
                  <Icon.Search /><span>Search</span>
                </button>
                <button className="payment-btn payment-btn--ghost" onClick={handleReset}>
                  <Icon.Refresh /><span>Reset</span>
                </button>
              </div>
            </div>
          </div>

          {/* Payment list table */}
          <div className="payment-card">
            <div className="payment-table-head">
              <h2 className="payment-card__title">
                Payment List
                {hasActiveFilters && <span className="payment-filter-tag">Filtered</span>}
              </h2>
              <span className="payment-muted">Showing {filteredPayments.length} of {payments.length} entries</span>
            </div>

            <div className="payment-table-wrap">
              <table className="payment-table">
                <thead>
                  <tr>
                    <th>Payment ID</th>
                    <th>Payment Date</th>
                    <th>Customer</th>
                    <th>Invoice / Bill No.</th>
                    <th>Payment Mode</th>
                    <th>Reference No.</th>
                    <th className="payment-th--right">Amount Received (₹)</th>
                    <th className="payment-th--right">Outstanding Before (₹)</th>
                    <th className="payment-th--right">Balance (₹)</th>
                    <th>Status</th>
                    <th className="payment-th--center">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={isAdmin() ? 11 : 10} className="payment-td--empty">Loading...</td></tr>
                  ) : filteredPayments.length === 0 ? (
                    <tr><td colSpan="11" className="payment-td--empty">
                      {hasActiveFilters ? "No payments match these filters" : "No payments found"}
                    </td></tr>
                  ) : (
                    filteredPayments.map((p) => (
                      <tr key={p._id} className="payment-tr">
                        <td className="payment-mono">{p.paymentId}</td>
                        <td>{formatDate(p.paymentDate)}</td>
                        <td>{p.customer?.name || "-"}</td>
                        <td className="payment-td--link">{p.sale?.invoiceNo || "-"}</td>
                        <td><span className="payment-mode">{p.paymentMode?.name || "-"}</span></td>
                        <td className="payment-mono payment-muted">{p.referenceNo || "-"}</td>
                        <td className="payment-td--right">{fmtINRCompact(p.amountReceived)}</td>
                        <td className="payment-td--right">{fmtINRCompact(p.outstandingBefore)}</td>
                        <td className={`payment-td--right ${p.outstandingAfter > 0 ? "payment-balance-due" : "payment-balance-zero"}`}>
                          {fmtINRCompact(p.outstandingAfter)}
                        </td>
                        <td>
                          <span className={`payment-badge payment-badge--${p.status?.toLowerCase()}`}>{p.status}</span>
                        </td>
                        <td className="payment-td--center">
                          {isAdmin() ? (
                            <button
                              type="button"
                              className="payment-icon-btn"
                              title="Delete"
                              onClick={() => handleDelete(p)}
                            >
                              <Icon.Trash />
                            </button>
                          ) : (
                            <span className="payment-muted" style={{ fontSize: 12 }}>—</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>

        {/* RIGHT SIDEBAR */}
        <aside className="payment-side">
          {/* Payment Overview */}
          <div className="payment-card">
            <h3 className="payment-card__title">Payment Overview</h3>
            <div className="payment-overview">
              {overview.map((o) => (
                <div key={o.label} className="payment-overview__row">
                  <span className="payment-overview__label">{o.label}</span>
                  <span className={`payment-overview__val payment-overview__val--${o.color}`}>{fmtINR(o.value)}</span>
                </div>
              ))}
            </div>
          </div>
          {/* Payment Mode Summary */}
          <div className="payment-card">
            <h3 className="payment-card__title">Payment Mode Summary</h3>
            {modeSummary.items.length === 0 ? (
              <div className="payment-muted" style={{ textAlign: "center", padding: 20 }}>No payment data yet</div>
            ) : (
              <>
                <DonutChart
                  segments={modeSummary.items}
                  centerTop="Total Received"
                  centerBottom={fmtINR(modeSummary.total)}
                />
                <div className="payment-legend">
                  {modeSummary.items.map((m) => (
                    <div key={m.name} className="payment-legend__row">
                      <span className="payment-legend__dot" style={{ background: m.color }} />
                      <span className="payment-legend__name">{m.name}</span>
                      <span className="payment-legend__pct">{m.percent}%</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Top Customers */}
          <div className="payment-card">
            <h3 className="payment-card__title">Top Customers (Outstanding)</h3>
            {topCustomers.length === 0 ? (
              <div className="payment-muted" style={{ padding: 8 }}>No outstanding dues</div>
            ) : (
              <div className="payment-list">
                {topCustomers.map((c) => (
                  <div key={c.name} className="payment-list__row">
                    <span className="payment-list__name">{c.name}</span>
                    <span className="payment-list__val">{fmtINR(c.amount)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Overdue */}
          <div className="payment-card">
            <h3 className="payment-card__title">Recent Overdue Invoices</h3>
            {recentOverdue.length === 0 ? (
              <div className="payment-muted" style={{ padding: 8 }}>No overdue invoices 🎉</div>
            ) : (
              <div className="payment-overdue">
                {recentOverdue.map((o) => (
                  <div key={o.invoice} className="payment-overdue__row">
                    <div>
                      <div className="payment-overdue__inv">{o.invoice}</div>
                      <div className="payment-overdue__cust">{o.customer}</div>
                    </div>
                    <div className="payment-overdue__right">
                      <div className="payment-overdue__amt">{fmtINR(o.amount)}</div>
                      <div className="payment-overdue__days">{o.days} Days</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ADD PAYMENT MODAL */}
      {showAdd && (
        <div className="payment-modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="payment-modal" onClick={(e) => e.stopPropagation()}>
            <div className="payment-modal__header">
              <h2 className="payment-modal__title">Add Payment</h2>
              <button className="payment-icon-btn payment-icon-btn--close" onClick={() => setShowAdd(false)}><Icon.X /></button>
            </div>

            <div className="payment-modal__body">
              {/* 🆕 Customer & Multi-Invoice Allocation */}
              <section className="payment-modal__section">
                <h3 className="payment-modal__section-title">Customer & Invoices</h3>
                <div className="payment-modal__grid">
                  <Field label="Customer" required>
                    <select className="payment-input" value={form.customer} onChange={(e) => handleCustomerChange(e.target.value)}>
                      <option value="">Select customer</option>
                      {masters.customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Company" required>
                    <select className="payment-input" value={form.company} onChange={(e) => setFm("company", e.target.value)}>
                      <option value="">Select company</option>
                      {masters.companies.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
                    </select>
                  </Field>
                </div>

                {/* 🆕 Multi-invoice allocation list */}
                {form.customer && (
                  <div className="payment-allocs">
                    <div className="payment-allocs__head">
                      <span>
                        Unpaid Invoices ({customerSales.length})
                        {customerSales.length > 0 && (
                          <span className="payment-allocs__hint"> — checkbox se select karo, amount edit karo</span>
                        )}
                      </span>
                      {customerSales.length > 0 && form.amountReceived && (
                        <button type="button" className="payment-allocs__auto" onClick={autoAllocate}>
                          ⚡ Auto-allocate FIFO
                        </button>
                      )}
                    </div>

                    {customerSales.length === 0 ? (
                      <div className="payment-allocs__empty">
                        ✅ All invoices paid! Pure advance payment possible.
                      </div>
                    ) : (
                      <div className="payment-allocs__list">
                        {customerSales.map((s) => {
                          const isChecked = allocations[s._id] !== undefined;
                          const amount = allocations[s._id] || "";
                          return (
                            <div
                              className={`payment-alloc-row ${isChecked ? "payment-alloc-row--active" : ""}`}
                              key={s._id}
                            >
                              <input
                                type="checkbox"
                                className="payment-alloc-check"
                                checked={isChecked}
                                onChange={(e) => toggleAllocation(s._id, e.target.checked, s.balanceDue)}
                              />
                              <div className="payment-alloc-info">
                                <div className="payment-alloc-inv">{s.invoiceNo}</div>
                                <div className="payment-alloc-meta">
                                  <span>Due: <strong>₹{fmtINRCompact(s.balanceDue)}</strong></span>
                                  <span>{formatDate(s.saleDate)}</span>
                                </div>
                              </div>
                              <input
                                type="number"
                                className="payment-alloc-amt"
                                placeholder="0"
                                value={amount}
                                disabled={!isChecked}
                                onChange={(e) => setAllocAmount(s._id, e.target.value)}
                              />
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* Summary */}
                    {(totalApplied > 0 || advanceAmount > 0 || form.amountReceived) && (
                      <div className="payment-allocs__summary">
                        <div className="payment-alloc-sum-row">
                          <span>Total Applied (Invoices):</span>
                          <strong>{fmtINR(totalApplied)}</strong>
                        </div>
                        <div className="payment-alloc-sum-row">
                          <span>Amount Received:</span>
                          <strong>{fmtINR(parseFloat(form.amountReceived) || 0)}</strong>
                        </div>
                        {advanceAmount > 0 && (
                          <div className="payment-alloc-sum-row payment-alloc-sum-row--advance">
                            <span>💰 Advance Amount:</span>
                            <strong>{fmtINR(advanceAmount)}</strong>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </section>

              {/* Payment Information */}
              <section className="payment-modal__section">
                <h3 className="payment-modal__section-title">Payment Information</h3>
                <div className="payment-modal__grid">
                  <Field label="Payment Date" required>
                    <input type="date" className="payment-input" value={form.paymentDate} onChange={(e) => setFm("paymentDate", e.target.value)} />
                  </Field>
                  <Field label="Payment Mode" required>
                    <select className="payment-input" value={form.paymentMode} onChange={(e) => setFm("paymentMode", e.target.value)}>
                      <option value="">Select mode</option>
                      {masters.paymentModes.map((m) => <option key={m._id} value={m._id}>{m.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Reference No." hint="UTR / Cheque / UPI Ref">
                    <input className="payment-input" placeholder="Enter reference" value={form.referenceNo} onChange={(e) => setFm("referenceNo", e.target.value)} />
                  </Field>
                  <Field
                    label="Amount Received"
                    required
                    hint={advanceAmount > 0 ? `Advance: ₹${fmtINRCompact(advanceAmount)}` : "Total customer ne diya hai"}
                  >
                    <input
                      className="payment-input"
                      type="number"
                      placeholder="0"
                      value={form.amountReceived}
                      onChange={(e) => setFm("amountReceived", e.target.value)}
                    />
                  </Field>
                  <Field label="Received By">
                    <select className="payment-input" value={form.receivedBy} onChange={(e) => setFm("receivedBy", e.target.value)}>
                      <option value="">Select person</option>
                      {masters.salesPersons.map((sp) => <option key={sp._id} value={sp._id}>{sp.name}</option>)}
                    </select>
                  </Field>
                  <Field label="Remarks" full>
                    <textarea className="payment-input payment-input--textarea" rows="2" placeholder="Payment received via..." value={form.remarks} onChange={(e) => setFm("remarks", e.target.value)} />
                  </Field>
                </div>
              </section>
            </div>

            <div className="payment-modal__footer">
              <button className="payment-btn payment-btn--ghost" onClick={() => setShowAdd(false)}>Cancel</button>
              <button className="payment-btn payment-btn--primary" onClick={handleSave} disabled={saving}>
                {saving ? "Saving..." : "Save Payment"}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .payment-page, .payment-page * { box-sizing: border-box; }
        .payment-page {
          --pm-text: #0f172a; --pm-muted: #64748b; --pm-label: #475569;
          --pm-card: #ffffff; --pm-border: #e5e7eb;
          --pm-primary: #2563eb; --pm-primary-hover: #1d4ed8;
          --pm-danger: #ef4444; --pm-success: #10b981; --pm-warning: #f59e0b;
          --pm-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--pm-text); font-size: 14px; line-height: 1.4;
        }
        .payment-page svg { width: 16px; height: 16px; display: block; }

        .payment-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
        }
        .payment-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .payment-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--pm-muted); font-size: 13px; }
        .payment-breadcrumb__sep { color: #cbd5e1; }
        .payment-breadcrumb__current { color: var(--pm-primary); font-weight: 500; }
        .payment-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .payment-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .payment-btn:disabled { opacity: 0.6; cursor: not-allowed; }
        .payment-btn--ghost { background: #fff; border-color: var(--pm-border); color: var(--pm-text); }
        .payment-btn--ghost:hover { background: #f8fafc; }
        .payment-btn--primary { background: var(--pm-primary); color: #fff; border-color: var(--pm-primary); }
        .payment-btn--primary:hover:not(:disabled) { background: var(--pm-primary-hover); }
        .payment-icon-btn {
          background: none; border: none; cursor: pointer;
          width: 30px; height: 30px;
          display: inline-flex; align-items: center; justify-content: center;
          border-radius: 6px; color: var(--pm-muted);
        }
        .payment-icon-btn:hover { background: #fee2e2; color: var(--pm-danger); }
        .payment-icon-btn--close:hover { background: #f1f5f9; color: var(--pm-text); }

        .payment-layout {
          display: grid; grid-template-columns: 1fr 320px;
          gap: 20px; align-items: flex-start;
        }
        .payment-main { display: flex; flex-direction: column; gap: 16px; min-width: 0; }
        .payment-side { display: flex; flex-direction: column; gap: 16px; }

        .payment-stats {
          display: grid; grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 14px;
        }
        .payment-stat {
          background: var(--pm-card); border: 1px solid var(--pm-border);
          border-radius: 12px; padding: 16px;
          box-shadow: var(--pm-shadow);
          display: flex; gap: 12px; align-items: flex-start;
        }
        .payment-stat__icon {
          width: 42px; height: 42px; border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }
        .payment-stat__icon svg { width: 22px; height: 22px; }
        .payment-stat__icon--blue   { background: #dbeafe; color: #2563eb; }
        .payment-stat__icon--green  { background: #d1fae5; color: #10b981; }
        .payment-stat__icon--orange { background: #ffedd5; color: #ea580c; }
        .payment-stat__icon--purple { background: #f3e8ff; color: #9333ea; }
        .payment-stat__body { min-width: 0; flex: 1; }
        .payment-stat__label { font-size: 12px; color: var(--pm-muted); margin-bottom: 4px; }
        .payment-stat__value { font-size: 16px; font-weight: 700; }

        .payment-card {
          background: var(--pm-card); border: 1px solid var(--pm-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--pm-shadow);
        }
        .payment-card__title {
          font-size: 15px; font-weight: 600; margin: 0 0 14px 0;
          display: flex; align-items: center; gap: 8px;
        }
        .payment-filter-tag {
          font-size: 11px; font-weight: 500;
          background: #dbeafe; color: #1d4ed8;
          padding: 2px 8px; border-radius: 10px;
        }

        .payment-filters__row {
          display: grid; grid-template-columns: repeat(5, minmax(0, 1fr));
          gap: 12px; margin-bottom: 12px;
        }
        .payment-filters__row:last-child { margin-bottom: 0; }
        .payment-filters__actions {
          display: flex; gap: 8px; align-items: flex-end;
        }
        .payment-filters__actions .payment-btn { padding: 9px 14px; }

        .payment-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .payment-field--full { grid-column: 1 / -1; }
        .payment-field__label {
          font-size: 12px; font-weight: 500; color: var(--pm-label);
          display: flex; align-items: center; gap: 6px;
        }
        .payment-field__required { color: var(--pm-danger); }
        .payment-field__hint { font-size: 11px; color: var(--pm-primary); font-weight: 400; margin-top: 2px; }

        .payment-input {
          width: 100%; padding: 8px 12px;
          border: 1px solid var(--pm-border);
          border-radius: 8px; background: #fff;
          font-size: 13px; color: var(--pm-text);
          font-family: inherit;
          transition: border-color 0.15s, box-shadow 0.15s;
        }
        .payment-input:focus {
          outline: none; border-color: var(--pm-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .payment-input:disabled { background: #f8fafc; color: var(--pm-muted); cursor: not-allowed; }
        .payment-input::placeholder { color: #94a3b8; }
        .payment-input--readonly { background: #f8fafc; color: var(--pm-muted); font-weight: 600; }
        .payment-input--success { background: #ecfdf5; color: var(--pm-success); border-color: #a7f3d0; }
        .payment-input--textarea { resize: vertical; min-height: 60px; }
        .payment-input--with-left-icon { padding-left: 36px; }
        .payment-input-wrap { position: relative; }
        .payment-input-wrap .payment-input:not(.payment-input--with-left-icon) { padding-right: 34px; }
        .payment-input__icon {
          position: absolute; right: 10px; top: 50%;
          transform: translateY(-50%);
          color: var(--pm-muted); pointer-events: none;
        }
        .payment-input__icon--left { left: 10px; right: auto; }

        .payment-table-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 12px; flex-wrap: wrap; gap: 8px;
        }
        .payment-muted { color: var(--pm-muted); font-size: 13px; }

        .payment-table-wrap { overflow-x: auto; }
        .payment-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        .payment-table th {
          background: #f8fafc; padding: 11px 12px;
          font-size: 11px; font-weight: 600;
          color: var(--pm-muted); text-align: left;
          text-transform: uppercase; letter-spacing: 0.4px;
          border-bottom: 1px solid var(--pm-border);
          white-space: nowrap;
        }
        .payment-th--right { text-align: right; }
        .payment-th--center { text-align: center; }
        .payment-table td {
          padding: 12px; font-size: 13px;
          border-bottom: 1px solid var(--pm-border);
          white-space: nowrap;
        }
        .payment-tr:hover { background: #fafbfc; }
        .payment-tr:last-child td { border-bottom: none; }
        .payment-td--right { text-align: right; }
        .payment-td--center { text-align: center; }
        .payment-td--link { color: var(--pm-primary); font-weight: 500; }
        .payment-td--empty { text-align: center; color: var(--pm-muted); padding: 40px !important; }
        .payment-mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; }
        .payment-balance-due { color: var(--pm-danger); font-weight: 600; }
        .payment-balance-zero { color: var(--pm-success); font-weight: 600; }

        .payment-mode {
          display: inline-block;
          padding: 3px 10px; border-radius: 12px;
          font-size: 11px; font-weight: 600;
          background: #e0e7ff; color: #4338ca;
        }

        .payment-badge {
          display: inline-block;
          padding: 3px 10px; border-radius: 12px;
          font-size: 11px; font-weight: 600;
        }
        .payment-badge--full     { background: #d1fae5; color: #047857; }
        .payment-badge--partial  { background: #ffedd5; color: #c2410c; }
        .payment-badge--advance  { background: #dbeafe; color: #1e40af; }

        .payment-overview { display: flex; flex-direction: column; gap: 10px; }
        .payment-overview__row {
          display: flex; align-items: center; justify-content: space-between;
          font-size: 13px;
        }
        .payment-overview__label { color: var(--pm-label); }
        .payment-overview__val { font-weight: 600; }
        .payment-overview__val--green { color: var(--pm-success); }
        .payment-overview__val--orange { color: #ea580c; }
        .payment-overview__val--red { color: var(--pm-danger); }

        .payment-donut { display: flex; justify-content: center; padding: 8px 0 14px; }
        .payment-donut svg { width: 170px; height: 170px; }
        .payment-legend { display: flex; flex-direction: column; gap: 8px; }
        .payment-legend__row {
          display: flex; align-items: center; gap: 10px; font-size: 13px;
        }
        .payment-legend__dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
        .payment-legend__name { flex: 1; color: var(--pm-text); }
        .payment-legend__pct { font-weight: 600; }

        .payment-list { display: flex; flex-direction: column; gap: 10px; }
        .payment-list__row {
          display: flex; align-items: center; justify-content: space-between; font-size: 13px;
        }
        .payment-list__val { font-weight: 600; }

        .payment-overdue { display: flex; flex-direction: column; gap: 12px; }
        .payment-overdue__row {
          display: flex; justify-content: space-between; align-items: flex-start; gap: 12px;
        }
        .payment-overdue__inv { font-size: 12px; color: var(--pm-primary); font-weight: 600; }
        .payment-overdue__cust { font-size: 13px; margin-top: 2px; }
        .payment-overdue__right { text-align: right; }
        .payment-overdue__amt { font-size: 13px; color: var(--pm-danger); font-weight: 600; }
        .payment-overdue__days { font-size: 11px; color: var(--pm-warning); margin-top: 2px; font-weight: 500; }

        /* MODAL */
        .payment-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.5);
          z-index: 100;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: pmFade 0.18s ease;
        }
        @keyframes pmFade { from { opacity: 0; } to { opacity: 1; } }
        .payment-modal {
          background: #fff;
          width: 100%; max-width: 720px;
          max-height: 90vh;
          border-radius: 14px;
          display: flex; flex-direction: column;
          box-shadow: 0 25px 50px rgba(0,0,0,0.25);
        }
        .payment-modal__header {
          padding: 18px 20px;
          border-bottom: 1px solid var(--pm-border);
          display: flex; align-items: center; justify-content: space-between;
        }
        .payment-modal__title { font-size: 18px; font-weight: 600; margin: 0; }
        .payment-modal__body { flex: 1; overflow-y: auto; padding: 20px; }
        .payment-modal__footer {
          padding: 14px 20px;
          border-top: 1px solid var(--pm-border);
          display: flex; gap: 10px; justify-content: flex-end;
        }
        .payment-modal__section { margin-bottom: 20px; }
        .payment-modal__section:last-child { margin-bottom: 0; }
        .payment-modal__section-title {
          font-size: 14px; font-weight: 600;
          margin: 0 0 12px 0; padding-bottom: 8px;
          border-bottom: 1px solid var(--pm-border);
        }
        .payment-modal__grid {
          display: grid; grid-template-columns: repeat(3, minmax(0, 1fr));
          gap: 14px;
        }

        /* 🆕 Multi-Invoice Allocation Section */
        .payment-allocs {
          margin-top: 14px;
          background: #f8fafc;
          border-radius: 10px;
          padding: 14px;
          border: 1px solid var(--pm-border);
        }
        .payment-allocs__head {
          display: flex; justify-content: space-between; align-items: center;
          margin-bottom: 12px;
          font-size: 13px; font-weight: 600;
        }
        .payment-allocs__hint {
          font-size: 11px; font-weight: 400; color: var(--pm-muted);
        }
        .payment-allocs__auto {
          background: var(--pm-primary); color: #fff;
          border: none; padding: 6px 12px; border-radius: 6px;
          font-size: 12px; font-weight: 500; cursor: pointer;
          font-family: inherit;
        }
        .payment-allocs__auto:hover { background: var(--pm-primary-hover); }
        .payment-allocs__empty {
          padding: 16px; text-align: center;
          color: var(--pm-muted); font-size: 13px;
          background: #fff; border-radius: 8px;
        }
        .payment-allocs__list {
          display: flex; flex-direction: column; gap: 6px;
          max-height: 260px; overflow-y: auto;
          padding-right: 4px;
        }
        .payment-alloc-row {
          display: grid;
          grid-template-columns: auto 1fr 140px;
          gap: 12px; align-items: center;
          padding: 10px 12px; background: #fff;
          border: 1px solid var(--pm-border);
          border-radius: 8px;
          transition: all 0.15s;
        }
        .payment-alloc-row--active {
          border-color: var(--pm-primary);
          background: #eff6ff;
        }
        .payment-alloc-check {
          width: 16px; height: 16px; cursor: pointer;
          accent-color: var(--pm-primary);
        }
        .payment-alloc-inv {
          font-weight: 700; font-size: 13px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          color: var(--pm-primary);
        }
        .payment-alloc-meta {
          display: flex; gap: 12px;
          font-size: 11px; color: var(--pm-muted);
          margin-top: 3px;
        }
        .payment-alloc-meta strong { color: var(--pm-text); }
        .payment-alloc-amt {
          padding: 7px 10px;
          border: 1px solid var(--pm-border);
          border-radius: 6px;
          font-size: 13px; text-align: right;
          font-family: inherit;
          font-weight: 600;
        }
        .payment-alloc-amt:focus {
          outline: none; border-color: var(--pm-primary);
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }
        .payment-alloc-amt:disabled {
          background: #f1f5f9; color: #cbd5e1;
          cursor: not-allowed;
        }
        .payment-allocs__summary {
          margin-top: 14px; padding-top: 12px;
          border-top: 2px solid var(--pm-border);
          display: flex; flex-direction: column; gap: 7px;
        }
        .payment-alloc-sum-row {
          display: flex; justify-content: space-between;
          font-size: 13px; color: var(--pm-text);
        }
        .payment-alloc-sum-row strong {
          font-weight: 700;
        }
        .payment-alloc-sum-row--advance {
          color: #d97706;
          background: #fef3c7;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: 600;
          margin-top: 4px;
        }

        @media (max-width: 1300px) {
          .payment-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 1100px) {
          .payment-layout { grid-template-columns: 1fr; }
          .payment-filters__row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 900px) {
          .payment-modal__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 700px) {
          .payment-page { padding: 16px; }
          .payment-page__title { font-size: 20px; }
          .payment-stats { grid-template-columns: 1fr; }
          .payment-filters__row { grid-template-columns: 1fr; }
          .payment-modal__grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
function Field({ label, required, hint, full, children }) {
  return (
    <div className={`payment-field ${full ? "payment-field--full" : ""}`}>
      <label className="payment-field__label">
        {label}
        {required && <span className="payment-field__required">*</span>}
      </label>
      {children}
      {hint && <div className="payment-field__hint">{hint}</div>}
    </div>
  );
}

function DonutChart({ segments, centerTop, centerBottom }) {
  const r = 70;
  const c = 2 * Math.PI * r;
  let cumulative = 0;

  return (
    <div className="payment-donut">
      <svg viewBox="0 0 200 200">
        <circle cx="100" cy="100" r={r} fill="none" stroke="#f1f5f9" strokeWidth="22" />
        <g transform="rotate(-90 100 100)">
          {segments.map((s, i) => {
            const len = (s.percent / 100) * c;
            const offset = (cumulative / 100) * c;
            cumulative += s.percent;
            return (
              <circle
                key={i}
                cx="100" cy="100" r={r}
                fill="none"
                stroke={s.color}
                strokeWidth="22"
                strokeDasharray={`${len} ${c}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
          })}
        </g>
        <text x="100" y="92" textAnchor="middle" fontSize="10" fill="#64748b">{centerTop}</text>
        <text x="100" y="115" textAnchor="middle" fontSize="14" fontWeight="700" fill="#0f172a">{centerBottom}</text>
      </svg>
    </div>
  );
}
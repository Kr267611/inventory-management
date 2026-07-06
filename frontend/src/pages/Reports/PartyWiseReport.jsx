import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { salesApi } from "../../Api/sales";
import { paymentApi } from "../../Api/paymentApi";
import { fetchAllMasters } from "../../Api/masterApi";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Printer: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  Calendar: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>,
  Eye: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Rupee: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12M6 8h12M6 13l8 8M14 8c0 2.76-2.24 5-5 5H6" /></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  X: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>,
  Phone: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" /></svg>,
};

/* ================================================================
   HELPERS
   ================================================================ */
const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" });
};
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtINR = (n) => "₹ " + fmtNum(n);
const isoDate = (d) => {
  const year  = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day   = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const getPresetRange = (preset) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today), to = new Date(today);
  switch (preset) {
    case "today": break;
    case "yesterday":
      from.setDate(today.getDate() - 1); to.setDate(today.getDate() - 1); break;
    case "this_week": {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      from.setDate(today.getDate() - diff); break;
    }
    case "this_month": from.setDate(1); break;
    case "last_month":
      from.setMonth(today.getMonth() - 1, 1); to.setDate(0); break;
    case "this_year": from.setMonth(0, 1); break;
    case "all": return { fromDate: "", toDate: "" };
    default: return { fromDate: "", toDate: "" };
  }
  return { fromDate: isoDate(from), toDate: isoDate(to) };
};

const DATE_PRESETS = [
  { key: "today",      label: "Today" },
  { key: "yesterday",  label: "Yesterday" },
  { key: "this_week",  label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year",  label: "This Year" },
  { key: "all",        label: "All Time" },
  { key: "custom",     label: "Custom" },
];

const STATUS_FILTERS = [
  { key: "all",         label: "All Parties" },
  { key: "outstanding", label: "With Dues" },
  { key: "cleared",     label: "Cleared" },
  { key: "overdue",     label: "Overdue" },
];

const COMPANY_INFO = {
  name:    "Aryan Exports",
  address: "PLOT NO. 21, BLOCK NO. 296, Village: VILL. TANTITHAIYA, SURAT BARDOLI ROAD, SURAT, Gujarat, 394327",
  phone:   "9825147345",
  mobile:  "9825147395",
  email:   "bhaskardyeing@gmail.com",
  gstin:   "24AACCB3983A1Z3",
};

const EMPTY_FILTERS = {
  fromDate: "", toDate: "",
  customer: "", baleNo: "", search: "",
};

/* ================================================================
   MAIN
   ================================================================ */
export default function PartyWiseReport() {
  const navigate = useNavigate();

  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [filters, setFilters] = useState({ ...EMPTY_FILTERS });
  const [appliedFilters, setAppliedFilters] = useState({ ...EMPTY_FILTERS });
  const [activePreset, setActivePreset] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [detailModal, setDetailModal] = useState(null);
  const [printMode, setPrintMode] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  const setF = (k, v) => setFilters({ ...filters, [k]: v });

  /* 🆕 Build item-level ledger (one row per bale) */
  const itemLedger = useMemo(() => {
    if (!detailModal) return [];
    const items = [];
    detailModal.sales
      .sort((a, b) => new Date(a.saleDate) - new Date(b.saleDate))
      .forEach((sale) => {
        (sale.items || []).forEach((item) => {
          items.push({
            date: sale.saleDate || sale.createdAt,
            invoiceNo: sale.invoiceNo || "-",
            baleNo: item.baleNo || "-",
            fabric: item.fabric?.name || "-",
            quality: item.fabricQuality?.name || "-",
            color: item.color?.name || "-",
            design: item.design?.designNo || "-",
            pcs: item.pcs || 0,
            rate: item.rate || 0,
            amount: item.amount || 0,
          });
        });
      });
    return items;
  }, [detailModal]);

  /* 🆕 Payment receipts sorted oldest first */
  const paymentReceipts = useMemo(() => {
    if (!detailModal) return [];
    return [...detailModal.payments].sort(
      (a, b) => new Date(a.paymentDate || a.createdAt) - new Date(b.paymentDate || b.createdAt)
    );
  }, [detailModal]);

  /* 🆕 Totals */
  const ledgerTotals = useMemo(() => {
    const totalQty    = itemLedger.reduce((s, r) => s + (r.pcs || 0), 0);
    const totalAmount = itemLedger.reduce((s, r) => s + (r.amount || 0), 0);
    const rcvAmount   = paymentReceipts.reduce((s, p) => s + (p.amountReceived || 0), 0);
    const duePayment  = totalAmount - rcvAmount;
    return { totalQty, totalAmount, rcvAmount, duePayment };
  }, [itemLedger, paymentReceipts]);

  const handlePrintLedger = () => {
    setPrintMode("ledger");
    setTimeout(() => {
      window.print();
      setTimeout(() => setPrintMode(null), 300);
    }, 100);
  };

  /* ──────── LOAD DATA ──────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [salesData, paymentsData, mastersData] = await Promise.all([
          salesApi.getAll(),
          paymentApi.getAll(),
          fetchAllMasters(),
        ]);
        setSales(salesData);
        setPayments(paymentsData);
        setCustomers(mastersData.customers || []);
      } catch (err) {
        alert("Failed to load: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ──────── DATE FILTER ──────── */
  const dateFilteredSales = useMemo(() => {
    let list = [...sales];
    if (appliedFilters.fromDate) {
      const from = new Date(appliedFilters.fromDate);
      from.setHours(0, 0, 0, 0);
      list = list.filter((s) => new Date(s.saleDate || s.createdAt) >= from);
    }
    if (appliedFilters.toDate) {
      const to = new Date(appliedFilters.toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((s) => new Date(s.saleDate || s.createdAt) <= to);
    }
    return list;
  }, [sales, appliedFilters]);

  const dateFilteredPayments = useMemo(() => {
    let list = [...payments];
    if (appliedFilters.fromDate) {
      const from = new Date(appliedFilters.fromDate);
      from.setHours(0, 0, 0, 0);
      list = list.filter((p) => new Date(p.paymentDate || p.createdAt) >= from);
    }
    if (appliedFilters.toDate) {
      const to = new Date(appliedFilters.toDate);
      to.setHours(23, 59, 59, 999);
      list = list.filter((p) => new Date(p.paymentDate || p.createdAt) <= to);
    }
    return list;
  }, [payments, appliedFilters]);

  /* ──────── BUILD PARTY LEDGER ──────── */
  const ledger = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return customers
      .map((customer) => {
        const customerSales = dateFilteredSales.filter((s) => (s.customer?._id || s.customer) === customer._id);
        const customerPayments = dateFilteredPayments.filter((p) => (p.customer?._id || p.customer) === customer._id);

        const totalInvoices    = customerSales.length;
        const totalSalesAmount = customerSales.reduce((sum, s) => sum + (s.netAmount || 0), 0);
        const totalPaid        = customerPayments.reduce((sum, p) => sum + (p.amountReceived || 0), 0);
        const outstanding      = customerSales.reduce((sum, s) => sum + (s.balanceDue || 0), 0);

        const hasOverdue = customerSales.some(
          (s) => s.dueDate && new Date(s.dueDate) < today && (s.balanceDue || 0) > 0
        );

        const lastSale = customerSales.length > 0
          ? customerSales.reduce((latest, s) =>
              new Date(s.saleDate || s.createdAt) > new Date(latest.saleDate || latest.createdAt) ? s : latest
            ).saleDate
          : null;
        const lastPayment = customerPayments.length > 0
          ? customerPayments.reduce((latest, p) =>
              new Date(p.paymentDate || p.createdAt) > new Date(latest.paymentDate || latest.createdAt) ? p : latest
            ).paymentDate
          : null;
        const lastActivity = lastSale && lastPayment
          ? (new Date(lastSale) > new Date(lastPayment) ? lastSale : lastPayment)
          : (lastSale || lastPayment);

        let status = "no-activity";
        if (totalInvoices > 0 || totalPaid > 0) {
          if (hasOverdue) status = "overdue";
          else if (outstanding > 0) status = "outstanding";
          else status = "cleared";
        }

        return {
          customer,
          totalInvoices,
          totalSalesAmount,
          totalPaid,
          outstanding,
          hasOverdue,
          lastActivity,
          status,
          sales: customerSales.sort((a, b) => new Date(b.saleDate) - new Date(a.saleDate)),
          payments: customerPayments.sort((a, b) => new Date(b.paymentDate) - new Date(a.paymentDate)),
        };
      })
      .filter((l) => l.totalInvoices > 0 || l.totalPaid > 0);
  }, [customers, dateFilteredSales, dateFilteredPayments]);

  const filteredLedger = useMemo(() => {
    let list = [...ledger];
    if (statusFilter === "outstanding") list = list.filter((l) => l.status === "outstanding" || l.status === "overdue");
    if (statusFilter === "cleared")     list = list.filter((l) => l.status === "cleared");
    if (statusFilter === "overdue")     list = list.filter((l) => l.status === "overdue");

    if (appliedFilters.customer) {
      list = list.filter((l) => l.customer._id === appliedFilters.customer);
    }
    if (appliedFilters.baleNo) {
      const baleList = appliedFilters.baleNo
        .split(",")
        .map((b) => b.trim().toUpperCase())
        .filter(Boolean);

      if (baleList.length > 0) {
        list = list.filter((l) =>
          l.sales.some((s) =>
            (s.items || []).some((it) => {
              const bn = (it.baleNo || "").toUpperCase();
              return baleList.some((b) => bn.includes(b));
            })
          )
        );
      }
    }
    if (appliedFilters.search) {
      const q = appliedFilters.search.toLowerCase();
      list = list.filter((l) =>
        (l.customer?.name || "").toLowerCase().includes(q) ||
        (l.customer?.phone || "").toLowerCase().includes(q) ||
        (l.customer?.gstNo || "").toLowerCase().includes(q) ||
        (l.customer?.code || "").toLowerCase().includes(q) ||
        l.sales.some((s) =>
          (s.items || []).some((it) => (it.baleNo || "").toLowerCase().includes(q))
        )
      );
    }
    return list.sort((a, b) => b.outstanding - a.outstanding);
  }, [ledger, statusFilter, appliedFilters]);

  const summary = useMemo(() => ({
    totalParties:     filteredLedger.length,
    totalSales:       filteredLedger.reduce((s, l) => s + l.totalSalesAmount, 0),
    totalCollected:   filteredLedger.reduce((s, l) => s + l.totalPaid, 0),
    totalOutstanding: filteredLedger.reduce((s, l) => s + l.outstanding, 0),
    withDues:         filteredLedger.filter((l) => l.outstanding > 0).length,
    overdue:          filteredLedger.filter((l) => l.hasOverdue).length,
  }), [filteredLedger]);

  const applyPreset = (preset) => {
    setActivePreset(preset);
    if (preset === "custom") return;
    const range = getPresetRange(preset);
    const newFilters = { ...filters, ...range };
    setFilters(newFilters);
    setAppliedFilters(newFilters);
  };

  const handleGenerate = () => {
    setAppliedFilters(filters);
    setActivePreset("custom");
  };

  const handleReset = () => {
    setFilters({ ...EMPTY_FILTERS });
    setAppliedFilters({ ...EMPTY_FILTERS });
    setActivePreset("all");
    setStatusFilter("all");
  };

  const openDetail = (l) => setDetailModal(l);

  const exportCSV = () => {
    if (filteredLedger.length === 0) return alert("No data to export");
    const headers = ["SR No.", "Customer", "Code", "Phone", "GST No", "Invoices", "Total Sales", "Total Paid", "Outstanding", "Last Activity", "Status"];
    const rows = filteredLedger.map((l, idx) => [
      idx + 1, l.customer.name, l.customer.code || "", l.customer.phone || "", l.customer.gstNo || "",
      l.totalInvoices, l.totalSalesAmount, l.totalPaid, l.outstanding,
      l.lastActivity ? formatDate(l.lastActivity) : "-", l.status,
    ]);
    rows.push(["", "", "", "", "TOTAL:", "", summary.totalSales.toFixed(2), summary.totalCollected.toFixed(2), summary.totalOutstanding.toFixed(2), "", ""]);
    const csvContent = [headers, ...rows]
      .map((row) =>
        row.map((cell) => {
          const str = String(cell ?? "");
          if (str.includes(",") || str.includes('"') || str.includes("\n")) return `"${str.replace(/"/g, '""')}"`;
          return str;
        }).join(",")
      ).join("\n");
    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `party-wise-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  /* PAGINATION (screen table only) */
  const totalPages = Math.max(1, Math.ceil(filteredLedger.length / ITEMS_PER_PAGE));

  const paginatedLedger = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredLedger.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredLedger, currentPage]);

  useEffect(() => { setCurrentPage(1); }, [appliedFilters, statusFilter]);

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const dateRangeLabel = useMemo(() => {
    if (!appliedFilters.fromDate && !appliedFilters.toDate) return "All Time";
    if (appliedFilters.fromDate === appliedFilters.toDate) return formatDate(appliedFilters.fromDate);
    return `${formatDate(appliedFilters.fromDate)} — ${formatDate(appliedFilters.toDate)}`;
  }, [appliedFilters]);

  /* 🆕 Party Ledger View — used in modal AND print */
  const PartyLedgerView = () => {
    if (!detailModal) return null;
    const fromD = appliedFilters.fromDate || (itemLedger[0]?.date) || new Date();
    const toD   = appliedFilters.toDate   || new Date();

    return (
      <div className="party-ledger">
        {/* Top: From / To */}
        <div className="pl-daterange">
          <div className="pl-date-cell">
            <span className="pl-date-label">From</span>
            <span className="pl-date-value">{formatDate(fromD)}</span>
          </div>
          <div className="pl-date-cell pl-date-cell--right">
            <span className="pl-date-label">To</span>
            <span className="pl-date-value">{formatDate(toD)}</span>
          </div>
        </div>

        {/* Company name */}
        <div className="pl-company-name">{COMPANY_INFO.name}</div>

        {/* Title */}
        <div className="pl-title">Party Ledger</div>

        {/* Customer info row */}
        <div className="pl-customer">
          <div className="pl-cust-block">
            <span className="pl-cust-label">Customer Name :</span>
            <span className="pl-cust-name">{detailModal.customer.name}</span>
          </div>
          <div className="pl-cust-block pl-cust-block--center">
            <span className="pl-cust-label">Print Date :</span>
            <span>{formatDate(new Date())}</span>
            {/* <div className="pl-cust-totalqty">{fmtInt(ledgerTotals.totalQty)}</div> */}
          </div>
          <div className="pl-cust-block pl-cust-block--right">
            <div className="pl-cust-summary">
              <div>
                <span className="pl-cust-label">RCV Amount</span>
                <span className="pl-cust-amt">{fmtInt(ledgerTotals.rcvAmount)}</span>
              </div>
              <div>
                <span className="pl-cust-label">Due Payment</span>
                <span className="pl-cust-amt pl-cust-amt--due">{fmtInt(ledgerTotals.duePayment)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main grid: Left table + Right amount column */}
        <div className="pl-grid">
          {/* LEFT — Sales items */}
          <div className="pl-left">
            <table className="pl-table">
              <thead>
                <tr>
                  <th>SR No</th>
                  <th>Date</th>
                  <th>Invoice No</th>
                  <th>Bale No</th>
                  <th>Fabric Name</th>
                  <th className="r">Qty</th>
                  <th className="r">Rate</th>
                  <th>Design No</th>
                  <th className="r">Amount</th>
                </tr>
              </thead>
              <tbody>
                {itemLedger.length === 0 ? (
                  <tr><td colSpan="9" className="pl-empty">No sales</td></tr>
                ) : (
                  itemLedger.map((row, idx) => (
                    <tr key={idx}>
                      <td>{idx + 1}</td>
                      <td>{formatDate(row.date)}</td>
                      <td>{row.invoiceNo}</td>
                      <td>{row.baleNo}</td>
                      <td>{row.fabric}</td>
                      <td className="r">{fmtInt(row.pcs)}</td>
                      <td className="r">{fmtInt(row.rate)}</td>
                      <td>{row.design}</td>
                      <td className="r">{fmtInt(row.amount)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* RIGHT — Receive amounts */}
          <div className="pl-right">
            <div className="pl-right-header">Amount</div>
            <div className="pl-right-body">
              {paymentReceipts.length === 0 ? (
                <div className="pl-empty">No receipts</div>
              ) : (
                paymentReceipts.map((p) => (
                  <div key={p._id} className="pl-receipt">
                    <div>Receive Date: <strong>{formatDate(p.paymentDate || p.createdAt)}</strong></div>
                    <div>Amt: <strong>{fmtInt(p.amountReceived)}</strong></div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="pwrpt-page">
      {/* HEADER */}
      <div className="pwrpt-page__header no-print">
        <div>
          <h1 className="pwrpt-page__title">Party-wise Report</h1>
          <div className="pwrpt-breadcrumb">
            <span>Home</span>
            <span className="pwrpt-breadcrumb__sep">/</span>
            <span>Reports</span>
            <span className="pwrpt-breadcrumb__sep">/</span>
            <span className="pwrpt-breadcrumb__current">Party-wise</span>
          </div>
        </div>
        <div className="pwrpt-page__actions">
          <button className="pwrpt-btn pwrpt-btn--ghost" onClick={() => navigate("/dashboard/reports")}>
            <Icon.ArrowLeft /><span>Back to Reports</span>
          </button>
          <button className="pwrpt-btn pwrpt-btn--ghost" onClick={exportCSV}>
            <Icon.Download /><span>Export CSV</span>
          </button>
          <button className="pwrpt-btn pwrpt-btn--primary" onClick={() => window.print()}>
            <Icon.Printer /><span>Print</span>
          </button>
        </div>
      </div>

      {/* DATE PRESETS */}
      <div className="pwrpt-presets no-print">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            className={`pwrpt-preset ${activePreset === p.key ? "pwrpt-preset--active" : ""}`}
            onClick={() => applyPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* STATUS CHIPS */}
      <div className="pwrpt-chips no-print">
        {STATUS_FILTERS.map((s) => (
          <button
            key={s.key}
            className={`pwrpt-chip pwrpt-chip--${s.key} ${statusFilter === s.key ? "pwrpt-chip--active" : ""}`}
            onClick={() => setStatusFilter(s.key)}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* FILTERS */}
      <div className="pwrpt-card no-print">
        <div className="pwrpt-filters__row">
          <Field label="From Date">
            <div className="pwrpt-input-wrap">
              <input type="date" className="pwrpt-input" value={filters.fromDate} onChange={(e) => setF("fromDate", e.target.value)} />
              <span className="pwrpt-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="To Date">
            <div className="pwrpt-input-wrap">
              <input type="date" className="pwrpt-input" value={filters.toDate} onChange={(e) => setF("toDate", e.target.value)} />
              <span className="pwrpt-input__icon"><Icon.Calendar /></span>
            </div>
          </Field>
          <Field label="Specific Customer">
            <select className="pwrpt-input" value={filters.customer} onChange={(e) => setF("customer", e.target.value)}>
              <option value="">All Customers</option>
              {customers.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Bale No">
            <input
              className="pwrpt-input pwrpt-bale-input"
              placeholder="A35, A59, 1224 (comma separated)"
              value={filters.baleNo}
              onChange={(e) => setF("baleNo", e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
            />
          </Field>
          <Field label="Search">
            <div className="pwrpt-input-wrap">
              <span className="pwrpt-input__icon pwrpt-input__icon--left"><Icon.Search /></span>
              <input
                className="pwrpt-input pwrpt-input--with-left-icon"
                placeholder="Name, code, phone, GST..."
                value={filters.search}
                onChange={(e) => setF("search", e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleGenerate()}
              />
            </div>
          </Field>
        </div>

        <div className="pwrpt-filters__actions">
          <button className="pwrpt-btn pwrpt-btn--ghost" onClick={handleReset}>
            <Icon.Refresh /><span>Reset</span>
          </button>
          <button className="pwrpt-btn pwrpt-btn--primary" onClick={handleGenerate}>
            <Icon.Search /><span>Generate</span>
          </button>
        </div>
      </div>

      {/* PRINT AREA — main report */}
      <div className="pwrpt-print-area">
        <div className="print-only pwrpt-print-header">
          <h1>Party-wise Report</h1>
          <div className="pwrpt-print-meta">
            <div><strong>Period:</strong> {dateRangeLabel}</div>
            <div><strong>Generated:</strong> {formatDate(new Date())}</div>
          </div>
        </div>

        <div className="pwrpt-period-banner no-print">
          <Icon.Calendar />
          <span>Report Period: <strong>{dateRangeLabel}</strong></span>
        </div>

        <div className="pwrpt-stats">
          <StatCard label="Total Parties"    value={fmtInt(summary.totalParties)}     hint="With activity"  tone="blue"   icon={<Icon.Users />} />
          <StatCard label="Total Sales"      value={fmtINR(summary.totalSales)}        hint="All invoices"   tone="purple" icon={<Icon.Rupee />} />
          <StatCard label="Total Collected"  value={fmtINR(summary.totalCollected)}    hint="Payments received" tone="green"  icon={<Icon.CheckCircle />} />
          <StatCard label="Outstanding"      value={fmtINR(summary.totalOutstanding)}  hint="Pending dues"   tone="red"    icon={<Icon.Clock />} />
          <StatCard label="Parties with Dues" value={fmtInt(summary.withDues)}         hint={`${summary.overdue} overdue`} tone="amber" icon={<Icon.AlertTriangle />} />
        </div>

        <div className="pwrpt-card">
          <div className="pwrpt-table-head">
            <h2 className="pwrpt-card__title">Customer Ledger</h2>
            <span className="pwrpt-muted no-print">{filteredLedger.length} parties</span>
          </div>

          <div className="pwrpt-table-wrap no-print">
            <table className="pwrpt-table">
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>Customer</th>
                  <th>Code</th>
                  <th>Phone</th>
                  <th className="pwrpt-th--right">Invoices</th>
                  <th className="pwrpt-th--right">Total Sales</th>
                  <th className="pwrpt-th--right">Paid</th>
                  <th className="pwrpt-th--right">Outstanding</th>
                  <th>Last Activity</th>
                  <th className="pwrpt-th--center">Status</th>
                  <th className="pwrpt-th--center no-print">Action</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="11" className="pwrpt-td--empty">Loading...</td></tr>
                ) : filteredLedger.length === 0 ? (
                  <tr><td colSpan="11" className="pwrpt-td--empty">No party activity in this period</td></tr>
                ) : (
                  paginatedLedger.map((l, idx) => (
                    <tr key={l.customer._id}>
                      <td>{(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}</td>
                      <td className="pwrpt-td--strong">{l.customer.name}</td>
                      <td className="pwrpt-mono">{l.customer.code || "-"}</td>
                      <td className="pwrpt-muted">{l.customer.phone || "-"}</td>
                      <td className="pwrpt-td--right">{fmtInt(l.totalInvoices)}</td>
                      <td className="pwrpt-td--right">{fmtNum(l.totalSalesAmount)}</td>
                      <td className="pwrpt-td--right pwrpt-paid">{fmtNum(l.totalPaid)}</td>
                      <td className={`pwrpt-td--right ${l.outstanding > 0 ? "pwrpt-balance-due" : "pwrpt-balance-zero"}`}>
                        {fmtNum(l.outstanding)}
                      </td>
                      <td>{l.lastActivity ? formatDate(l.lastActivity) : "-"}</td>
                      <td className="pwrpt-td--center">
                        <span className={`pwrpt-badge pwrpt-badge--${l.status}`}>
                          {l.status === "cleared" && "✓ Cleared"}
                          {l.status === "outstanding" && "Due"}
                          {l.status === "overdue" && "⚠ Overdue"}
                        </span>
                      </td>
                      <td className="pwrpt-td--center no-print">
                        <button className="pwrpt-icon-btn" title="View Party Ledger" onClick={() => openDetail(l)}>
                          <Icon.Eye />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredLedger.length > 0 && (
                <tfoot>
                  <tr className="pwrpt-total-row">
                    <td colSpan="5" className="pwrpt-td--strong">TOTAL</td>
                    <td className="pwrpt-td--right pwrpt-td--strong">{fmtNum(summary.totalSales)}</td>
                    <td className="pwrpt-td--right pwrpt-td--strong pwrpt-paid">{fmtNum(summary.totalCollected)}</td>
                    <td className="pwrpt-td--right pwrpt-td--strong pwrpt-balance-due">{fmtNum(summary.totalOutstanding)}</td>
                    <td></td><td></td>
                    <td className="no-print"></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Print-only: full unpaginated table so printing always shows every filtered row */}
          <div className="pwrpt-table-wrap print-only">
            <table className="pwrpt-table">
              <thead>
                <tr>
                  <th>SR No.</th>
                  <th>Customer</th>
                  <th>Code</th>
                  <th>Phone</th>
                  <th className="pwrpt-th--right">Invoices</th>
                  <th className="pwrpt-th--right">Total Sales</th>
                  <th className="pwrpt-th--right">Paid</th>
                  <th className="pwrpt-th--right">Outstanding</th>
                  <th>Last Activity</th>
                  <th className="pwrpt-th--center">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLedger.length === 0 ? (
                  <tr><td colSpan="10" className="pwrpt-td--empty">No party activity in this period</td></tr>
                ) : (
                  filteredLedger.map((l, idx) => (
                    <tr key={l.customer._id}>
                      <td>{idx + 1}</td>
                      <td className="pwrpt-td--strong">{l.customer.name}</td>
                      <td className="pwrpt-mono">{l.customer.code || "-"}</td>
                      <td className="pwrpt-muted">{l.customer.phone || "-"}</td>
                      <td className="pwrpt-td--right">{fmtInt(l.totalInvoices)}</td>
                      <td className="pwrpt-td--right">{fmtNum(l.totalSalesAmount)}</td>
                      <td className="pwrpt-td--right pwrpt-paid">{fmtNum(l.totalPaid)}</td>
                      <td className={`pwrpt-td--right ${l.outstanding > 0 ? "pwrpt-balance-due" : "pwrpt-balance-zero"}`}>
                        {fmtNum(l.outstanding)}
                      </td>
                      <td>{l.lastActivity ? formatDate(l.lastActivity) : "-"}</td>
                      <td className="pwrpt-td--center">
                        <span className={`pwrpt-badge pwrpt-badge--${l.status}`}>
                          {l.status === "cleared" && "✓ Cleared"}
                          {l.status === "outstanding" && "Due"}
                          {l.status === "overdue" && "⚠ Overdue"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {filteredLedger.length > 0 && (
                <tfoot>
                  <tr className="pwrpt-total-row">
                    <td colSpan="5" className="pwrpt-td--strong">TOTAL</td>
                    <td className="pwrpt-td--right pwrpt-td--strong">{fmtNum(summary.totalSales)}</td>
                    <td className="pwrpt-td--right pwrpt-td--strong pwrpt-paid">{fmtNum(summary.totalCollected)}</td>
                    <td className="pwrpt-td--right pwrpt-td--strong pwrpt-balance-due">{fmtNum(summary.totalOutstanding)}</td>
                    <td></td><td></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>

          {/* Pagination — screen only, does not affect export/print (both use filteredLedger above) */}
          <div className="pwrpt-pagination no-print">
            <div className="pwrpt-pagination__info">
              Showing {filteredLedger.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredLedger.length)} of {filteredLedger.length} entries
            </div>
            <div className="pwrpt-pagination__controls">
              <button
                className="pwrpt-page-btn"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              >
                Previous
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`pwrpt-page-btn ${page === currentPage ? "pwrpt-page-btn--active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
              <button
                className="pwrpt-page-btn"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 🆕 PARTY LEDGER MODAL — Excel/Tally style */}
      {detailModal && (
        <div className="pwrpt-modal-overlay no-print" onClick={() => setDetailModal(null)}>
          <div className="pwrpt-modal pwrpt-modal--wide" onClick={(e) => e.stopPropagation()}>
            <div className="pwrpt-modal__header">
              <h2 className="pwrpt-modal__title">Party Ledger — {detailModal.customer.name}</h2>
              <button className="pwrpt-icon-btn pwrpt-icon-btn--close" onClick={() => setDetailModal(null)}>
                <Icon.X />
              </button>
            </div>

            <div className="pwrpt-modal__body">
              <PartyLedgerView />
            </div>

            <div className="pwrpt-modal__footer">
              <button className="pwrpt-btn pwrpt-btn--ghost" onClick={() => setDetailModal(null)}>Close</button>
              <button className="pwrpt-btn pwrpt-btn--primary" onClick={handlePrintLedger}>
                <Icon.Printer /><span>Print Ledger</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 🆕 PARTY LEDGER PRINT — hidden until print mode active */}
      {detailModal && (
        <div className={`pwrpt-ledger-print ${printMode === "ledger" ? "pwrpt-ledger-print--active" : ""}`}>
          <PartyLedgerView />
        </div>
      )}

      <style>{`
        .pwrpt-page, .pwrpt-page * { box-sizing: border-box; }
        .pwrpt-page {
          --pwrpt-text: #0f172a; --pwrpt-muted: #64748b; --pwrpt-label: #475569;
          --pwrpt-card: #ffffff; --pwrpt-border: #e5e7eb;
          --pwrpt-primary: #2563eb; --pwrpt-primary-hover: #1d4ed8;
          --pwrpt-danger: #ef4444; --pwrpt-success: #10b981; --pwrpt-warning: #f59e0b;
          --pwrpt-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--pwrpt-text); font-size: 14px; line-height: 1.4;
          display: flex; flex-direction: column; gap: 16px;
        }
        .pwrpt-page svg { width: 16px; height: 16px; display: block; }
        .print-only { display: none; }

        .pwrpt-page__header { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; flex-wrap: wrap; }
        .pwrpt-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .pwrpt-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--pwrpt-muted); font-size: 13px; flex-wrap: wrap; }
        .pwrpt-breadcrumb__sep { color: #cbd5e1; }
        .pwrpt-breadcrumb__current { color: var(--pwrpt-primary); font-weight: 500; }
        .pwrpt-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .pwrpt-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .pwrpt-btn--ghost { background: #fff; border-color: var(--pwrpt-border); color: var(--pwrpt-text); }
        .pwrpt-btn--ghost:hover { background: #f8fafc; }
        .pwrpt-btn--primary { background: var(--pwrpt-primary); color: #fff; border-color: var(--pwrpt-primary); }
        .pwrpt-btn--primary:hover { background: var(--pwrpt-primary-hover); }

        .pwrpt-icon-btn {
          background: #eff6ff; border: none;
          width: 30px; height: 30px;
          border-radius: 6px; cursor: pointer;
          color: var(--pwrpt-primary);
          display: inline-flex; align-items: center; justify-content: center;
        }
        .pwrpt-icon-btn:hover { background: #dbeafe; }
        .pwrpt-icon-btn svg { width: 14px; height: 14px; }
        .pwrpt-icon-btn--close { background: transparent; color: var(--pwrpt-muted); width: 32px; height: 32px; }
        .pwrpt-icon-btn--close:hover { background: #f1f5f9; color: var(--pwrpt-text); }
        .pwrpt-icon-btn--close svg { width: 18px; height: 18px; }

        .pwrpt-presets, .pwrpt-chips { display: flex; flex-wrap: wrap; gap: 8px; }
        .pwrpt-preset, .pwrpt-chip {
          padding: 7px 14px; border: 1px solid var(--pwrpt-border);
          background: #fff; border-radius: 20px;
          font-size: 13px; font-weight: 500;
          color: var(--pwrpt-label); cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .pwrpt-preset:hover { border-color: var(--pwrpt-primary); color: var(--pwrpt-primary); }
        .pwrpt-preset--active { background: var(--pwrpt-primary); color: #fff; border-color: var(--pwrpt-primary); }
        .pwrpt-chip--all.pwrpt-chip--active         { background: var(--pwrpt-primary); color: #fff; border-color: var(--pwrpt-primary); }
        .pwrpt-chip--outstanding.pwrpt-chip--active { background: #f59e0b; color: #fff; border-color: #f59e0b; }
        .pwrpt-chip--cleared.pwrpt-chip--active     { background: var(--pwrpt-success); color: #fff; border-color: var(--pwrpt-success); }
        .pwrpt-chip--overdue.pwrpt-chip--active     { background: var(--pwrpt-danger); color: #fff; border-color: var(--pwrpt-danger); }

        .pwrpt-card { background: var(--pwrpt-card); border: 1px solid var(--pwrpt-border); border-radius: 12px; padding: 18px; box-shadow: var(--pwrpt-shadow); }
        .pwrpt-card__title { font-size: 15px; font-weight: 600; margin: 0; }

        .pwrpt-filters__row { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; margin-bottom: 12px; }
        .pwrpt-filters__actions { display: flex; gap: 8px; justify-content: flex-end; padding-top: 4px; }

        .pwrpt-field { display: flex; flex-direction: column; gap: 6px; min-width: 0; }
        .pwrpt-field__label { font-size: 12px; font-weight: 500; color: var(--pwrpt-label); }

        .pwrpt-input {
          width: 100%; padding: 9px 12px;
          border: 1px solid var(--pwrpt-border);
          border-radius: 8px; background: #fff;
          font-size: 13px; color: var(--pwrpt-text);
          font-family: inherit;
        }
        .pwrpt-input:focus { outline: none; border-color: var(--pwrpt-primary); box-shadow: 0 0 0 3px rgba(37,99,235,0.12); }
        .pwrpt-input--with-left-icon { padding-left: 36px; }
        .pwrpt-input-wrap { position: relative; }
        .pwrpt-input-wrap .pwrpt-input:not(.pwrpt-input--with-left-icon) { padding-right: 34px; }
        .pwrpt-input__icon { position: absolute; right: 10px; top: 50%; transform: translateY(-50%); color: var(--pwrpt-muted); pointer-events: none; }
        .pwrpt-input__icon--left { left: 10px; right: auto; }
        .pwrpt-bale-input { text-transform: uppercase; font-weight: 600; letter-spacing: 0.5px; }

        .pwrpt-period-banner {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 12px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #1e40af; margin-bottom: 20px;
        }
        .pwrpt-period-banner svg { color: var(--pwrpt-primary); }

        .pwrpt-stats { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; margin-bottom: 20px; }
        .pwrpt-stat { background: var(--pwrpt-card); border: 1px solid var(--pwrpt-border); border-radius: 12px; padding: 14px; box-shadow: var(--pwrpt-shadow); display: flex; align-items: center; gap: 10px; }
        .pwrpt-stat__icon { width: 40px; height: 40px; border-radius: 10px; display: flex; align-items: center; justify-content: center; flex-shrink: 0; }
        .pwrpt-stat__icon svg { width: 20px; height: 20px; }
        .pwrpt-stat__icon--blue   { background: #dbeafe; color: #2563eb; }
        .pwrpt-stat__icon--green  { background: #d1fae5; color: #059669; }
        .pwrpt-stat__icon--purple { background: #f3e8ff; color: #9333ea; }
        .pwrpt-stat__icon--amber  { background: #fef3c7; color: #d97706; }
        .pwrpt-stat__icon--red    { background: #fee2e2; color: #dc2626; }
        .pwrpt-stat__label { font-size: 11px; color: var(--pwrpt-muted); }
        .pwrpt-stat__value { font-size: 17px; font-weight: 700; line-height: 1.2; word-break: break-word; }
        .pwrpt-stat__hint { font-size: 10px; color: var(--pwrpt-muted); margin-top: 2px; }

        .pwrpt-table-head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 14px; flex-wrap: wrap; gap: 8px; }
        .pwrpt-muted { color: var(--pwrpt-muted); font-size: 13px; }

        .pwrpt-table-wrap { overflow-x: auto; }
        .pwrpt-table { width: 100%; border-collapse: collapse; min-width: 1100px; }
        .pwrpt-table th { background: #f8fafc; padding: 11px 12px; font-size: 11px; font-weight: 600; color: var(--pwrpt-muted); text-align: left; text-transform: uppercase; letter-spacing: 0.4px; border-bottom: 1px solid var(--pwrpt-border); white-space: nowrap; }
        .pwrpt-th--right { text-align: right; }
        .pwrpt-th--center { text-align: center; }
        .pwrpt-table td { padding: 12px; font-size: 13px; border-bottom: 1px solid var(--pwrpt-border); white-space: nowrap; }
        .pwrpt-table tbody tr:hover { background: #fafbfc; }
        .pwrpt-table tbody tr:last-child td { border-bottom: none; }
        .pwrpt-td--right { text-align: right; }
        .pwrpt-td--center { text-align: center; }
        .pwrpt-td--strong { font-weight: 600; }
        .pwrpt-td--empty { text-align: center; color: var(--pwrpt-muted); padding: 40px !important; }
        .pwrpt-mono { font-family: ui-monospace, SFMono-Regular, monospace; font-size: 12px; color: var(--pwrpt-primary); }
        .pwrpt-paid { color: var(--pwrpt-success); font-weight: 600; }
        .pwrpt-balance-due { color: var(--pwrpt-danger); font-weight: 600; }
        .pwrpt-balance-zero { color: var(--pwrpt-success); font-weight: 600; }

        .pwrpt-badge { display: inline-block; padding: 3px 10px; border-radius: 12px; font-size: 11px; font-weight: 600; }
        .pwrpt-badge--cleared     { background: #d1fae5; color: #047857; }
        .pwrpt-badge--outstanding { background: #ffedd5; color: #c2410c; }
        .pwrpt-badge--overdue     { background: #fee2e2; color: #b91c1c; }

        .pwrpt-total-row td { background: #f8fafc; padding: 14px 12px; font-size: 13px; border-top: 2px solid var(--pwrpt-border); border-bottom: none; }

        .pwrpt-pagination {
          padding: 12px 4px 0;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
          border-top: 1px solid var(--pwrpt-border);
          margin-top: 14px;
        }
        .pwrpt-pagination__info { font-size: 13px; color: var(--pwrpt-muted); }
        .pwrpt-pagination__controls { display: flex; gap: 6px; flex-wrap: wrap; }
        .pwrpt-page-btn {
          min-width: 32px; padding: 6px 12px;
          border: 1px solid var(--pwrpt-border);
          background: #fff; border-radius: 6px;
          font-size: 13px; cursor: pointer;
          color: var(--pwrpt-text); font-family: inherit;
        }
        .pwrpt-page-btn:hover:not(:disabled) { background: #f8fafc; }
        .pwrpt-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
        .pwrpt-page-btn--active { background: var(--pwrpt-primary); color: #fff; border-color: var(--pwrpt-primary); }

        /* MODAL */
        .pwrpt-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(15,23,42,0.5);
          z-index: 100;
          display: flex; align-items: center; justify-content: center;
          padding: 20px;
          animation: pwrptFade 0.18s ease;
        }
        @keyframes pwrptFade { from { opacity: 0; } to { opacity: 1; } }
        .pwrpt-modal { background: #fff; width: 100%; max-width: 900px; max-height: 90vh; border-radius: 14px; display: flex; flex-direction: column; box-shadow: 0 25px 50px rgba(0,0,0,0.25); }
        .pwrpt-modal--wide { max-width: 1300px; }
        .pwrpt-modal__header { padding: 16px 20px; border-bottom: 1px solid var(--pwrpt-border); display: flex; align-items: center; justify-content: space-between; gap: 12px; }
        .pwrpt-modal__title { font-size: 16px; font-weight: 600; margin: 0; }
        .pwrpt-modal__body { flex: 1; overflow: auto; padding: 16px; background: #f1f5f9; }
        .pwrpt-modal__footer { padding: 14px 20px; border-top: 1px solid var(--pwrpt-border); display: flex; justify-content: flex-end; gap: 8px; flex-wrap: wrap; }

        /* ════════════════════════════════════
           🆕 PARTY LEDGER (Excel-style)
           ════════════════════════════════════ */
        .party-ledger {
          background: #fff;
          font-family: Calibri, Arial, sans-serif;
          font-size: 12px;
          color: #000;
          border: 2px solid #1e3a8a;
        }
        .pl-daterange {
          display: grid;
          grid-template-columns: 1fr 1fr;
          background: #fef3c7;
          border-bottom: 1px solid #1e3a8a;
        }
        .pl-date-cell {
          display: flex; align-items: center; gap: 10px;
          padding: 8px 16px;
          border-right: 1px solid #1e3a8a;
        }
        .pl-date-cell--right { border-right: none; }
        .pl-date-label {
          font-weight: 700;
          color: #92400e;
          min-width: 50px;
        }
        .pl-date-value {
          background: #fff;
          padding: 4px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 3px;
        }
        .pl-company-name {
          background: #fde68a;
          padding: 12px;
          font-size: 18px;
          font-weight: 700;
          text-align: center;
          color: #78350f;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #1e3a8a;
        }
        .pl-title {
          background: #dbeafe;
          padding: 8px;
          font-size: 14px;
          font-weight: 700;
          text-align: center;
          color: #1e3a8a;
          letter-spacing: 0.5px;
          border-bottom: 1px solid #1e3a8a;
        }
        .pl-customer {
          display: grid;
          grid-template-columns: 1.5fr 1fr 1.2fr;
          background: #fff;
          border-bottom: 2px solid #1e3a8a;
        }
        .pl-cust-block {
          padding: 10px 14px;
          display: flex; flex-direction: column; gap: 4px;
          border-right: 1px solid #1e3a8a;
          font-size: 12px;
        }
        .pl-cust-block:last-child { border-right: none; }
        .pl-cust-block--center { background: #fef3c7; align-items: flex-start; }
        .pl-cust-block--right { background: #fef9c3; }
        .pl-cust-label {
          font-size: 11px;
          color: #475569;
          font-weight: 600;
        }
        .pl-cust-name {
          font-size: 13px;
          font-weight: 700;
          color: #1e3a8a;
        }
        .pl-cust-totalqty {
          margin-top: 4px;
          font-size: 14px;
          font-weight: 700;
          color: #1e3a8a;
        }
        .pl-cust-summary {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        .pl-cust-summary > div {
          display: flex; flex-direction: column; gap: 2px;
        }
        .pl-cust-amt {
          font-size: 14px;
          font-weight: 700;
          color: #059669;
        }
        .pl-cust-amt--due { color: #dc2626; }

        .pl-grid {
          display: grid;
          grid-template-columns: 1fr 260px;
        }
        .pl-left {
          overflow: auto;
          border-right: 2px solid #1e3a8a;
        }
        .pl-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 11px;
          min-width: 800px;
        }
        .pl-table th {
          background: #3b82f6;
          color: #fff;
          padding: 8px 6px;
          text-align: left;
          font-weight: 700;
          border: 1px solid #1e3a8a;
          font-size: 11px;
          white-space: nowrap;
        }
        .pl-table th.r { text-align: right; }
        .pl-table td {
          padding: 6px;
          border: 1px solid #cbd5e1;
          background: #fff;
          white-space: nowrap;
        }
        .pl-table td.r { text-align: right; }
        .pl-table tbody tr:nth-child(even) td { background: #f0f9ff; }
        .pl-empty {
          text-align: center;
          padding: 24px;
          color: #64748b;
          font-style: italic;
        }
        .pl-right {
          background: #fff;
          display: flex; flex-direction: column;
        }
        .pl-right-header {
          background: #3b82f6;
          color: #fff;
          padding: 8px;
          text-align: center;
          font-weight: 700;
          border: 1px solid #1e3a8a;
        }
        .pl-right-body {
          padding: 8px;
          font-size: 11px;
          background: #fff7ed;
          flex: 1;
          overflow-y: auto;
        }
        .pl-receipt {
          padding: 6px 8px;
          margin-bottom: 6px;
          background: #fff;
          border: 1px solid #fed7aa;
          border-radius: 3px;
          line-height: 1.5;
        }
        .pl-receipt strong { color: #c2410c; }

        @media (max-width: 1400px) {
          .pwrpt-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1300px) {
          .pwrpt-filters__row { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1100px) {
          .pwrpt-filters__row { grid-template-columns: repeat(2, 1fr); }
          .pl-grid { grid-template-columns: 1fr; }
          .pl-left { border-right: none; border-bottom: 2px solid #1e3a8a; }
        }
        @media (max-width: 768px) {
          .pwrpt-page__title { font-size: 20px; }
          .pwrpt-stats { grid-template-columns: repeat(2, 1fr); }
          .pl-customer { grid-template-columns: 1fr; }
          .pl-cust-block { border-right: none; border-bottom: 1px solid #1e3a8a; }
        }
        @media (max-width: 560px) {
          .pwrpt-stats { grid-template-columns: 1fr; }
          .pwrpt-filters__row { grid-template-columns: 1fr; }
          .pwrpt-page__actions { width: 100%; }
          .pwrpt-page__actions .pwrpt-btn { flex: 1; justify-content: center; }
        }

        /* PARTY LEDGER PRINT */
        .pwrpt-ledger-print {
          display: none;
          position: fixed;
          left: 0; top: 0;
          width: 100%;
          background: #fff;
          z-index: -1;
        }
        .pwrpt-ledger-print--active { display: block; }

        /* PRINT */
        @media print {
          body * { visibility: hidden; }
          .pwrpt-print-area, .pwrpt-print-area * { visibility: visible; }
          .pwrpt-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }

          .pwrpt-ledger-print--active,
          .pwrpt-ledger-print--active * { visibility: visible !important; }
          .pwrpt-ledger-print--active {
            display: block !important;
            position: absolute !important;
            left: 0; top: 0;
            width: 100%;
            z-index: 9999;
          }
          body:has(.pwrpt-ledger-print--active) .pwrpt-print-area {
            visibility: hidden !important;
            display: none !important;
          }

          /* Force colors in print */
          .party-ledger,
          .party-ledger * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
          }
          .pl-table tbody tr { page-break-inside: avoid; }
          .pl-receipt { page-break-inside: avoid; }

          .pwrpt-print-header { text-align: center; margin-bottom: 20px; padding-bottom: 14px; border-bottom: 2px solid #000; }
          .pwrpt-print-header h1 { font-size: 22px; margin: 0 0 8px 0; }
          .pwrpt-print-meta { display: flex; justify-content: center; gap: 30px; font-size: 12px; }
          .pwrpt-stats { grid-template-columns: repeat(5, 1fr); margin-bottom: 16px; gap: 8px; }
          .pwrpt-stat { padding: 8px; border: 1px solid #ccc; box-shadow: none; }
          .pwrpt-stat__value { font-size: 13px; }
          .pwrpt-stat__label { font-size: 10px; }
          .pwrpt-card { border: 1px solid #ccc; box-shadow: none; }
          .pwrpt-table { min-width: 0; font-size: 10px; }
          .pwrpt-table th { background: #f0f0f0 !important; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .pwrpt-table th, .pwrpt-table td { padding: 5px 6px; border: 1px solid #ddd; }
          .pwrpt-table tbody tr { page-break-inside: avoid; }

          @page {
    size: A4 landscape;
    margin: 10mm;
  }

  .pwrpt-ledger-print--active .pl-grid {
    display: grid !important;
    grid-template-columns: 1fr 220px !important;
  }
  .pwrpt-ledger-print--active .pl-left {
    border-right: 2px solid #1e3a8a !important;
    border-bottom: none !important;
  }
  .pwrpt-ledger-print--active .pl-table {
    min-width: 0 !important;
    font-size: 10px !important;
  }
  .pwrpt-ledger-print--active .pl-table th {
    padding: 6px 4px !important;
    font-size: 10px !important;
  }
  .pwrpt-ledger-print--active .pl-table td {
    padding: 4px 4px !important;
  }
  .pwrpt-ledger-print--active .pl-customer {
    grid-template-columns: 1.5fr 1fr 1.2fr !important;
  }
  .pwrpt-ledger-print--active .pl-cust-block {
    border-right: 1px solid #1e3a8a !important;
    border-bottom: none !important;
  }
  .pwrpt-ledger-print--active .pl-cust-block:last-child {
    border-right: none !important;
  }
  .pwrpt-ledger-print--active .pl-right-body {
    font-size: 10px !important;
    padding: 6px !important;
  }
  .pwrpt-ledger-print--active .pl-receipt {
    padding: 4px 6px !important;
    margin-bottom: 4px !important;
  }
        }
      `}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
function Field({ label, children }) {
  return (
    <div className="pwrpt-field">
      <label className="pwrpt-field__label">{label}</label>
      {children}
    </div>
  );
}

function StatCard({ label, value, hint, icon, tone }) {
  return (
    <div className="pwrpt-stat">
      <div className={`pwrpt-stat__icon pwrpt-stat__icon--${tone}`}>{icon}</div>
      <div>
        <div className="pwrpt-stat__label">{label}</div>
        <div className="pwrpt-stat__value">{value}</div>
        <div className="pwrpt-stat__hint">{hint}</div>
      </div>
    </div>
  );
}
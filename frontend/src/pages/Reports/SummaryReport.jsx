import React, { useState, useMemo, useEffect , useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell,
} from "recharts";
import { inwardApi } from "../../Api/inwardApi";
import { salesApi } from "../../Api/sales";
import { paymentApi } from "../../Api/paymentApi";
import { inventoryApi } from "../../Api/inventoryApi";

/* ================================================================
   ICONS
   ================================================================ */
const Icon = {
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
  Download: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>,
  Printer: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>,
  TrendUp: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18" /><polyline points="17 6 23 6 23 12" /></svg>,
  TrendDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 18 13.5 8.5 8.5 13.5 1 6" /><polyline points="17 18 23 18 23 12" /></svg>,
  ShoppingBag: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  Cart: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" /></svg>,
  Wallet: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 12V8a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-2" /><path d="M20 12v0a2 2 0 0 0-2 2v0a2 2 0 0 0 2 2h2v-4h-2z" /></svg>,
  Box: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Activity: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>,
};

/* ================================================================
   HELPERS
   ================================================================ */
const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};
const formatShortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
const fmtNum = (n) => Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtInt = (n) => Number(n || 0).toLocaleString("en-IN");
const fmtINR = (n) => "₹ " + fmtNum(n);
const fmtINRCompact = (n) => {
  const num = Number(n || 0);
  if (num >= 10000000) return "₹ " + (num / 10000000).toFixed(2) + " Cr";
  if (num >= 100000) return "₹ " + (num / 100000).toFixed(2) + " L";
  if (num >= 1000) return "₹ " + (num / 1000).toFixed(1) + " K";
  return "₹ " + num.toFixed(0);
};
const isoDate = (d) => d.toISOString().slice(0, 10);

const getPresetRange = (preset) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today), to = new Date(today);
  switch (preset) {
    case "this_week": {
      const day = today.getDay();
      const diff = day === 0 ? 6 : day - 1;
      from.setDate(today.getDate() - diff); break;
    }
    case "this_month": from.setDate(1); break;
    case "last_month":
      from.setMonth(today.getMonth() - 1, 1); to.setDate(0); break;
    case "this_year": from.setMonth(0, 1); break;
    case "last_year":
      from.setFullYear(today.getFullYear() - 1, 0, 1);
      to.setFullYear(today.getFullYear() - 1, 11, 31); break;
    default: return { from: "", to: "" };
  }
  return { from: isoDate(from), to: isoDate(to) };
};

const DATE_PRESETS = [
  { key: "this_week",  label: "This Week" },
  { key: "this_month", label: "This Month" },
  { key: "last_month", label: "Last Month" },
  { key: "this_year",  label: "This Year" },
  { key: "last_year",  label: "Last Year" },
  { key: "all",        label: "All Time" },
];

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

/* ================================================================
   MAIN
   ================================================================ */
export default function SummaryReport() {
  const navigate = useNavigate();

  const [inwards, setInwards] = useState([]);
  const [sales, setSales] = useState([]);
  const [payments, setPayments] = useState([]);
  const [inventoryStats, setInventoryStats] = useState({});
  const [loading, setLoading] = useState(true);

  const [activePreset, setActivePreset] = useState("this_month");
  const [dateRange, setDateRange] = useState(getPresetRange("this_month"));

  /* ──────── LOAD ──────── */
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const [inwardsData, salesData, paymentsData, invStats] = await Promise.all([
          inwardApi.getAll(),
          salesApi.getAll(),
          paymentApi.getAll(),
          inventoryApi.getStats(),
        ]);
        setInwards(inwardsData);
        setSales(salesData);
        setPayments(paymentsData);
        setInventoryStats(invStats);
      } catch (err) {
        alert("Failed to load: " + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ──────── DATE FILTER ──────── */
  const filterByDate = useCallback((list, dateField) => {
    if (!dateRange.from && !dateRange.to) return list;
    return list.filter((item) => {
      const d = new Date(item[dateField] || item.createdAt);
      if (dateRange.from) {
        const from = new Date(dateRange.from);
        from.setHours(0, 0, 0, 0);
        if (d < from) return false;
      }
      if (dateRange.to) {
        const to = new Date(dateRange.to);
        to.setHours(23, 59, 59, 999);
        if (d > to) return false;
      }
      return true;
    });
  },[dateRange]);

  const periodInwards  = useMemo(() => filterByDate(inwards, "entryDate"), [inwards, filterByDate]);
  const periodSales    = useMemo(() => filterByDate(sales, "saleDate"), [sales, filterByDate]);
  const periodPayments = useMemo(() => filterByDate(payments, "paymentDate"), [payments, filterByDate]);

  /* ──────── BUSINESS METRICS ──────── */
  const metrics = useMemo(() => {
    const totalPurchase = periodInwards.reduce(
      (s, i) => s + (i.baseCurrencyTotal || (i.totalMeter * i.rate) || 0), 0
    );
    const totalSales = periodSales.reduce((s, x) => s + (x.netAmount || 0), 0);
    const totalCollected = periodPayments.reduce((s, p) => s + (p.amountReceived || 0), 0);
    const totalOutstanding = sales.reduce((s, x) => s + (x.balanceDue || 0), 0); // all-time outstanding

    const grossProfit = totalSales - totalPurchase;
    const profitMargin = totalSales > 0 ? ((grossProfit / totalSales) * 100).toFixed(2) : 0;

    const inwardEntries = periodInwards.length;
    const salesCount = periodSales.length;
    const paymentCount = periodPayments.length;

    const totalInwardPcs = periodInwards.reduce((s, i) => s + (i.totalPcs || 0), 0);
    const totalSalesPcs  = periodSales.reduce((s, x) => s + (x.totalPcs || 0), 0);

    const avgSaleValue = salesCount > 0 ? totalSales / salesCount : 0;
    const avgPurchaseValue = inwardEntries > 0 ? totalPurchase / inwardEntries : 0;

    return {
      totalPurchase, totalSales, totalCollected, totalOutstanding,
      grossProfit, profitMargin,
      inwardEntries, salesCount, paymentCount,
      totalInwardPcs, totalSalesPcs,
      avgSaleValue, avgPurchaseValue,
    };
  }, [periodInwards, periodSales, periodPayments, sales]);

  /* ──────── CHART: Daily Activity ──────── */
  const dailyTrend = useMemo(() => {
    if (periodInwards.length === 0 && periodSales.length === 0) return [];

    // Bucket by date — last 30 days or selected range
    const buckets = {};
    const now = new Date();
    const start = dateRange.from ? new Date(dateRange.from) : new Date(now.setDate(now.getDate() - 30));
    const end = dateRange.to ? new Date(dateRange.to) : new Date();

    const days = Math.min(Math.floor((end - start) / (1000 * 60 * 60 * 24)) + 1, 60);
    const step = days > 30 ? Math.ceil(days / 15) : 1;

    for (let i = 0; i < days; i += step) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { day: formatShortDate(d), Purchase: 0, Sales: 0, Collection: 0, _date: d };
    }

    const bucketKeys = Object.keys(buckets).sort();
    const findNearestBucket = (date) => {
      let nearest = bucketKeys[0];
      for (const k of bucketKeys) if (new Date(k) <= date) nearest = k;
      return nearest;
    };

    periodInwards.forEach((i) => {
      const d = new Date(i.entryDate || i.createdAt);
      const key = findNearestBucket(d);
      if (buckets[key]) buckets[key].Purchase += i.baseCurrencyTotal || (i.totalMeter * i.rate) || 0;
    });
    periodSales.forEach((s) => {
      const d = new Date(s.saleDate || s.createdAt);
      const key = findNearestBucket(d);
      if (buckets[key]) buckets[key].Sales += s.netAmount || 0;
    });
    periodPayments.forEach((p) => {
      const d = new Date(p.paymentDate || p.createdAt);
      const key = findNearestBucket(d);
      if (buckets[key]) buckets[key].Collection += p.amountReceived || 0;
    });

    return Object.values(buckets);
  }, [periodInwards, periodSales, periodPayments, dateRange]);

  /* ──────── TOP CUSTOMERS ──────── */
  const topCustomers = useMemo(() => {
    const totals = {};
    periodSales.forEach((s) => {
      const name = s.customer?.name || "Unknown";
      totals[name] = (totals[name] || 0) + (s.netAmount || 0);
    });
    return Object.entries(totals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [periodSales]);

  /* ──────── TOP SUPPLIERS ──────── */
  const topSuppliers = useMemo(() => {
    const totals = {};
    periodInwards.forEach((i) => {
      const name = i.supplier?.name || "Unknown";
      totals[name] = (totals[name] || 0) + (i.baseCurrencyTotal || (i.totalMeter * i.rate) || 0);
    });
    return Object.entries(totals)
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [periodInwards]);

  /* ──────── PAYMENT MODE PIE ──────── */
  const paymentModeData = useMemo(() => {
    const totals = {};
    periodPayments.forEach((p) => {
      const mode = p.paymentMode?.name || "Other";
      totals[mode] = (totals[mode] || 0) + (p.amountReceived || 0);
    });
    return Object.entries(totals)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [periodPayments]);

  /* ──────── TOP FABRICS (sold) ──────── */
  const topFabrics = useMemo(() => {
    const totals = {};
    periodSales.forEach((s) => {
      (s.items || []).forEach((item) => {
        const name = item.fabric?.name || "Unknown";
        totals[name] = (totals[name] || 0) + (item.totalMeter || 0);
      });
    });
    return Object.entries(totals)
      .map(([name, meter]) => ({ name, meter }))
      .sort((a, b) => b.meter - a.meter)
      .slice(0, 5);
  }, [periodSales]);

  /* ──────── HANDLERS ──────── */
  const applyPreset = (preset) => {
    setActivePreset(preset);
    setDateRange(getPresetRange(preset));
  };

  const exportCSV = () => {
    const sections = [
      ["BUSINESS SUMMARY REPORT"],
      ["Period:", dateRangeLabel],
      ["Generated:", formatDate(new Date())],
      [],
      ["KEY METRICS"],
      ["Metric", "Value"],
      ["Total Purchase", metrics.totalPurchase.toFixed(2)],
      ["Total Sales", metrics.totalSales.toFixed(2)],
      ["Gross Profit", metrics.grossProfit.toFixed(2)],
      ["Profit Margin (%)", metrics.profitMargin],
      ["Total Collected", metrics.totalCollected.toFixed(2)],
      ["Outstanding (All Time)", metrics.totalOutstanding.toFixed(2)],
      [],
      ["TRANSACTION COUNTS"],
      ["Inward Entries", metrics.inwardEntries],
      ["Sales Count", metrics.salesCount],
      ["Payment Count", metrics.paymentCount],
      ["Total Inward PCS", metrics.totalInwardPcs],
      ["Total Sales PCS", metrics.totalSalesPcs],
      [],
      ["TOP 5 CUSTOMERS"],
      ["Name", "Total Sales"],
      ...topCustomers.map((c) => [c.name, c.amount.toFixed(2)]),
      [],
      ["TOP 5 SUPPLIERS"],
      ["Name", "Total Purchase"],
      ...topSuppliers.map((s) => [s.name, s.amount.toFixed(2)]),
      [],
      ["TOP 5 FABRICS SOLD"],
      ["Fabric", "Meter Sold"],
      ...topFabrics.map((f) => [f.name, f.meter.toFixed(2)]),
    ];

    const csvContent = sections
      .map((row) =>
        row.map((cell) => {
          const str = String(cell ?? "");
          if (str.includes(",") || str.includes('"') || str.includes("\n")) {
            return `"${str.replace(/"/g, '""')}"`;
          }
          return str;
        }).join(",")
      ).join("\n");

    const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `summary-report-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const dateRangeLabel = useMemo(() => {
    if (!dateRange.from && !dateRange.to) return "All Time";
    return `${formatDate(dateRange.from)} — ${formatDate(dateRange.to)}`;
  }, [dateRange]);

  if (loading) {
    return (
      <div className="smry-page">
        <div style={{ padding: 60, textAlign: "center", color: "#64748b" }}>
          Loading business overview...
        </div>
      </div>
    );
  }

  return (
    <div className="smry-page">
      {/* HEADER */}
      <div className="smry-page__header no-print">
        <div>
          <h1 className="smry-page__title">Business Summary Report</h1>
          <div className="smry-breadcrumb">
            <span>Home</span>
            <span className="smry-breadcrumb__sep">/</span>
            <span>Reports</span>
            <span className="smry-breadcrumb__sep">/</span>
            <span className="smry-breadcrumb__current">Summary</span>
          </div>
        </div>
        <div className="smry-page__actions">
          <button className="smry-btn smry-btn--ghost" onClick={() => navigate("/dashboard/reports")}>
            <Icon.ArrowLeft /><span>Back to Reports</span>
          </button>
          <button className="smry-btn smry-btn--ghost" onClick={exportCSV}>
            <Icon.Download /><span>Export CSV</span>
          </button>
          <button className="smry-btn smry-btn--primary" onClick={() => window.print()}>
            <Icon.Printer /><span>Print</span>
          </button>
        </div>
      </div>

      {/* PRESETS */}
      <div className="smry-presets no-print">
        {DATE_PRESETS.map((p) => (
          <button
            key={p.key}
            className={`smry-preset ${activePreset === p.key ? "smry-preset--active" : ""}`}
            onClick={() => applyPreset(p.key)}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* PRINT AREA */}
      <div className="smry-print-area">
        <div className="print-only smry-print-header">
          <h1>Business Summary Report</h1>
          <div className="smry-print-meta">
            <div><strong>Period:</strong> {dateRangeLabel}</div>
            <div><strong>Generated:</strong> {formatDate(new Date())}</div>
          </div>
        </div>

        <div className="smry-period-banner no-print">
          <Icon.Activity />
          <span>Business Performance for <strong>{dateRangeLabel}</strong></span>
        </div>

        {/* TOP KPI ROW */}
        <div className="smry-kpis">
          <KPICard
            label="Total Purchase"
            value={fmtINRCompact(metrics.totalPurchase)}
            fullValue={fmtINR(metrics.totalPurchase)}
            hint={`${metrics.inwardEntries} entries`}
            icon={<Icon.ShoppingBag />}
            tone="blue"
          />
          <KPICard
            label="Total Sales"
            value={fmtINRCompact(metrics.totalSales)}
            fullValue={fmtINR(metrics.totalSales)}
            hint={`${metrics.salesCount} invoices`}
            icon={<Icon.Cart />}
            tone="purple"
          />
          <KPICard
            label="Gross Profit"
            value={fmtINRCompact(metrics.grossProfit)}
            fullValue={fmtINR(metrics.grossProfit)}
            hint={`${metrics.profitMargin}% margin`}
            icon={metrics.grossProfit >= 0 ? <Icon.TrendUp /> : <Icon.TrendDown />}
            tone={metrics.grossProfit >= 0 ? "green" : "red"}
          />
          <KPICard
            label="Total Collected"
            value={fmtINRCompact(metrics.totalCollected)}
            fullValue={fmtINR(metrics.totalCollected)}
            hint={`${metrics.paymentCount} payments`}
            icon={<Icon.Wallet />}
            tone="amber"
          />
          <KPICard
            label="Outstanding"
            value={fmtINRCompact(metrics.totalOutstanding)}
            fullValue={fmtINR(metrics.totalOutstanding)}
            hint="All-time dues"
            icon={<Icon.AlertTriangle />}
            tone="red"
          />
        </div>

        {/* INVENTORY OVERVIEW */}
        <div className="smry-inv">
          <div className="smry-inv__card smry-inv__card--blue">
            <div className="smry-inv__label">Stock Items</div>
            <div className="smry-inv__value">{fmtInt(inventoryStats.totalItems || 0)}</div>
            <div className="smry-inv__hint">Unique combinations</div>
          </div>
          <div className="smry-inv__card smry-inv__card--green">
            <div className="smry-inv__label">Stock Value</div>
            <div className="smry-inv__value">{fmtINRCompact(inventoryStats.totalValue || 0)}</div>
            <div className="smry-inv__hint">Current inventory worth</div>
          </div>
          <div className="smry-inv__card smry-inv__card--purple">
            <div className="smry-inv__label">Total Stock (Meter)</div>
            <div className="smry-inv__value">{fmtInt(inventoryStats.totalStockMtr || 0)}</div>
            <div className="smry-inv__hint">Total fabric available</div>
          </div>
          <div className="smry-inv__card smry-inv__card--amber">
            <div className="smry-inv__label">Low Stock</div>
            <div className="smry-inv__value">{fmtInt(inventoryStats.lowStockItems || 0)}</div>
            <div className="smry-inv__hint">Need replenishment</div>
          </div>
          <div className="smry-inv__card smry-inv__card--red">
            <div className="smry-inv__label">Out of Stock</div>
            <div className="smry-inv__value">{fmtInt(inventoryStats.outOfStockItems || 0)}</div>
            <div className="smry-inv__hint">Zero quantity</div>
          </div>
        </div>

        {/* MAIN CHART — Cash Flow Trend */}
        <div className="smry-card">
          <div className="smry-card-head">
            <h3 className="smry-card__title">Cash Flow Trend</h3>
            <div className="smry-card__legend">
              <span className="smry-dot smry-dot--blue"></span> Purchase
              <span className="smry-dot smry-dot--purple"></span> Sales
              <span className="smry-dot smry-dot--green"></span> Collection
            </div>
          </div>
          <div className="smry-chart">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={dailyTrend} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} tickFormatter={(v) => fmtINRCompact(v).replace("₹ ", "")} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                  formatter={(v) => fmtINR(v)}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Purchase"   stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Sales"      stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Collection" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* TWO COLUMN: Top Customers + Top Suppliers */}
        <div className="smry-grid-2">
          {/* Top Customers — Bar Chart */}
          <div className="smry-card">
            <h3 className="smry-card__title smry-mb-12">Top 5 Customers</h3>
            {topCustomers.length === 0 ? (
              <div className="smry-empty">No sales in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topCustomers} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => fmtINRCompact(v).replace("₹ ", "")} fontSize={11} stroke="#6b7280" />
                  <YAxis type="category" dataKey="name" width={120} fontSize={11} stroke="#6b7280" />
                  <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#8b5cf6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top Suppliers — Bar Chart */}
          <div className="smry-card">
            <h3 className="smry-card__title smry-mb-12">Top 5 Suppliers</h3>
            {topSuppliers.length === 0 ? (
              <div className="smry-empty">No purchases in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topSuppliers} layout="vertical" margin={{ left: 10, right: 16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" horizontal={false} />
                  <XAxis type="number" tickFormatter={(v) => fmtINRCompact(v).replace("₹ ", "")} fontSize={11} stroke="#6b7280" />
                  <YAxis type="category" dataKey="name" width={120} fontSize={11} stroke="#6b7280" />
                  <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="amount" fill="#3b82f6" radius={[0, 6, 6, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* TWO COLUMN: Payment Mode + Top Fabrics */}
        <div className="smry-grid-2">
          {/* Payment Mode Pie */}
          <div className="smry-card">
            <h3 className="smry-card__title smry-mb-12">Collection by Payment Mode</h3>
            {paymentModeData.length === 0 ? (
              <div className="smry-empty">No payments in this period</div>
            ) : (
              <div className="smry-pie-wrap">
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={paymentModeData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={90}
                      paddingAngle={2}
                    >
                      {paymentModeData.map((_, idx) => (
                        <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmtINR(v)} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="smry-pie-legend">
                  {paymentModeData.map((m, idx) => (
                    <div key={m.name} className="smry-pie-legend__row">
                      <span className="smry-pie-legend__dot" style={{ background: CHART_COLORS[idx % CHART_COLORS.length] }} />
                      <span className="smry-pie-legend__name">{m.name}</span>
                      <span className="smry-pie-legend__val">{fmtINRCompact(m.value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Top Fabrics Sold */}
          <div className="smry-card">
            <h3 className="smry-card__title smry-mb-12">Top Fabrics Sold (by Meter)</h3>
            {topFabrics.length === 0 ? (
              <div className="smry-empty">No fabrics sold in this period</div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={topFabrics} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="name" fontSize={11} stroke="#6b7280" />
                  <YAxis fontSize={11} stroke="#6b7280" />
                  <Tooltip formatter={(v) => fmtNum(v) + " m"} contentStyle={{ borderRadius: 8, fontSize: 12 }} />
                  <Bar dataKey="meter" fill="#10b981" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* QUICK STATS TABLE */}
        <div className="smry-card">
          <h3 className="smry-card__title smry-mb-12">Quick Business Stats</h3>
          <div className="smry-quick-stats">
            <QuickStat label="Avg Sale Value"     value={fmtINR(metrics.avgSaleValue)} />
            <QuickStat label="Avg Purchase Value" value={fmtINR(metrics.avgPurchaseValue)} />
            <QuickStat label="Inward PCS"         value={fmtInt(metrics.totalInwardPcs)} />
            <QuickStat label="Sales PCS"          value={fmtInt(metrics.totalSalesPcs)} />
            <QuickStat label="Collection Rate"
              value={metrics.totalSales > 0 ? ((metrics.totalCollected / metrics.totalSales) * 100).toFixed(1) + "%" : "0%"} />
            <QuickStat label="Profit Margin"
              value={metrics.profitMargin + "%"}
              tone={metrics.grossProfit >= 0 ? "green" : "red"} />
          </div>
        </div>
      </div>

      <style>{`
        .smry-page, .smry-page * { box-sizing: border-box; }
        .smry-page {
          --smry-text: #0f172a; --smry-muted: #64748b; --smry-label: #475569;
          --smry-card: #ffffff; --smry-border: #e5e7eb;
          --smry-primary: #2563eb; --smry-primary-hover: #1d4ed8;
          --smry-danger: #ef4444; --smry-success: #10b981; --smry-warning: #f59e0b;
          --smry-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 1px 3px rgba(0,0,0,0.06);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--smry-text); font-size: 14px; line-height: 1.4;
          display: flex; flex-direction: column; gap: 16px;
        }
        .smry-page svg { width: 16px; height: 16px; display: block; }
        .print-only { display: none; }
        .smry-mb-12 { margin-bottom: 20px; }

        .smry-page__header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 16px; flex-wrap: wrap;
        }
        .smry-page__title { font-size: 24px; font-weight: 700; margin: 0 0 4px 0; }
        .smry-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--smry-muted); font-size: 13px; flex-wrap: wrap; }
        .smry-breadcrumb__sep { color: #cbd5e1; }
        .smry-breadcrumb__current { color: var(--smry-primary); font-weight: 500; }
        .smry-page__actions { display: flex; gap: 8px; flex-wrap: wrap; }

        .smry-btn {
          display: inline-flex; align-items: center; gap: 8px;
          padding: 9px 16px; border-radius: 8px;
          font-size: 14px; font-weight: 500;
          cursor: pointer; border: 1px solid transparent;
          transition: all 0.15s; background: #fff;
          font-family: inherit; white-space: nowrap;
        }
        .smry-btn--ghost { background: #fff; border-color: var(--smry-border); color: var(--smry-text); }
        .smry-btn--ghost:hover { background: #f8fafc; }
        .smry-btn--primary { background: var(--smry-primary); color: #fff; border-color: var(--smry-primary); }
        .smry-btn--primary:hover { background: var(--smry-primary-hover); }

        .smry-presets { display: flex; flex-wrap: wrap; gap: 8px; }
        .smry-preset {
          padding: 7px 14px; border: 1px solid var(--smry-border);
          background: #fff; border-radius: 20px;
          font-size: 13px; font-weight: 500;
          color: var(--smry-label); cursor: pointer;
          transition: all 0.15s; font-family: inherit;
        }
        .smry-preset:hover { border-color: var(--smry-primary); color: var(--smry-primary); }
        .smry-preset--active { background: var(--smry-primary); color: #fff; border-color: var(--smry-primary); }

        .smry-card {
          background: var(--smry-card); border: 1px solid var(--smry-border);
          border-radius: 12px; padding: 18px;
          box-shadow: var(--smry-shadow);
          margin-bottom: 20px;
        }
        .smry-card__title { font-size: 15px; font-weight: 600; margin: 0; }
        .smry-card-head {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px; flex-wrap: wrap; gap: 8px;
        }
        .smry-card__legend {
          display: flex; gap: 14px; flex-wrap: wrap;
          font-size: 12px; color: var(--smry-muted);
          align-items: center;
        }
        .smry-dot { width: 10px; height: 10px; border-radius: 50%; display: inline-block; margin-right: 4px; }
        .smry-dot--blue   { background: #3b82f6; }
        .smry-dot--purple { background: #8b5cf6; }
        .smry-dot--green  { background: #10b981; }

        .smry-period-banner {
          background: #eff6ff; border: 1px solid #bfdbfe;
          border-radius: 10px; padding: 12px 18px;
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #1e40af;
          margin-bottom: 20px;
        }
        .smry-period-banner svg { color: var(--smry-primary); }

        /* KPIs */
        .smry-kpis {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .smry-kpi {
          background: var(--smry-card); border: 1px solid var(--smry-border);
          border-radius: 12px; padding: 16px;
          box-shadow: var(--smry-shadow);
          display: flex; flex-direction: column;
          gap: 8px;
          position: relative; overflow: hidden;
        }
        .smry-kpi::before {
          content: ""; position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
        }
        .smry-kpi--blue::before   { background: #3b82f6; }
        .smry-kpi--purple::before { background: #8b5cf6; }
        .smry-kpi--green::before  { background: #10b981; }
        .smry-kpi--amber::before  { background: #f59e0b; }
        .smry-kpi--red::before    { background: #ef4444; }
        .smry-kpi__head {
          display: flex; align-items: center; justify-content: space-between;
        }
        .smry-kpi__icon {
          width: 36px; height: 36px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
        }
        .smry-kpi__icon svg { width: 18px; height: 18px; }
        .smry-kpi--blue .smry-kpi__icon   { background: #dbeafe; color: #2563eb; }
        .smry-kpi--purple .smry-kpi__icon { background: #f3e8ff; color: #9333ea; }
        .smry-kpi--green .smry-kpi__icon  { background: #d1fae5; color: #059669; }
        .smry-kpi--amber .smry-kpi__icon  { background: #fef3c7; color: #d97706; }
        .smry-kpi--red .smry-kpi__icon    { background: #fee2e2; color: #dc2626; }
        .smry-kpi__label { font-size: 12px; color: var(--smry-muted); }
        .smry-kpi__value { font-size: 22px; font-weight: 700; line-height: 1.2; }
        .smry-kpi__full { font-size: 11px; color: var(--smry-muted); }
        .smry-kpi__hint { font-size: 11px; color: var(--smry-muted); font-style: italic; }

        /* Inventory */
        .smry-inv {
          display: grid; grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          margin-bottom: 20px;
        }
        .smry-inv__card {
          background: var(--smry-card); border: 1px solid var(--smry-border);
          border-radius: 12px; padding: 16px;
          box-shadow: var(--smry-shadow);
          border-left: 4px solid transparent;
        }
        .smry-inv__card--blue   { border-left-color: #3b82f6; }
        .smry-inv__card--green  { border-left-color: #10b981; }
        .smry-inv__card--purple { border-left-color: #9333ea; }
        .smry-inv__card--amber  { border-left-color: #f59e0b; }
        .smry-inv__card--red    { border-left-color: #ef4444; }
        .smry-inv__label { font-size: 12px; color: var(--smry-muted); margin-bottom: 6px; }
        .smry-inv__value { font-size: 22px; font-weight: 700; line-height: 1.2; margin-bottom: 4px; }
        .smry-inv__hint { font-size: 11px; color: var(--smry-muted); }

        /* Chart wrapper */
        .smry-chart { width: 100%; }
        .smry-empty {
          text-align: center; padding: 40px;
          color: var(--smry-muted); font-size: 13px;
        }

        /* Pie */
        .smry-pie-wrap {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px; align-items: center;
        }
        .smry-pie-legend { display: flex; flex-direction: column; gap: 8px; }
        .smry-pie-legend__row {
          display: flex; align-items: center; gap: 8px;
          font-size: 12px;
        }
        .smry-pie-legend__dot { width: 10px; height: 10px; border-radius: 2px; flex-shrink: 0; }
        .smry-pie-legend__name { flex: 1; }
        .smry-pie-legend__val { font-weight: 600; color: var(--smry-text); }

        /* Grids */
        .smry-grid-2 {
          display: grid; grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* Quick stats */
        .smry-quick-stats {
          display: grid; grid-template-columns: repeat(6, 1fr);
          gap: 12px;
        }
        .smry-qstat {
          padding: 14px;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #e2e8f0;
        }
        .smry-qstat__label { font-size: 11px; color: var(--smry-muted); margin-bottom: 6px; }
        .smry-qstat__value { font-size: 16px; font-weight: 700; }
        .smry-qstat__value--green { color: var(--smry-success); }
        .smry-qstat__value--red { color: var(--smry-danger); }

        /* RESPONSIVE */
        @media (max-width: 1400px) {
          .smry-kpis { grid-template-columns: repeat(3, 1fr); }
          .smry-inv { grid-template-columns: repeat(3, 1fr); }
          .smry-quick-stats { grid-template-columns: repeat(3, 1fr); }
        }
        @media (max-width: 1100px) {
          .smry-grid-2 { grid-template-columns: 1fr; }
          .smry-pie-wrap { grid-template-columns: 1fr; }
        }
        @media (max-width: 768px) {
          .smry-page__title { font-size: 20px; }
          .smry-kpis { grid-template-columns: repeat(2, 1fr); }
          .smry-inv { grid-template-columns: repeat(2, 1fr); }
          .smry-quick-stats { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 560px) {
          .smry-kpis { grid-template-columns: 1fr; }
          .smry-inv { grid-template-columns: 1fr; }
          .smry-quick-stats { grid-template-columns: 1fr; }
          .smry-page__actions { width: 100%; }
          .smry-page__actions .smry-btn { flex: 1; justify-content: center; }
          .smry-preset { padding: 6px 12px; font-size: 12px; }
        }

        /* PRINT */
        @media print {
          body * { visibility: hidden; }
          .smry-print-area, .smry-print-area * { visibility: visible; }
          .smry-print-area { position: absolute; left: 0; top: 0; width: 100%; }
          .no-print { display: none !important; }
          .print-only { display: block !important; }

          .smry-print-header {
            text-align: center; margin-bottom: 20px;
            padding-bottom: 14px; border-bottom: 2px solid #000;
          }
          .smry-print-header h1 { font-size: 22px; margin: 0 0 8px 0; }
          .smry-print-meta { display: flex; justify-content: center; gap: 30px; font-size: 12px; }

          .smry-kpis, .smry-inv { grid-template-columns: repeat(5, 1fr); gap: 8px; }
          .smry-kpi, .smry-inv__card { padding: 10px; border: 1px solid #ccc; box-shadow: none; }
          .smry-kpi::before { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          .smry-kpi__value, .smry-inv__value { font-size: 15px; }
          .smry-card { border: 1px solid #ccc; box-shadow: none; page-break-inside: avoid; }
          .smry-quick-stats { grid-template-columns: repeat(6, 1fr); gap: 8px; }
        }
      `}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
function KPICard({ label, value, fullValue, hint, icon, tone }) {
  return (
    <div className={`smry-kpi smry-kpi--${tone}`}>
      <div className="smry-kpi__head">
        <div className="smry-kpi__label">{label}</div>
        <div className="smry-kpi__icon">{icon}</div>
      </div>
      <div className="smry-kpi__value" title={fullValue}>{value}</div>
      <div className="smry-kpi__hint">{hint}</div>
    </div>
  );
}

function QuickStat({ label, value, tone }) {
  return (
    <div className="smry-qstat">
      <div className="smry-qstat__label">{label}</div>
      <div className={`smry-qstat__value ${tone ? `smry-qstat__value--${tone}` : ""}`}>{value}</div>
    </div>
  );
}
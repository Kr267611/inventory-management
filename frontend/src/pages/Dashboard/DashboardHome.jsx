import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer,
} from "recharts";
import { inventoryApi } from "../../Api/inventoryApi";
import { inwardApi } from "../../Api/inwardApi";
import { salesApi } from "../../Api/sales";
import {paymentApi} from "../../Api/paymentApi";

const fmtINR = (n) =>
  Number(n || 0).toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", {
    day: "numeric", month: "short", year: "numeric",
  });
};

const formatShortDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

function DashboardHome() {
  const navigate = useNavigate();

  const [inventoryStats, setInventoryStats] = useState({
    totalItems: 0, totalStockMtr: 0, totalValue: 0,
    lowStockItems: 0, outOfStockItems: 0,
  });
  const [inwards, setInwards] = useState([]);
  const [payments, setPayments] = useState([]);
  const [sales, setSales] = useState([]);
  const [lowStockList, setLowStockList] = useState([]);
  const [loading, setLoading] = useState(true);

  /* ──────── LOAD ALL DASHBOARD DATA ──────── */
  const loadData = async () => {
    try {
      setLoading(true);
      const [invStatsData, inwardsData, salesData, lowStockData, paymentsData] = await Promise.all([
        inventoryApi.getStats(),
        inwardApi.getAll(),
        salesApi.getAll(),
        inventoryApi.getAll({ stockType: "Low Stock" }),
        paymentApi.getAll(),
      ]);
      setInventoryStats(invStatsData);
      setInwards(inwardsData);
      setSales(salesData);
      setLowStockList(lowStockData);
      setPayments(paymentsData);
    } catch (err) {
      console.error("Dashboard load failed:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  /* ──────── TODAY's INWARD / SALES ──────── */
  const todayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const inwardToday = inwards.filter((i) => {
      const d = new Date(i.entryDate || i.createdAt);
      return d >= today && d < tomorrow;
    });
    const salesToday = sales.filter((s) => {
      const d = new Date(s.saleDate || s.createdAt);
      return d >= today && d < tomorrow;
    });

    return {
      inwardCount: inwardToday.length,
      inwardPcs: inwardToday.reduce((sum, i) => sum + (i.totalPcs || 0), 0),
      salesCount: salesToday.length,
      salesPcs: salesToday.reduce((sum, s) => sum + (s.totalPcs || 0), 0),
      salesAmount: salesToday.reduce((sum, s) => sum + (s.netAmount || 0), 0),
    };
  }, [inwards, sales]);

  /* ──────── YESTERDAY for comparison ──────── */
  const yesterdayStats = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const inwardYest = inwards.filter((i) => {
      const d = new Date(i.entryDate || i.createdAt);
      return d >= yesterday && d < today;
    });
    const salesYest = sales.filter((s) => {
      const d = new Date(s.saleDate || s.createdAt);
      return d >= yesterday && d < today;
    });

    return {
      inwardPcs: inwardYest.reduce((sum, i) => sum + (i.totalPcs || 0), 0),
      salesPcs: salesYest.reduce((sum, s) => sum + (s.totalPcs || 0), 0),
    };
  }, [inwards, sales]);

  /* ──────── STAT CARDS ──────── */
  const stats = useMemo(() => {
    const inwardDiff = todayStats.inwardPcs - yesterdayStats.inwardPcs;
    const salesDiff = todayStats.salesPcs - yesterdayStats.salesPcs;

    return [
      {
        title: "Total Stock",
        value: fmtINR(inventoryStats.totalStockMtr) + " m",
        change: inventoryStats.totalItems + " bales",   // 🆕 items → bales
        changeText: "in inventory",
        icon: "📦", color: "#2563eb", bg: "#dbeafe",
        positive: true,
      },
      {
        title: "Inward Today",
        value: String(todayStats.inwardPcs),
        change: (inwardDiff >= 0 ? "+" : "") + inwardDiff,
        changeText: "PCS from yesterday",
        icon: "📥", color: "#16a34a", bg: "#dcfce7",
        positive: inwardDiff >= 0,
      },
      {
        title: "Sales Today",
        value: String(todayStats.salesPcs),
        change: (salesDiff >= 0 ? "+" : "") + salesDiff,
        changeText: "PCS from yesterday",
        icon: "🛒", color: "#f59e0b", bg: "#fef3c7",
        positive: salesDiff >= 0,
      },
      {
        title: "Low Stock Items",
        value: String(inventoryStats.lowStockItems),
        change: "View all",
        changeText: "",
        icon: "⚠️", color: "#ef4444", bg: "#fee2e2",
        isAlert: true,
      },
    ];
  }, [inventoryStats, todayStats, yesterdayStats]);

  /* ──────── RECENT INWARD (last 5) ──────── */
  const recentInwards = useMemo(() => {
    return inwards.slice(0, 5).map((i) => ({
      date: formatDate(i.entryDate || i.createdAt),
      baleNo: i.baleNo || "-",                    // 🆕
      supplier: i.supplier?.name || "-",
      item: i.fabric?.name || "-",
      qty: i.totalPcs || 0,
      rate: i.rate || 0,
      total: i.baseCurrencyTotal || (i.totalMeter * i.rate) || 0,
    }));
  }, [inwards]);


  /* ──────── RECENT PAYMENTS (last 5) ──────── */
const recentPayments = useMemo(() => {
  return payments.slice(0, 5).map((p) => ({
    date: formatDate(p.paymentDate || p.createdAt),
    customer: p.customer?.name || "-",
    invoice: p.sale?.invoiceNo || (p.isAdvance ? "Advance" : "-"),
    mode: p.paymentMode?.name || "-",
    amount: p.amountReceived || 0,
    status: p.status || "-",
  }));
}, [payments]);

  /* ──────── RECENT SALES (last 5) ──────── */
  const recentSales = useMemo(() => {
    return sales.slice(0, 5).map((s) => ({
      date: formatDate(s.saleDate || s.createdAt),
      // 🆕 Unique bales from items
      bales: [...new Set((s.items || []).map((it) => it.baleNo).filter(Boolean))],
      customer: s.customer?.name || "-",
      invoice: s.invoiceNo,
      qty: s.totalPcs || 0,
      total: s.netAmount || 0,
      status: s.paymentStatus || "Unpaid",
    }));
  }, [sales]);

  /* ──────── CHART DATA (last 30 days, group by 5-day buckets) ──────── */
  const chartData = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const days = 30;
    const buckets = {};

    for (let i = days; i >= 0; i -= 5) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      buckets[key] = { day: formatShortDate(d), Inward: 0, Sales: 0 };
    }

    const bucketKeys = Object.keys(buckets).sort();

    inwards.forEach((inw) => {
      const d = new Date(inw.entryDate || inw.createdAt);
      let nearest = bucketKeys[0];
      for (const k of bucketKeys) if (new Date(k) <= d) nearest = k;
      if (buckets[nearest]) buckets[nearest].Inward += inw.totalPcs || 0;
    });

    sales.forEach((s) => {
      const d = new Date(s.saleDate || s.createdAt);
      let nearest = bucketKeys[0];
      for (const k of bucketKeys) if (new Date(k) <= d) nearest = k;
      if (buckets[nearest]) buckets[nearest].Sales += s.totalPcs || 0;
    });

    return Object.values(buckets);
  }, [inwards, sales]);

  /* ──────── LOW STOCK TABLE ──────── */
  const lowStock = useMemo(() => {
    return lowStockList.slice(0, 5).map((inv) => ({
      baleNo: inv.baleNo || "-",                  // 🆕
      item: inv.fabric?.name || "-",
      color: inv.color?.name || "-",
      available: inv.availablePcs || 0,           // 🆕 BUG FIX: was totalPcs
      min: inv.minStockPcs || 2,                  // 🆕 new schema default
    }));
  }, [lowStockList]);

  if (loading) {
    return (
      <div className="dashboard-home">
        <div style={{ padding: 40, textAlign: "center", color: "#64748b" }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-home">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="dashboard-breadcrumb">
          <span className="dashboard-breadcrumb__link">Home</span>
          <span className="dashboard-breadcrumb__sep">/</span>
          <span>Dashboard</span>
        </div>
      </div>

      <div className="dashboard-quick-actions">
  <button
    className="dashboard-quick-card dashboard-quick-card--blue"
    onClick={() => navigate("/dashboard/inward")}
  >
    <div className="dashboard-quick-icon">📥</div>
    <div className="dashboard-quick-text">
      <div className="dashboard-quick-title">New Inward</div>
      <div className="dashboard-quick-sub">Add bale entry</div>
    </div>
    <div className="dashboard-quick-arrow">→</div>
  </button>

  <button
    className="dashboard-quick-card dashboard-quick-card--green"
    onClick={() => navigate("/dashboard/sales")}
  >
    <div className="dashboard-quick-icon">🛒</div>
    <div className="dashboard-quick-text">
      <div className="dashboard-quick-title">New Sale</div>
      <div className="dashboard-quick-sub">Create invoice</div>
    </div>
    <div className="dashboard-quick-arrow">→</div>
  </button>

  <button
    className="dashboard-quick-card dashboard-quick-card--orange"
    onClick={() => navigate("/dashboard/payment")}
  >
    <div className="dashboard-quick-icon">💰</div>
    <div className="dashboard-quick-text">
      <div className="dashboard-quick-title">Add Payment</div>
      <div className="dashboard-quick-sub">Receive money</div>
    </div>
    <div className="dashboard-quick-arrow">→</div>
  </button>

  <button
    className="dashboard-quick-card dashboard-quick-card--purple"
    onClick={() => navigate("/dashboard/inventory")}
  >
    <div className="dashboard-quick-icon">📦</div>
    <div className="dashboard-quick-text">
      <div className="dashboard-quick-title">Inventory</div>
      <div className="dashboard-quick-sub">Stock view</div>
    </div>
    <div className="dashboard-quick-arrow">→</div>
  </button>

  <button
    className="dashboard-quick-card dashboard-quick-card--cyan"
    onClick={() => navigate("/dashboard/reports")}
  >
    <div className="dashboard-quick-icon">📊</div>
    <div className="dashboard-quick-text">
      <div className="dashboard-quick-title">Reports</div>
      <div className="dashboard-quick-sub">View all reports</div>
    </div>
    <div className="dashboard-quick-arrow">→</div>
  </button>

  <button
    className="dashboard-quick-card dashboard-quick-card--pink"
    onClick={() => navigate("/dashboard/reports/party-wise-report")}
  >
    <div className="dashboard-quick-icon">🧾</div>
    <div className="dashboard-quick-text">
      <div className="dashboard-quick-title">Party Ledger</div>
      <div className="dashboard-quick-sub">Customer-wise</div>
    </div>
    <div className="dashboard-quick-arrow">→</div>
  </button>
</div>

      {/* Stats Cards */}
      <div className="dashboard-stats-grid">
        {stats.map((stat, idx) => (
          <div className="dashboard-stat-card" key={idx}>
            <div className="dashboard-stat-icon" style={{ background: stat.bg, color: stat.color }}>
              {stat.icon}
            </div>
            <div className="dashboard-stat-info">
              <p className="dashboard-stat-title">{stat.title}</p>
              <h2 className="dashboard-stat-value">{stat.value}</h2>
              {stat.isAlert ? (
                <span
                  className="dashboard-stat-link"
                  onClick={() => navigate("/dashboard/inventory")}
                >
                  {stat.change}
                </span>
              ) : (
                <p className="dashboard-stat-change">
                  <span className={stat.positive ? "dashboard-positive" : "dashboard-negative"}>
                    {stat.change}
                  </span>{" "}
                  {stat.changeText}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tables Row */}
      <div className="dashboard-tables-grid">
        {/* Recent Inward */}
     {/* Recent Payments */}
<div className="dashboard-card">
  <div className="dashboard-card-header">
    <h3>Recent Payments</h3>
    <button className="dashboard-view-all-btn" onClick={() => navigate("/dashboard/payment")}>
      View All
    </button>
  </div>
  <div className="dashboard-table-wrapper">
    <table className="dashboard-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Customer</th>
          <th>Invoice</th>
          <th>Mode</th>
          <th>Amount</th>
          <th>Status</th>
        </tr>
      </thead>
      <tbody>
        {recentPayments.length === 0 ? (
          <tr><td colSpan="6" className="dashboard-td-empty">No payments yet</td></tr>
        ) : (
          recentPayments.map((row, i) => (
            <tr key={i}>
              <td>{row.date}</td>
              <td>{row.customer}</td>
              <td className="dashboard-td-invoice">
                {row.invoice === "Advance"
                  ? <span className="dashboard-bale-chip">Advance</span>
                  : row.invoice}
              </td>
              <td>{row.mode}</td>
              <td>{fmtINR(row.amount)}</td>
              <td>
                <span className={`dashboard-status dashboard-status--${row.status.toLowerCase()}`}>
                  {row.status}
                </span>
              </td>
            </tr>
          ))
        )}
      </tbody>
    </table>
  </div>
</div>

        {/* Recent Sales */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Recent Sales</h3>
            <button className="dashboard-view-all-btn" onClick={() => navigate("/dashboard/sales")}>
              View All
            </button>
          </div>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Invoice</th>
                  <th>Bales</th>{/* 🆕 */}
                  <th>Customer</th>
                  <th>Qty</th>
                  <th>Total</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recentSales.length === 0 ? (
                  <tr><td colSpan="7" className="dashboard-td-empty">No sales yet</td></tr>
                ) : (
                  recentSales.map((row, i) => (
                    <tr key={i}>
                      <td>{row.date}</td>
                      <td className="dashboard-td-invoice">{row.invoice}</td>
                      {/* 🆕 Bales chips */}
                      <td>
                        {row.bales.length === 0 ? "-" : (
                          <div className="dashboard-bales-list">
                            {row.bales.slice(0, 2).map((b) => (
                              <span key={b} className="dashboard-bale-chip">{b}</span>
                            ))}
                            {row.bales.length > 2 && (
                              <span className="dashboard-bale-more" title={row.bales.slice(2).join(", ")}>
                                +{row.bales.length - 2}
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td>{row.customer}</td>
                      <td>{row.qty}</td>
                      <td>{fmtINR(row.total)}</td>
                      <td>
                        <span className={`dashboard-status dashboard-status--${row.status.toLowerCase()}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Chart + Low Stock Row */}
      <div className="dashboard-bottom-grid">
        {/* Chart */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Inward vs Sales (Last 30 Days)</h3>
          </div>
          <div className="dashboard-chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 10, right: 16, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={11} />
                <YAxis stroke="#6b7280" fontSize={11} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: "1px solid #e5e7eb", fontSize: 12 }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Line type="monotone" dataKey="Inward" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="Sales" stroke="#10b981" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Low Stock */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Low Stock Items</h3>
            <button className="dashboard-view-all-btn" onClick={() => navigate("/dashboard/inventory")}>
              View All
            </button>
          </div>
          <div className="dashboard-table-wrapper">
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Bale No</th>{/* 🆕 */}
                  <th>Item</th>
                  <th>Color</th>
                  <th>Available</th>
                  <th>Min</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.length === 0 ? (
                  <tr><td colSpan="6" className="dashboard-td-empty">All bales well stocked 🎉</td></tr>
                ) : (
                  lowStock.map((row, i) => (
                    <tr key={i}>
                      <td>{row.baleNo !== "-" ? <span className="dashboard-bale-chip">{row.baleNo}</span> : "-"}</td>{/* 🆕 */}
                      <td>{row.item}</td>
                      <td>{row.color}</td>
                      <td>{row.available}</td>
                      <td>{row.min}</td>
                      <td>
                        <span className={`dashboard-badge dashboard-badge--${row.available <= 0 ? "out" : "low"}`}>
                          {row.available <= 0 ? "Out" : "Low"}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <style>{`
        .dashboard-home, .dashboard-home * { box-sizing: border-box; }
        .dashboard-home {
          --dh-text: #111827;
          --dh-muted: #6b7280;
          --dh-label: #4b5563;
          --dh-card: #ffffff;
          --dh-border: #f1f5f9;
          --dh-border-strong: #e5e7eb;
          --dh-primary: #2563eb;
          --dh-primary-hover: #1d4ed8;
          --dh-danger: #ef4444;
          --dh-success: #10b981;
          --dh-warning: #f59e0b;
          --dh-shadow: 0 1px 3px rgba(0,0,0,0.05);
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          color: var(--dh-text);
          display: flex; flex-direction: column; gap: 20px;
          font-size: 14px;
        }

        /* HEADER */
        .dashboard-header {
          display: flex; align-items: flex-start; justify-content: space-between;
          gap: 12px; flex-wrap: wrap;
        }
        .dashboard-header h1 {
          font-size: 24px; font-weight: 700;
          margin: 0 0 4px 0; color: var(--dh-text);
        }
        .dashboard-breadcrumb {
          display: flex; align-items: center; gap: 6px;
          font-size: 13px; color: var(--dh-muted);
        }
        .dashboard-breadcrumb__link { color: var(--dh-primary); cursor: pointer; }
        .dashboard-breadcrumb__sep { color: #cbd5e1; }
        /* 🆕 QUICK ACTIONS — Shortcut cards */
.dashboard-quick-actions {
  display: grid;
  grid-template-columns: repeat(6, 1fr);
  gap: 12px;
}
.dashboard-quick-card {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  font-family: inherit;
  text-align: left;
  transition: all 0.2s;
  box-shadow: var(--dh-shadow);
  position: relative;
  overflow: hidden;
}
.dashboard-quick-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 8px 20px rgba(0,0,0,0.1);
}
.dashboard-quick-card:active { transform: translateY(0); }

.dashboard-quick-icon {
  font-size: 26px;
  flex-shrink: 0;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.1));
}
.dashboard-quick-text {
  flex: 1;
  min-width: 0;
  color: #fff;
}
.dashboard-quick-title {
  font-size: 14px;
  font-weight: 700;
  margin-bottom: 2px;
}
.dashboard-quick-sub {
  font-size: 11px;
  opacity: 0.9;
}
.dashboard-quick-arrow {
  font-size: 18px;
  color: #fff;
  opacity: 0.7;
  transition: transform 0.2s, opacity 0.2s;
  font-weight: 700;
}
.dashboard-quick-card:hover .dashboard-quick-arrow {
  transform: translateX(4px);
  opacity: 1;
}

/* Color variants */
.dashboard-quick-card--blue {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}
.dashboard-quick-card--green {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}
.dashboard-quick-card--orange {
  background: linear-gradient(135deg, #fb923c 0%, #f59e0b 100%);
}
.dashboard-quick-card--purple {
  background: linear-gradient(135deg, #a855f7 0%, #8b5cf6 100%);
}
.dashboard-quick-card--cyan {
  background: linear-gradient(135deg, #06b6d4 0%, #0891b2 100%);
}
.dashboard-quick-card--pink {
  background: linear-gradient(135deg, #ec4899 0%, #db2777 100%);
}


        /* STAT CARDS */
        .dashboard-stats-grid {
          display: grid;
          grid-template-columns: repeat(4, minmax(0, 1fr));
          gap: 16px;
        }
        .dashboard-stat-card {
          background: var(--dh-card);
          border-radius: 12px;
          padding: 18px;
          display: flex; align-items: center; gap: 14px;
          box-shadow: var(--dh-shadow);
          border: 1px solid var(--dh-border);
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .dashboard-stat-card:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0,0,0,0.06);
        }
        .dashboard-stat-icon {
          width: 50px; height: 50px;
          border-radius: 10px;
          display: flex; align-items: center; justify-content: center;
          font-size: 22px; flex-shrink: 0;
        }
        .dashboard-stat-info { flex: 1; min-width: 0; }
        .dashboard-stat-title {
          font-size: 13px;
          color: var(--dh-muted);
          margin: 0 0 4px 0;
        }
        .dashboard-stat-value {
          font-size: 22px;
          font-weight: 700;
          color: var(--dh-text);
          margin: 0 0 4px 0;
          line-height: 1.2;
        }
        .dashboard-stat-change {
          font-size: 12px;
          color: var(--dh-muted);
          margin: 0;
        }
        .dashboard-positive { color: var(--dh-success); font-weight: 600; }
        .dashboard-negative { color: var(--dh-danger); font-weight: 600; }
        .dashboard-stat-link {
          font-size: 13px;
          color: var(--dh-primary);
          text-decoration: none;
          font-weight: 500;
          cursor: pointer;
        }
        .dashboard-stat-link:hover { text-decoration: underline; }

        /* TABLES GRID */
        .dashboard-tables-grid,
        .dashboard-bottom-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
        }

        /* CARD */
        .dashboard-card {
          background: var(--dh-card);
          border-radius: 12px;
          padding: 18px;
          box-shadow: var(--dh-shadow);
          border: 1px solid var(--dh-border);
          min-width: 0;
        }
        .dashboard-card-header {
          display: flex; align-items: center; justify-content: space-between;
          margin-bottom: 14px;
          flex-wrap: wrap; gap: 8px;
        }
        .dashboard-card-header h3 {
          font-size: 15px;
          font-weight: 600;
          color: var(--dh-text);
          margin: 0;
        }
        .dashboard-view-all-btn {
          background: #fff;
          border: 1px solid var(--dh-primary);
          color: var(--dh-primary);
          padding: 5px 14px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          font-family: inherit;
        }
        .dashboard-view-all-btn:hover {
          background: var(--dh-primary);
          color: #fff;
        }

        /* TABLES */
        .dashboard-table-wrapper { overflow-x: auto; }
        .dashboard-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 13px;
          min-width: 480px;
        }
        .dashboard-table thead tr {
          border-bottom: 1px solid var(--dh-border-strong);
        }
        .dashboard-table th {
          text-align: left;
          padding: 10px 8px;
          color: var(--dh-muted);
          font-weight: 600;
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.4px;
          white-space: nowrap;
        }
        .dashboard-table tbody tr {
          border-bottom: 1px solid #f3f4f6;
          transition: background 0.15s;
        }
        .dashboard-table tbody tr:hover { background: #f9fafb; }
        .dashboard-table tbody tr:last-child { border-bottom: none; }
        .dashboard-table td {
          padding: 12px 8px;
          color: #374151;
          white-space: nowrap;
        }
        .dashboard-td-empty {
          text-align: center !important;
          color: #94a3b8 !important;
          padding: 24px !important;
        }
        .dashboard-td-invoice {
          color: var(--dh-primary);
          font-weight: 500;
        }

        /* STATUS BADGES (Sales) */
        .dashboard-status {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .dashboard-status--paid    { background: #d1fae5; color: #047857; }
        .dashboard-status--partial { background: #ffedd5; color: #c2410c; }
        .dashboard-status--unpaid  { background: #fee2e2; color: #b91c1c; }

        /* STOCK BADGES */
        .dashboard-badge {
          display: inline-block;
          padding: 3px 10px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
        }
        .dashboard-badge--low { background: #ffedd5; color: #c2410c; }
        .dashboard-badge--out { background: #fee2e2; color: #b91c1c; }

        /* 🆕 BALE CHIP */
        .dashboard-bales-list {
          display: flex; flex-wrap: wrap; gap: 4px;
          align-items: center;
        }
        .dashboard-bale-chip {
          display: inline-block;
          padding: 2px 8px;
          background: #dbeafe;
          color: #1e40af;
          border-radius: 5px;
          font-family: ui-monospace, SFMono-Regular, monospace;
          font-size: 11px;
          font-weight: 700;
          letter-spacing: 0.3px;
        }
        .dashboard-bale-more {
          display: inline-block;
          padding: 2px 7px;
          background: #f1f5f9;
          color: var(--dh-muted);
          border-radius: 5px;
          font-size: 11px;
          font-weight: 600;
          cursor: help;
        }

        /* CHART */
        .dashboard-chart-wrapper {
          width: 100%;
          margin-top: 8px;
          min-height: 300px;
        }

        /* ────────────────────────────────
           RESPONSIVE BREAKPOINTS
           ──────────────────────────────── */

        /* Large tablet (1200px) — stats stay 4, tables stack early */
       /* Large tablet (1200px) */
@media (max-width: 1200px) {
  .dashboard-quick-actions {
    grid-template-columns: repeat(3, 1fr);  /* 🆕 3 cols */
  }
  .dashboard-stats-grid {
    grid-template-columns: repeat(2, 1fr);
  }
  .dashboard-tables-grid,
  .dashboard-bottom-grid {
    grid-template-columns: 1fr;
  }
}

        /* Small tablet (768px) */
        @media (max-width: 768px) {
          .dashboard-home { gap: 16px; }
          .dashboard-header h1 { font-size: 20px; }
          .dashboard-stat-card { padding: 14px; }
          .dashboard-stat-icon { width: 44px; height: 44px; font-size: 20px; }
          .dashboard-stat-value { font-size: 20px; }
          .dashboard-card { padding: 14px; }
          .dashboard-card-header h3 { font-size: 14px; }
          .dashboard-chart-wrapper { min-height: 260px; }
        }

        /* Mobile (560px) — stats single column */
        @media (max-width: 560px) {
          .dashboard-quick-actions { grid-template-columns: repeat(2, 1fr); }
          .dashboard-stats-grid { grid-template-columns: 1fr; }
          .dashboard-header h1 { font-size: 18px; }
          .dashboard-stat-card { padding: 12px; }
          .dashboard-stat-icon { width: 40px; height: 40px; font-size: 18px; }
          .dashboard-stat-value { font-size: 18px; }
          .dashboard-stat-title { font-size: 12px; }
          .dashboard-card { padding: 12px; }
          .dashboard-view-all-btn {
            font-size: 11px;
            padding: 4px 10px;
          }
          .dashboard-table { font-size: 12px; }
          .dashboard-table th { font-size: 10px; padding: 8px 6px; }
          .dashboard-table td { padding: 10px 6px; }
        }

        /* Very small (400px) — tighter mobile */
        @media (max-width: 400px) {
          .dashboard-stat-card {
            flex-direction: row;
            align-items: center;
          }
          .dashboard-chart-wrapper { min-height: 220px; }
        }
      `}</style>
    </div>
  );
}

export default DashboardHome;
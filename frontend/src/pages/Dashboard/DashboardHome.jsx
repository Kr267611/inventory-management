import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import "./DashboardHome.css";

function DashboardHome() {
  // Stats cards data
  const stats = [
    {
      title: "Total Stock",
      value: "5,430",
      change: "+120",
      changeText: "from last week",
      icon: "📦",
      color: "#2563eb",
      bg: "#dbeafe",
    },
    {
      title: "Inward Today",
      value: "320",
      change: "+45",
      changeText: "from yesterday",
      icon: "📥",
      color: "#16a34a",
      bg: "#dcfce7",
    },
    {
      title: "Sales Today",
      value: "210",
      change: "+30",
      changeText: "from yesterday",
      icon: "🛒",
      color: "#f59e0b",
      bg: "#fef3c7",
    },
    {
      title: "Low Stock Items",
      value: "8",
      change: "View all",
      changeText: "",
      icon: "⚠️",
      color: "#ef4444",
      bg: "#fee2e2",
      isAlert: true,
    },
  ];

  // Recent Inward Entries
  const inwardEntries = [
    { date: "24 May 2025", supplier: "Shree Textiles", item: "Viscose Fabric", qty: 100, rate: 120.0, total: 12000 },
    { date: "24 May 2025", supplier: "Om Fabrics", item: "Cotton Fabric", qty: 80, rate: 110.0, total: 8800 },
    { date: "23 May 2025", supplier: "Shree Textiles", item: "Linen Fabric", qty: 60, rate: 150.0, total: 9000 },
    { date: "23 May 2025", supplier: "Maa Textiles", item: "Viscose Fabric", qty: 70, rate: 125.0, total: 8750 },
    { date: "22 May 2025", supplier: "Om Fabrics", item: "Cotton Fabric", qty: 50, rate: 115.0, total: 5750 },
  ];

  // Recent Sales
  const salesEntries = [
    { date: "24 May 2025", customer: "Riya Boutique", item: "Viscose Fabric", qty: 40, total: 4800 },
    { date: "24 May 2025", customer: "Milan Textiles", item: "Cotton Fabric", qty: 30, total: 3300 },
    { date: "23 May 2025", customer: "Shivam Traders", item: "Linen Fabric", qty: 20, total: 3000 },
    { date: "23 May 2025", customer: "Riya Boutique", item: "Cotton Fabric", qty: 25, total: 2875 },
    { date: "22 May 2025", customer: "Milan Textiles", item: "Viscose Fabric", qty: 35, total: 4375 },
  ];

  // Low Stock Items
  const lowStock = [
    { item: "Viscose Fabric", available: 12, min: 50 },
    { item: "Linen Fabric", available: 8, min: 40 },
    { item: "Cotton Fabric", available: 15, min: 50 },
    { item: "Silk Fabric", available: 5, min: 30 },
  ];

  // Chart data
  const chartData = [
    { day: "1 May", Inward: 150, Sales: 110 },
    { day: "6 May", Inward: 280, Sales: 160 },
    { day: "11 May", Inward: 240, Sales: 140 },
    { day: "16 May", Inward: 260, Sales: 170 },
    { day: "21 May", Inward: 320, Sales: 200 },
    { day: "26 May", Inward: 300, Sales: 180 },
    { day: "31 May", Inward: 270, Sales: 150 },
  ];

  return (
    <div className="dashboard-home">
      {/* Dashboard Header */}
      <div className="dashboard-header">
        <h1>Dashboard</h1>
        <div className="breadcrumb">
          <span className="link">Home</span>
          <span className="separator">/</span>
          <span>Dashboard</span>
        </div>
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
                <a href="/dashboard/inventory" className="dashboard-stat-link">{stat.change}</a>
              ) : (
                <p className="dashboard-stat-change">
                  <span className="positive">{stat.change}</span> {stat.changeText}
                </p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Tables Row */}
      <div className="dashboard-tables-grid">
        {/* Recent Inward */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Recent Inward Entries</h3>
            <button className="dashboard-view-all-btn">View All</button>
          </div>
          <div className="dashboard-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Supplier</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Rate</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {inwardEntries.map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    <td>{row.supplier}</td>
                    <td>{row.item}</td>
                    <td>{row.qty}</td>
                    <td>{row.rate.toFixed(2)}</td>
                    <td>{row.total.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="dashboard-card">
          <div className="dashboard-card-header">
            <h3>Recent Sales</h3>
            <button className="dashboard-view-all-btn">View All</button>
          </div>
          <div className="dashboard-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Item</th>
                  <th>Qty</th>
                  <th>Total</th>
                </tr>
              </thead>
              <tbody>
                {salesEntries.map((row, i) => (
                  <tr key={i}>
                    <td>{row.date}</td>
                    <td>{row.customer}</td>
                    <td>{row.item}</td>
                    <td>{row.qty}</td>
                    <td>{row.total.toLocaleString()}</td>
                  </tr>
                ))}
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
            <h3>Inward vs Sales (This Month)</h3>
          </div>
          <div className="chart-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="day" stroke="#6b7280" fontSize={12} />
                <YAxis stroke="#6b7280" fontSize={12} />
                <Tooltip />
                <Legend />
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
            <button className="dashboard-view-all-btn">View All</button>
          </div>
          <div className="dashboard-table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Item</th>
                  <th>Available Qty</th>
                  <th>Min Qty</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {lowStock.map((row, i) => (
                  <tr key={i}>
                    <td>{row.item}</td>
                    <td>{row.available}</td>
                    <td>{row.min}</td>
                    <td>
                      <span className="dashboard-badge-low">Low</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

export default DashboardHome;
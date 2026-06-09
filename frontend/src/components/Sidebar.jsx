import { NavLink } from "react-router-dom";
import { useState } from "react";
import "./Sidebar.css";

function Sidebar({ isOpen }) {
  const [mastersOpen, setMastersOpen] = useState(false);
  const [reportsOpen, setReportsOpen] = useState(false);

  return (
    <aside className={`sidebar ${isOpen ? "open" : "closed"}`}>
      <div className="sidebar-logo">
       <img className="logo-box" src={`${process.env.PUBLIC_URL}/favicon.ico`} alt="Logo" />
        <h2>Bhaskar Silk Mills</h2>
      </div>

      <nav className="sidebar-nav">
        <NavLink to="/dashboard" end className="nav-item">
          <span className="icon">🏠</span>
          <span className="label">Dashboard</span>
        </NavLink>

        <NavLink to="/dashboard/inward" className="nav-item">
          <span className="icon">📥</span>
          <span className="label">Inward Entry</span>
        </NavLink>

        <NavLink to="/dashboard/inventory" className="nav-item">
          <span className="icon">📋</span>
          <span className="label">Inventory</span>
        </NavLink>

        <NavLink to="/dashboard/sales" className="nav-item">
          <span className="icon">🛒</span>
          <span className="label">Sales</span>
        </NavLink>

        <NavLink to="/dashboard/payment" className="nav-item">
          <span className="icon">💳</span>
          <span className="label">Payment</span>
        </NavLink>

        {/* Reports */}
        <NavLink
          to="/dashboard/reports"
          className="nav-item dropdown-toggle"
          onClick={() => setReportsOpen(!reportsOpen)}
        >
          <span className="icon">📊</span>
          <span className="label">Reports</span>
          <span className="arrow">{reportsOpen ? "▼" : "▶"}</span>
        </NavLink>

        {reportsOpen && (
          <div className="dropdown-menu">
            <NavLink
              to="/dashboard/reports/inward-report"
              className="sub-item"
            >
              • Inward Report
            </NavLink>

            <NavLink
              to="/dashboard/reports/inventory-report"
              className="sub-item"
            >
              • Inventory Report
            </NavLink>

            <NavLink
              to="/dashboard/reports/sales-report"
              className="sub-item"
            >
              • Sales Report
            </NavLink>

            <NavLink
              to="/dashboard/reports/payment-report"
              className="sub-item"
            >
              • Payment Report
            </NavLink>

            <NavLink
              to="/dashboard/reports/party-wise-report"
              className="sub-item"
            >
              • Party-Wise Report
            </NavLink>

            <NavLink
              to="/dashboard/reports/summary-report"
              className="sub-item"
            >
              • Summary Report
            </NavLink>
          </div>
        )}

        {/* Masters */}
        <NavLink
          to="/dashboard/masters"
          className="nav-item dropdown-toggle"
          onClick={() => setMastersOpen(!mastersOpen)}
        >
          <span className="icon">🗂️</span>
          <span className="label">Masters</span>
          <span className="arrow">{mastersOpen ? "▼" : "▶"}</span>
        </NavLink>

        {mastersOpen && (
          <div className="dropdown-menu">
            <NavLink to="/dashboard/masters/fabric" className="sub-item">
              • Fabric
            </NavLink>

            <NavLink to="/dashboard/masters/quality" className="sub-item">
              • Quality
            </NavLink>

            <NavLink to="/dashboard/masters/design" className="sub-item">
              • Design
            </NavLink>

            <NavLink to="/dashboard/masters/color" className="sub-item">
              • Color
            </NavLink>

            <NavLink to="/dashboard/masters/supplier" className="sub-item">
              • Supplier
            </NavLink>

            <NavLink to="/dashboard/masters/location" className="sub-item">
              • Location
            </NavLink>

            <NavLink to="/dashboard/masters/uom" className="sub-item">
              • UOM
            </NavLink>

            <NavLink to="/dashboard/masters/company" className="sub-item">
              • Company
            </NavLink>
          </div>
        )}

        <div className="sidebar-divider"></div>

        <NavLink to="/dashboard/setting" className="nav-item">
          <span className="icon">⚙️</span>
          <span className="label">Settings</span>
        </NavLink>
      </nav>
    </aside>
  );
}

export default Sidebar;
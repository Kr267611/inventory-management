import React, { useEffect, useState } from "react";
import { useNavigate, Outlet } from "react-router-dom";
import "./Dashboard.css";
import Sidebar from "../../components/Sidebar";
import Navbar from "../../components/Navbar";

function Dashboard() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/");
    }
  }, [navigate]);

  return (
    <div className="dashboard-container">
      <Sidebar isOpen={sidebarOpen} />
      <div className={`main-section ${sidebarOpen ? "" : "expanded"}`}>
        <Navbar toggleSidebar={toggleSidebar} />
        <div className="content-area">
          <Outlet />
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
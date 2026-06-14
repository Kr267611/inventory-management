import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../Api/userApi";
import { salesApi } from "../Api/sales";
import { inventoryApi } from "../Api/inventoryApi"; // 🔧 adjust path if different
import "./Navbar.css";

/* ───────── ICONS ───────── */
const Icon = {
  Menu: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="18" x2="21" y2="18" /></svg>,
  Bell: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>,
  ChevronDown: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9" /></svg>,
  Logout: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><polyline points="16 17 21 12 16 7" /><line x1="21" y1="12" x2="9" y2="12" /></svg>,
  ShoppingBag: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" /><line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 0 1-8 0" /></svg>,
  AlertTriangle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>,
  Package: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="16.5" y1="9.4" x2="7.5" y2="4.21" /><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" /></svg>,
  Clock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>,
  CheckCircle: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
};

/* ───────── HELPERS ───────── */
const formatTimeAgo = (date) => {
  if (!date) return "";
  const seconds = Math.floor((new Date() - new Date(date)) / 1000);
  if (seconds < 60) return "Just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
  return new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
};

const buildNotifications = (sales = [], inventory = []) => {
  const items = [];
  const today = new Date();
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  // 1. Recent Sales
  sales
    .filter((s) => s.saleDate && new Date(s.saleDate) > yesterday)
    .slice(0, 5)
    .forEach((s) => {
      items.push({
        id: `sale-${s._id}`,
        type: "sale",
        title: "New Sale",
        message: `${s.invoiceNo || "Invoice"} — ${s.customer?.name || "Customer"}`,
        time: s.saleDate,
        link: "/dashboard/sales",
      });
    });

  // 2. Low Stock (between 0 and 50m)
  inventory
    .filter((i) => (i.totalMeter || 0) > 0 && (i.totalMeter || 0) < 50)
    .slice(0, 5)
    .forEach((i) => {
      items.push({
        id: `stock-${i._id}`,
        type: "stock",
        title: "Low Stock Alert",
        message: `Bale ${i.baleNo || ""} — Only ${(i.totalMeter || 0).toFixed(1)}m left`,
        time: i.updatedAt,
        link: "/dashboard/inventory",
      });
    });

  // 3. Out of Stock
  inventory
    .filter((i) => (i.totalMeter || 0) <= 0)
    .slice(0, 3)
    .forEach((i) => {
      items.push({
        id: `out-${i._id}`,
        type: "out",
        title: "Out of Stock",
        message: `Bale ${i.baleNo || ""} is empty`,
        time: i.updatedAt,
        link: "/dashboard/inventory",
      });
    });

  // 4. Overdue Payments
  sales
    .filter((s) => (s.balanceDue || 0) > 0 && s.dueDate && new Date(s.dueDate) < today)
    .slice(0, 5)
    .forEach((s) => {
      const days = Math.floor((today - new Date(s.dueDate)) / (1000 * 60 * 60 * 24));
      items.push({
        id: `overdue-${s._id}`,
        type: "overdue",
        title: "Overdue Payment",
        message: `${s.invoiceNo} — ₹${(s.balanceDue || 0).toLocaleString("en-IN")} (${days}d overdue)`,
        time: s.dueDate,
        link: "/dashboard/payment",
      });
    });

  return items.sort((a, b) => new Date(b.time) - new Date(a.time)).slice(0, 15);
};

/* ───────── MAIN COMPONENT ───────── */
function Navbar({ toggleSidebar }) {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loadingNotif, setLoadingNotif] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);

  const profileRef = useRef(null);
  const notifRef = useRef(null);

  /* Fetch current user */
  useEffect(() => {
    (async () => {
      try {
        const me = await userApi.me();
        setUser(me);
      } catch (err) {
        console.error("User load failed:", err);
      }
    })();
  }, []);

  /* Fetch notifications + auto-refresh */
  const loadNotifications = async () => {
    try {
      setLoadingNotif(true);
      const [sales, inventory] = await Promise.all([
        salesApi.getAll().catch(() => []),
        inventoryApi?.getAll?.().catch(() => []) || Promise.resolve([]),
      ]);
      setNotifications(buildNotifications(sales, inventory));
    } catch (err) {
      console.error("Notifications load failed:", err);
    } finally {
      setLoadingNotif(false);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 120000); // 2 min
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* Click outside */
  useEffect(() => {
    const handler = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setProfileOpen(false);
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* User info derived */
  const firstName = user?.name?.split(" ")[0] || user?.email?.split("@")[0] || "User";
  const fullName  = user?.name || user?.email || "User";
  const initial   = firstName[0]?.toUpperCase() || "?";
  const role      = user?.role || "";

  const handleLogout = () => {
    localStorage.removeItem("token");
    setProfileOpen(false);
    navigate("/");
  };

  const handleNotifClick = (notif) => {
    setNotifOpen(false);
    if (notif.link) navigate(notif.link);
  };

  const notifCount = notifications.length;

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={toggleSidebar} title="Toggle Menu">
          <Icon.Menu />
        </button>
      </div>

      <div className="navbar-right">
        {/* NOTIFICATIONS */}
        <div className="navbar-notif-wrap" ref={notifRef}>
          <button
            className="navbar-icon-btn"
            onClick={() => setNotifOpen(!notifOpen)}
            title="Notifications"
          >
            <Icon.Bell />
            {notifCount > 0 && (
              <span className="navbar-badge">{notifCount > 99 ? "99+" : notifCount}</span>
            )}
          </button>

          {notifOpen && (
            <div className="navbar-dropdown navbar-dropdown--notif">
              <div className="navbar-dropdown__header">
                <h3 className="navbar-dropdown__title">Notifications</h3>
                <button
                  className="navbar-dropdown__refresh"
                  onClick={loadNotifications}
                  title="Refresh"
                >
                  <Icon.Refresh />
                </button>
              </div>

              <div className="navbar-notif-list">
                {loadingNotif ? (
                  <div className="navbar-notif-empty">
                    <p>Loading...</p>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="navbar-notif-empty">
                    <Icon.CheckCircle />
                    <p>All caught up!</p>
                    <span>No new notifications</span>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`navbar-notif-item navbar-notif-item--${n.type}`}
                      onClick={() => handleNotifClick(n)}
                    >
                      <div className="navbar-notif-icon">
                        {n.type === "sale" && <Icon.ShoppingBag />}
                        {n.type === "stock" && <Icon.AlertTriangle />}
                        {n.type === "out" && <Icon.Package />}
                        {n.type === "overdue" && <Icon.Clock />}
                      </div>
                      <div className="navbar-notif-body">
                        <div className="navbar-notif-title">{n.title}</div>
                        <div className="navbar-notif-msg">{n.message}</div>
                        <div className="navbar-notif-time">{formatTimeAgo(n.time)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {notifications.length > 0 && (
                <div className="navbar-dropdown__footer">
                  <span>{notifCount} notification{notifCount !== 1 ? "s" : ""} · auto-refresh 2 min</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* PROFILE */}
        <div className="navbar-profile-wrap" ref={profileRef}>
          <button
            className="navbar-profile"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="navbar-avatar">{initial}</div>
            <div className="navbar-user">
              <div className="navbar-user__name">{firstName}</div>
              {role && (
                <div className={`navbar-user__role navbar-user__role--${role}`}>
                  {role.toUpperCase()}
                </div>
              )}
            </div>
            <span className={`navbar-chevron ${profileOpen ? "open" : ""}`}>
              <Icon.ChevronDown />
            </span>
          </button>

          {profileOpen && (
            <div className="navbar-dropdown navbar-dropdown--profile">
              <div className="navbar-profile-header">
                <div className="navbar-avatar navbar-avatar--lg">{initial}</div>
                <div className="navbar-profile-info">
                  <div className="navbar-profile-name">{fullName}</div>
                  <div className="navbar-profile-email">{user?.email}</div>
                  {role && (
                    <div className={`navbar-role-badge navbar-role-badge--${role}`}>
                      {role.toUpperCase()}
                    </div>
                  )}
                </div>
              </div>
              <div className="navbar-dropdown__divider"></div>
              <div
                className="navbar-dropdown__item navbar-dropdown__item--danger"
                onClick={handleLogout}
              >
                <Icon.Logout />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
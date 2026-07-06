import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../../Api/userApi";

/* ICONS */
const Icon = {
  ArrowLeft: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="19" y1="12" x2="5" y2="12" /><polyline points="12 19 5 12 12 5" /></svg>,
  Users: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" /></svg>,
  Shield: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>,
  UserCheck: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><polyline points="17 11 19 13 23 9" /></svg>,
  User: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>,
  Search: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" /></svg>,
  Trash: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg>,
  Lock: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>,
  Refresh: () => <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 4 23 10 17 10" /><polyline points="1 20 1 14 7 14" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>,
};

const ROLES = ["admin", "manager", "staff"];

const formatDate = (iso) => {
  if (!iso) return "-";
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
};

export default function Setting() {
  const navigate= useNavigate();
  const [users, setUsers] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 10;

  /* ──────── LOAD ──────── */
  const load = async () => {
    try {
      setLoading(true);
      const me = await userApi.me();
      setCurrentUser(me);
      if (me.role === "admin") {
        const list = await userApi.getAll();
        setUsers(list);
      }
    } catch (err) {
      alert("Load failed: " + (err.response?.data?.message || err.message));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  /* ──────── FILTERED ──────── */
  const filteredUsers = useMemo(() => {
    let list = [...users];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    if (filterRole) {
      list = list.filter((u) => u.role === filterRole);
    }
    return list;
  }, [users, search, filterRole]);

  /* ──────── PAGINATION ──────── */
  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / ITEMS_PER_PAGE));

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredUsers.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  // search/filter change hone pe page 1 pe reset
  useEffect(() => { setCurrentPage(1); }, [search, filterRole]);

  // agar current page range se bahar chala jaaye (delete ke baad)
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  /* ──────── STATS ──────── */
  const stats = useMemo(() => ({
    total:   users.length,
    admin:   users.filter((u) => u.role === "admin").length,
    manager: users.filter((u) => u.role === "manager").length,
    staff:   users.filter((u) => u.role === "staff").length,
  }), [users]);

  /* ──────── HANDLERS ──────── */
  const handleRoleChange = async (user, newRole) => {
    if (user.role === newRole) return;
    if (user._id === currentUser._id && newRole !== "admin") {
      return alert("Apna role demote nahi kar sakte");
    }
    if (!window.confirm(`${user.name} ka role "${user.role}" se "${newRole}" karna hai?`)) return;
    try {
      await userApi.updateRole(user._id, newRole);
      await load();
    } catch (err) {
      alert("Role update failed: " + (err.response?.data?.message || err.message));
    }
  };

  const handleDelete = async (user) => {
    if (user._id === currentUser._id) {
      return alert("Khud ko delete nahi kar sakte");
    }
    if (!window.confirm(`User "${user.name}" delete karna hai? Ye permanent hai.`)) return;
    try {
      await userApi.remove(user._id);
      await load();
    } catch (err) {
      alert("Delete failed: " + (err.response?.data?.message || err.message));
    }
  };

  /* ──────── LOADING ──────── */
  if (loading) {
    return (
      <div className="setg-page">
        <div className="setg-loading">Loading...</div>
        <style>{settingsCSS}</style>
      </div>
    );
  }

  /* ──────── ACCESS DENIED ──────── */
  if (currentUser && currentUser.role !== "admin") {
    return (
      <div className="setg-page">
        <div className="setg-denied">
          <div className="setg-denied__icon"><Icon.Lock /></div>
          <h2 className="setg-denied__title">Access Denied</h2>
          <p className="setg-denied__msg">
            Sirf <strong>admin</strong> users ko Settings access hai.
            <br />
            Tumhara current role: <span className={`setg-badge setg-badge--${currentUser.role}`}>{currentUser.role}</span>
          </p>
          <p className="setg-denied__hint">
            Admin se contact karke role upgrade karwao.
          </p>
        </div>
        <style>{settingsCSS}</style>
      </div>
    );
  }

  /* ──────── ADMIN VIEW ──────── */
  return (
    <div className="setg-page">
      {/* HEADER */}
      <div className="setg-header">
        <div>
          <h1 className="setg-title">Settings — User Management</h1>
          <div className="setg-breadcrumb">
            <span>Home</span>
            <span className="setg-sep">/</span>
            <span className="setg-current">Settings</span>
          </div>
        </div>
      <div className="setg-actions">                                                        {/* 🆕 */}
  <button className="setg-btn setg-btn--ghost" onClick={() => navigate(-1)}>         {/* 🆕 */}
    <Icon.ArrowLeft /><span>Back</span>
  </button>
  <button className="setg-btn setg-btn--ghost" onClick={load}>
    <Icon.Refresh /><span>Refresh</span>
  </button>
</div>
      </div>

      {/* STATS */}
      <div className="setg-stats">
        <StatCard label="Total Users"  value={stats.total}   icon="users"     color="blue" />
        <StatCard label="Admins"       value={stats.admin}   icon="shield"    color="red" />
        <StatCard label="Managers"     value={stats.manager} icon="usercheck" color="purple" />
        <StatCard label="Staff"        value={stats.staff}   icon="user"      color="green" />
      </div>

      {/* FILTERS */}
      <div className="setg-card setg-filters">
        <div className="setg-search-wrap">
          <Icon.Search />
          <input
            className="setg-input"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="setg-input setg-select"
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
        >
          <option value="">All Roles</option>
          {ROLES.map((r) => <option key={r} value={r}>{r.toUpperCase()}</option>)}
        </select>
        {(search || filterRole) && (
          <button
            className="setg-btn setg-btn--ghost"
            onClick={() => { setSearch(""); setFilterRole(""); }}
          >
            Clear
          </button>
        )}
      </div>

      {/* USER TABLE */}
      <div className="setg-card">
        <div className="setg-table-head">
          <h2 className="setg-card-title">All Users</h2>
          <span className="setg-muted">
            Showing {filteredUsers.length} of {users.length}
          </span>
        </div>

        <div className="setg-table-wrap">
          <table className="setg-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Company</th>
                <th>Joined</th>
                <th className="setg-th--center">Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="setg-td-empty">No users found</td>
                </tr>
              ) : (
                paginatedUsers.map((user) => {
                  const isMe = user._id === currentUser._id;
                  return (
                    <tr key={user._id} className={isMe ? "setg-tr-self" : ""}>
                      <td>
                        <div className="setg-user">
                          <div className="setg-avatar">{user.name?.[0]?.toUpperCase() || "?"}</div>
                          <div>
                            <div className="setg-user-name">
                              {user.name}
                              {isMe && <span className="setg-self-tag">YOU</span>}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="setg-muted">{user.email}</td>
                      <td>
                        <select
                          className={`setg-role-select setg-role-select--${user.role}`}
                          value={user.role}
                          onChange={(e) => handleRoleChange(user, e.target.value)}
                          disabled={isMe}
                          title={isMe ? "Apna role change nahi kar sakte" : ""}
                        >
                          {ROLES.map((r) => (
                            <option key={r} value={r}>{r.toUpperCase()}</option>
                          ))}
                        </select>
                      </td>
                      <td>{user.company?.name || "-"}</td>
                      <td className="setg-muted">{formatDate(user.createdAt)}</td>
                      <td className="setg-td--center">
                        <button
                          className="setg-icon-btn"
                          onClick={() => handleDelete(user)}
                          disabled={isMe}
                          title={isMe ? "Khud ko delete nahi kar sakte" : "Delete user"}
                        >
                          <Icon.Trash />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="setg-pagination">
          <div className="setg-pagination__info">
            Showing {filteredUsers.length === 0 ? 0 : (currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
            {Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)} of {filteredUsers.length} entries
          </div>
          <div className="setg-pagination__controls">
            <button
              className="setg-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                className={`setg-page-btn ${page === currentPage ? "setg-page-btn--active" : ""}`}
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </button>
            ))}

            <button
              className="setg-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <style>{settingsCSS}</style>
    </div>
  );
}

/* ──────── HELPERS ──────── */
function StatCard({ label, value, icon, color }) {
  return (
    <div className="setg-stat">
      <div className={`setg-stat__icon setg-stat__icon--${color}`}>
        {icon === "users" && <Icon.Users />}
        {icon === "shield" && <Icon.Shield />}
        {icon === "usercheck" && <Icon.UserCheck />}
        {icon === "user" && <Icon.User />}
      </div>
      <div>
        <div className="setg-stat__label">{label}</div>
        <div className="setg-stat__value">{value}</div>
      </div>
    </div>
  );
}

/* ──────── CSS ──────── */
const settingsCSS = `
.setg-page, .setg-page * { box-sizing: border-box; }
.setg-page {
  --setg-text: #0f172a; --setg-muted: #64748b; --setg-label: #475569;
  --setg-card: #fff; --setg-border: #e5e7eb;
  --setg-primary: #2563eb; --setg-primary-hover: #1d4ed8;
  --setg-danger: #ef4444; --setg-success: #10b981;
  --setg-shadow: 0 1px 2px rgba(0,0,0,.04), 0 1px 3px rgba(0,0,0,.06);
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  color: var(--setg-text); font-size: 14px;
}
.setg-page svg { width: 16px; height: 16px; display: block; }

.setg-loading { padding: 60px; text-align: center; color: var(--setg-muted); }

.setg-header {
  display: flex; justify-content: space-between; align-items: flex-start;
  gap: 16px; flex-wrap: wrap; margin-bottom: 20px;
}
.setg-title { font-size: 24px; font-weight: 700; margin: 0 0 4px; }
.setg-breadcrumb { display: flex; align-items: center; gap: 6px; color: var(--setg-muted); font-size: 13px; }
.setg-sep { color: #cbd5e1; }
.setg-current { color: var(--setg-primary); font-weight: 500; }

.setg-btn {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 9px 16px; border-radius: 8px;
  font-size: 14px; font-weight: 500;
  cursor: pointer; border: 1px solid transparent;
  background: #fff; font-family: inherit; transition: all .15s;
}
.setg-btn:disabled { opacity: .5; cursor: not-allowed; }
.setg-btn--ghost { border-color: var(--setg-border); color: var(--setg-text); }
.setg-btn--ghost:hover:not(:disabled) { background: #f8fafc; }
.setg-btn--primary { background: var(--setg-primary); color: #fff; border-color: var(--setg-primary); }
.setg-btn--primary:hover:not(:disabled) { background: var(--setg-primary-hover); }
.setg-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.setg-stats {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 14px; margin-bottom: 20px;
}
.setg-stat {
  background: var(--setg-card); border: 1px solid var(--setg-border);
  border-radius: 12px; padding: 16px;
  box-shadow: var(--setg-shadow);
  display: flex; gap: 12px; align-items: center;
}
.setg-stat__icon {
  width: 44px; height: 44px; border-radius: 10px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
}
.setg-stat__icon svg { width: 22px; height: 22px; }
.setg-stat__icon--blue   { background: #dbeafe; color: #2563eb; }
.setg-stat__icon--red    { background: #fee2e2; color: #dc2626; }
.setg-stat__icon--purple { background: #f3e8ff; color: #9333ea; }
.setg-stat__icon--green  { background: #d1fae5; color: #10b981; }
.setg-stat__label { font-size: 12px; color: var(--setg-muted); margin-bottom: 2px; }
.setg-stat__value { font-size: 22px; font-weight: 700; }

.setg-card {
  background: var(--setg-card); border: 1px solid var(--setg-border);
  border-radius: 12px; padding: 18px;
  box-shadow: var(--setg-shadow);
  margin-bottom: 16px;
}
.setg-card-title { font-size: 15px; font-weight: 600; margin: 0; }
.setg-muted { color: var(--setg-muted); font-size: 13px; }

.setg-filters {
  display: flex; gap: 12px; align-items: center;
  flex-wrap: wrap;
}
.setg-search-wrap {
  position: relative; flex: 1; min-width: 220px;
}
.setg-search-wrap svg {
  position: absolute; left: 12px; top: 50%; transform: translateY(-50%);
  color: var(--setg-muted); pointer-events: none;
}
.setg-search-wrap .setg-input { padding-left: 38px; }
.setg-input {
  width: 100%; padding: 9px 12px;
  border: 1px solid var(--setg-border);
  border-radius: 8px; background: #fff;
  font-size: 14px; font-family: inherit;
  color: var(--setg-text);
  transition: border-color .15s, box-shadow .15s;
}
.setg-input:focus {
  outline: none; border-color: var(--setg-primary);
  box-shadow: 0 0 0 3px rgba(37,99,235,.12);
}
.setg-select { width: auto; min-width: 140px; cursor: pointer; }

.setg-table-head {
  display: flex; justify-content: space-between; align-items: center;
  margin-bottom: 14px;
}
.setg-table-wrap { overflow-x: auto; }
.setg-table { width: 100%; border-collapse: collapse; min-width: 760px; }
.setg-table th {
  background: #f8fafc; padding: 11px 12px;
  font-size: 11px; font-weight: 600;
  color: var(--setg-muted); text-align: left;
  text-transform: uppercase; letter-spacing: .4px;
  border-bottom: 1px solid var(--setg-border);
}
.setg-th--center, .setg-td--center { text-align: center; }
.setg-table td {
  padding: 12px; font-size: 13px;
  border-bottom: 1px solid var(--setg-border);
}
.setg-table tr:hover { background: #fafbfc; }
.setg-tr-self { background: #fef3c7 !important; }
.setg-tr-self:hover { background: #fde68a !important; }
.setg-td-empty { text-align: center; color: var(--setg-muted); padding: 40px !important; }

.setg-pagination {
  padding: 14px 4px 0;
  display: flex; align-items: center; justify-content: space-between;
  flex-wrap: wrap; gap: 12px;
  border-top: 1px solid var(--setg-border);
  margin-top: 14px;
}
.setg-pagination__info { font-size: 13px; color: var(--setg-muted); }
.setg-pagination__controls { display: flex; gap: 6px; flex-wrap: wrap; }
.setg-page-btn {
  min-width: 32px; padding: 6px 12px;
  border: 1px solid var(--setg-border);
  background: #fff; border-radius: 6px;
  font-size: 13px; cursor: pointer;
  color: var(--setg-text); font-family: inherit;
}
.setg-page-btn:hover:not(:disabled) { background: #f8fafc; }
.setg-page-btn:disabled { color: #cbd5e1; cursor: not-allowed; }
.setg-page-btn--active { background: var(--setg-primary); color: #fff; border-color: var(--setg-primary); }

.setg-user { display: flex; align-items: center; gap: 10px; }
.setg-avatar {
  width: 36px; height: 36px; border-radius: 50%;
  background: linear-gradient(135deg, #3b82f6, #8b5cf6);
  color: #fff; font-weight: 600;
  display: flex; align-items: center; justify-content: center;
  font-size: 14px; flex-shrink: 0;
}
.setg-user-name { font-weight: 500; display: flex; align-items: center; gap: 8px; }
.setg-self-tag {
  background: #f59e0b; color: #fff;
  font-size: 9px; font-weight: 700;
  padding: 2px 6px; border-radius: 4px;
  letter-spacing: .5px;
}

.setg-role-select {
  padding: 5px 10px; border-radius: 6px;
  font-size: 11px; font-weight: 700;
  letter-spacing: .5px; cursor: pointer;
  border: 1px solid transparent;
  text-transform: uppercase;
}
.setg-role-select:disabled { cursor: not-allowed; opacity: .7; }
.setg-role-select--admin   { background: #fee2e2; color: #dc2626; }
.setg-role-select--manager { background: #f3e8ff; color: #9333ea; }
.setg-role-select--staff   { background: #d1fae5; color: #065f46; }

.setg-badge {
  display: inline-block; padding: 3px 10px;
  border-radius: 12px; font-size: 11px;
  font-weight: 700; text-transform: uppercase;
}
.setg-badge--admin   { background: #fee2e2; color: #dc2626; }
.setg-badge--manager { background: #f3e8ff; color: #9333ea; }
.setg-badge--staff   { background: #d1fae5; color: #065f46; }

.setg-icon-btn {
  background: none; border: none; cursor: pointer;
  width: 30px; height: 30px;
  display: inline-flex; align-items: center; justify-content: center;
  border-radius: 6px; color: var(--setg-muted);
}
.setg-icon-btn:hover:not(:disabled) {
  background: #fee2e2; color: var(--setg-danger);
}
.setg-icon-btn:disabled { opacity: .3; cursor: not-allowed; }

/* ACCESS DENIED */
.setg-denied {
  background: #fff; border: 1px solid var(--setg-border);
  border-radius: 12px; padding: 60px 40px;
  text-align: center; max-width: 500px; margin: 80px auto;
  box-shadow: var(--setg-shadow);
}
.setg-denied__icon {
  width: 72px; height: 72px; border-radius: 50%;
  background: #fee2e2; color: #dc2626;
  display: flex; align-items: center; justify-content: center;
  margin: 0 auto 20px;
}
.setg-denied__icon svg { width: 32px; height: 32px; }
.setg-denied__title { font-size: 22px; font-weight: 700; margin: 0 0 12px; color: var(--setg-text); }
.setg-denied__msg { font-size: 14px; color: var(--setg-muted); line-height: 1.6; margin: 0 0 16px; }
.setg-denied__hint { font-size: 13px; color: var(--setg-muted); margin: 0; }

@media (max-width: 900px) {
  .setg-stats { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 600px) {
  .setg-stats { grid-template-columns: 1fr; }
  .setg-filters { flex-direction: column; align-items: stretch; }
  .setg-select { width: 100%; }
}
`;
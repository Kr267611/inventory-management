import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ toggleSidebar }) {
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef(null);
  const navigate = useNavigate();

  const handleLogout = () => {
    // agar token store karta hai toh yha clear kar dena
    // localStorage.removeItem("token");
    setProfileOpen(false);
    navigate("/");
  };

  // bahar click kare toh dropdown band ho jaye
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <header className="navbar">
      <div className="navbar-left">
        <button className="menu-btn" onClick={toggleSidebar}>
          ☰
        </button>
      </div>

      <div className="navbar-right">
        <button className="icon-btn">🌙</button>
        <button className="icon-btn notification">
          🔔
          <span className="badge">5</span>
        </button>

        <div className="user-profile-wrapper" ref={profileRef}>
          <div
            className="user-profile"
            onClick={() => setProfileOpen(!profileOpen)}
          >
            <div className="avatar">A</div>
            <span className="user-name">Admin User</span>
            <span className="dropdown-arrow">
              {profileOpen ? "▼" : "▶"}
            </span>
          </div>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-item" onClick={handleLogout}>
                <span className="dropdown-icon">🚪</span>
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
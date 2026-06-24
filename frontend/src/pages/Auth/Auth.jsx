import React, { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";
import {api} from "../../Api/api";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: ""
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  }

const handleSubmit = async (e) => {
    e.preventDefault();

    // 🆕 Already submitting? Block double-click
    if (loading) return;

    // 🆕 Basic validation
    if (!formData.email || !formData.password) {
      return alert("Email aur password dono daalo");
    }
    if (!isLogin && !formData.name) {
      return alert("Naam daalo");
    }

    try {
      setLoading(true);                                  // 🆕 disable button

      if (isLogin) {
        const data = await api.post("/auth/login", {
          email: formData.email,
          password: formData.password,
        });

        localStorage.setItem("token", data.token);
        alert("Login Successful");
        navigate("/dashboard");
      } else {
        await api.post("/auth/register", formData);

        alert("Registered Successfully!");

        setFormData({
          name: "",
          email: "",
          password: ""
        });

        setIsLogin(true);
      }
    } catch (error) {
      console.log(error);
      alert(error.message || "Something went wrong");
    } finally {
      setLoading(false);                                 // 🆕 re-enable button (success ya error dono case me)
    }
  };

  return (
    <div className="auth-container">

      {/* LEFT SIDE */}
      <div className="auth-left">
        <div className="overlay">
          <div className="branding">
            <div className="logo">BSM</div>
            <h1>Bhaskar Silk Mills</h1>
            <p>Smart Textile Management System</p>

            {/* <div className="features">
              <div>📦 Inventory</div>
              <div>📊 Sales</div>
              <div>💳 Payments</div>
              <div>📈 Reports</div>
            </div> */}
          </div>
        </div>
      </div>

      {/* RIGHT SIDE */}
      <div className="auth-right">

        <div className="auth-card">

         {/* 🔥 Tabs */}
          <div className="tabs">
            <button
              className={isLogin ? "active" : ""}
              onClick={() => setIsLogin(true)}
              disabled={loading}
            >
              Login
            </button>

            <button
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
              disabled={loading}
            >
              Register
            </button>
          </div>
          {/* 🔥 Heading */}
          <h2>{isLogin ? "Welcome Back!" : "Create Account"}</h2>
          <p className="subtitle">
            {isLogin
              ? "Sign in to continue"
              : "Create your account to get started"}
          </p>

          {/* 🔥 Form */}
          <form onSubmit={handleSubmit}>

            {!isLogin && (
              <div className="input-group">
                <span>👤</span>
                <input
                  type="text"
                  name="name"
                  placeholder="Full Name"
                  value={formData.name}
                  onChange={handleChange}
                />
              </div>
            )}

            <div className="input-group">
              <span>📧</span>
              <input
                type="email"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange} 
              />
            </div>

            <div className="input-group">
              <span>🔒</span>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            {/* 🔥 Remember + Forgot */}
            {isLogin && (
              <div className="extra">
                <label>
                  <input type="checkbox" /> Remember me
                </label>
                <span className="link">Forgot?</span>
              </div>
            )}

            {/* 🔥 Button */}
         {/* 🔥 Button */}
            <button type="submit" className="main-btn" disabled={loading}>
              {loading
                ? (isLogin ? "Signing In..." : "Creating Account...")
                : (isLogin ? "Sign In" : "Sign Up")
              }
            </button>

            {/* 🔥 Divider */}
            {/* <div className="divider">or</div> */}

            {/* 🔥 OTP Button */}
            {/* <button type="button" className="secondary-btn">
              🔐 Login with OTP
            </button> */}

          </form>

        </div>

      </div>
    </div>
  );
};

export default Auth;
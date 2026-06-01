import React, { useState } from "react";
import "./Auth.css";
import { useNavigate } from "react-router-dom";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
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

  try {
    if (isLogin) {
      const res = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Login failed");
        return;
      }

      localStorage.setItem("token", data.token);

      alert("Login Successful");
      navigate("/dashboard");

    } else {
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(formData)
      });

      const data = await res.json();

      if (!res.ok) {
        alert(data.message || "Registration failed");
        return;
      }

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
    alert("Something went wrong");
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

            <div className="features">
              <div>📦 Inventory</div>
              <div>📊 Sales</div>
              <div>💳 Payments</div>
              <div>📈 Reports</div>
            </div>
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
            >
              Login
            </button>

            <button
              className={!isLogin ? "active" : ""}
              onClick={() => setIsLogin(false)}
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
            <button type="submit" className="main-btn">
              {isLogin ? "Sign In" : "Sign Up"}
            </button>

            {/* 🔥 Divider */}
            <div className="divider">or</div>

            {/* 🔥 OTP Button */}
            <button type="button" className="secondary-btn">
              🔐 Login with OTP
            </button>

          </form>

        </div>

      </div>
    </div>
  );
};

export default Auth;
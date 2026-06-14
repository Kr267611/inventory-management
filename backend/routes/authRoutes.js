const express = require("express");
const router = express.Router();
const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const authMiddleware = require("../middleware/authMiddleware");

/* ──────────────────────────────────────
   🔒 ADMIN-ONLY MIDDLEWARE
   ────────────────────────────────────── */
const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
};

/* ──────────────────────────────────────
   🔥 REGISTER — default role = staff (forced)
   ────────────────────────────────────── */
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, company } = req.body;
    // 🔒 role removed from destructure — security: koi bhi register karega to staff banega

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = new User({
      name,
      email,
      password: hashedPassword,
      role: "staff",                           // 🔒 forced staff — admin promote karega baad me
      company,
    });

    await user.save();

    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────
   🔥 LOGIN
   ────────────────────────────────────── */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).populate("company", "name");
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: "Invalid password" });

    const token = jwt.sign(
      { id: user._id, role: user.role, company: user.company?._id },
      process.env.JWT_SECRET || "SECRET_KEY",
      { expiresIn: "1d" }
    );

    res.status(200).json({ message: "Login successful", token, user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────
   🆕 GET CURRENT USER (/me)
   ────────────────────────────────────── */
router.get("/me", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .select("-password")
      .populate("company", "name");
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
    console.log("Current user:", user); // Debug log
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────
   🆕 LIST ALL USERS (admin only)
   ────────────────────────────────────── */
router.get("/users", authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find()
      .select("-password")
      .populate("company", "name")
      .sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────
   🆕 UPDATE USER ROLE (admin only)
   ────────────────────────────────────── */
router.put("/users/:id/role", authMiddleware, adminOnly, async (req, res) => {
  try {
    const { role } = req.body;

    if (!["admin", "staff", "manager"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    // 🔒 Self-demotion prevent
    if (req.user.id === req.params.id && role !== "admin") {
      return res.status(400).json({ message: "Apna role demote nahi kar sakte" });
    }

    // 🔒 Last admin demote prevent
    if (role !== "admin") {
      const targetUser = await User.findById(req.params.id);
      if (targetUser?.role === "admin") {
        const adminCount = await User.countDocuments({ role: "admin" });
        if (adminCount <= 1) {
          return res.status(400).json({ message: "Last admin demote nahi kar sakte" });
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { role },
      { new: true }
    ).select("-password");

    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "Role updated", user });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

/* ──────────────────────────────────────
   🆕 DELETE USER (admin only)
   ────────────────────────────────────── */
router.delete("/users/:id", authMiddleware, adminOnly, async (req, res) => {
  try {
    // 🔒 Self-delete prevent
    if (req.user.id === req.params.id) {
      return res.status(400).json({ message: "Khud ko delete nahi kar sakte" });
    }

    // 🔒 Last admin delete prevent
    const targetUser = await User.findById(req.params.id);
    if (targetUser?.role === "admin") {
      const adminCount = await User.countDocuments({ role: "admin" });
      if (adminCount <= 1) {
        return res.status(400).json({ message: "Last admin delete nahi kar sakte" });
      }
    }

    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    res.json({ message: "User deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
// models/SalesPerson.js
const mongoose = require("mongoose");

const salesPersonSchema = new mongoose.Schema({
  name:    { type: String, required: true, trim: true },
  code:    { type: String, trim: true },             // 👈 internal code (SP-001)
  phone:   { type: String, trim: true },
  email:   { type: String, trim: true },             // 👈 useful for reports
  role:    { type: String, default: "Sales" },
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },
  isActive: { type: Boolean, default: true },        // 👈 ex-employees ko hide karne ke liye
}, { timestamps: true });

module.exports = mongoose.model("SalesPerson", salesPersonSchema);
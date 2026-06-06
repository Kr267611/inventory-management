// models/Customer.js
const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  code:          { type: String, trim: true },        // CUST-001

  // Contact
  contactPerson: { type: String, trim: true },
  phone:         { type: String, trim: true },
  email:         { type: String, trim: true },

  // Tax / Legal
  gstNo:         { type: String, trim: true },
  pan:           { type: String, trim: true },

  // Address
  address:       { type: String, trim: true },
  city:          { type: String, trim: true },
  state:         { type: String, trim: true },
  pincode:       { type: String, trim: true },
  country:       { type: String, default: "India" },

  // Business terms
  paymentTerms:  { type: String, trim: true },        // "30 days", "COD", etc.
  creditLimit:   { type: Number, default: 0 },        // Maximum credit allowed
  outstanding:   { type: Number, default: 0 },        // Current dues — auto-updated from sales/payments

  isActive:      { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);
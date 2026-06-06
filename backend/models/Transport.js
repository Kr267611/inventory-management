// models/Transport.js
const mongoose = require("mongoose");

const transportSchema = new mongoose.Schema({
  name:      { type: String, required: true, trim: true },   // Transporter name
  code:      { type: String, trim: true },                   // TRN-001
  phone:     { type: String, trim: true },
  email:     { type: String, trim: true },
  gstNo:     { type: String, trim: true },                   // For GST tracking on freight bills
  address:   { type: String, trim: true },
  vehicleNo: { type: String, trim: true },                   // Default truck/vehicle (optional)
  remarks:   { type: String, trim: true },
  isActive:  { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model("Transport", transportSchema);
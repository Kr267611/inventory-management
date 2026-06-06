const mongoose = require("mongoose");

const paymentModeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, trim: true },
  isActive: { type: Boolean, default: true },              // 👈 NEW
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true,
  },
}, { timestamps: true });

paymentModeSchema.index({ name: 1, company: 1 }, { unique: true });

module.exports = mongoose.model("PaymentMode", paymentModeSchema);
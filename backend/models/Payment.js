const mongoose = require("mongoose");

const paymentModeSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  description: String,

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  }

}, { timestamps: true });


// 🔥 Prevent duplicate in same company
paymentModeSchema.index({ name: 1, company: 1 }, { unique: true });

module.exports = mongoose.model("PaymentMode", paymentModeSchema);
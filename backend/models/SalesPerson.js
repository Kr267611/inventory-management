const mongoose = require("mongoose");

const salesPersonSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  phone: String,

  role: {
    type: String,
    default: "Sales"
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("SalesPerson", salesPersonSchema);
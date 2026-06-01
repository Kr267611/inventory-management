const mongoose = require("mongoose");

const customerSchema = new mongoose.Schema({

  name: {
    type: String,
    required: true,
    trim: true
  },

  phone: {
    type: String
  },

  email: {
    type: String
  },

  address: {
    type: String
  },

  gstNumber: {
    type: String
  },

  // 🔥 Multi-company support
  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("Customer", customerSchema);
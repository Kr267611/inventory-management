const mongoose = require("mongoose");

const containerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true, // duplicate container avoid
    trim: true
  },

  description: {
    type: String
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true // multi-company support
  }

}, { timestamps: true });

module.exports = mongoose.model("Container", containerSchema);
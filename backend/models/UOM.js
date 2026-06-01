const mongoose = require("mongoose");

const uomSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model("UOM", uomSchema);
const mongoose = require("mongoose");

const fabricSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Fabric", fabricSchema);
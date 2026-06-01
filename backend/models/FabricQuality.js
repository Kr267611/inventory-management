const mongoose = require("mongoose");

const fabricQualitySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model("FabricQuality", fabricQualitySchema);
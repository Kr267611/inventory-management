const mongoose = require("mongoose");

const designSchema = new mongoose.Schema({
  designNo: {
    type: String,
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model("Design", designSchema);
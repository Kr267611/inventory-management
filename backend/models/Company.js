const mongoose = require("mongoose");

const companySchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  code: {
    type: String,
    unique: true
  },
  address: String,
  city: String,
  state: String,
  country: String,
  mobile: String,
  email: String
}, { timestamps: true });

module.exports = mongoose.model("Company", companySchema);
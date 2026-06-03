const mongoose = require("mongoose");

const salesSchema = new mongoose.Schema({

  salesDate: {
    type: Date,
    required: true
  },

  customer: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Customer",
    required: true
  },

  invoiceNo: {
    type: String,
    required: true
  },

  // 🔗 Inventory se link (MOST IMPORTANT)
  inventory: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inventory",
    required: true
  },

  baleNo: String,

  // 🔥 MASTER SNAPSHOT (copy for safety)
  fabric: { type: mongoose.Schema.Types.ObjectId, ref: "Fabric" },
  fabricQuality: { type: mongoose.Schema.Types.ObjectId, ref: "FabricQuality" },
  design: { type: mongoose.Schema.Types.ObjectId, ref: "Design" },
  color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
  container: { type: mongoose.Schema.Types.ObjectId, ref: "Container" },

  uom: { type: mongoose.Schema.Types.ObjectId, ref: "UOM" },

  // 📦 PCS WISE SELLING
  onePcsQty: Number,

  pcsSold: {
    type: Number,
    required: true
  },

  qty: {
    type: Number
  },

  // 💰 Pricing
  inwardRate: Number,

  sellingRate: {
    type: Number,
    required: true
  },

  sellingAmount: Number,

  currencyType: {
    type: String,
    enum: ["INR", "NGN", "USD"],
    default: "INR"
  },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  salesPerson: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "SalesPerson"
  }

}, { timestamps: true });


// 🔥 AUTO CALCULATION
salesSchema.pre("save", function () {

  // PCS → Qty convert
  if (this.onePcsQty && this.pcsSold) {
    this.qty = this.onePcsQty * this.pcsSold;
  }

  // Amount calculate
  this.sellingAmount = this.qty * this.sellingRate;
});

module.exports = mongoose.model("Sales", salesSchema);
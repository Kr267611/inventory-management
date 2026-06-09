// models/Sales.js
const mongoose = require("mongoose");

/* ──────── SUB-SCHEMA: Har bechi gayi item ke liye ──────── */
const saleItemSchema = new mongoose.Schema({
  // 🆕 BALE NO — primary lookup key (sale ka physical bale identifier)
  baleNo: {
    type: String,
    required: [true, "Bale No required for each item"],
    uppercase: true,
    trim: true,
    index: true,
  },

  // Snapshot fields (bale se auto-fill, audit ke liye save karte hain)
  fabric:        { type: mongoose.Schema.Types.ObjectId, ref: "Fabric",        required: true },
  fabricQuality: { type: mongoose.Schema.Types.ObjectId, ref: "FabricQuality" },
  design:        { type: mongoose.Schema.Types.ObjectId, ref: "Design" },
  color:         { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
  location:      { type: mongoose.Schema.Types.ObjectId, ref: "Location" },

  // Direct inventory link (jab bale lookup hota hai tab fill karte hain)
  inventoryRef:  { type: mongoose.Schema.Types.ObjectId, ref: "Inventory" },

  // Quantity / Measurement
  pcs:           { type: Number, required: true, min: 1 },
  meterPerPcs:   { type: Number, required: true, min: 0 },
  totalMeter:    { type: Number, default: 0 },   // pcs * meterPerPcs

  // Pricing
  rate:          { type: Number, required: true, min: 0 },  // selling rate per meter
  discount:      { type: Number, default: 0 },              // discount per meter
  amount:        { type: Number, default: 0 },              // (totalMeter * rate) - (totalMeter * discount)
}, { _id: true });


/* ──────── MAIN SCHEMA ──────── */
const salesSchema = new mongoose.Schema({
  saleDate:  { type: Date, required: true, default: Date.now },
  invoiceNo: { type: String, required: true, unique: true },

  // 🔗 Links
  customer:    { type: mongoose.Schema.Types.ObjectId, ref: "Customer",    required: true },
  company:     { type: mongoose.Schema.Types.ObjectId, ref: "Company",     required: true },
  location:    { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
  salesPerson: { type: mongoose.Schema.Types.ObjectId, ref: "SalesPerson" },
  transport:   { type: mongoose.Schema.Types.ObjectId, ref: "Transport" },

  // 🧾 Invoice details
  gstNo:       { type: String, trim: true },
  lrNo:        { type: String, trim: true },
  paymentMode: { type: mongoose.Schema.Types.ObjectId, ref: "PaymentMode" },
  paymentType: {
    type: String,
    enum: ["Credit", "Cash", "Advance"],
    default: "Credit",
  },
  dueDate:     Date,
  remarks:     { type: String, trim: true },

  // 📦 Items
  items: {
    type: [saleItemSchema],
    validate: {
      validator: (arr) => Array.isArray(arr) && arr.length > 0,
      message: "Kam se kam ek item hona chahiye",
    },
  },

  // 💰 Derived totals (pre-save me auto fill)
  totalPcs:      { type: Number, default: 0 },
  totalMeter:    { type: Number, default: 0 },
  grossAmount:   { type: Number, default: 0 },
  discountTotal: { type: Number, default: 0 },
  netAmount:     { type: Number, default: 0 },

  // 💵 Payment tracking
  paidAmount:    { type: Number, default: 0 },
  balanceDue:    { type: Number, default: 0 },
  paymentStatus: {
    type: String,
    enum: ["Unpaid", "Partial", "Paid"],
    default: "Unpaid",
  },

  // 🚦 Sale workflow status
  status: {
    type: String,
    enum: ["Draft", "Confirmed", "Dispatched", "Delivered", "Cancelled"],
    default: "Confirmed",
  },

  // Currency
  currencyType: { type: String, enum: ["INR", "USD", "NGN"], default: "INR" },
  exchangeRate: { type: Number, default: 1 },
}, { timestamps: true });


/* ──────── AUTO CALCULATIONS ──────── */
salesSchema.pre("save", function () {
  let gross = 0, disc = 0, pcsCount = 0, meterTotal = 0;

  this.items.forEach((it) => {
    // Normalize baleNo
    if (it.baleNo) it.baleNo = it.baleNo.toUpperCase().trim();

    it.totalMeter = +(it.pcs * it.meterPerPcs).toFixed(2);
    const lineGross = it.totalMeter * it.rate;
    const lineDisc  = it.totalMeter * (it.discount || 0);
    it.amount = +(lineGross - lineDisc).toFixed(2);

    gross    += lineGross;
    disc     += lineDisc;
    pcsCount += it.pcs;
    meterTotal += it.totalMeter;
  });

  this.totalPcs      = pcsCount;
  this.totalMeter    = +meterTotal.toFixed(2);
  this.grossAmount   = +gross.toFixed(2);
  this.discountTotal = +disc.toFixed(2);
  this.netAmount     = +(gross - disc).toFixed(2);

  // Balance due
  this.balanceDue = Math.max(this.netAmount - (this.paidAmount || 0), 0);

  // Payment status auto
  if (this.paidAmount === 0) this.paymentStatus = "Unpaid";
  else if (this.paidAmount >= this.netAmount) this.paymentStatus = "Paid";
  else this.paymentStatus = "Partial";
});

module.exports = mongoose.model("Sales", salesSchema);
const mongoose = require("mongoose");

// 🔥 SUB-SCHEMA: har PCS (taka) ke liye ek row
const pcsDetailSchema = new mongoose.Schema(
  {
    pcsNo: {
      type: Number,
      required: true
    },
    meter: {
      type: Number,
      required: true,
      min: 0
    },
    color: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Color"
    }
  },
  { _id: true } // har subdoc ka apna _id rahega → edit/delete me kaam aayega
);

const inwardSchema = new mongoose.Schema(
  {
    entryDate: { type: Date, required: true },
    voucherNo: { type: String, required: true }, // UI me dikh raha hai, add kar

    // 🔥 MASTER LINKS
    supplier:      { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: true },
    company:       { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    location:      { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    fabric:        { type: mongoose.Schema.Types.ObjectId, ref: "Fabric" },
    fabricQuality: { type: mongoose.Schema.Types.ObjectId, ref: "FabricQuality" },
    design:        { type: mongoose.Schema.Types.ObjectId, ref: "Design" },
    defaultColor:  { type: mongoose.Schema.Types.ObjectId, ref: "Color" }, // overall/default
    uom:           { type: mongoose.Schema.Types.ObjectId, ref: "UOM" },
    container:     { type: mongoose.Schema.Types.ObjectId, ref: "Container" },
    processType:   { type: mongoose.Schema.Types.ObjectId, ref: "ProcessType" }, // ya enum

    // Document refs
    challanNo:  String,
    invoiceNo:  String,
    lrNo:       String,
    transport:  String,
    gstNo:      String,
    hsnCode:    String,
    referenceNo: String,
    lotNo:      String,        // ye unique chahiye toh index laga
    rack:       String,
    invType:    String,        // FRESH GOODS, etc.
    weaver:     String,
    gsm:        String,
    width:      String,
    remarks:    String,

    // 🔥 PCS ARRAY — ye hai main change
    pcsDetails: {
      type: [pcsDetailSchema],
      validate: {
        validator: (arr) => Array.isArray(arr) && arr.length > 0,
        message: "Kam se kam ek PCS hona chahiye"
      }
    },

    // Weight info
    weight:      { type: Number, default: 0 }, // KG
    grossWeight: { type: Number, default: 0 },
    netWeight:   { type: Number, default: 0 },
    sqMeter:     { type: Number, default: 0 },

    // Currency & Rate
    currencyType: { type: String, enum: ["INR", "NGN", "USD"], default: "INR" },
    rate:         { type: Number, required: true, min: 0 }, // Grey Rate per meter
    exchangeRate: { type: Number, default: 1 },

    // 🔥 DERIVED FIELDS — pre-save me auto fill honge
    totalPcs:           { type: Number, default: 0 },
    totalMeter:         { type: Number, default: 0 },
    averageMeter:       { type: Number, default: 0 },
    greyAmount:         { type: Number, default: 0 }, // totalMeter * rate
    baseCurrencyTotal:  { type: Number, default: 0 }, // greyAmount * exchangeRate
    takaAdjustmentDiff: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// 🔥 AUTO-CALCULATIONS
inwardSchema.pre("save", function (next) {
  const pcs = this.pcsDetails || [];

  this.totalPcs   = pcs.length;
  this.totalMeter = pcs.reduce((sum, p) => sum + (p.meter || 0), 0);
  this.averageMeter = this.totalPcs ? +(this.totalMeter / this.totalPcs).toFixed(2) : 0;

  this.greyAmount        = +(this.totalMeter * (this.rate || 0)).toFixed(2);
  this.baseCurrencyTotal = +(this.greyAmount * (this.exchangeRate || 1)).toFixed(2);

  next();
});

// Same logic findOneAndUpdate ke liye bhi chahiye agar PATCH/PUT use kare
// (alag se handle karna padta hai — agar chahiye toh bata dena)

module.exports = mongoose.model("Inward", inwardSchema);
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
    },

  },
  { _id: true } // har subdoc ka apna _id rahega → edit/delete me kaam aayega
);

const inwardSchema = new mongoose.Schema(
  {
    entryDate: { type: Date, required: true },
    voucherNo: { type: String, required: false}, // auto-generated below

    // 🆕 BALE NO — unique physical identifier (A35, A59, 1224, 163...)
    baleNo: {
      type: String,
      required: [true, "Bale No is required"],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },

    // 🔥 MASTER LINKS
    supplier:      { type: mongoose.Schema.Types.ObjectId, ref: "Supplier", required: false },
    company:       { type: mongoose.Schema.Types.ObjectId, ref: "Company" },
    location:      { type: mongoose.Schema.Types.ObjectId, ref: "Location" },
    fabric:        { type: mongoose.Schema.Types.ObjectId, ref: "Fabric" },
    fabricQuality: { type: mongoose.Schema.Types.ObjectId, ref: "FabricQuality" },
    design:        { type: mongoose.Schema.Types.ObjectId, ref: "Design" },
    defaultColor:  { type: mongoose.Schema.Types.ObjectId, ref: "Color" }, // overall/default
    uom:           { type: mongoose.Schema.Types.ObjectId, ref: "UOM" },
    container:     { type: mongoose.Schema.Types.ObjectId, ref: "Container" },

    processType: {
      type: String,
      enum: ["DYEING", "PRINTING", "FINISHING"]
    },

    // Document refs
    challanNo:   String,
    invoiceNo:   String,
    lrNo:        String,
    transport:   String,
    gstNo:       String,
    hsnCode:     String,
    referenceNo: String,
    lotNo:       String,
    rack:        String,
    invType:     String,        // FRESH GOODS, etc.
    weaver:      String,
    gsm:         String,
    width:       String,
    remarks:     String,

    // 🔥 PCS ARRAY
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
    rateNGN:{ type: Number, min: 0 },
    exchangeRate: { type: Number, default: 1 },

    // 🔥 DERIVED FIELDS — auto-filled
    totalPcs:           { type: Number, default: 0 },
    totalMeter:         { type: Number, default: 0 },
    averageMeter:       { type: Number, default: 0 },
    greyAmount:         { type: Number, default: 0 }, // totalMeter * rate
    baseCurrencyTotal:  { type: Number, default: 0 }, // greyAmount * exchangeRate
    totalNGN:          { type: Number, default: 0 }, // totalNGN
    takaAdjustmentDiff: { type: Number, default: 0 }
  },
  { timestamps: true }
);

// 🔥 HELPER — derived calculations (reuse in save + update)
function computeDerived(doc) {
  const pcs = doc.pcsDetails || [];

  doc.totalPcs   = pcs.length;
  doc.totalMeter = pcs.reduce((sum, p) => sum + (p.meter || 0), 0);
  doc.averageMeter = doc.totalPcs ? +(doc.totalMeter / doc.totalPcs).toFixed(2) : 0;

  doc.greyAmount        = +(doc.totalMeter * (doc.rate || 0)).toFixed(2);
  doc.baseCurrencyTotal = +(doc.greyAmount * (doc.exchangeRate || 1)).toFixed(2);
}

// 🔥 AUTO-CALCULATIONS — on save (create + .save())
inwardSchema.pre("save", function () {
  computeDerived(this);
});

// 🔥 AUTO-CALCULATIONS — on findOneAndUpdate / findByIdAndUpdate
inwardSchema.pre("findOneAndUpdate", function () {
  const update = this.getUpdate() || {};

  // Normalize baleNo to uppercase if being updated
  if (update.baleNo) {
    update.baleNo = update.baleNo.toUpperCase().trim();
  }
  if (update.$set?.baleNo) {
    update.$set.baleNo = update.$set.baleNo.toUpperCase().trim();
  }

  // Recompute derived fields if pcsDetails or rate changed
  const target = update.$set || update;
  if (target.pcsDetails || target.rate !== undefined || target.exchangeRate !== undefined) {
    const merged = { ...target };
    computeDerived(merged);

    // Push computed values back
    if (update.$set) {
      Object.assign(update.$set, {
        totalPcs: merged.totalPcs,
        totalMeter: merged.totalMeter,
        averageMeter: merged.averageMeter,
        greyAmount: merged.greyAmount,
        baseCurrencyTotal: merged.baseCurrencyTotal
      });
    } else {
      Object.assign(update, {
        totalPcs: merged.totalPcs,
        totalMeter: merged.totalMeter,
        averageMeter: merged.averageMeter,
        greyAmount: merged.greyAmount,
        baseCurrencyTotal: merged.baseCurrencyTotal
      });
    }
  }

  this.setUpdate(update);
});

module.exports = mongoose.model("Inward", inwardSchema);
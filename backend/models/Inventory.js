const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema({

  inward: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Inward",
    required: true,
    unique: true // 🔥 prevent duplicate
  },

  baleNo: {
    type: String,
    required: true,
    unique: true
  },

  fabric: { type: mongoose.Schema.Types.ObjectId, ref: "Fabric" },
  fabricQuality: { type: mongoose.Schema.Types.ObjectId, ref: "FabricQuality" },
  design: { type: mongoose.Schema.Types.ObjectId, ref: "Design" },
  color: { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },

  container: { type: mongoose.Schema.Types.ObjectId, ref: "Container" },

  uom: { type: mongoose.Schema.Types.ObjectId, ref: "UOM" },
  location: { type: mongoose.Schema.Types.ObjectId, ref: "Location" },

  company: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Company",
    required: true
  },

  onePcsQty: Number,

  pcs: {
    type: Number,
    default: 0
  },

  qty: {
    type: Number,
    required: true
  },

  saleQty: {
    type: Number,
    default: 0
  },
  // 📏 Measurements
meter: {
  type: Number,
  default: 0
},

sqMeter: {
  type: Number,
  default: 0
},

// ⚖️ Weight
grossWeight: {
  type: Number,
  default: 0
},

netWeight: {
  type: Number,
  default: 0
},

// 💰 Financial
currencyType: {
  type: String,
  enum: ["INR", "NGN", "USD"],
  default: "INR"
},

rate: {
  type: Number,
  default: 0
},

totalAmount: {
  type: Number
},

  balanceQty: Number

}, { timestamps: true });


// 🔥 Auto calculation
inventorySchema.pre("save", function () {
  this.balanceQty = this.qty - this.saleQty;
  if(this.onePcsQty && this.qty) {
    this.pcs = this.onePcsQty * this.qty;
  }
});

inventorySchema.pre("findOneAndUpdate", function (next) {
  const update = this.getUpdate();

  if (update.qty !== undefined || update.saleQty !== undefined || update.rate !== undefined) {
    const qty = update.qty ?? this._update.qty;
    const saleQty = update.saleQty ?? this._update.saleQty ?? 0;
    const rate = update.rate ?? this._update.rate ?? 0;

    update.balanceQty = qty - saleQty;
    update.totalAmount = qty * rate;
  }

  next();
});

module.exports = mongoose.model("Inventory", inventorySchema);
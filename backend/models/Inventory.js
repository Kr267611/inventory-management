const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    // 🆕 BALE-BASED — har bale ka apna inventory record
    baleNo: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
      index: true,
    },

    // 🔗 Source inward (1:1 relationship)
    inward: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Inward",
      required: true,
    },

    // 📋 SNAPSHOT fields from inward (fast lookup ke liye)
    fabric:        { type: mongoose.Schema.Types.ObjectId, ref: "Fabric" },
    fabricQuality: { type: mongoose.Schema.Types.ObjectId, ref: "FabricQuality" },
    design:        { type: mongoose.Schema.Types.ObjectId, ref: "Design" },
    color:         { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
    location:      { type: mongoose.Schema.Types.ObjectId, ref: "Location" },

    // 📊 QUANTITY TRACKING — initial vs current available
    totalPcs:       { type: Number, default: 0 },  // jab inward aaya tab kitne the
    availablePcs:   { type: Number, default: 0 },  // abhi kitne hain (sales pe ghatata hai)
    totalMeter:     { type: Number, default: 0 },  // initial meter
    availableMeter: { type: Number, default: 0 },  // current available meter

    // 💰 RATE & VALUE
    avgMeterPerPcs: { type: Number, default: 0 },  // average meter per piece
    rate:           { type: Number, default: 0 },  // per meter rate (inward se)
    totalValue:     { type: Number, default: 0 },  // availablePcs × avgMeterPerPcs × rate

    // 🎚 STOCK THRESHOLD (for Low/Out badges)
    minStockPcs: { type: Number, default: 2 },
  },
  { timestamps: true }
);

// 🔥 PRE-SAVE: totalValue auto-compute
inventorySchema.pre("save", function () {
  this.totalValue = +(
    (this.availablePcs || 0) *
    (this.avgMeterPerPcs || 0) *
    (this.rate || 0)
  ).toFixed(2);
  // next();
});

// 🔥 VIRTUAL: Stock status based on availablePcs (not totalPcs)
inventorySchema.virtual("status").get(function () {
  if (this.availablePcs <= 0) return "Out of Stock";
  if (this.availablePcs <= this.minStockPcs) return "Low Stock";
  return "In Stock";
});
inventorySchema.set("toJSON", { virtuals: true });
inventorySchema.set("toObject", { virtuals: true });

module.exports = mongoose.model("Inventory", inventorySchema);
const mongoose = require("mongoose");

const inventorySchema = new mongoose.Schema(
  {
    // 🔑 COMPOSITE KEY — ye 4 combine se ek unique inventory record banta hai
    fabric:        { type: mongoose.Schema.Types.ObjectId, ref: "Fabric",        required: true },
    fabricQuality: { type: mongoose.Schema.Types.ObjectId, ref: "FabricQuality" },
    color:         { type: mongoose.Schema.Types.ObjectId, ref: "Color" },
    location:      { type: mongoose.Schema.Types.ObjectId, ref: "Location" },

    // 📊 AGGREGATED STOCK
    totalPcs:    { type: Number, default: 0 },   // Available PCS (taka)
    totalMeter:  { type: Number, default: 0 },   // Available meters
    avgRate:     { type: Number, default: 0 },   // Weighted avg rate
    totalValue:  { type: Number, default: 0 },   // totalMeter * avgRate

    // 🎚 STOCK THRESHOLDS (for Low Stock / Out of Stock badges)
    minStockPcs: { type: Number, default: 5 },

    // 🔗 Source tracking
    inwards: [{ type: mongoose.Schema.Types.ObjectId, ref: "Inward" }],
  },
  { timestamps: true }
);

// Unique combo
inventorySchema.index(
  { fabric: 1, fabricQuality: 1, color: 1, location: 1 },
  { unique: true }
);

// 🔥 HELPER: Stock status compute karne ke liye
inventorySchema.virtual("status").get(function () {
  if (this.totalPcs <= 0) return "Out of Stock";
  if (this.totalPcs <= this.minStockPcs) return "Low Stock";
  return "In Stock";
});
inventorySchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("Inventory", inventorySchema);
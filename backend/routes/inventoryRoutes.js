const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

/* ──────────────────────────────────────────────
   1. LIST ALL BALES — with filters
   ────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const { baleNo, fabric, fabricQuality, color, location, stockType, search } = req.query;

    const filter = {};
    if (baleNo) filter.baleNo = baleNo.toUpperCase();
    if (fabric) filter.fabric = fabric;
    if (fabricQuality) filter.fabricQuality = fabricQuality;
    if (color) filter.color = color;
    if (location) filter.location = location;

    let data = await Inventory.find(filter)
      .populate("fabric", "name")
      .populate("fabricQuality", "name")
      .populate("design", "name")
      .populate("color", "name")
      .populate("location", "name")
      .populate("inward", "voucherNo entryDate supplier")
      .sort({ createdAt: -1 });

    // 🔥 Stock type filter (virtual status pe based)
    if (stockType && stockType !== "All Stock") {
      data = data.filter((inv) => {
        const status = inv.availablePcs <= 0 ? "Out of Stock"
                     : inv.availablePcs <= inv.minStockPcs ? "Low Stock"
                     : "In Stock";
        return status === stockType;
      });
    }

    // 🔥 Search text filter (baleNo + names pe)
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((inv) =>
        (inv.baleNo || "").toLowerCase().includes(q) ||
        (inv.fabric?.name || "").toLowerCase().includes(q) ||
        (inv.fabricQuality?.name || "").toLowerCase().includes(q) ||
        (inv.color?.name || "").toLowerCase().includes(q)
      );
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inventory", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   2. STATS — top cards ke liye (available stock pe based)
   ────────────────────────────────────────────── */
router.get("/stats", async (req, res) => {
  try {
    const all = await Inventory.find();

    const totalItems      = all.length;                    // total bales
    const totalStockMtr   = all.reduce((s, i) => s + (i.availableMeter || 0), 0);
    const totalStockPcs   = all.reduce((s, i) => s + (i.availablePcs || 0), 0);
    const totalValue      = all.reduce((s, i) => s + (i.totalValue || 0), 0);
    const lowStockItems   = all.filter((i) => i.availablePcs > 0 && i.availablePcs <= i.minStockPcs).length;
    const outOfStockItems = all.filter((i) => i.availablePcs <= 0).length;
    const inStockItems    = all.filter((i) => i.availablePcs > i.minStockPcs).length;

    res.json({
      totalItems,
      totalStockPcs,
      totalStockMtr: +totalStockMtr.toFixed(2),
      totalValue: +totalValue.toFixed(2),
      lowStockItems,
      outOfStockItems,
      inStockItems,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   🆕 3. LOOKUP BY BALE NO — Sales auto-fill ke liye
   GET /api/inventory/lookup/bale/A35
   ────────────────────────────────────────────── */
router.get("/lookup/bale/:baleNo", async (req, res) => {
  try {
    const baleNo = req.params.baleNo.toUpperCase().trim();

    const inv = await Inventory.findOne({ baleNo })
      .populate("fabric", "name")
      .populate("fabricQuality", "name")
      .populate("design", "name")
      .populate("color", "name")
      .populate("location", "name")
      .populate("inward", "voucherNo entryDate supplier");

    if (!inv) {
      return res.status(404).json({ message: `Bale "${baleNo}" not found in inventory` });
    }

    if (inv.availablePcs <= 0) {
      return res.status(400).json({
        message: `Bale "${baleNo}" is out of stock`,
        baleNo: inv.baleNo,
        availablePcs: 0,
      });
    }

    res.json(inv);
  } catch (err) {
    res.status(500).json({ message: "Error looking up bale", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   4. CHECK STOCK BY COMBO — legacy support (optional)
   GET /api/inventory/check?fabric=X&fabricQuality=Y&color=Z
   Returns all matching bales with available stock
   ────────────────────────────────────────────── */
router.get("/check", async (req, res) => {
  try {
    const { fabric, fabricQuality, color, location } = req.query;
    if (!fabric) return res.status(400).json({ message: "fabric required" });

    const filter = { fabric, availablePcs: { $gt: 0 } };
    if (fabricQuality) filter.fabricQuality = fabricQuality;
    if (color) filter.color = color;
    if (location) filter.location = location;

    const bales = await Inventory.find(filter)
      .populate("fabric fabricQuality color location", "name")
      .sort({ availablePcs: -1 });

    const totalAvailable = bales.reduce((s, b) => s + (b.availablePcs || 0), 0);
    const totalMeterAvailable = bales.reduce((s, b) => s + (b.availableMeter || 0), 0);

    res.json({
      totalBales: bales.length,
      totalAvailable,
      totalMeterAvailable: +totalMeterAvailable.toFixed(2),
      available: bales.length > 0,
      bales: bales.map((b) => ({
        _id: b._id,
        baleNo: b.baleNo,
        availablePcs: b.availablePcs,
        availableMeter: b.availableMeter,
        rate: b.rate,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   5. GET SINGLE BALE — view details
   ────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const data = await Inventory.findById(req.params.id)
      .populate("fabric fabricQuality design color location")
      .populate({
        path: "inward",
        select: "baleNo voucherNo entryDate totalPcs totalMeter rate",
        populate: { path: "supplier", select: "name" },
      });

    if (!data) return res.status(404).json({ message: "Inventory not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   6. UPDATE — sirf minStockPcs editable
   (availablePcs / availableMeter inward+sales se hi update hone chahiye)
   ────────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = ["minStockPcs"];   // sirf ye edit allowed
    const updates = {};
    allowedFields.forEach((k) => {
      if (req.body[k] !== undefined) updates[k] = req.body[k];
    });

    const updated = await Inventory.findByIdAndUpdate(req.params.id, updates, { new: true });
    if (!updated) return res.status(404).json({ message: "Inventory not found" });

    res.json({ message: "Inventory updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
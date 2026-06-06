const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

/* ──────────────────────────────────────────────
   1. LIST ALL — with optional filters via query params
   ────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const { fabric, fabricQuality, color, location, stockType, search } = req.query;

    const filter = {};
    if (fabric) filter.fabric = fabric;
    if (fabricQuality) filter.fabricQuality = fabricQuality;
    if (color) filter.color = color;
    if (location) filter.location = location;

    let data = await Inventory.find(filter)
      .populate("fabric", "name")
      .populate("fabricQuality", "name")
      .populate("color", "name")
      .populate("location", "name")
      .sort({ updatedAt: -1 });

    // Stock type filter (status virtual ke base pe)
    if (stockType && stockType !== "All Stock") {
      data = data.filter((inv) => {
        const status = inv.totalPcs <= 0 ? "Out of Stock"
                     : inv.totalPcs <= inv.minStockPcs ? "Low Stock"
                     : "In Stock";
        return status === stockType;
      });
    }

    // Search text filter (fabric/quality/color name pe)
    if (search) {
      const q = search.toLowerCase();
      data = data.filter((inv) =>
        inv.fabric?.name?.toLowerCase().includes(q) ||
        inv.fabricQuality?.name?.toLowerCase().includes(q) ||
        inv.color?.name?.toLowerCase().includes(q)
      );
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inventory", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   2. STATS — top cards ke liye
   ────────────────────────────────────────────── */
router.get("/stats", async (req, res) => {
  try {
    const all = await Inventory.find();

    const totalItems     = all.length;
    const totalStockMtr  = all.reduce((s, i) => s + (i.totalMeter || 0), 0);
    const totalValue     = all.reduce((s, i) => s + (i.totalValue || 0), 0);
    const lowStockItems  = all.filter((i) => i.totalPcs > 0 && i.totalPcs <= i.minStockPcs).length;
    const outOfStockItems= all.filter((i) => i.totalPcs <= 0).length;

    res.json({
      totalItems,
      totalStockMtr: +totalStockMtr.toFixed(2),
      totalValue: +totalValue.toFixed(2),
      lowStockItems,
      outOfStockItems,
    });
  } catch (err) {
    res.status(500).json({ message: "Error fetching stats", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   3. CHECK STOCK — Sales form me available PCS dikhane ke liye
   GET /inventory/check?fabric=X&fabricQuality=Y&color=Z&location=W
   ────────────────────────────────────────────── */
router.get("/check", async (req, res) => {
  try {
    const { fabric, fabricQuality, color, location } = req.query;

    if (!fabric) return res.status(400).json({ message: "fabric required" });

    const inv = await Inventory.findOne({
      fabric,
      fabricQuality: fabricQuality || null,
      color: color || null,
      location: location || null,
    });

    res.json({
      totalPcs: inv?.totalPcs || 0,
      totalMeter: inv?.totalMeter || 0,
      avgRate: inv?.avgRate || 0,
      available: !!(inv && inv.totalPcs > 0),
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   4. GET SINGLE — view details ke liye
   ────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const data = await Inventory.findById(req.params.id)
      .populate("fabric fabricQuality color location")
      .populate({
        path: "inwards",
        select: "voucherNo entryDate totalPcs totalMeter rate",
        populate: { path: "supplier", select: "name" },
      });

    if (!data) return res.status(404).json({ message: "Inventory not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   5. UPDATE — sirf minStockPcs ya manual correction ke liye
   (Stock totalPcs/totalMeter manual change na karo —
    woh inward/sales se hi update hone chahiye)
   ────────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const allowedFields = ["minStockPcs"];   // sirf ye edit allow
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
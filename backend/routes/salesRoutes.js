const express = require("express");
const router = express.Router();
const Sales = require("../models/Sales");
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

/* ──────────────────────────────────────────────
   HELPER: Inventory adjust karna
   direction: -1 = Sale ho raha hai (stock kam karo)
   direction: +1 = Sale cancel/delete (stock wapas badhao)
   ────────────────────────────────────────────── */
async function adjustInventory(items, direction) {
  for (const it of items) {
    await Inventory.findOneAndUpdate(
      {
        fabric: it.fabric,
        fabricQuality: it.fabricQuality || null,
        color: it.color || null,
        location: it.location || null,
      },
      {
        $inc: {
          totalPcs:   direction * it.pcs,
          totalMeter: direction * it.totalMeter,
        },
      }
    );
  }
}

/* ──────────────────────────────────────────────
   1. CREATE SALE
   ────────────────────────────────────────────── */
router.post("/add", async (req, res) => {
  try {
    const items = req.body.items || [];
    if (items.length === 0) {
      return res.status(400).json({ message: "Kam se kam ek item add karo" });
    }

    // 1. Stock check pehle — sab items ke liye
    for (const it of items) {
      const inv = await Inventory.findOne({
        fabric: it.fabric,
        fabricQuality: it.fabricQuality || null,
        color: it.color || null,
        location: it.location || null,
      }).populate("fabric", "name");

      if (!inv) {
        return res.status(400).json({
          message: `Stock not found for fabric (combo not in inventory)`,
        });
      }
      if (inv.totalPcs < it.pcs) {
        return res.status(400).json({
          message: `Insufficient stock for ${inv.fabric?.name || "item"}. Available: ${inv.totalPcs} PCS, Requested: ${it.pcs} PCS`,
        });
      }
    }

    // 2. Sale create karo — pre-save hook automatically derived totals fill karega
    const sale = await Sales.create(req.body);

    // 3. Inventory decrement
    await adjustInventory(sale.items, -1);

    res.status(201).json({
      message: "Sale created successfully, Inventory updated",
      data: sale,
    });
  } catch (err) {
    // Duplicate invoiceNo error handling
    if (err.code === 11000) {
      return res.status(400).json({ message: "Invoice No already exists" });
    }
    res.status(500).json({ message: "Error creating sale", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   2. LIST SALES — with filters
   ────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const filter = {};
    if (req.query.customer) filter.customer = req.query.customer;
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.fromDate || req.query.toDate) {
      filter.saleDate = {};
      if (req.query.fromDate) filter.saleDate.$gte = new Date(req.query.fromDate);
      if (req.query.toDate)   filter.saleDate.$lte = new Date(req.query.toDate);
    }

    const data = await Sales.find(filter)
      .populate("customer", "name code")
      .populate("company", "name")
      .populate("location", "name")
      .populate("salesPerson", "name")
      .populate("transport", "name")
      .populate("paymentMode", "name")
      .sort({ createdAt: -1 });

    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   3. STATS — for dashboard cards
   ────────────────────────────────────────────── */
router.get("/stats", async (req, res) => {
  try {
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const [totals, monthTotals] = await Promise.all([
      Sales.aggregate([
        {
          $group: {
            _id: null,
            totalSales: { $sum: 1 },
            totalAmount: { $sum: "$netAmount" },
            totalOutstanding: { $sum: "$balanceDue" },
          },
        },
      ]),
      Sales.aggregate([
        { $match: { saleDate: { $gte: monthStart } } },
        {
          $group: {
            _id: null,
            monthSales: { $sum: 1 },
            monthAmount: { $sum: "$netAmount" },
          },
        },
      ]),
    ]);

    res.json({
      totalSales:       totals[0]?.totalSales || 0,
      totalAmount:      totals[0]?.totalAmount || 0,
      totalOutstanding: totals[0]?.totalOutstanding || 0,
      monthSales:       monthTotals[0]?.monthSales || 0,
      monthAmount:      monthTotals[0]?.monthAmount || 0,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   4. GET SINGLE SALE — full populated for edit/view
   ────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const data = await Sales.findById(req.params.id)
      .populate("customer", "name code phone gstNo address city state")
      .populate("company", "name")
      .populate("location", "name")
      .populate("salesPerson", "name")
      .populate("transport", "name")
      .populate("paymentMode", "name")
      .populate("items.fabric", "name")
      .populate("items.fabricQuality", "name")
      .populate("items.color", "name")
      .populate("items.location", "name");

    if (!data) return res.status(404).json({ message: "Sale not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   5. UPDATE SALE — reverse old inventory, save new, re-apply
   ────────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const old = await Sales.findById(req.params.id);
    if (!old) return res.status(404).json({ message: "Sale not found" });

    // 1. Old items inventory wapas (+1)
    await adjustInventory(old.items, +1);

    // 2. New items ki stock check
    const newItems = req.body.items || [];
    for (const it of newItems) {
      const inv = await Inventory.findOne({
        fabric: it.fabric,
        fabricQuality: it.fabricQuality || null,
        color: it.color || null,
        location: it.location || null,
      }).populate("fabric", "name");

      if (!inv || inv.totalPcs < it.pcs) {
        // Rollback — old inventory wapas decrement
        await adjustInventory(old.items, -1);
        return res.status(400).json({
          message: `Insufficient stock for ${inv?.fabric?.name || "item"}. Available: ${inv?.totalPcs || 0} PCS`,
        });
      }
    }

    // 3. Update karo
    Object.assign(old, req.body);
    const updated = await old.save();

    // 4. New items inventory decrement
    await adjustInventory(updated.items, -1);

    res.json({ message: "Sale updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   6. DELETE SALE — restore inventory
   ────────────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const sale = await Sales.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: "Sale not found" });

    // Inventory wapas badhao
    await adjustInventory(sale.items, +1);

    await sale.deleteOne();
    res.json({ message: "Sale deleted, Inventory restored" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
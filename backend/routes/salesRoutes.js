const express = require("express");
const router = express.Router();
const Sales = require("../models/Sales");
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

/* ──────────────────────────────────────────────
   HELPER 1: Bale-based stock validation
   - Check each item has baleNo
   - Check bale exists in inventory
   - Check availablePcs >= requested pcs
   ────────────────────────────────────────────── */
async function validateBaleStock(items) {
  for (const it of items) {
    if (!it.baleNo) {
      return { ok: false, message: "Bale No required for each item" };
    }

    const baleNo = it.baleNo.toUpperCase().trim();
    const inv = await Inventory.findOne({ baleNo }).populate("fabric", "name");

    if (!inv) {
      return { ok: false, message: `Bale "${baleNo}" not found in inventory` };
    }

    if (inv.availablePcs < it.pcs) {
      return {
        ok: false,
        message: `Bale "${baleNo}" (${inv.fabric?.name || ""}): only ${inv.availablePcs} PCS available, you requested ${it.pcs}`,
      };
    }
  }
  return { ok: true };
}

/* ──────────────────────────────────────────────
   HELPER 2: Inventory adjust karna (bale-wise)
   direction: -1 = Sale ho raha hai (availablePcs ghatao)
   direction: +1 = Sale cancel/delete (availablePcs wapas badhao)
   ────────────────────────────────────────────── */
async function adjustInventory(items, direction) {
  for (const it of items) {
    if (!it.baleNo) continue;

    const baleNo = it.baleNo.toUpperCase().trim();
    const inv = await Inventory.findOne({ baleNo });
    if (!inv) continue;

    // availablePcs aur availableMeter modify
    inv.availablePcs   = Math.max(inv.availablePcs   + direction * (it.pcs || 0),        0);
    inv.availableMeter = Math.max(inv.availableMeter + direction * (it.totalMeter || 0), 0);

    // Safety: agar +1 (restore) ke baad available > total ho jaaye to clamp
    if (inv.availablePcs > inv.totalPcs)     inv.availablePcs   = inv.totalPcs;
    if (inv.availableMeter > inv.totalMeter) inv.availableMeter = inv.totalMeter;

    await inv.save();  // pre-save chalega → totalValue recompute
  }
}

/* ──────────────────────────────────────────────
   HELPER 3: Bale lookups ko inventoryRef se link karna
   (audit/traceability ke liye)
   ────────────────────────────────────────────── */
async function attachInventoryRefs(items) {
  for (const it of items) {
    if (!it.baleNo || it.inventoryRef) continue;
    const inv = await Inventory.findOne({ baleNo: it.baleNo.toUpperCase().trim() });
    if (inv) it.inventoryRef = inv._id;
  }
  return items;
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

    // 1. Bale-based stock validation
    const check = await validateBaleStock(items);
    if (!check.ok) {
      return res.status(400).json({ message: check.message });
    }

    // 2. inventoryRef attach karo
    req.body.items = await attachInventoryRefs(items);

    // 3. Sale create karo (pre-save derived totals auto fill karega)
    const sale = await Sales.create(req.body);
    console.log(`✅ Sale created: ${sale.invoiceNo} | ${sale.items.length} items`);

    // 4. Inventory decrement (per-bale)
    await adjustInventory(sale.items, -1);
    console.log("✅ Inventory updated (bales decremented)");

    res.status(201).json({
      message: "Sale created successfully, Inventory updated",
      data: sale,
    });
  } catch (err) {
    console.error("🔴 Sale create error:", err.message);

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
    if (req.query.customer)      filter.customer = req.query.customer;
    if (req.query.status)        filter.status = req.query.status;
    if (req.query.paymentStatus) filter.paymentStatus = req.query.paymentStatus;
    if (req.query.baleNo)        filter["items.baleNo"] = req.query.baleNo.toUpperCase();

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
      // 🆕 Items refs populate karo — Party-Wise Report ke ledger ke liye
      .populate("items.fabric", "name")
      .populate("items.fabricQuality", "name")
      .populate("items.color", "name")
      .populate("items.design", "designNo name")
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
   4. GET SINGLE SALE — full populated
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
      .populate("items.design", "designNo name") 
      .populate("items.color", "name")
      .populate("items.location", "name")
      .populate("items.inventoryRef", "baleNo availablePcs totalPcs");

    if (!data) return res.status(404).json({ message: "Sale not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

/* ──────────────────────────────────────────────
   5. UPDATE SALE — reverse old, validate new, save, re-apply
   ────────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const old = await Sales.findById(req.params.id);
    if (!old) return res.status(404).json({ message: "Sale not found" });

    // 1. Old items inventory wapas (+1)
    await adjustInventory(old.items, +1);

    // 2. New items ka bale-based stock check
    const newItems = req.body.items || [];
    const check = await validateBaleStock(newItems);

    if (!check.ok) {
      // Rollback — old items wapas decrement
      await adjustInventory(old.items, -1);
      return res.status(400).json({ message: check.message });
    }

    // 3. inventoryRef refresh
    req.body.items = await attachInventoryRefs(newItems);

    // 4. Update karo
    Object.assign(old, req.body);
    const updated = await old.save();

    // 5. New items inventory decrement
    await adjustInventory(updated.items, -1);

    console.log(`✅ Sale updated: ${updated.invoiceNo}`);
    res.json({ message: "Sale updated", data: updated });
  } catch (err) {
    console.error("🔴 Sale update error:", err.message);
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
    console.log(`✅ Sale deleted: ${sale.invoiceNo} | Inventory restored`);
    res.json({ message: "Sale deleted, Inventory restored" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
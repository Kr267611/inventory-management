const express = require("express");
const router = express.Router();
const Inward = require("../models/Inward");
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");
const Supplier      = require("../models/Supplier");
const Fabric        = require("../models/Fabric");
const FabricQuality = require("../models/FabricQuality");
const Design        = require("../models/Design");
const Color         = require("../models/Color");

router.use(authMiddleware);

/* ──────────────────────────────────────────────
   HELPER: BALE-BASED inventory sync
   - create: naya bale → naya inventory record
   - update: existing inventory update (sold count preserve)
   - delete: inventory delete
   ────────────────────────────────────────────── */
async function applyToInventory(inward, action = "create") {
  // ───── DELETE ─────
  if (action === "delete") {
    await Inventory.deleteOne({ inward: inward._id });
    return;
  }

  // avgMeterPerPcs nikal lo
  const avgMeterPerPcs = inward.totalPcs > 0
    ? +(inward.totalMeter / inward.totalPcs).toFixed(2)
    : 0;

  // Inventory snapshot (inward se copy)
  const snapshot = {
    baleNo: inward.baleNo,
    inward: inward._id,
    fabric: inward.fabric,
    fabricQuality: inward.fabricQuality,
    design: inward.design,
    color: inward.defaultColor,
    location: inward.location,
    totalPcs: inward.totalPcs,
    totalMeter: inward.totalMeter,
    avgMeterPerPcs,
    rate: inward.rate,
  };

  // ───── UPDATE ─────
  if (action === "update") {
    const existing = await Inventory.findOne({ inward: inward._id });
    if (existing) {
      // Sold count preserve karo
      const soldPcs = Math.max(existing.totalPcs - existing.availablePcs, 0);
      const soldMeter = Math.max(existing.totalMeter - existing.availableMeter, 0);

      existing.set({
        ...snapshot,
        availablePcs: Math.max(snapshot.totalPcs - soldPcs, 0),
        availableMeter: Math.max(snapshot.totalMeter - soldMeter, 0),
        minStockPcs: existing.minStockPcs,
      });
      await existing.save();
      console.log(`✅ Inventory updated for bale ${snapshot.baleNo}`);
      return;
    }
  }

  // ───── CREATE ─────
  await Inventory.create({
    ...snapshot,
    availablePcs: snapshot.totalPcs,
    availableMeter: snapshot.totalMeter,
  });
  console.log(`✅ Inventory created for bale ${snapshot.baleNo}`);
}

/* ══════════════════════════════════════════════════════════════
   BULK IMPORT ROUTE — add this to your existing inward route file
   (routes/inward.js), BEFORE the "module.exports = router;" line.

   Also make sure these master models are required at the TOP of the
   file (add whichever are missing):

     const Supplier      = require("../models/Supplier");
     const Fabric        = require("../models/Fabric");
     const FabricQuality = require("../models/FabricQuality");
     const Design        = require("../models/Design");
     const Color         = require("../models/Color");

   NOTE: These master models are assumed to have a "name" field only
   as required. If any model has OTHER required fields (e.g. "code"),
   the auto-create will fail for that master — tell me and I'll adjust.
   ══════════════════════════════════════════════════════════════ */

// Helper: find a master by name (case-insensitive), auto-create if missing.
// Returns the ObjectId. Caches within a single request to avoid dup queries.
async function resolveMaster(Model, name, cache) {
  if (!name || !String(name).trim()) return null;
  const clean = String(name).trim();
  const key = clean.toLowerCase();

  if (cache.has(key)) return cache.get(key);

  // Case-insensitive exact match
  let doc = await Model.findOne({
    name: { $regex: `^${clean.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, $options: "i" },
  });

  if (!doc) {
    doc = await Model.create({ name: clean });
    console.log(`  ➕ Auto-created ${Model.modelName}: ${clean}`);
  }

  cache.set(key, doc._id);
  return doc._id;
}

/* ──────────────────────────────────────────────
   7. BULK IMPORT INWARD
   Body: { rows: [ { baleNo, entryDate, supplier, fabric,
                     fabricQuality, design, color, pcsCount,
                     totalMeter, rate, exchangeRate,
                     invoiceNo, challanNo, remarks }, ... ] }
   ────────────────────────────────────────────── */

/* ──────────────────────────────────────────────
   1. CREATE INWARD
   ────────────────────────────────────────────── */
router.post("/add", async (req, res) => {
  try {
    const newInward = new Inward(req.body);
    const saved = await newInward.save();
    console.log("✅ New Inward saved:", saved._id, "| Bale:", saved.baleNo);

    await applyToInventory(saved, "create");

    res.status(201).json({
      message: "Inward created + Inventory updated",
      data: saved,
    });
  } catch (err) {
    console.error("🔴 ════════ ERROR ════════");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);
    console.error("════════════════════════");

    // Duplicate baleNo friendly error
    if (err.code === 11000 && err.keyPattern?.baleNo) {
      return res.status(400).json({
        message: `Bale No "${req.body.baleNo}" already exists. Use a different one.`,
      });
    }

    res.status(500).json({
      message: "Error adding inward",
      error: err.message,
      stack: err.stack,
    });
  }
});

/* ──────────────────────────────────────────────
   2. LIST INWARDS
   ────────────────────────────────────────────── */
router.get("/", async (req, res) => {
  try {
    const data = await Inward.find()
      .populate("supplier", "name")
      .populate("company", "name")
      .populate("location", "name")
      .populate("fabric", "name")
      .populate("fabricQuality", "name")
      .populate("design", "name")
      .populate("defaultColor", "name")
      .populate("uom", "name")
      .sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inwards", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   3. GET SINGLE BY ID
   ────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const data = await Inward.findById(req.params.id)
      .populate("supplier company location fabric fabricQuality design defaultColor uom container")
      .populate("pcsDetails.color");
    if (!data) return res.status(404).json({ message: "Inward not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inward", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   4. GET BY BALE NO — Sales lookup ke liye
   ────────────────────────────────────────────── */
router.get("/bale/:baleNo", async (req, res) => {
  try {
    const baleNo = req.params.baleNo.toUpperCase().trim();
    const data = await Inward.findOne({ baleNo })
      .populate("supplier company location fabric fabricQuality design defaultColor uom container")
      .populate("pcsDetails.color");

    if (!data) return res.status(404).json({ message: `Bale "${baleNo}" not found` });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching bale", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   5. UPDATE
   ────────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const oldInward = await Inward.findById(req.params.id);
    if (!oldInward) return res.status(404).json({ message: "Inward not found" });

    const oldBaleNo = oldInward.baleNo;
    const newBaleNo = (req.body.baleNo || oldBaleNo).toUpperCase().trim();

    // Duplicate baleNo check (agar change ho raha hai)
    if (newBaleNo !== oldBaleNo) {
      const dup = await Inward.findOne({ baleNo: newBaleNo, _id: { $ne: oldInward._id } });
      if (dup) {
        return res.status(400).json({
          message: `Bale No "${newBaleNo}" already exists on another inward.`,
        });
      }
    }

    Object.assign(oldInward, req.body);
    oldInward.baleNo = newBaleNo;
    const updated = await oldInward.save();

    // Inventory baleNo sync (agar change hua)
    if (newBaleNo !== oldBaleNo) {
      await Inventory.updateOne(
        { inward: updated._id },
        { $set: { baleNo: newBaleNo } }
      );
    }

    await applyToInventory(updated, "update");

    console.log(`✅ Inward updated: ${updated._id} | Bale: ${updated.baleNo}`);
    res.json({ message: "Inward + Inventory updated", data: updated });
  } catch (err) {
    console.error("🔴 Update error:", err.message);

    if (err.code === 11000 && err.keyPattern?.baleNo) {
      return res.status(400).json({
        message: `Bale No "${req.body.baleNo}" already exists.`,
      });
    }

    res.status(500).json({ message: "Error updating inward", error: err.message });
  }
});

router.post("/bulk", async (req, res) => {
  try {
    const rows = Array.isArray(req.body.rows) ? req.body.rows : [];
    if (rows.length === 0) {
      return res.status(400).json({ message: "No rows to import" });
    }

    // Per-request cache so same supplier/fabric isn't queried repeatedly
    const cache = {
      supplier: new Map(),
      fabric: new Map(),
      quality: new Map(),
      design: new Map(),
      color: new Map(),
    };

    const created = [];
    const skipped = [];   // { baleNo, reason }
    const errors = [];    // { row, baleNo, error }

    for (let idx = 0; idx < rows.length; idx++) {
      const r = rows[idx];
      const rowNo = idx + 2; // +2 because Excel row 1 = header
      const baleNo = (r.baleNo || "").toString().toUpperCase().trim();

      try {
        // ── Validate required fields ──
        if (!baleNo) {
          errors.push({ row: rowNo, baleNo: "-", error: "Bale No is empty" });
          continue;
        }
        if (!r.fabric || !r.fabricQuality) {
          errors.push({ row: rowNo, baleNo, error: "Fabric and Fabric Quality are required" });
          continue;
        }
        const rate = parseFloat(r.rate) || 0;
        if (rate <= 0) {
          errors.push({ row: rowNo, baleNo, error: "Rate must be greater than 0" });
          continue;
        }
        const pcsCount = Math.max(0, parseInt(r.pcsCount) || 0);
        const totalMeter = parseFloat(r.totalMeter) || 0;
        if (pcsCount <= 0) {
          errors.push({ row: rowNo, baleNo, error: "Pcs Count must be greater than 0" });
          continue;
        }

        // ── Duplicate baleNo? skip ──
        const dup = await Inward.findOne({ baleNo });
        if (dup) {
          skipped.push({ baleNo, reason: "Bale No already exists" });
          continue;
        }

        // ── Resolve masters (auto-create) ──
        const supplierId = await resolveMaster(Supplier, r.supplier, cache.supplier);
        const fabricId = await resolveMaster(Fabric, r.fabric, cache.fabric);
        const qualityId = await resolveMaster(FabricQuality, r.fabricQuality, cache.quality);
        const designId = await resolveMaster(Design, r.designNo, cache.design);
        const colorId = await resolveMaster(Color, r.color, cache.color);

        // ── Build pcsDetails: divide total meter equally ──
        const perRow = pcsCount > 0 ? +(totalMeter / pcsCount).toFixed(3) : 0;
        const pcsDetails = Array.from({ length: pcsCount }, (_, i) => {
          const row = { pcsNo: i + 1, meter: perRow };
          if (colorId) row.color = colorId;
          return row;
        });

        // ── Build inward document ──
        const inwardDoc = {
          baleNo,
          entryDate: r.entryDate ? new Date(r.entryDate) : new Date(),
          supplier: supplierId || undefined,
          fabric: fabricId,
          fabricQuality: qualityId,
          design: designId || undefined,
          defaultColor: colorId || undefined,
          totalPcs: pcsCount,
          totalMeter,
          rate,
          exchangeRate: parseFloat(r.exchangeRate) || 1,
          invoiceNo: r.invoiceNo || "",
          challanNo: r.challanNo || "",
          remarks: r.remarks || "",
          pcsDetails,
        };

        // Strip undefined keys (avoid Mongoose cast issues)
        Object.keys(inwardDoc).forEach((k) => inwardDoc[k] === undefined && delete inwardDoc[k]);

        const saved = await new Inward(inwardDoc).save();
        await applyToInventory(saved, "create");
        created.push({ baleNo: saved.baleNo, id: saved._id });
      } catch (rowErr) {
        // Handle duplicate at DB level (race) + any other row error
        if (rowErr.code === 11000 && rowErr.keyPattern?.baleNo) {
          skipped.push({ baleNo, reason: "Bale No already exists" });
        } else {
          console.error(`🔴 Bulk row ${rowNo} (${baleNo}) failed:`, rowErr.message);
          errors.push({ row: rowNo, baleNo, error: rowErr.message });
        }
      }
    }

    res.status(200).json({
      message: `Import done: ${created.length} created, ${skipped.length} skipped, ${errors.length} errors`,
      createdCount: created.length,
      skippedCount: skipped.length,
      errorCount: errors.length,
      created,
      skipped,
      errors,
    });
  } catch (err) {
    console.error("🔴 Bulk import failed:", err.message);
    res.status(500).json({ message: "Bulk import failed", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   6. DELETE — sales check + revert inventory
   ────────────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const inward = await Inward.findById(req.params.id);
    if (!inward) return res.status(404).json({ message: "Inward not found" });

    // Safety: agar bale se sales ho chuki hain, delete mat hone do
    const inv = await Inventory.findOne({ inward: inward._id });
    if (inv && inv.availablePcs < inv.totalPcs) {
      const soldPcs = inv.totalPcs - inv.availablePcs;
      return res.status(400).json({
        message: `Cannot delete bale "${inward.baleNo}" — ${soldPcs} PCS already sold. Delete the sales first.`,
      });
    }

    await applyToInventory(inward, "delete");
    await inward.deleteOne();

    console.log(`✅ Inward deleted: ${inward._id} | Bale: ${inward.baleNo}`);
    res.json({ message: "Inward deleted + Inventory cleared" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting inward", error: err.message });
  }
});

module.exports = router;
const express = require("express");
const router = express.Router();
const Inward = require("../models/Inward");
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");

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
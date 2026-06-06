const express = require("express");
const router = express.Router();
const Inward = require("../models/Inward");
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);

/* ──────────────────────────────────────────────
   HELPER: PCS ko color ke hisaab se group karke
   inventory me +/- karna. Ek inward me alag-alag
   color ke PCS ho sakte hain.
   ────────────────────────────────────────────── */
async function applyToInventory(inward, direction = 1) {
  // direction: +1 (add on create), -1 (revert on delete)
  const groups = {};

  for (const pcs of inward.pcsDetails) {
    // PCS ka color use karo, na ho to inward ka defaultColor
    const color = pcs.color?.toString() || inward.defaultColor?.toString();
    const key = `${inward.fabric}|${inward.fabricQuality || ""}|${color || ""}|${inward.location || ""}`;

    if (!groups[key]) {
      groups[key] = {
        fabric: inward.fabric,
        fabricQuality: inward.fabricQuality,
        color,
        location: inward.location,
        pcs: 0,
        meter: 0,
      };
    }
    groups[key].pcs += 1;
    groups[key].meter += pcs.meter || 0;
  }

  // Har group ke liye inventory upsert
  for (const g of Object.values(groups)) {
    const filter = {
      fabric: g.fabric,
      fabricQuality: g.fabricQuality || null,
      color: g.color || null,
      location: g.location || null,
    };

    const existing = await Inventory.findOne(filter);

    if (existing) {
      // Weighted avg rate update
      const oldValue = existing.totalMeter * existing.avgRate;
      const addValue = direction === 1 ? g.meter * inward.rate : 0;
      const newMeter = existing.totalMeter + direction * g.meter;
      const newValue = oldValue + direction * (g.meter * inward.rate);

      existing.totalPcs   += direction * g.pcs;
      existing.totalMeter  = Math.max(newMeter, 0);
      existing.avgRate     = newMeter > 0 ? newValue / newMeter : 0;
      existing.totalValue  = Math.max(newValue, 0);

      if (direction === 1 && !existing.inwards.includes(inward._id)) {
        existing.inwards.push(inward._id);
      }
      if (direction === -1) {
        existing.inwards = existing.inwards.filter(
          (id) => id.toString() !== inward._id.toString()
        );
      }

      await existing.save();
    } else if (direction === 1) {
      // New inventory record
      await Inventory.create({
        ...filter,
        totalPcs: g.pcs,
        totalMeter: g.meter,
        avgRate: inward.rate,
        totalValue: g.meter * inward.rate,
        inwards: [inward._id],
      });
    }
  }
}

/* ──────────────────────────────────────────────
   1. CREATE INWARD → auto add to Inventory
   ────────────────────────────────────────────── */
router.post("/add", async (req, res) => {
  try {
    const newInward = new Inward(req.body);
    const saved = await newInward.save();     
    console.log("✅ New Inward saved to DB:", saved._id);

    await applyToInventory(saved, +1);
    console.log("✅ Inventory updated for new inward");
    
    res.status(201).json({
      message: "Inward created + Inventory updated",
      data: saved,
    });
  } catch (err) {
    console.error("🔴 ════════ ERROR ════════");
    console.error("Name:", err.name);
    console.error("Message:", err.message);
    console.error("Stack:", err.stack);            // ← ye line crucial hai
    console.error("════════════════════════");
    
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
   3. GET SINGLE
   ────────────────────────────────────────────── */
router.get("/:id", async (req, res) => {
  try {
    const data = await Inward.findById(req.params.id)
      .populate("supplier company location fabric fabricQuality design defaultColor uom container processType")
      .populate("pcsDetails.color");
    if (!data) return res.status(404).json({ message: "Inward not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: "Error fetching inward", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   4. UPDATE — revert old, apply new
   ────────────────────────────────────────────── */
router.put("/:id", async (req, res) => {
  try {
    const oldInward = await Inward.findById(req.params.id);
    if (!oldInward) return res.status(404).json({ message: "Inward not found" });

    // Pehle purana inward inventory se revert karo
    await applyToInventory(oldInward, -1);

    // Phir update karo
    Object.assign(oldInward, req.body);
    const updated = await oldInward.save();         // pre-save chalega

    // Naya inventory me add karo
    await applyToInventory(updated, +1);

    res.json({ message: "Inward + Inventory updated", data: updated });
  } catch (err) {
    res.status(500).json({ message: "Error updating inward", error: err.message });
  }
});

/* ──────────────────────────────────────────────
   5. DELETE — revert inventory
   ────────────────────────────────────────────── */
router.delete("/:id", async (req, res) => {
  try {
    const inward = await Inward.findById(req.params.id);
    if (!inward) return res.status(404).json({ message: "Inward not found" });

    await applyToInventory(inward, -1);             // inventory se ghatao
    await inward.deleteOne();

    res.json({ message: "Inward deleted + Inventory reverted" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting inward", error: err.message });
  }
});

module.exports = router;
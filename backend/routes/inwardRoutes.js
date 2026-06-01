const express = require("express");
const router = express.Router();
const Inward = require("../models/Inward");
const Inventory = require("../models/Inventory");
const authMiddleware = require("../middleware/authMiddleware");

router.use(authMiddleware);


// 🔥 1. ADD INWARD (POST)
router.post("/add", async (req, res) => {
  try {
    const newInward = new Inward(req.body);
    const savedData = await newInward.save();

    // 🔥 AUTO CREATE INVENTORY
    const newInventory = new Inventory({
      inward: savedData._id,
      baleNo: savedData.baleNo,

      fabric: savedData.fabric,
      fabricQuality: savedData.fabricQuality,
      design: savedData.design,
      color: savedData.color,
      supplier: savedData.supplier,
      container: savedData.container,

      uom: savedData.uom,
      location: savedData.location,
      company: savedData.company, // make sure inward me bhi hai

      // new fields
      meter: savedData.meter,
      sqMeter: savedData.sqMeter,
      grossWeight: savedData.grossWeight,
      netWeight: savedData.netWeight,

      currencyType: savedData.currencyType,
      rate: savedData.rate,
      onePcsQty: savedData.onePcsQty,
      qty: savedData.qty,
      pcs: savedData.onePcsQty || 0, // optional logic
    });

    await newInventory.save();

    res.status(201).json({
      message: "Inward + Inventory Created Successfully",
      data: savedData
    });

  } catch (error) {
    res.status(500).json({
      message: "Error while adding inward",
      error: error.message
    });
  }
});

// 🔥 2. GET ALL INWARD
router.get("/", async (req, res) => {
  try {
    const data = await Inward.find()
      .populate("supplier", "name")
      .populate("fabricQuality", "name")
      .populate("design", "name")
      .populate("color", "name")
      .populate("uom", "name")
      .populate("location", "name")
      .populate("container", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error while fetching data",
      error: error.message
    });
  }
});


// 🔥 3. GET SINGLE INWARD (by ID)
router.get("/:id", async (req, res) => {
  try {
    const data = await Inward.findById(req.params.id);

    if (!data) {
      return res.status(404).json({ message: "Inward not found" });
    }

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error while fetching single inward",
      error: error.message
    });
  }
});


// 🔥 4. DELETE INWARD
router.delete("/:id", async (req, res) => {
  try {
    const inwardId = req.params.id;

    await Inward.findByIdAndDelete(inwardId);

    // 🔥 DELETE INVENTORY ALSO
    await Inventory.findOneAndDelete({ inward: inwardId });

    res.status(200).json({ message: "Inward + Inventory Deleted Successfully" });

  } catch (error) {
    res.status(500).json({
      message: "Error while deleting inward",
      error: error.message
    });
  }
});


// 🔥 5. UPDATE INWARD
router.put("/:id", async (req, res) => {
  try {
    const inwardId = req.params.id;

    const updated = await Inward.findByIdAndUpdate(
      inwardId,
      req.body,
      { new: true }
    );

    // 🔥 UPDATE INVENTORY ALSO
    await Inventory.findOneAndUpdate(
      { inward: inwardId },
      {
        baleNo: updated.baleNo,
        fabric: updated.fabric,
        fabricQuality: updated.fabricQuality,
        design: updated.design,
        color: updated.color,
        supplier: updated.supplier,
        container: updated.container,
        uom: updated.uom,
        location: updated.location,
        company: updated.company,

        onePcsQty: updated.onePcsQty,
        qty: updated.qty,

        // new fields
        meter: updated.meter,
        sqMeter: updated.sqMeter,
        grossWeight: updated.grossWeight,
        netWeight: updated.netWeight,

        currencyType: updated.currencyType,
        rate: updated.rate
      }
    );

    res.status(200).json({
      message: "Inward + Inventory Updated",
      data: updated
    });

  } catch (error) {
    res.status(500).json({
      message: "Error while updating inward",
      error: error.message
    });
  }
});


module.exports = router;
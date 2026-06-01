const express = require("express");
const router = express.Router();
const Inventory = require("../models/Inventory");


// ✅ GET ALL INVENTORY
router.get("/", async (req, res) => {
  try {
    const { company, location } = req.query;

    let filter = {};
    if (company) filter.company = company;
    if (location) filter.location = location;

    const data = await Inventory.find(filter)
      .populate("fabric", "name")
      .populate("fabricQuality", "name")
      .populate("design", "name")
      .populate("color", "name")
      .populate("supplier", "name")
      .populate("container", "name")
      .populate("location", "name")
      .populate("company", "name")
      .populate("uom", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching inventory",
      error: error.message
    });
  }
});

module.exports = router;
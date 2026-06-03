const express = require("express");
const router = express.Router();

const Inward = require("../models/Inward");
const Inventory = require("../models/Inventory");
const Sales = require("../models/Sales");
const Payment = require("../models/Payment");

// 🔥 IMPORT FILTER
const buildFilter = require("../utils/reportFilter");



// Inward report API

router.get("/inward", async (req, res) => {
  try {

    const filter = buildFilter(req.query); // 🔥 magic line

    const data = await Inward.find(filter)
      .populate("supplier", "name")
      .populate("fabric", "name")
      .populate("fabricQuality", "name")
      .populate("design", "name")
      .populate("color", "name")
      .populate("location", "name")
      .populate("company", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching inward report",
      error: error.message
    });
  }
});

//Inventory report API

router.get("/inventory", async (req, res) => {
  try {

    const filter = buildFilter(req.query);

    const data = await Inventory.find(filter)
      .populate("fabric", "name")
      .populate("fabricQuality", "name")
      .populate("design", "name")
      .populate("color", "name")
      .populate("supplier", "name")
      .populate("location", "name")
      .populate("company", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching inventory report",
      error: error.message
    });
  }
});

// Sales report API

router.get("/sales", async (req, res) => {
  try {

    const filter = buildFilter(req.query);

    const data = await Sales.find(filter)
      .populate("customer", "name")
      .populate("fabric", "name")
      .populate("fabricQuality", "name")
      .populate("design", "name")
      .populate("color", "name")
      .populate("company", "name")
      .populate("salesPerson", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching sales report",
      error: error.message
    });
  }
});


// payment report API

router.get("/payment", async (req, res) => {
  try {

    const filter = buildFilter(req.query);

    const data = await Payment.find(filter)
      .populate("customer", "name")
      .populate("paymentMode", "name")
      .populate("company", "name")
      .sort({ createdAt: -1 });

    res.status(200).json(data);

  } catch (error) {
    res.status(500).json({
      message: "Error fetching payment report",
      error: error.message
    });
  }
});

module.exports = router;

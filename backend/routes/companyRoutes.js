const express = require("express");
const router = express.Router();
const Company = require("../models/Company");

// ADD Company
router.post("/add", async (req, res) => {
  try {
    const data = await Company.create(req.body);
    res.status(201).json({
      message: "Company Added Successfully",
      data
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL Companies
router.get("/", async (req, res) => {
  try {
    const data = await Company.find().sort({ createdAt: -1 });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
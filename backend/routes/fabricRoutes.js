const express = require("express");
const router = express.Router();
const Fabric = require("../models/Fabric");

// ADD Fabric
router.post("/add", async (req, res) => {
  try {
    const data = await Fabric.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET ALL
router.get("/", async (req, res) => {
  const data = await Fabric.find();
  res.json(data);
});

// update
router.put("/update/:id", async (req, res) => {
  try {
    const data = await Fabric.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete
router.delete("/delete/:id", async (req, res) => {
  try {
    const data = await Fabric.findByIdAndDelete(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
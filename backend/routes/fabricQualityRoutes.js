const express = require("express");
const router = express.Router();
const FabricQuality = require("../models/FabricQuality");

// ADD
router.post("/add", async (req, res) => {
  try {
    const data = await FabricQuality.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET
router.get("/", async (req, res) => {
  const data = await FabricQuality.find();
  res.json(data);
});


// update
router.put("/update/:id", async (req, res) => {
  try {
    const data = await FabricQuality.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
});

// delete
router.delete("/delete/:id", async (req, res) => {
  try {
    const data = await FabricQuality.findByIdAndDelete(req.params.id);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
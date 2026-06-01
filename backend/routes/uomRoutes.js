const express = require("express");
const router = express.Router();
const UOM = require("../models/UOM");

router.post("/add", async (req, res) => {
  try {
    const data = await UOM.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const data = await UOM.find();
  res.json(data);
});

router.get("/:id", async (req, res) => {
  try {
    const data = await UOM.findById(req.params.id);
    if (!data) return res.status(404).json({ error: "UOM not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.put("/update/:id", async (req, res) => {
  try {
    const data = await UOM.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ error: "UOM not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const data = await UOM.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: "UOM not found" });
    res.json({ message: "UOM deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
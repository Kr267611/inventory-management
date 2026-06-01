const express = require("express");
const router = express.Router();
const Color = require("../models/Color");

router.post("/add", async (req, res) => {
  try {
    const data = await Color.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const data = await Color.find();
  res.json(data);
});

router.put("/update/:id", async (req, res) => {
  try {
    const data = await Color.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ error: "Color not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  } 
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const data = await Color.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: "Color not found" });
    res.json({ message: "Color deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
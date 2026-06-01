const express = require("express");
const router = express.Router();
const Location = require("../models/Location");

router.post("/add", async (req, res) => {
  try {
    const data = await Location.create(req.body);
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  const data = await Location.find();
  res.json(data);
});

router.put("/update/:id", async (req, res) => {
  try {
    const data = await Location.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!data) return res.status(404).json({ error: "Location not found" });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.delete("/delete/:id", async (req, res) => {
  try {
    const data = await Location.findByIdAndDelete(req.params.id);
    if (!data) return res.status(404).json({ error: "Location not found" });
    res.json({ message: "Location deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;